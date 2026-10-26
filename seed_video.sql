-- 演示视频（站内 demo 片段，非真实作品）与专家评审样例
INSERT INTO program_videos (app_id,user_id,kind,url,duration,title,status,reviewer,reviewed_at,plays,finishes) VALUES
 (1,1,'link','/static/media/demo1.mp4',8,'《雾港来信》先导片（演示片段）','已上线',8,datetime('now','-6 day'),1286,742),
 (2,2,'link','/static/media/demo2.mp4',8,'《星环邮差》预告（演示片段）','已上线',8,datetime('now','-6 day'),1534,903),
 (3,1,'link','/static/media/demo3.mp4',8,'《长安夜行录》第一集节选（演示片段）','已上线',8,datetime('now','-5 day'),864,411),
 (4,2,'link','/static/media/demo1.mp4',8,'《山海食肆》样片（演示片段）','已上线',9,datetime('now','-4 day'),622,330),
 (5,1,'link','/static/media/demo2.mp4',8,'《北纬四十度》完整版（演示片段）','已上线',9,datetime('now','-3 day'),517,288),
 (6,2,'link','/static/media/demo3.mp4',8,'《潮汐之下》样片（演示片段）','已上线',8,datetime('now','-2 day'),402,190),
 (7,1,'link','/static/media/demo1.mp4',8,'《墨鳞》概念片（演示片段）','已上线',9,datetime('now','-2 day'),355,170),
 (8,2,'link','/static/media/demo2.mp4',8,'《天元》样片（演示片段）','待审核',NULL,NULL,0,0);
INSERT INTO program_reviews (app_id,user_id,scores,total,comment,recommend,status,watched_sec) VALUES
 (1,3,'{"story":9,"visual":9,"ai":8,"craft":8,"market":8}',86.5,'港口雾景的视觉语言统一，信件线索推进节奏稳，三代人情感落点清晰。',1,'已提交',8),
 (1,4,'{"story":8,"visual":9,"ai":9,"craft":8,"market":9}',86.0,'AI 镜头一致性控制得很好，人物面部稳定，具备院线短片单元竞争力。',1,'已提交',8),
 (2,3,'{"story":9,"visual":10,"ai":9,"craft":7,"market":9}',89.0,'世界观完整，太空邮路的设定有记忆点；部分转场略生硬，建议路演前精修。',1,'已提交',8),
 (2,4,'{"story":8,"visual":9,"ai":9,"craft":8,"market":9}',86.0,'工业化潜力强，适合拆分为系列内容出海，算力需求测算合理。',1,'已提交',8),
 (3,4,'{"story":8,"visual":8,"ai":7,"craft":7,"market":8}',76.5,'唐风美术完成度不错，案件结构偏常规，建议强化少女角色动机。',0,'已提交',8),
 (4,3,'{"story":7,"visual":9,"ai":8,"craft":8,"market":7}',78.5,'异兽设计很有辨识度，单元故事形式适合短剧平台。',1,'已提交',8),
 (4,4,'{"story":5,"visual":6,"ai":6,"craft":5,"market":5}',55.5,'叙事松散，单集缺少钩子，AI 生成的口型与表演存在明显瑕疵。',0,'已提交',8),
 (6,5,'{}',0,NULL,0,'已回避',0);
UPDATE program_reviews SET conflict='同校师生关系' WHERE app_id=6 AND user_id=5;
