import http from 'http'
import fs from 'fs'
import path from 'path'
import { createHmac, randomUUID, timingSafeEqual } from 'crypto'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import { formatQueueToken } from '../src/lib/queueToken.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load ignored local environment files for the Node backend only. Host environment
// values take precedence; the service-role key is never read by the Vite client.
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

const PORT = Number(process.env.PORT || 3001)
const STAFF_USERNAME = 'staff'
const STAFF_PIN = process.env.STAFF_PIN?.trim() || ''
const STAFF_SESSION_SECRET = process.env.STAFF_SESSION_SECRET || ''
const STAFF_SESSION_SECRET_CONFIGURED = Buffer.byteLength(STAFF_SESSION_SECRET) >= 32
const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const SUPABASE_CONFIGURED = SUPABASE_URL.startsWith('https://') && Boolean(SUPABASE_SERVICE_ROLE_KEY)
const SUPABASE = SUPABASE_CONFIGURED
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    })
  : null
const isProduction = process.env.NODE_ENV === 'production'
const sampleResetEnabled = !isProduction && process.env.ENABLE_SAMPLE_DATA_RESET === 'true'
const allowedOrigins = new Set(
  (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean),
)
const STYLIST_DISPLAY_NAMES = { zara: 'Ramesh', marcus: 'Vinod', dev: 'Arjun' }

function isSecureStaffPin(pin) {
  if (!/^\d{6}$/.test(pin)) return false
  const digits = Array.from(pin, Number)
  if (new Set(digits).size === 1) return false
  const step = digits[1] - digits[0]
  return !((step === 1 || step === -1) && digits.every((digit, index) => index === 0 || digit - digits[index - 1] === step))
}

const staffPinIssue = !STAFF_PIN ? 'missing' : isSecureStaffPin(STAFF_PIN) ? null : 'invalid'
const sessionSecretIssue = !STAFF_SESSION_SECRET ? 'missing' : STAFF_SESSION_SECRET_CONFIGURED ? null : 'too short'
const staffPinConfigured = staffPinIssue === null
const sessionConfigValid = staffPinConfigured && sessionSecretIssue === null

function matchesSecret(candidate, expected) {
  if (typeof candidate !== 'string' || !expected) return false
  const candidateBytes = Buffer.from(candidate)
  const expectedBytes = Buffer.from(expected)
  return candidateBytes.length === expectedBytes.length && timingSafeEqual(candidateBytes, expectedBytes)
}

function signSession(payload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = createHmac('sha256', STAFF_SESSION_SECRET).update(encodedPayload).digest('base64url')
  return `${encodedPayload}.${signature}`
}

function verifySession(token) {
  if (!sessionConfigValid || typeof token !== 'string') return null
  const [encodedPayload, signature, extra] = token.split('.')
  if (!encodedPayload || !signature || extra) return null
  const expected = createHmac('sha256', STAFF_SESSION_SECRET).update(encodedPayload).digest()
  let supplied
  try { supplied = Buffer.from(signature, 'base64url') } catch { return null }
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null
  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'))
    if (payload.sub !== STAFF_USERNAME || payload.role !== 'admin' || !Number.isInteger(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

function getStaffSession(req) {
  const authorization = req.headers.authorization || ''
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return match ? verifySession(match[1]) : null
}

function normalizeBarber(row) {
  return { ...row, name: STYLIST_DISPLAY_NAMES[row.id] || row.name }
}

function normalizeEntry(row) {
  return {
    ...row,
    token: formatQueueToken(row.token),
    barber_name: STYLIST_DISPLAY_NAMES[row.barber_id] || row.barber_name,
  }
}

const jsonHeaders = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }

function sendJson(res, status, value, extraHeaders = {}) {
  res.writeHead(status, { ...jsonHeaders, ...extraHeaders })
  res.end(JSON.stringify(value))
}

function requireStaff(req, res) {
  const session = getStaffSession(req)
  if (!session) {
    sendJson(res, 401, { success: false, message: 'Staff authorization is required.' })
    return null
  }
  return session
}

function requireDatabase(res) {
  if (SUPABASE) return true
  sendJson(res, 503, {
    success: false,
    message: 'Queue service is unavailable. Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the backend.',
  })
  return false
}

async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
      if (Buffer.byteLength(body) > 64 * 1024) {
        reject(Object.assign(new Error('Request too large'), { statusCode: 413 }))
        req.destroy()
      }
    })
    req.on('end', () => {
      if (!body) return resolve({})
      try {
        const parsed = JSON.parse(body)
        resolve(parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {})
      } catch {
        reject(Object.assign(new Error('Invalid JSON'), { statusCode: 400 }))
      }
    })
    req.on('error', reject)
  })
}

