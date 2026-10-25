-- 迭代影交汇 核心数据结构（模块化单体 · 七域）
-- 身份域
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,            -- creator / expert / institution / distributor / operator / finance / admin
  org TEXT,
  title TEXT,
  salt TEXT NOT NULL,
  pwd_hash TEXT NOT NULL,
  verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at TEXT NOT NULL
);
-- 内容资产域
CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  form TEXT NOT NULL,            -- AIGC电影 / AI剧集 / 微短剧 / AI漫剧 / 动画
  genre TEXT,
  episodes INTEGER DEFAULT 1,
  ep_minutes REAL DEFAULT 0,
  total_minutes REAL DEFAULT 0,
  stage TEXT DEFAULT '开发中',   -- 开发中 / 试制中 / 制作中 / 已成片
  logline TEXT,
  synopsis TEXT,
  team TEXT,
  ai_tools TEXT,
  rights_status TEXT DEFAULT '待清权',
  public_consent INTEGER DEFAULT 0,
  cover TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS asset_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER NOT NULL,
  version TEXT NOT NULL,
  note TEXT,
  checksum TEXT,
  locked INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
-- 赛事评奖域
CREATE TABLE IF NOT EXISTS editions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, year INTEGER, theme TEXT, status TEXT,
  open_at TEXT, close_at TEXT, ceremony_at TEXT, timezone TEXT DEFAULT 'Asia/Shanghai', rule_version TEXT
);
CREATE TABLE IF NOT EXISTS tracks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  edition_id INTEGER, code TEXT, name TEXT, grp TEXT, materials TEXT, weights TEXT, quota INTEGER
);
CREATE TABLE IF NOT EXISTS awards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  track_id INTEGER, name TEXT, quota INTEGER DEFAULT 1, allow_vacant INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  edition_id INTEGER, track_id INTEGER, asset_id INTEGER, version_id INTEGER, user_id INTEGER,
  status TEXT DEFAULT '已提交',   -- 已提交/待补件/资格通过/评审中/提名/未提名/获奖/合规暂停/撤回
  consents TEXT, receipt_no TEXT, missing TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS expert_library (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT, title TEXT, org TEXT, field TEXT, note TEXT, source TEXT, source_url TEXT
);
CREATE TABLE IF NOT EXISTS review_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER, expert_id INTEGER, stage TEXT DEFAULT '初审',
  status TEXT DEFAULT '待接受',   -- 待接受/已回避/评审中/已提交
  conflict TEXT, scores TEXT, total REAL, comment_internal TEXT, comment_feedback TEXT,
  submitted_at TEXT, created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS award_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  award_id INTEGER, entry_id INTEGER,
  status TEXT DEFAULT '待批准',   -- 待批准/未公开/有效/复核中/已撤销
  approver1 INTEGER, approver2 INTEGER, published_at TEXT, revoke_reason TEXT
);
CREATE TABLE IF NOT EXISTS certificates (
  code TEXT PRIMARY KEY, award_result_id INTEGER, holder TEXT, work_title TEXT, version TEXT,
  award_name TEXT, edition_name TEXT, issuer TEXT, issued_at TEXT, status TEXT DEFAULT '有效'
);
-- 项目制作域
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER, owner_id INTEGER, title TEXT, package TEXT DEFAULT '试制包',
  status TEXT DEFAULT '待材料审核', budget_total REAL DEFAULT 0, compute_grant REAL DEFAULT 0,
  compute_used REAL DEFAULT 0, demand_id INTEGER, created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER, code TEXT, name TEXT, deliverables TEXT, release_pct REAL, status TEXT DEFAULT '未开始', evidence TEXT
);
CREATE TABLE IF NOT EXISTS estimates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER, user_id INTEGER, input TEXT, result TEXT, valid_until TEXT, created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS usage_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER, kind TEXT, amount REAL, unit TEXT, provider TEXT, external_id TEXT UNIQUE, note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
-- 版权交易域
CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER, seller_id INTEGER, type TEXT, title TEXT, summary TEXT,
  territory TEXT, media TEXT, language TEXT, start_date TEXT, end_date TEXT, exclusive INTEGER DEFAULT 0,
  price_mode TEXT, price_hint TEXT, visibility TEXT DEFAULT '公开摘要',
  status TEXT DEFAULT '审核中', created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS demands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_user_id INTEGER, org TEXT, title TEXT, genre TEXT, duration TEXT, region TEXT, language TEXT,
  budget_band TEXT, rights TEXT, deadline TEXT, status TEXT DEFAULT '征集中', created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS access_grants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER, requester_id INTEGER, level TEXT, purpose TEXT, nda_signed INTEGER DEFAULT 0,
  status TEXT DEFAULT '待批准', expires_at TEXT, created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS deals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER, asset_id INTEGER, buyer_id INTEGER, seller_id INTEGER, deal_type TEXT,
  territory TEXT, media TEXT, language TEXT, start_date TEXT, end_date TEXT, exclusive INTEGER DEFAULT 0,
  amount REAL, status TEXT DEFAULT '意向', contract_hash TEXT, created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS rights_reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER, source TEXT, source_id INTEGER, territory TEXT, media TEXT, language TEXT,
  start_date TEXT, end_date TEXT, exclusive INTEGER, status TEXT DEFAULT '已占用', created_at TEXT DEFAULT (datetime('now'))
);
-- 发行履约域
CREATE TABLE IF NOT EXISTS channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT, type TEXT, region TEXT, model TEXT, specs TEXT,
  biz_status TEXT DEFAULT '候选', tech_status TEXT DEFAULT '未接入', public_info TEXT, source_url TEXT
);
CREATE TABLE IF NOT EXISTS releases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER, channel_id INTEGER, deal_id INTEGER, region TEXT, language TEXT, media TEXT,
  window_start TEXT, window_end TEXT, exclusive INTEGER DEFAULT 0,
  status TEXT DEFAULT '计划', content_id TEXT, live_evidence TEXT, live_at TEXT, created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS statements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  release_id INTEGER, period TEXT, external_id TEXT, version INTEGER DEFAULT 1, currency TEXT DEFAULT 'CNY',
  gross REAL, channel_fee REAL, net REAL, received REAL DEFAULT 0, status TEXT DEFAULT '已导入',
  created_at TEXT DEFAULT (datetime('now')), UNIQUE(release_id, period, external_id, version)
);
CREATE TABLE IF NOT EXISTS settlements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  statement_id INTEGER, rule TEXT, result TEXT, status TEXT DEFAULT '待审批', approver INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);
-- 活动
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT, kind TEXT, date TEXT, city TEXT, venue TEXT, capacity INTEGER, booked INTEGER DEFAULT 0, intro TEXT
);
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER, user_id INTEGER, created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(event_id, user_id)
);
-- 学院 / 行业洞察
CREATE TABLE IF NOT EXISTS insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, source TEXT, url TEXT, date TEXT, summary TEXT, tag TEXT
);
CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT, path TEXT, title TEXT, level TEXT, lessons INTEGER, free INTEGER DEFAULT 1, intro TEXT
);
-- 治理域
CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT, object TEXT, detail TEXT, status TEXT DEFAULT '待处理',
  created_by INTEGER, created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, actor_id INTEGER, actor TEXT, action TEXT, object TEXT, detail TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS outbox (
  event_id TEXT PRIMARY KEY, topic TEXT, payload TEXT, processed INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_entries_user ON entries(user_id);
CREATE INDEX IF NOT EXISTS idx_ra_expert ON review_assignments(expert_id);
CREATE INDEX IF NOT EXISTS idx_rr_asset ON rights_reservations(asset_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_releases_asset ON releases(asset_id);
