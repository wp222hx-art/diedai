-- v4.1 出海片单与交易演示数据（演示，非真实交易；买方为演示机构账号）
INSERT INTO export_titles (app_id,user_id,modes,territories,languages,formats,price_hint,highlights,rights_note,status,reviewer) VALUES
 (1,1,'["license","mg","agency","revshare"]','["东南亚","北美","欧洲","日韩"]','["中文","英文字幕","日文字幕"]','["横屏 16:9","竖屏切条 9:16"]','授权费 5—30 万元 / 地区，或保底 + 分成','雾港悬疑 + 家族情感，AI 写实电影感；先导片 A/B 已上线，可切条为 60 集竖屏短剧','原创剧本，团队自有全部著作权；音乐为自制；无肖像使用','已上架',8),
 (2,2,'["buyout","presale","coprod","option"]','["全球"]','["中文","英文"]','["横屏 16:9"]','预售 / 联合出品面议','近未来科幻，95 分钟长片；适合海外流媒体与电影节','原创；已签国内网络独家（中国大陆），海外权利全部可售','已上架',8),
 (3,1,'["revshare","license","buyout"]','["东南亚","港澳台","北美"]','["中文"]','["竖屏 9:16"]','分账 50%—70%','盛唐悬疑，院校毕业生作品，适合短剧 App 与 TikTok 连载','北京电影学院 2025 届毕业作品，主创授权提报','已上架',8);
INSERT INTO export_deals (code,title_id,app_id,buyer_id,seller_id,mode,territories,media,languages,exclusive,term_months,amount,mg,share_pct,currency,stage,message,contract_hash,received,created_at,updated_at) VALUES
 ('EXDEMO1',1,1,7,1,'mg','["东南亚"]','短剧 App','英文/印尼文字幕',1,36,0,80000,50,'CNY','上线','seller','sha256:3f9a1c0d6b7e2a44c1e9d8f1b2a3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5',0,datetime('now','-20 day'),datetime('now','-2 day')),
 ('EXDEMO2',1,1,6,1,'license','["北美"]','免费流媒体 AVOD/FAST','英文',0,24,150000,0,0,'CNY','报价','buyer',NULL,0,datetime('now','-6 day'),datetime('now','-1 day')),
 ('EXDEMO3',2,2,6,2,'presale','["欧洲"]','流媒体 SVOD','英文/法文',1,60,600000,0,0,'CNY','条款','seller',NULL,0,datetime('now','-9 day'),datetime('now','-1 day')),
 ('EXDEMO4',3,3,7,1,'revshare','["东南亚","港澳台"]','视频平台 YouTube/TikTok','中文/英文字幕',0,24,0,0,60,'CNY','回款','seller','sha256:9b2e77aa01c45d6e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e',12600,datetime('now','-40 day'),datetime('now','-3 day'));
INSERT INTO rights_reservations (asset_id,source,source_id,territory,media,language,start_date,end_date,exclusive) VALUES
 (-1,'export',1,'东南亚','短剧 App','英文/印尼文字幕',date('now','-15 day'),date('now','+1080 day'),1),
 (-3,'export',4,'东南亚','视频平台 YouTube/TikTok','中文/英文字幕',date('now','-35 day'),date('now','+690 day'),0),
 (-3,'export',4,'港澳台','视频平台 YouTube/TikTok','中文/英文字幕',date('now','-35 day'),date('now','+690 day'),0);
INSERT INTO export_events (deal_id,actor_id,actor,stage,action,detail,created_at) VALUES
 (1,7,'陈可','询价','发起询价','保底 + 分成 · 东南亚 · 独家',datetime('now','-20 day')),
 (1,1,'林深','看片','同意看片','授权 14 天水印看片',datetime('now','-19 day')),
 (1,7,'陈可','报价','报价','买方报价：保底 60,000 · 45%',datetime('now','-17 day')),
 (1,1,'林深','报价','还价','卖方还价：保底 80,000 · 50% · 含印尼文字幕制作',datetime('now','-16 day')),
 (1,7,'陈可','条款','接受报价','买方接受当前报价',datetime('now','-15 day')),
 (1,8,'运营主管','签约','签约生效','sha256:3f9a1c0d6b7e2a44… · 权利占用 东南亚',datetime('now','-14 day')),
 (1,1,'林深','交付','提交交付','母版、多语种字幕、海报与剧照、元数据、权利链与授权文件',datetime('now','-8 day')),
 (1,7,'陈可','上线','验收并上线','内容ID SEA-SD-20481（演示）',datetime('now','-2 day')),
 (2,6,'周明远','询价','发起询价','授权许可 · 北美 · 非独家',datetime('now','-6 day')),
 (2,1,'林深','看片','同意看片','授权 14 天水印看片',datetime('now','-5 day')),
 (2,6,'周明远','报价','报价','买方报价：CNY 150,000 · FAST 频道 24 个月',datetime('now','-1 day')),
 (3,6,'周明远','询价','发起询价','地区预售 · 欧洲 · 独家',datetime('now','-9 day')),
 (3,2,'苏芮','看片','同意看片','授权 14 天水印看片',datetime('now','-8 day')),
 (3,6,'周明远','报价','报价','买方报价：CNY 600,000 预售款，分 3 期支付',datetime('now','-4 day')),
 (3,2,'苏芮','条款','接受报价','卖方接受当前报价',datetime('now','-1 day')),
 (4,7,'陈可','询价','发起询价','纯分账 · 东南亚/港澳台',datetime('now','-40 day')),
 (4,8,'运营主管','签约','签约生效','sha256:9b2e77aa01c4… · 权利占用 东南亚/港澳台',datetime('now','-35 day')),
 (4,7,'陈可','上线','验收并上线','TikTok 连载账号上线（演示）',datetime('now','-25 day')),
 (4,10,'财务复核','回款','登记回款','BK-SEA-0915 · CNY 12,600（演示）',datetime('now','-3 day'));
INSERT INTO export_releases (deal_id,region,channel,language,window_start,window_end,status) VALUES
 (1,'东南亚','海外短剧 App（演示）','英文/印尼文',date('now','-2 day'),date('now','+1080 day'),'已上线'),
 (4,'东南亚','TikTok 短剧账号','英文字幕',date('now','-25 day'),date('now','+690 day'),'已上线'),
 (4,'港澳台','YouTube 频道','中文',date('now','+10 day'),date('now','+690 day'),'计划');