const rateBuckets = new Map()
function rateLimit(req, key, max, windowMs) {
  const now = Date.now()
  const identity = `${req.socket.remoteAddress || 'unknown'}:${key}`
  const bucket = rateBuckets.get(identity)
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(identity, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (bucket.count >= max) return false
  bucket.count += 1
  return true
}

let revision = 0
const sseClients = new Set()
function broadcastSSE(eventType, safeData = {}) {
  revision += 1
  const message = `event: ${eventType}\ndata: ${JSON.stringify({ revision, ...safeData })}\n\n`
  for (const client of sseClients) {
    try { client.res.write(message) } catch { clearInterval(client.heartbeat); sseClients.delete(client) }
  }
}

async function getQueueSnapshot(isStaff) {
  const queueQuery = SUPABASE.from('queue_entries').select('*').order('timestamp_joined', { ascending: true })
  const barberQuery = SUPABASE.from('barbers').select('*').order('id')
  const todayParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date()).reduce((parts, part) => ({ ...parts, [part.type]: part.value }), {})
  const todayStart = new Date(Date.UTC(
    Number(todayParts.year), Number(todayParts.month) - 1, Number(todayParts.day), -5, -30,
  )).toISOString()
  const [queueResult, barberResult, reviewResult, servedResult] = await Promise.all([
    isStaff ? queueQuery : queueQuery.in('status', ['waiting', 'serving']),
    barberQuery,
    isStaff ? SUPABASE.from('reviews').select('*').order('created_at', { ascending: false }) : Promise.resolve({ data: [], error: null }),
    SUPABASE.from('queue_entries').select('barber_id').eq('status', 'completed').gte('timestamp_completed', todayStart),
  ])
  if (queueResult.error || barberResult.error || reviewResult.error || servedResult.error) throw new Error('database_query_failed')
  const queue = (queueResult.data || []).map(normalizeEntry)
  const waitingByBarber = new Map()
  for (const entry of queue) {
    if (entry.status === 'waiting') waitingByBarber.set(entry.barber_id, (waitingByBarber.get(entry.barber_id) || 0) + 1)
  }
  const servedTodayByBarber = new Map()
  for (const row of servedResult.data || []) {
    servedTodayByBarber.set(row.barber_id, (servedTodayByBarber.get(row.barber_id) || 0) + 1)
  }
  const barbers = (barberResult.data || []).map(row => {
    const barber = normalizeBarber(row)
    return {
      ...barber,
      queue_count: waitingByBarber.get(barber.id) || 0,
      served_today: servedTodayByBarber.get(barber.id) || 0,
    }
  })
  if (isStaff) {
    const reviews = (reviewResult.data || []).map(review => ({ ...review, token: formatQueueToken(review.token) }))
    return { queue, barbers, reviews }
  }
  return {
    queue: queue.map(entry => ({
      id: entry.id,
      token: entry.token,
      customer_name: 'Guest',
      service: entry.service,
      service_duration: entry.service_duration,
      barber_id: entry.barber_id,
      barber_name: entry.barber_name,
      status: entry.status,
      position: entry.position,
      timestamp_joined: entry.timestamp_joined,
      timestamp_called: entry.timestamp_called,
      estimated_wait: entry.estimated_wait,
      language: entry.language,
    })),
    barbers,
  }
}

