import http from 'http'
import fs from 'fs'
import path from 'path'
import { randomBytes, timingSafeEqual } from 'crypto'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load ignored local environment files for the Node backend only. Explicit shell/host
// environment variables always take precedence, and Vite exposes only VITE_ variables.
function loadLocalEnvironment() {
  const inheritedKeys = new Set(Object.keys(process.env))
  for (const fileName of ['.env', '.env.local']) {
    const envPath = path.resolve(__dirname, '..', fileName)
    if (!fs.existsSync(envPath)) continue
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const match = line.trim().match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
      if (!match || inheritedKeys.has(match[1])) continue
      let value = match[2].trim()
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      } else {
        value = value.replace(/\s+#.*$/, '').trim()
      }
      process.env[match[1]] = value
    }
  }
}

loadLocalEnvironment()

const STAFF_USERNAME = 'staff'
const STAFF_PIN = process.env.STAFF_PIN?.trim() || ''

function isSecureStaffPin(pin) {
  if (!/^\d{6}$/.test(pin)) return false
  const digits = Array.from(pin, Number)
  if (new Set(digits).size === 1) return false
  const step = digits[1] - digits[0]
  const isSequential = (step === 1 || step === -1) && digits.every((digit, index) => index === 0 || digit - digits[index - 1] === step)
  return !isSequential
}

const isStaffPinConfigured = isSecureStaffPin(STAFF_PIN)

function matchesSecret(candidate, expected) {
  if (typeof candidate !== 'string' || !expected) return false
  const candidateBytes = Buffer.from(candidate)
  const expectedBytes = Buffer.from(expected)
  return candidateBytes.length === expectedBytes.length && timingSafeEqual(candidateBytes, expectedBytes)
}

const PORT = process.env.PORT || 3001
const DATA_DIR = path.join(__dirname, 'data')
const DB_FILE = path.join(DATA_DIR, 'database.json')

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// Initial default seed state
const DEFAULT_DB = {
  barbers: [
    { id: 'zara', name: 'Zara', specialty: 'D-Tan & Hair Spa', status: 'available', avatar: 'Z', queue_count: 2, served_today: 7, avg_duration: 32 },
    { id: 'marcus', name: 'Marcus', specialty: 'Fade & Classic', status: 'available', avatar: 'M', queue_count: 3, served_today: 9, avg_duration: 28 },
    { id: 'dev', name: 'Dev', specialty: 'Beard & Kids', status: 'break', avatar: 'D', queue_count: 1, served_today: 6, avg_duration: 25 },
  ],
  queue: [
    { id: '1', token: 'LX-01', customer_name: 'Priya', service: 'Fade', service_duration: 35, barber_id: 'zara', barber_name: 'Zara', status: 'serving', position: 1, timestamp_joined: new Date(Date.now() - 40 * 60000).toISOString(), timestamp_called: new Date(Date.now() - 5 * 60000).toISOString(), estimated_wait: 0, language: 'en' },
    { id: '2', token: 'LX-02', customer_name: 'Rahul', service: 'Classic Cut', service_duration: 25, barber_id: 'marcus', barber_name: 'Marcus', status: 'serving', position: 1, timestamp_joined: new Date(Date.now() - 35 * 60000).toISOString(), timestamp_called: new Date(Date.now() - 8 * 60000).toISOString(), estimated_wait: 0, language: 'hi' },
    { id: '3', token: 'LX-03', customer_name: 'Aisha', service: 'Hair Spa', service_duration: 45, barber_id: 'zara', barber_name: 'Zara', status: 'waiting', position: 2, timestamp_joined: new Date(Date.now() - 25 * 60000).toISOString(), estimated_wait: 30, language: 'en' },
    { id: '4', token: 'LX-04', customer_name: 'Kabir', service: 'Beard Sculpt', service_duration: 20, barber_id: 'marcus', barber_name: 'Marcus', status: 'waiting', position: 2, timestamp_joined: new Date(Date.now() - 20 * 60000).toISOString(), estimated_wait: 20, language: 'hi' },
    { id: '5', token: 'LX-05', customer_name: 'Meera', service: 'Kids Cut', service_duration: 20, barber_id: 'dev', barber_name: 'Dev', status: 'waiting', position: 1, timestamp_joined: new Date(Date.now() - 15 * 60000).toISOString(), estimated_wait: 25, language: 'en' },
    { id: '6', token: 'LX-06', customer_name: 'Arjun', service: 'Fade', service_duration: 35, barber_id: 'zara', barber_name: 'Zara', status: 'waiting', position: 3, timestamp_joined: new Date(Date.now() - 10 * 60000).toISOString(), estimated_wait: 65, language: 'en' },
    { id: '7', token: 'LX-07', customer_name: 'Nisha', service: 'Classic Cut', service_duration: 25, barber_id: 'marcus', barber_name: 'Marcus', status: 'waiting', position: 3, timestamp_joined: new Date(Date.now() - 5 * 60000).toISOString(), estimated_wait: 45, language: 'hi' },
  ],
  tokenCounter: 8,
  admin: { role: 'admin', name: 'Salon Staff' },
  logs: [],
}

