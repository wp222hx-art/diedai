-- 作品视频（R2 上传或外链）+ 专家评审 + 播放记录
CREATE TABLE IF NOT EXISTS program_videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_id INTEGER NOT NULL, user_id INTEGER NOT NULL,
  kind TEXT NOT NULL,                 -- upload / link
  r2_key TEXT, url TEXT, mime TEXT, size INTEGER, duration REAL, title TEXT,
  status TEXT DEFAULT '待审核',       -- 待审核 / 已上线 / 已驳回 / 已替换
  reviewer INTEGER, reject_reason TEXT, reviewed_at TEXT,
  plays INTEGER DEFAULT 0, finishes INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_pvid_app ON program_videos(app_id);
CREATE INDEX IF NOT EXISTS idx_pvid_status ON program_videos(status);
CREATE TABLE IF NOT EXISTS program_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_id INTEGER NOT NULL, user_id INTEGER NOT NULL,
  scores TEXT NOT NULL, total REAL NOT NULL, comment TEXT, recommend INTEGER DEFAULT 0,
  conflict TEXT, status TEXT DEFAULT '已提交',   -- 已提交 / 已回避
  watched_sec REAL DEFAULT 0, created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(app_id, user_id)
);