async function lookupCustomerEntry(accessToken) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(accessToken || '')) return null
  const { data, error } = await SUPABASE.from('queue_entries').select('*').eq('public_access_token', accessToken).maybeSingle()
  if (error) throw new Error('database_query_failed')
  return data ? normalizeEntry(data) : null
}

function publicEntry(entry) {
  if (!entry) return null
  const { join_request_id, ...safeEntry } = entry
  return safeEntry
}

function validUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin
  if (origin && !allowedOrigins.has(origin)) {
    sendJson(res, 403, { error: 'Origin is not allowed.' })
    return
  }
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Max-Age', '600')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  let pathname
  let url
  try {
    url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
    pathname = url.pathname
  } catch {
    sendJson(res, 400, { error: 'Invalid request URL.' })
    return
  }

  try {
    if (req.method === 'GET' && pathname === '/api/health') {
      if (!SUPABASE) {
        sendJson(res, 503, { status: 'unavailable', database: 'not-configured', staffAuth: sessionConfigValid ? 'configured' : 'not-configured', timestamp: new Date().toISOString() })
        return
      }
      const readinessQueries = await Promise.all([
        SUPABASE.from('barbers').select('id').limit(0),
        SUPABASE.from('services').select('id').limit(0),
        SUPABASE.from('queue_entries').select('id').limit(0),
        SUPABASE.from('salon_state').select('singleton').limit(0),
        SUPABASE.from('salon_settings').select('singleton').limit(0),
        SUPABASE.from('reviews').select('id').limit(0),
      ])
      if (readinessQueries.some(result => result.error)) {
        sendJson(res, 503, { status: 'unavailable', database: 'not-ready', staffAuth: sessionConfigValid ? 'configured' : 'not-configured', timestamp: new Date().toISOString() })
        return
      }
      sendJson(res, 200, { status: 'ok', database: 'connected', storage: 'supabase-postgresql', staffAuth: sessionConfigValid ? 'configured' : 'not-configured', timestamp: new Date().toISOString() })
      return
    }

    if (req.method === 'GET' && pathname === '/api/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      })
      res.write(`event: connected\ndata: ${JSON.stringify({ revision })}\n\n`)
      const client = { res, heartbeat: setInterval(() => { try { res.write(': keep-alive\n\n') } catch {} }, 25000) }
      sseClients.add(client)
      req.on('close', () => { clearInterval(client.heartbeat); sseClients.delete(client) })
      return
    }

    if (req.method === 'POST' && pathname === '/api/auth/login') {
      if (!rateLimit(req, 'login', 8, 15 * 60 * 1000)) {
        sendJson(res, 429, { success: false, message: 'Too many sign-in attempts. Please wait before trying again.' })
        return
      }
      if (!sessionConfigValid) {
        sendJson(res, 503, {
          success: false,
          message: 'Staff sign-in is disabled. Configure a secure STAFF_PIN and STAFF_SESSION_SECRET on the backend.',
        })
        return
      }
      const body = await parseBody(req)
      const identifier = typeof body.identifier === 'string' ? body.identifier.trim().toLowerCase() : ''
      const pinMatch = matchesSecret(body.pin || body.identifier, STAFF_PIN)
      const usernamePinMatch = identifier === STAFF_USERNAME && matchesSecret(body.password, STAFF_PIN)
      if (!pinMatch && !usernamePinMatch) {
        sendJson(res, 401, { success: false, message: 'Staff username or PIN is incorrect. Please try again.' })
        return
      }
      const issuedAt = Math.floor(Date.now() / 1000)
      const token = signSession({ sub: STAFF_USERNAME, role: 'admin', iat: issuedAt, exp: issuedAt + 8 * 60 * 60 })
      sendJson(res, 200, { success: true, token, user: { role: 'admin', name: 'Salon Staff', username: STAFF_USERNAME } })
      return
    }

    if (req.method === 'GET' && pathname === '/api/queue') {
      if (!requireDatabase(res)) return
      const hasAuthorization = Boolean(req.headers.authorization)
      const staffSession = getStaffSession(req)
      if (hasAuthorization && !staffSession) {
        sendJson(res, 401, { success: false, message: 'Staff session expired. Sign in again.' })
        return
      }
      const snapshot = await getQueueSnapshot(Boolean(staffSession))
      sendJson(res, 200, snapshot)
      return
    }

    if (req.method === 'GET' && pathname === '/api/services') {
      if (!requireDatabase(res)) return
      const { data, error } = await SUPABASE.from('services').select('id,name_en,name_gu,icon,duration,price').eq('active', true).order('sort_order')
      if (error) throw new Error('database_query_failed')
      sendJson(res, 200, { services: data || [] })
      return
    }

    const entryMatch = pathname.match(/^\/api\/queue\/entry\/([^/]+)$/)
    if (req.method === 'GET' && entryMatch) {
      if (!requireDatabase(res)) return
      if (!rateLimit(req, 'customer-entry', 80, 60 * 1000)) {
        sendJson(res, 429, { error: 'Too many requests.' })
        return
      }
      const entry = await lookupCustomerEntry(decodeURIComponent(entryMatch[1]))
      if (!entry) { sendJson(res, 404, { error: 'Queue pass not found.' }); return }
      sendJson(res, 200, { entry: publicEntry(entry) })
      return
    }

    const feedbackLookup = pathname.match(/^\/api\/feedback\/([^/]+)$/)
    if (req.method === 'GET' && feedbackLookup) {
      if (!requireDatabase(res)) return
      const entry = await lookupCustomerEntry(decodeURIComponent(feedbackLookup[1]))
      if (!entry || entry.status !== 'completed') { sendJson(res, 404, { error: 'Completed queue pass not found.' }); return }
      const { data: review, error } = await SUPABASE.from('reviews').select('id,rating,comment,aspects,created_at').eq('queue_entry_id', entry.id).maybeSingle()
      if (error) throw new Error('database_query_failed')
      sendJson(res, 200, { entry: publicEntry(entry), review })
      return
    }

    if (req.method === 'POST' && (pathname === '/api/queue/join' || pathname === '/api/queue/walk-in')) {
      if (!requireDatabase(res)) return
      const isWalkIn = pathname.endsWith('/walk-in')
      if (isWalkIn && !requireStaff(req, res)) return
      if (!rateLimit(req, isWalkIn ? 'walk-in' : 'join', isWalkIn ? 120 : 12, 60 * 1000)) {
        sendJson(res, 429, { success: false, message: 'Please wait before creating another queue entry.' })
        return
      }
      const body = await parseBody(req)
      const customerName = typeof body.customer_name === 'string' ? body.customer_name.trim() : ''
      const barberId = typeof body.barber_id === 'string' ? body.barber_id : ''
      const anyStylist = !isWalkIn && body.barber_preference === 'any'
      const language = body.language === 'gu' ? 'gu' : 'en'
      if (!customerName || customerName.length > 80 || !barberId) {
        sendJson(res, 400, { success: false, message: 'A customer name and stylist are required.' })
        return
      }
      const serviceIds = Array.isArray(body.service_ids) ? body.service_ids.filter(id => typeof id === 'string') : []
      if (serviceIds.length > 6 || serviceIds.length !== new Set(serviceIds).size) {
        sendJson(res, 400, { success: false, message: 'Choose valid services before joining the queue.' })
        return
      }
      const requestId = validUuid(body.join_request_id) ? body.join_request_id : randomUUID()
      const { data, error } = await SUPABASE.rpc('join_queue_with_preference', {
        p_customer_name: customerName,
        p_service: typeof body.service === 'string' ? body.service : '',
        p_service_duration: Number.isInteger(body.service_duration) ? body.service_duration : null,
        p_barber_id: barberId,
        p_language: language,
        p_join_request_id: requestId,
        p_service_ids: serviceIds,
        p_any_stylist: anyStylist,
      })
      if (error && ['stylist_unavailable', 'no_stylist_available'].includes(error.message)) {
        sendJson(res, 409, {
          success: false,
          message: error.message === 'stylist_unavailable'
            ? 'That stylist is unavailable. Please choose another stylist.'
            : 'No stylists are currently available. Please try again shortly.',
        })
        return
      }
      if (error) throw Object.assign(new Error('queue_join_rejected'), { databaseCode: error.code })
      const entry = normalizeEntry(data)
      broadcastSSE('QUEUE_UPDATE', { token: entry.token, service: entry.service, barber_name: entry.barber_name })
      sendJson(res, 201, entry)
      return
    }

    if (req.method === 'POST' && pathname === '/api/queue/cancel') {
      if (!requireDatabase(res)) return
      const body = await parseBody(req)
      if (!validUuid(body.access_token)) { sendJson(res, 400, { success: false, message: 'This queue pass cannot be verified.' }); return }
      const { data, error } = await SUPABASE.rpc('cancel_queue_entry', { p_public_access_token: body.access_token })
      if (error) throw Object.assign(new Error('queue_cancel_rejected'), { databaseCode: error.code })
      if (!data) { sendJson(res, 404, { success: false, message: 'Queue pass not found.' }); return }
      broadcastSSE('MARK_ABSENT', { token: formatQueueToken(data.token) })
      sendJson(res, 200, { success: true, entry: publicEntry(normalizeEntry(data)) })
      return
    }

    if (req.method === 'POST' && pathname === '/api/feedback') {
      if (!requireDatabase(res)) return
      const body = await parseBody(req)
      if (!validUuid(body.access_token)) { sendJson(res, 400, { success: false, message: 'This queue pass cannot be verified.' }); return }
      const rating = Number(body.rating)
      const comment = typeof body.comment === 'string' ? body.comment.slice(0, 2000) : ''
      const aspects = body.aspects && typeof body.aspects === 'object' && !Array.isArray(body.aspects) ? body.aspects : {}
      const { error } = await SUPABASE.rpc('submit_queue_feedback', {
        p_public_access_token: body.access_token,
        p_rating: rating,
        p_comment: comment,
        p_aspects: aspects,
      })
      if (error) throw Object.assign(new Error('feedback_rejected'), { databaseCode: error.code })
      broadcastSSE('FEEDBACK_UPDATE')
      sendJson(res, 201, { success: true })
      return
    }

    if (req.method === 'POST' && pathname === '/api/queue/call-next') {
      if (!requireStaff(req, res) || !requireDatabase(res)) return
      const body = await parseBody(req)
      const barberId = typeof body.barberId === 'string' ? body.barberId : ''
      const { data, error } = await SUPABASE.rpc('call_next_queue_entry', { p_barber_id: barberId })
      if (error) throw Object.assign(new Error('call_next_rejected'), { databaseCode: error.code })
      if (!data) { sendJson(res, 200, { success: false, message: 'Queue is empty' }); return }
      broadcastSSE('CALL_NEXT', { barber_id: barberId })
      sendJson(res, 200, { success: true, entry: normalizeEntry(data) })
      return
    }

    if (req.method === 'POST' && (pathname === '/api/queue/mark-done' || pathname === '/api/queue/mark-absent')) {
      if (!requireStaff(req, res) || !requireDatabase(res)) return
      const body = await parseBody(req)
      if (typeof body.id !== 'string' || !body.id) { sendJson(res, 400, { success: false, message: 'Queue entry id is required.' }); return }
      const status = pathname.endsWith('mark-done') ? 'completed' : 'absent'
      const { data, error } = await SUPABASE.rpc('transition_queue_entry', { p_entry_id: body.id, p_status: status })
      if (error?.message === 'no_show_not_ready') {
        sendJson(res, 409, { success: false, message: 'A no-show can be recorded 10 minutes after the customer is called.' })
        return
      }
      if (error) throw Object.assign(new Error('queue_transition_rejected'), { databaseCode: error.code })
      if (!data) { sendJson(res, 404, { success: false, message: 'Queue entry not found.' }); return }
      broadcastSSE(status === 'completed' ? 'MARK_DONE' : 'MARK_ABSENT', { token: formatQueueToken(data.token) })
      sendJson(res, 200, { success: true, entry: normalizeEntry(data) })
      return
    }

    if (req.method === 'POST' && pathname === '/api/queue/remove-waiting') {
      if (!requireStaff(req, res) || !requireDatabase(res)) return
      const body = await parseBody(req)
      if (typeof body.id !== 'string' || !body.id) { sendJson(res, 400, { success: false, message: 'Queue entry id is required.' }); return }
      const { data, error } = await SUPABASE.rpc('remove_waiting_queue_entry', { p_entry_id: body.id })
      if (error) throw Object.assign(new Error('waiting_entry_removal_rejected'), { databaseCode: error.code })
      if (!data) { sendJson(res, 404, { success: false, message: 'Queue entry not found.' }); return }
      broadcastSSE('MARK_ABSENT', { token: formatQueueToken(data.token) })
      sendJson(res, 200, { success: true, entry: normalizeEntry(data) })
      return
    }

    if (req.method === 'POST' && pathname === '/api/barbers/status') {
      if (!requireStaff(req, res) || !requireDatabase(res)) return
      const body = await parseBody(req)
      const { data, error } = await SUPABASE.rpc('set_barber_status', {
        p_barber_id: typeof body.barberId === 'string' ? body.barberId : '',
        p_status: typeof body.status === 'string' ? body.status : '',
      })
      if (error) throw Object.assign(new Error('barber_status_rejected'), { databaseCode: error.code })
      if (!data) { sendJson(res, 404, { success: false, message: 'Stylist not found.' }); return }
      broadcastSSE('BARBER_UPDATE', { barber_id: data.id, status: data.status })
      sendJson(res, 200, { success: true, barber: normalizeBarber(data) })
      return
    }

    if (req.method === 'POST' && pathname === '/api/database/reset') {
      if (!requireStaff(req, res) || !requireDatabase(res)) return
      if (!sampleResetEnabled) {
        sendJson(res, 403, { success: false, message: 'Sample-data reset is disabled. Enable it only in a non-production environment.' })
        return
      }
      const { error } = await SUPABASE.rpc('reset_latecuts_sample_data')
      if (error) throw new Error('sample_reset_failed')
      broadcastSSE('RESET_DATA')
      sendJson(res, 200, { success: true, message: 'Queue data reset for the non-production environment.' })
      return
    }

    sendJson(res, 404, { error: 'Endpoint not found' })
  } catch (error) {
    if (res.headersSent) { res.end(); return }
    const status = error?.statusCode || (
      error?.databaseCode === '22023' ? 400 :
      error?.databaseCode === '55000' ? 409 :
      error?.message === 'database_query_failed' ? 503 : 500
    )
    if (status >= 500) console.error('API request failed:', pathname, error?.databaseCode || error?.message || 'unknown')
    const message = status === 400 ? 'The request does not match the queue or service rules.'
      : status === 409 ? 'That queue action is no longer available. Refresh and try again.'
      : status === 413 ? 'Request is too large.'
      : status === 503 ? 'Queue service is temporarily unavailable.'
      : status === 500 ? 'The server could not complete this request.'
      : 'Invalid request.'
    sendJson(res, status, { success: false, error: message, message })
  }
})

server.requestTimeout = 30000
server.headersTimeout = 35000
server.keepAliveTimeout = 65000
server.listen(PORT, '0.0.0.0', () => {
  console.log(`LateCuts Node API listening on port ${PORT}`)
  console.log(`Database configuration: ${SUPABASE ? 'Supabase credentials present' : 'missing; APIs will fail closed'}`)
  if (staffPinIssue) console.warn(`Staff auth configuration: STAFF_PIN ${staffPinIssue}.`)
  if (sessionSecretIssue) console.warn(`Staff auth configuration: STAFF_SESSION_SECRET ${sessionSecretIssue}.`)
  console.log(`CORS allowed origins configured: ${allowedOrigins.size}`)
})
