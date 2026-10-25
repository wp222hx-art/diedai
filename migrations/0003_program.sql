-- 光年计划：报名 → 线上初选（邀请打分）→ 路演 → 双人审批 → 算力发放
CREATE TABLE IF NOT EXISTS program_apps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,              -- 公开分享码（邀请打分链接）
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL, team TEXT NOT NULL,
  track TEXT NOT NULL,                    -- 专业团队 / 院校毕业生
  school TEXT, grad_year INTEGER,
  form TEXT, minutes REAL, logline TEXT, video_url TEXT, members TEXT,
  status TEXT DEFAULT '初选中',           -- 初选中 / 晋级路演 / 路演通过 / 已审批 / 未通过
  roadshow_score REAL, roadshow_note TEXT,
  grant_yuan REAL, approver1 INTEGER, approver2 INTEGER, grant_id INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, title)
);
CREATE TABLE IF NOT EXISTS program_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_id INTEGER NOT NULL, voter_key TEXT NOT NULL, user_id INTEGER, name TEXT,
  story INTEGER, visual INTEGER, craft INTEGER, comment TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(app_id, voter_key)
);
CREATE TABLE IF NOT EXISTS program_people (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT, title TEXT, role TEXT,       -- 评审 / 导师
  record TEXT, source TEXT, source_url TEXT, status TEXT DEFAULT '邀约中', sort INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS likeness_library (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT, archetype TEXT, ages TEXT, genres TEXT, uses TEXT, limits TEXT, fee TEXT, status TEXT
);
CREATE INDEX IF NOT EXISTS idx_pv_app ON program_votes(app_id);
CREATE INDEX IF NOT EXISTS idx_pa_status ON program_apps(status);
