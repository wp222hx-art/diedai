-- v4.2 全站后台：专家照片 / 站点文案 / 影片评语管理 / 媒体库
ALTER TABLE program_people ADD COLUMN photo TEXT;           -- 照片地址（/api/cms/media/:id 或 /static/...）
ALTER TABLE program_people ADD COLUMN photo_credit TEXT;    -- 署名与许可
ALTER TABLE program_people ADD COLUMN bio TEXT;
ALTER TABLE program_people ADD COLUMN visible INTEGER DEFAULT 1;
ALTER TABLE expert_library ADD COLUMN photo TEXT;
ALTER TABLE expert_library ADD COLUMN photo_credit TEXT;
ALTER TABLE expert_library ADD COLUMN visible INTEGER DEFAULT 1;
ALTER TABLE expert_library ADD COLUMN sort INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN avatar TEXT;
ALTER TABLE users ADD COLUMN disabled INTEGER DEFAULT 0;

-- 评语治理：观众短评 / 专家评审意见均可隐藏、置顶、回复
ALTER TABLE program_votes ADD COLUMN hidden INTEGER DEFAULT 0;
ALTER TABLE program_votes ADD COLUMN pinned INTEGER DEFAULT 0;
ALTER TABLE program_votes ADD COLUMN reply TEXT;
ALTER TABLE program_votes ADD COLUMN flag TEXT;
ALTER TABLE program_reviews ADD COLUMN public_ok INTEGER DEFAULT 0;   -- 是否允许公开展示（匿名）
ALTER TABLE program_reviews ADD COLUMN featured INTEGER DEFAULT 0;    -- 精选专家短评
ALTER TABLE program_reviews ADD COLUMN op_note TEXT;

-- 站点文案（首页 Hero、公告条、页脚声明、时间线等，前台读取，后台编辑）
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY, label TEXT, grp TEXT, value TEXT, kind TEXT DEFAULT 'text', sort INTEGER DEFAULT 0,
  updated_by INTEGER, updated_at TEXT DEFAULT (datetime('now'))
);
-- 媒体库（照片 / 封面上传到 R2）
CREATE TABLE IF NOT EXISTS cms_media (
  id INTEGER PRIMARY KEY AUTOINCREMENT, r2_key TEXT NOT NULL, mime TEXT, size INTEGER, name TEXT,
  user_id INTEGER, created_at TEXT DEFAULT (datetime('now'))
);
