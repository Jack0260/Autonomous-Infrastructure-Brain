/*
# ATLAS Core Schema — Nodes, Telemetry, Incidents, Approvals, Audit, Policies, Customers

## Purpose
ATLAS is an autonomous infrastructure brain. This schema stores edge node registry,
telemetry snapshots, incidents with causal chains, self-heal approval workflow,
immutable audit trail, policy rules, and customer onboarding data.

## Tables Created
1. `nodes` — Edge node registry (id, name, type, sector, location, status, health_score, attested, signing_key_id, config jsonb)
2. `telemetry` — Time-series telemetry snapshots (node_id FK, temperature, vibration, power, sound, anomaly_score, is_anomalous, ts)
3. `incidents` — Incident records (node_id FK, severity, status, title, description, causal_chain jsonb, action_taken, mttr_seconds, created_at, resolved_at)
4. `approvals` — Self-heal approval workflow (incident_id FK, action_type, action_params jsonb, risk_level, status, decided_by, decided_at, created_at)
5. `audit_log` — Immutable audit trail (entity_type, entity_id, action, actor, metadata jsonb, created_at)
6. `policies` — Self-heal policy rules in OPA-style JSON (name, enabled, conditions jsonb, action jsonb, priority)
7. `customers` — FDE onboarding (name, industry, node_count, config jsonb, sdk_key, status, created_at)

## Security
- All tables have RLS enabled.
- This is a single-tenant app with no sign-in screen, so all policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)` — data is intentionally shared/public.
- The `audit_log` has an INSERT-only constraint pattern (no UPDATE/DELETE) to preserve immutability.

## Notes
1. Telemetry uses a `ts` column (bigint) for high-resolution epoch timestamps suitable for real-time streaming.
2. `causal_chain` is jsonb to store arbitrary event graphs.
3. `audit_log` is designed to be append-only — no UPDATE or DELETE policies are created.
*/

-- ============================================================
-- 1. NODES
-- ============================================================
CREATE TABLE IF NOT EXISTS nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('server', 'motor', 'transformer', 'pump', 'compressor', 'sensor')),
  sector text NOT NULL CHECK (sector IN ('datacenter', 'factory', 'powergrid')),
  location text,
  status text NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'degraded', 'isolated', 'maintenance')),
  health_score numeric NOT NULL DEFAULT 100.0 CHECK (health_score >= 0 AND health_score <= 100),
  attested boolean NOT NULL DEFAULT false,
  signing_key_id text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_nodes" ON nodes;
CREATE POLICY "anon_select_nodes" ON nodes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_nodes" ON nodes;
CREATE POLICY "anon_insert_nodes" ON nodes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_nodes" ON nodes;
CREATE POLICY "anon_update_nodes" ON nodes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_nodes" ON nodes;
CREATE POLICY "anon_delete_nodes" ON nodes FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 2. TELEMETRY
-- ============================================================
CREATE TABLE IF NOT EXISTS telemetry (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  node_id uuid NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  temperature numeric,
  vibration numeric,
  power numeric,
  sound numeric,
  anomaly_score numeric NOT NULL DEFAULT 0.0,
  is_anomalous boolean NOT NULL DEFAULT false,
  swarm_votes integer NOT NULL DEFAULT 0,
  swarm_total integer NOT NULL DEFAULT 0,
  ts bigint NOT NULL DEFAULT (EXTRACT(EPOCH FROM now()) * 1000)::bigint
);

ALTER TABLE telemetry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_telemetry" ON telemetry;
CREATE POLICY "anon_select_telemetry" ON telemetry FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_telemetry" ON telemetry;
CREATE POLICY "anon_insert_telemetry" ON telemetry FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_telemetry" ON telemetry;
CREATE POLICY "anon_update_telemetry" ON telemetry FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_telemetry" ON telemetry;
CREATE POLICY "anon_delete_telemetry" ON telemetry FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_telemetry_node_ts ON telemetry(node_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_anomalous ON telemetry(is_anomalous) WHERE is_anomalous = true;

-- ============================================================
-- 3. INCIDENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id uuid REFERENCES nodes(id) ON DELETE SET NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'investigating', 'healing', 'resolved', 'dismissed')),
  title text NOT NULL,
  description text,
  causal_chain jsonb NOT NULL DEFAULT '[]'::jsonb,
  action_taken text,
  mttr_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_incidents" ON incidents;
CREATE POLICY "anon_select_incidents" ON incidents FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_incidents" ON incidents;
CREATE POLICY "anon_insert_incidents" ON incidents FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_incidents" ON incidents;
CREATE POLICY "anon_update_incidents" ON incidents FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_incidents" ON incidents;
CREATE POLICY "anon_delete_incidents" ON incidents FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_node ON incidents(node_id);

-- ============================================================
-- 4. APPROVALS
-- ============================================================
CREATE TABLE IF NOT EXISTS approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('throttle', 'isolate', 'failover', 'restart', 'notify', 'shutdown')),
  action_params jsonb NOT NULL DEFAULT '{}'::jsonb,
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'executed', 'failed')),
  decided_by text,
  decided_at timestamptz,
  execution_result jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_approvals" ON approvals;
CREATE POLICY "anon_select_approvals" ON approvals FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_approvals" ON approvals;
CREATE POLICY "anon_insert_approvals" ON approvals FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_approvals" ON approvals;
CREATE POLICY "anon_update_approvals" ON approvals FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_approvals" ON approvals;
CREATE POLICY "anon_delete_approvals" ON approvals FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 5. AUDIT LOG (append-only)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  actor text NOT NULL DEFAULT 'system',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_audit_log" ON audit_log;
CREATE POLICY "anon_select_audit_log" ON audit_log FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_audit_log" ON audit_log;
CREATE POLICY "anon_insert_audit_log" ON audit_log FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- No UPDATE or DELETE policies — audit_log is append-only by design

CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);

-- ============================================================
-- 6. POLICIES (self-heal rules)
-- ============================================================
CREATE TABLE IF NOT EXISTS policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  enabled boolean NOT NULL DEFAULT true,
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  action jsonb NOT NULL DEFAULT '{}'::jsonb,
  priority integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_policies" ON policies;
CREATE POLICY "anon_select_policies" ON policies FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_policies" ON policies;
CREATE POLICY "anon_insert_policies" ON policies FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_policies" ON policies;
CREATE POLICY "anon_update_policies" ON policies FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_policies" ON policies;
CREATE POLICY "anon_delete_policies" ON policies FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 7. CUSTOMERS (FDE onboarding)
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  industry text NOT NULL,
  node_count integer NOT NULL DEFAULT 10,
  sectors text[] NOT NULL DEFAULT '{}',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  sdk_key text UNIQUE,
  status text NOT NULL DEFAULT 'onboarding' CHECK (status IN ('onboarding', 'active', 'suspended', 'churned')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_customers" ON customers;
CREATE POLICY "anon_select_customers" ON customers FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_customers" ON customers;
CREATE POLICY "anon_insert_customers" ON customers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_customers" ON customers;
CREATE POLICY "anon_update_customers" ON customers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_customers" ON customers;
CREATE POLICY "anon_delete_customers" ON customers FOR DELETE
  TO anon, authenticated USING (true);
