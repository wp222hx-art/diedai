-- 光年计划：5000万元 Seedance 影视算力共享（标准Token = Seedance 2.0 不含视频输入刊例价 46元/百万tokens 折算）
CREATE TABLE IF NOT EXISTS compute_buckets (
  code TEXT PRIMARY KEY, name TEXT, amount_yuan REAL, std_tokens INTEGER,
  granted INTEGER DEFAULT 0, intro TEXT, sort INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS compute_grants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL, asset_id INTEGER, task_code TEXT NOT NULL, tier TEXT, bucket TEXT,
  tokens INTEGER NOT NULL, status TEXT DEFAULT '已到账',   -- 已到账 / 待审批 / 已授予 / 已拒绝
  prediction_id INTEGER, note TEXT, approver INTEGER, created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, task_code)
);
CREATE TABLE IF NOT EXISTS compute_predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, asset_id INTEGER,
  input TEXT, result TEXT, std_tokens INTEGER, created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS compute_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, asset_id INTEGER, request_id TEXT UNIQUE,
  model TEXT, resolution TEXT, seconds REAL, input_seconds REAL DEFAULT 0, raw_tokens INTEGER, std_tokens INTEGER,
  note TEXT, created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_cg_user ON compute_grants(user_id);
CREATE INDEX IF NOT EXISTS idx_cu_user ON compute_usage(user_id);
