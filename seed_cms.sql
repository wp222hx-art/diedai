-- v4.2 CMS 种子：站点文案 / 专家照片（CC/PD 授权，署名见 photo_credit）/ 公开专家短评 / 待审评语演示
INSERT OR REPLACE INTO site_settings (key,label,grp,value,kind,sort) VALUES ('hero_label','Hero 角标','首页 Hero','迭代 × 捷成世纪 · 2027 年度扶持计划','text',1);
INSERT OR REPLACE INTO site_settings (key,label,grp,value,kind,sort) VALUES ('hero_title','Hero 主标题','首页 Hero','迭影计划','text',2);
INSERT OR REPLACE INTO site_settings (key,label,grp,value,kind,sort) VALUES ('slogan','Hero 口号','首页 Hero','每一次迭代，离银幕更近一帧','text',3);
INSERT OR REPLACE INTO site_settings (key,label,grp,value,kind,sort) VALUES ('deadline','报名截止日','首页 Hero','2027.01.31','text',4);
INSERT OR REPLACE INTO site_settings (key,label,grp,value,kind,sort) VALUES ('notice_tag','公告条标签','公告条','征集中','text',1);
INSERT OR REPLACE INTO site_settings (key,label,grp,value,kind,sort) VALUES ('notice_title','公告条标题','公告条','第四届迭代盛典 · 影视专业毕业生作品征集已启动','text',2);
INSERT OR REPLACE INTO site_settings (key,label,grp,value,kind,sort) VALUES ('notice_sub','公告条副标题','公告条','2021 年由张会军、杨步亭、岳晓湄等电影专家发起 · 院校毕业生赛道可同步参评','textarea',3);
INSERT OR REPLACE INTO site_settings (key,label,grp,value,kind,sort) VALUES ('footer_disclaimer','页脚免责声明','页脚','“迭影计划”为工作名称；1 亿元为合作方拟投入的扶持总面值（AI 算力 7,000 万元 + 宣发资源 3,000 万元），以书面协议为准。评审与导师为邀约中，以官方公布为准。免费算力不代表获奖、获投或发行承诺。演示数据均已标注。© 2026 迭代','textarea',1);
UPDATE program_people SET photo='/static/img/people/tian-zhuangzhuang.jpg', photo_credit='Bryan C · CC BY-SA 2.0 · Wikimedia Commons（https://commons.wikimedia.org/wiki/File:Tian_Zhuangzhuang.jpg）' WHERE name='田壮壮';
UPDATE expert_library SET photo='/static/img/people/tian-zhuangzhuang.jpg', photo_credit='Bryan C · CC BY-SA 2.0 · Wikimedia Commons（https://commons.wikimedia.org/wiki/File:Tian_Zhuangzhuang.jpg）' WHERE name='田壮壮';
UPDATE program_people SET photo='/static/img/people/lu-chuan.jpg', photo_credit='Baiyeruge · CC BY 2.0 · Wikimedia Commons（https://commons.wikimedia.org/wiki/File:Luchuan01.jpg）' WHERE name='陆川';
UPDATE expert_library SET photo='/static/img/people/lu-chuan.jpg', photo_credit='Baiyeruge · CC BY 2.0 · Wikimedia Commons（https://commons.wikimedia.org/wiki/File:Luchuan01.jpg）' WHERE name='陆川';
UPDATE program_people SET photo='/static/img/people/zeng-jian.jpg', photo_credit='張新偉 · Public domain · Wikimedia Commons（https://commons.wikimedia.org/wiki/File:%E6%9B%BE%E5%8A%8D%E7%8D%B2%E7%AC%AC51%E5%B1%86%E9%87%91%E9%A6%AC%E3%80%8C%E6%9C%80%E4%BD%B3%E6%94%9D%E5%BD%B1%E7%8D%8E%E3%80%8D.jpg）' WHERE name='曾剑';
UPDATE expert_library SET photo='/static/img/people/zeng-jian.jpg', photo_credit='張新偉 · Public domain · Wikimedia Commons（https://commons.wikimedia.org/wiki/File:%E6%9B%BE%E5%8A%8D%E7%8D%B2%E7%AC%AC51%E5%B1%86%E9%87%91%E9%A6%AC%E3%80%8C%E6%9C%80%E4%BD%B3%E6%94%9D%E5%BD%B1%E7%8D%8E%E3%80%8D.jpg）' WHERE name='曾剑';
UPDATE program_people SET photo='/static/img/people/wen-muye.jpg', photo_credit='張新偉 · Public domain · Wikimedia Commons（https://commons.wikimedia.org/wiki/File:%E6%96%87%E7%89%A7%E9%87%8E%E7%8D%B2%E7%AC%AC55%E5%B1%86%E9%87%91%E9%A6%AC%E3%80%8C%E6%9C%80%E4%BD%B3%E6%96%B0%E5%B0%8E%E6%BC%94%E3%80%8D%E3%80%81%E3%80%8C%E6%9C%80%E4%BD%B3%E5%8E%9F%E8%91%97%E5%8A%87%E6%9C%AC%E3%80%8D%E9%9B%99%E6%96%99%E7%8D%8E.jpg）' WHERE name='文牧野';
UPDATE expert_library SET photo='/static/img/people/wen-muye.jpg', photo_credit='張新偉 · Public domain · Wikimedia Commons（https://commons.wikimedia.org/wiki/File:%E6%96%87%E7%89%A7%E9%87%8E%E7%8D%B2%E7%AC%AC55%E5%B1%86%E9%87%91%E9%A6%AC%E3%80%8C%E6%9C%80%E4%BD%B3%E6%96%B0%E5%B0%8E%E6%BC%94%E3%80%8D%E3%80%81%E3%80%8C%E6%9C%80%E4%BD%B3%E5%8E%9F%E8%91%97%E5%8A%87%E6%9C%AC%E3%80%8D%E9%9B%99%E6%96%99%E7%8D%8E.jpg）' WHERE name='文牧野';
UPDATE program_people SET photo='/static/img/people/stanley-tong.jpg', photo_credit='Dick Thomas Johnson from Tokyo, Japan · CC BY 2.0 · Wikimedia Commons（https://commons.wikimedia.org/wiki/File:Stanley_Tong_at_Red_Carpet_of_the_Tokyo_International_Film_Festival_2024.jpg）' WHERE name='唐季礼';
UPDATE expert_library SET photo='/static/img/people/stanley-tong.jpg', photo_credit='Dick Thomas Johnson from Tokyo, Japan · CC BY 2.0 · Wikimedia Commons（https://commons.wikimedia.org/wiki/File:Stanley_Tong_at_Red_Carpet_of_the_Tokyo_International_Film_Festival_2024.jpg）' WHERE name='唐季礼';
UPDATE expert_library SET sort=id;
UPDATE program_reviews SET public_ok=1 WHERE status='已提交' AND recommend=1;
UPDATE program_reviews SET featured=1, op_note='演示：精选专家短评' WHERE app_id IN (1,2) AND user_id=3;
INSERT INTO program_votes (app_id,voter_key,name,story,visual,craft,comment,pinned,reply) VALUES
 (1,'seed-cm-1','演示观众·小林',9,9,8,'雾港的光影太有质感了，结尾信件那场戏看哭了。（演示短评）',1,'感谢认真观看！主创团队已收到你的鼓励。（演示官方回复）'),
 (1,'seed-cm-2','演示观众·阿哲',8,9,8,'AI 镜头一致性比去年同类作品好很多，期待长片版。（演示短评）',0,NULL),
 (2,'seed-cm-3','演示观众·Momo',9,10,8,'太空邮路的世界观好想看系列！转场稍微有点跳。（演示短评）',0,NULL),
 (3,'seed-cm-4','演示观众·老周',7,8,7,'唐风美术在线，案件推理可以再烧脑一点。（演示短评）',0,NULL),
 (4,'seed-cm-5','演示观众·Kiki',8,9,7,'异兽设计很萌，适合做成短剧连载。（演示短评）',0,NULL);
INSERT INTO program_votes (app_id,voter_key,name,story,visual,craft,comment,flag,hidden) VALUES (1,'seed-flag-1','演示评分人',3,3,3,'演示待审评语：加微信领取内部资源，刷分包过','敏感词：加微信',1);
