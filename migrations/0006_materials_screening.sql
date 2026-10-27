-- v4：1 亿元扶持（7000 万算力 + 3000 万宣发）· 分片续传 · 申报材料 · 展映与推广
-- 视频：分类（正片/预告/先导A/先导B/样章/花絮）、封面、展映单元
ALTER TABLE program_videos ADD COLUMN category TEXT DEFAULT '正片';
ALTER TABLE program_videos ADD COLUMN cover_key TEXT;
ALTER TABLE program_apps ADD COLUMN sheet TEXT;            -- 项目速览表 JSON
ALTER TABLE program_apps ADD COLUMN screen_unit TEXT;      -- 展映单元（运营编排）
ALTER TABLE program_apps ADD COLUMN featured INTEGER DEFAULT 0;

-- 分片上传会话（R2 multipart，可断点续传）
CREATE TABLE IF NOT EXISTS uploads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL, r2_upload_id TEXT NOT NULL, r2_key TEXT NOT NULL,
  app_id INTEGER NOT NULL, user_id INTEGER NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'video',      -- video / material
  category TEXT, item_code TEXT,
  file_name TEXT, size INTEGER, mime TEXT, duration REAL, part_size INTEGER,
  parts TEXT DEFAULT '[]',                    -- [{n,etag}]
  status TEXT DEFAULT '上传中',               -- 上传中 / 已完成 / 已取消
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_up_user ON uploads(user_id, status);

-- 申报材料（首轮 10 项 / 二轮 9 项，版本化）
CREATE TABLE IF NOT EXISTS app_materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_id INTEGER NOT NULL, user_id INTEGER NOT NULL,
  round INTEGER NOT NULL, item TEXT NOT NULL,
  kind TEXT NOT NULL,                         -- file / link / form
  url TEXT, r2_key TEXT, file_name TEXT, mime TEXT, size INTEGER,
  version INTEGER DEFAULT 1, note TEXT,
  status TEXT DEFAULT '待审阅',               -- 待审阅 / 已确认 / 需补件 / 已替换
  feedback TEXT, reviewer INTEGER, reviewed_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_mat_app ON app_materials(app_id, round, item);

-- 宣发扶持资金池（3000 万元）
CREATE TABLE IF NOT EXISTS promo_buckets (
  code TEXT PRIMARY KEY, name TEXT, amount_yuan REAL, used_yuan REAL DEFAULT 0, intro TEXT, sort INTEGER
);
CREATE TABLE IF NOT EXISTS promo_grants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_id INTEGER NOT NULL, bucket TEXT NOT NULL, yuan REAL NOT NULL, note TEXT,
  operator INTEGER, created_at TEXT DEFAULT (datetime('now'))
);
-- 推广事件：浏览 / 分享 / 播放 / 打分，带来源 ref，用于热度与拉新统计
CREATE TABLE IF NOT EXISTS promo_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_id INTEGER NOT NULL, type TEXT NOT NULL, ref TEXT, device TEXT,
  day TEXT DEFAULT (date('now')), created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_pe_app ON promo_events(app_id, type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pe_dedup ON promo_events(app_id, type, device, day);
CREATE TABLE IF NOT EXISTS upload_parts (
  upload_id INTEGER NOT NULL, n INTEGER NOT NULL, etag TEXT NOT NULL, size INTEGER,
  PRIMARY KEY (upload_id, n)
);
