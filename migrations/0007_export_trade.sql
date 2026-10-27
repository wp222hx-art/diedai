-- v4.1 出海与交易中心：出海片单 · 交易（9 阶段）· 发行窗口 · 事件留痕
CREATE TABLE IF NOT EXISTS export_titles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_id INTEGER UNIQUE NOT NULL, user_id INTEGER NOT NULL,
  modes TEXT NOT NULL,              -- JSON 可接受交易模式
  territories TEXT NOT NULL,        -- JSON 可售地区
  languages TEXT,                   -- 已有 / 可做语种
  formats TEXT,                     -- 横屏 / 竖屏 / 剧集切条
  price_hint TEXT, highlights TEXT, rights_note TEXT,
  status TEXT DEFAULT '审核中',     -- 审核中 / 已上架 / 已驳回 / 已下架
  reject_reason TEXT, reviewer INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS export_deals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  title_id INTEGER NOT NULL, app_id INTEGER NOT NULL,
  buyer_id INTEGER NOT NULL, seller_id INTEGER NOT NULL,
  mode TEXT NOT NULL,               -- buyout / license / mg / revshare / agency / coprod / option / presale
  territories TEXT NOT NULL, media TEXT, languages TEXT,
  exclusive INTEGER DEFAULT 0, term_months INTEGER,
  amount REAL DEFAULT 0,            -- 买断价 / 授权费 / 期权费 / 预售总额
  mg REAL DEFAULT 0,                -- 保底预付
  share_pct REAL DEFAULT 0,         -- 创作方分成 % 或代理佣金 %
  currency TEXT DEFAULT 'CNY',
  stage TEXT DEFAULT '询价',        -- 询价 / 看片 / 报价 / 条款 / 签约 / 交付 / 上线 / 回款 / 完结 / 已终止
  message TEXT, contract_hash TEXT, delivery TEXT, content_id TEXT, live_evidence TEXT,
  received REAL DEFAULT 0, close_reason TEXT,
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ed_title ON export_deals(title_id, stage);
CREATE TABLE IF NOT EXISTS export_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL, actor_id INTEGER, actor TEXT, stage TEXT, action TEXT, detail TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ee_deal ON export_events(deal_id);
CREATE TABLE IF NOT EXISTS export_releases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL, region TEXT NOT NULL, channel TEXT NOT NULL, language TEXT,
  window_start TEXT NOT NULL, window_end TEXT NOT NULL, status TEXT DEFAULT '计划',
  created_at TEXT DEFAULT (datetime('now'))
);
