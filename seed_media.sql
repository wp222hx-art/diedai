-- v4 宣发扶持资金池（3000 万元）与演示数据（演示，非真实合作）
INSERT INTO promo_buckets (code,name,amount_yuan,used_yuan,intro,sort) VALUES
 ('premiere','首映与展映',8000000,0,'线下首映礼、影院 / 艺术空间巡回展映、迭代盛典展映单元场地与放映支持',1),
 ('traffic','平台推流',9000000,0,'短视频与长视频平台推荐位、信息流投放、话题与榜单运营，按作品热度与评审结果分档',2),
 ('material','物料制作',4500000,0,'正式海报、预告片精剪、多语种字幕与配音、宣发视觉包',3),
 ('festival','电影节与市场',4500000,0,'国际电影节报名费、市场展摊位、片方差旅与版权路演',4),
 ('media','媒体与公关',4000000,0,'主创采访、行业媒体专题、发布会与 KOL 观片团',5);
UPDATE program_apps SET featured=1, screen_unit='feature' WHERE code='GY7K2Q';
UPDATE program_apps SET featured=1 WHERE code='XH3M9P';
UPDATE program_apps SET featured=1, screen_unit='campus' WHERE code='CA8R4T';
UPDATE program_videos SET category='先导片A' WHERE id=1;
UPDATE program_videos SET category='预告' WHERE id=2;
INSERT INTO program_videos (app_id,user_id,kind,url,duration,title,status,reviewer,reviewed_at,plays,finishes,category) VALUES
 (1,1,'link','/static/media/demo2.mp4',8,'《雾港来信》先导片B · 连续叙事（演示片段）','已上线',8,datetime('now','-5 day'),640,388,'先导片B'),
 (1,1,'link','/static/media/demo3.mp4',8,'《雾港来信》正式预告（演示片段）','已上线',8,datetime('now','-1 day'),2210,1504,'预告');
INSERT INTO promo_grants (app_id,bucket,yuan,note,operator) VALUES (1,'material',60000,'正式海报与预告精剪（演示）',8);
UPDATE promo_buckets SET used_yuan=60000 WHERE code='material';
INSERT INTO app_materials (app_id,user_id,round,item,kind,url,note,version,status,feedback) VALUES
 (1,1,1,'r1_deck','link','https://pan.example.com/s/demo-deck','提取码 8k2d · 有效期至 2027-03-31（演示）',2,'已确认',NULL),
 (1,1,1,'r1_story','link','https://pan.example.com/s/demo-story','提取码 3fa1 · 长期有效（演示）',1,'需补件','请补充结局部分的场戏，并标注第 5 集分集走向'),
 (1,1,1,'r1_budget','link','https://pan.example.com/s/demo-budget','在线表格，评审可读（演示）',1,'待审阅',NULL);
UPDATE program_apps SET sheet='{"genre":"悬疑 / 家庭","length":"28 分钟","audience":"18—40 岁悬疑剧集观众","stage":"样章","leads":"导演 林深 · AI 制作 深焦工作室","compute":"Seedance 2.0 · 约 1.4 亿 Token","promo":"预告精剪、平台推流","cash_gap":"约 12 万元（配乐与混音）","delivery":"2027 年 6 月"}' WHERE id=1;
INSERT INTO promo_events (app_id,type,ref,device,day) VALUES
 (1,'view','wechat','dvdemo0001',date('now','-3 day')),(1,'view','wechat','dvdemo0002',date('now','-2 day')),(1,'view','douyin','dvdemo0003',date('now','-2 day')),
 (1,'view','direct','dvdemo0004',date('now','-1 day')),(1,'view','weibo','dvdemo0005',date('now')),(1,'share','wechat','dvdemo0001',date('now','-3 day')),
 (1,'share','poster','dvdemo0003',date('now','-1 day')),(2,'view','wechat','dvdemo0006',date('now','-1 day')),(2,'share','wechat','dvdemo0006',date('now'));