// Database Read & Write Helpers
function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8')
      return DEFAULT_DB
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (err) {
    console.error('Database read error, restoring defaults:', err)
    return DEFAULT_DB
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    console.error('Database write error:', err)
  }
}

// Active Server-Sent Events (SSE) Client Connections
const sseClients = new Set()

function broadcastSSE(eventType, data) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`
  for (const res of sseClients) {
    try {
      res.write(message)
    } catch {
      sseClients.delete(res)
    }
  }
}

// Parse request body helper
function parseBody(req) {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        resolve({})
      }
    })
  })
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  const pathname = url.pathname

  // 1. Health check
  if (req.method === 'GET' && pathname === '/api/health') {
    const db = readDB()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      status: 'ok',
      database: 'connected',
      storage: 'persistent-file-db',
      activeTokens: db.queue.filter(q => q.status === 'waiting' || q.status === 'serving').length,
      timestamp: new Date().toISOString(),
    }))
    return
  }

  // 2. Server-Sent Events (SSE) Realtime Stream
  if (req.method === 'GET' && pathname === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    })
    res.write('event: connected\ndata: {"status":"streaming"}\n\n')
    sseClients.add(res)

    req.on('close', () => {
      sseClients.delete(res)
    })
    return
  }

  // 3. Admin Authentication Login
  if (req.method === 'POST' && pathname === '/api/auth/login') {
    const body = await parseBody(req)
    const { identifier, password, pin } = body
    if (!isStaffPinConfigured) {
      res.writeHead(503, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        success: false,
        message: 'Staff sign-in is disabled. Configure a valid STAFF_PIN in the backend environment and restart the server.',
      }))
      return
    }

    const isPinMatch = matchesSecret(pin || identifier, STAFF_PIN)
    const isUsernamePinMatch = (identifier || '').trim().toLowerCase() === STAFF_USERNAME && matchesSecret(password, STAFF_PIN)

    if (isPinMatch || isUsernamePinMatch) {
      const token = randomBytes(32).toString('hex')
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        success: true,
        token,
        user: {
          role: 'admin',
          name: 'Salon Staff',
          username: STAFF_USERNAME,
        },
      }))
    } else {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        success: false,
        message: 'Staff username or PIN is incorrect. Please try again.',
      }))
    }
    return
  }

  // 4. GET /api/queue -> Fetch entire current queue
  if (req.method === 'GET' && pathname === '/api/queue') {
    const db = readDB()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ queue: db.queue, barbers: db.barbers }))
    return
  }

  // 5. POST /api/queue/join -> Patron check-in
  if (req.method === 'POST' && pathname === '/api/queue/join') {
    const body = await parseBody(req)
    const db = readDB()

    const token = `LX-${String(db.tokenCounter).padStart(2, '0')}`
    db.tokenCounter += 1

    const barberQueue = db.queue.filter(e => e.barber_id === body.barber_id && e.status === 'waiting')
    const position = barberQueue.length + 1
    const barber = db.barbers.find(b => b.id === body.barber_id) || db.barbers[0]
    const estimated_wait = position * (barber.avg_duration || 25)

    const newEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      token,
      customer_name: body.customer_name || 'Guest',
      service: body.service || 'Classic Cut',
      service_duration: body.service_duration || 25,
      barber_id: body.barber_id || 'marcus',
      barber_name: body.barber_name || barber.name,
      status: 'waiting',
      position,
      timestamp_joined: new Date().toISOString(),
      estimated_wait,
      language: body.language || 'en',
    }

    db.queue.push(newEntry)
    // Update barber queue count
    const b = db.barbers.find(barb => barb.id === newEntry.barber_id)
    if (b) b.queue_count += 1

    writeDB(db)
    broadcastSSE('QUEUE_UPDATE', { queue: db.queue, barbers: db.barbers, newEntry })

    res.writeHead(201, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(newEntry))
    return
  }

  // 6. POST /api/queue/call-next -> Stylist calls next
  if (req.method === 'POST' && pathname === '/api/queue/call-next') {
    const body = await parseBody(req)
    const db = readDB()
    const { barberId } = body

    const next = db.queue
      .filter(e => e.barber_id === barberId && e.status === 'waiting')
      .sort((a, b) => new Date(a.timestamp_joined) - new Date(b.timestamp_joined))[0]

    if (next) {
      next.status = 'serving'
      next.timestamp_called = new Date().toISOString()
      writeDB(db)
      broadcastSSE('CALL_NEXT', { barberId, entry: next, queue: db.queue })
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: true, entry: next }))
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: false, message: 'Queue is empty' }))
    }
    return
  }

  // 7. POST /api/queue/mark-done -> Service completed
  if (req.method === 'POST' && pathname === '/api/queue/mark-done') {
    const body = await parseBody(req)
    const db = readDB()
    const { id } = body

    const entry = db.queue.find(e => e.id === id)
    if (entry) {
      entry.status = 'completed'
      entry.timestamp_completed = new Date().toISOString()
      const b = db.barbers.find(barb => barb.id === entry.barber_id)
      if (b) {
        b.served_today += 1
        b.queue_count = Math.max(0, b.queue_count - 1)
      }
      writeDB(db)
      broadcastSSE('MARK_DONE', { id, entry, queue: db.queue, barbers: db.barbers })
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: true, entry }))
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: false, message: 'Entry not found' }))
    }
    return
  }

  // 8. POST /api/queue/mark-absent -> Cancel or skip patron
  if (req.method === 'POST' && pathname === '/api/queue/mark-absent') {
    const body = await parseBody(req)
    const db = readDB()
    const { id } = body

    const entry = db.queue.find(e => e.id === id)
    if (entry) {
      entry.status = 'absent'
      writeDB(db)
      broadcastSSE('MARK_ABSENT', { id, queue: db.queue })
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: true, entry }))
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: false, message: 'Entry not found' }))
    }
    return
  }

  // 9. POST /api/barbers/status -> Change stylist duty status
  if (req.method === 'POST' && pathname === '/api/barbers/status') {
    const body = await parseBody(req)
    const db = readDB()
    const { barberId, status } = body

    const b = db.barbers.find(barb => barb.id === barberId)
    if (b) {
      b.status = status
      writeDB(db)
      broadcastSSE('BARBER_UPDATE', { barberId, status, barbers: db.barbers })
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: true, barber: b }))
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: false, message: 'Barber not found' }))
    }
    return
  }

  // 10. POST /api/database/reset -> Reset database
  if (req.method === 'POST' && pathname === '/api/database/reset') {
    writeDB(DEFAULT_DB)
    broadcastSSE('RESET_DATA', DEFAULT_DB)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ success: true, message: 'Database reset to defaults' }))
    return
  }

  // Default 404
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Endpoint not found' }))
})

server.listen(PORT, () => {
  console.log(`\n=================================================`)
  console.log(`💈 LateCuts Backend API Server Active`)
  console.log(`📍 URL: http://localhost:${PORT}`)
  console.log(`📡 Realtime SSE Stream: http://localhost:${PORT}/api/events`)
  console.log(`💾 Database: ${DB_FILE}`)
  if (!isStaffPinConfigured) console.warn('Staff sign-in is disabled. Configure a valid STAFF_PIN in the backend environment.')
  console.log(`=================================================\n`)
})
