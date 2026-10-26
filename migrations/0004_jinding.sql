-- 迭代盛典栏目（原工作名“金鼎盛典”，表名沿用 jd_）：体系内容（可由运营维护）+ 公众号文章导入
CREATE TABLE IF NOT EXISTS jd_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT UNIQUE, title TEXT, body TEXT, sort INTEGER DEFAULT 0,
  status TEXT DEFAULT '草案', updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS jd_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, pub_date TEXT, category TEXT, summary TEXT,
  body TEXT, cover TEXT, source TEXT, url TEXT UNIQUE, created_by INTEGER, created_at TEXT DEFAULT (datetime('now'))
);
