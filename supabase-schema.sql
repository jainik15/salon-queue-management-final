/* HISTORICAL, DEPRECATED SCHEMA — DO NOT APPLY.
   The legacy policies below allow unrestricted public reads and writes.
   Use supabase/migrations/202611250001_latecuts_backend.sql after a verified backup
   and explicit approval to apply the schema to a Supabase project.

-- 1. Create Barbers Table
CREATE TABLE IF NOT EXISTS barbers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'break', 'offline')),
  avatar TEXT NOT NULL,
  queue_count INTEGER DEFAULT 0,
  served_today INTEGER DEFAULT 0,
  avg_duration INTEGER DEFAULT 25
);

-- 2. Create Queue Entries Table
CREATE TABLE IF NOT EXISTS queue_entries (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  service TEXT NOT NULL,
  service_duration INTEGER NOT NULL DEFAULT 25,
  barber_id TEXT NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  barber_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'serving', 'completed', 'absent', 'expired')),
  position INTEGER DEFAULT 1,
  timestamp_joined TIMESTAMPTZ DEFAULT NOW(),
  timestamp_called TIMESTAMPTZ,
  timestamp_completed TIMESTAMPTZ,
  estimated_wait INTEGER DEFAULT 0,
  language TEXT DEFAULT 'en'
);

-- 3. Enable Realtime Replication
ALTER TABLE barbers REPLICA IDENTITY FULL;
ALTER TABLE queue_entries REPLICA IDENTITY FULL;

-- 4. Row Level Security Policies (Permit public read/insert for salon floor)
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Barbers" ON barbers FOR SELECT USING (true);
CREATE POLICY "Public Update Barbers" ON barbers FOR UPDATE USING (true);

CREATE POLICY "Public Read Queue" ON queue_entries FOR SELECT USING (true);
CREATE POLICY "Public Insert Queue" ON queue_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Queue" ON queue_entries FOR UPDATE USING (true);

-- 5. Seed Initial Stylists
INSERT INTO barbers (id, name, specialty, status, avatar, queue_count, served_today, avg_duration)
VALUES
  ('zara', 'Zara', 'Bridal & Head Spa', 'available', 'Z', 2, 7, 32),
  ('marcus', 'Marcus', 'Royal Fade & Classic', 'available', 'M', 3, 9, 28),
  ('dev', 'Dev', 'Beard & Kids', 'break', 'D', 1, 6, 25)
ON CONFLICT (id) DO NOTHING;
*/
