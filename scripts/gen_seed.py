import hashlib, json, os
def h(pwd, salt): return hashlib.pbkdf2_hmac('sha256', pwd.encode(), salt.encode(), 10000).hex()
def q(s):
    if s is None: return 'NULL'
    if isinstance(s,(int,float)): return str(s)
    return "'" + str(s).replace("'", "''") + "'"
out=["-- 自动生成：python3 scripts/gen_seed.py > seed.sql  （演示数据，均标注来源或“演示”）"]
def ins(table, rows):
    for r in rows:
        cols=",".join(r.keys()); vals=",".join(q(v) for v in r.values())
        out.append(f"INSERT INTO {table} ({cols}) VALUES ({vals});")

users=[
 ("creator@demo.cn","林深","creator","北京电影学院2025届导演系（演示）","编剧/导演"),
 ("creator2@demo.cn","苏芮","creator","中国传媒大学动画与数字艺术学院校友（演示）","AIGC制片人"),
 ("expert@demo.cn","评审专家A","expert","迭代盛典专家委员会（演示账号）","叙事/美学评审"),
 ("expert2@demo.cn","评审专家B","expert","迭代盛典专家委员会（演示账号）","制作/市场评审"),
 ("expert3@demo.cn","评审专家C","expert","迭代盛典专家委员会（演示账号）","技术可行性评审"),
 ("org@demo.cn","周明远","institution","认证发行机构（演示）","版权采购总监"),
 ("dist@demo.cn","陈可","distributor","发行中心（演示）","发行经理"),
 ("ops@demo.cn","运营主管","operator","联合运营管理台","评奖运营/审批人1"),
 ("ops2@demo.cn","合规主管","operator","联合运营管理台","合规复核/审批人2"),
 ("finance@demo.cn","财务复核","finance","联合运营管理台","结算财务"),
]
rows=[]
for i,(e,n,r,o,t) in enumerate(users):
    salt=f"s{i}x9k"; rows.append(dict(email=e,name=n,role=r,org=o,title=t,salt=salt,pwd_hash=h("demo1234",salt),verified=1))
ins("users",rows)

# 公开资料专家库（来源：公开新闻报道；仅作专家网络参考，未经本平台邀约确认）
SRC1=("中国传媒大学新闻网《产业跃迁｜第十六届北京国际电影节AIGC电影单元圆满落幕》2026-05-06","https://www.cuc.edu.cn/cucnews/_t114/2026/0506/c1976a269895/page.psp")
SRC2=("北京电影学院导演系《第十四届“学生导演奖”青年创作论坛｜AI短片展》2025-11-27","https://www.bfa.edu.cn/daoyan/info/1012/3455.htm")
experts=[
 ("唐季礼","导演、监制、动作指导","—","动作/商业类型片","第十六届北京国际电影节AIGC电影单元终审评委",SRC1),
 ("俞白眉","导演、编剧、监制","—","喜剧/编剧","第十六届北京国际电影节AIGC电影单元终审评委",SRC1),
 ("孙忠怀","腾讯公司副总裁、腾讯在线视频董事长","腾讯在线视频","平台发行/长视频","第十六届北京国际电影节AIGC电影单元终审评委",SRC1),
 ("杨紫烨","香港大学未来媒体学院院长","香港大学","纪录片/未来媒体","第十六届北京国际电影节AIGC电影单元终审评委",SRC1),
 ("樊尚·洛维 Vincent Lowy","法国南锡大学教授、法国国立高等路易·卢米埃尔学院前任院长","法国南锡大学","电影理论/国际视野","第十六届北京国际电影节AIGC电影单元终审评委",SRC1),
 ("陆川","导演","—","导演/类型叙事","北影节AIGC单元72小时极限创夺赛评委主席",SRC1),
 ("曹小卉","北京电影学院动画学院教授、中国动画研究院常务副院长","北京电影学院","动画/美术","北影节AIGC单元荣誉盛典颁奖嘉宾",SRC1),
 ("王雷","中国传媒大学动画与数字艺术学院院长","中国传媒大学","动画与数字艺术/AIGC教育","北影节AIGC单元承办方代表",SRC1),
 ("孙琳","导演、编剧","—","编剧/导演","北影节AIGC单元大师工作坊颁奖嘉宾",SRC1),
 ("李大任","腾讯在线视频AI影视表达工作室总经理","腾讯在线视频","AI影视制作","北影节AIGC单元颁奖嘉宾",SRC1),
 ("王红卫","北京电影学院导演系教授","北京电影学院","导演/青年创作","第十四届学生导演奖AI短片论坛主持",SRC2),
 ("周新霞","北京电影学院导演系教授","北京电影学院","剪辑/叙事节奏","第十四届学生导演奖AI短片论坛嘉宾",SRC2),
 ("刘梦雅","北京电影学院数字媒体学院院长","北京电影学院","数字媒体/智能影像","第十四届学生导演奖AI短片论坛嘉宾",SRC2),
]
ins("expert_library",[dict(name=a,title=b,org=c,field=d,note=e,source=s[0],source_url=s[1]) for a,b,c,d,e,s in experts])

ins("editions",[
 dict(name="2026 迭代盛典（演示届次）",year=2026,theme="新叙事·新影像",status="已颁奖",open_at="2026-03-01",close_at="2026-05-31",ceremony_at="2026-09-20",rule_version="R2026.1"),
 dict(name="2027 迭代盛典 · AIGC影视单元",year=2027,theme="让好故事被看见，让好作品走向市场",status="报名中",open_at="2026-10-15",close_at="2027-02-28",ceremony_at="2027-06-18",rule_version="R2027.1"),
])
W1=json.dumps({"叙事":40,"美学":25,"技术完成度":20,"创新":15},ensure_ascii=False)
W2=json.dumps({"故事":30,"技术可行性":25,"市场":20,"团队":15,"预算":10},ensure_ascii=False)
tracks=[]
for ed in (1,2):
    tracks+= [
     dict(edition_id=ed,code="F",name="完成作品组",grp="完成作品",materials="完整审片版、梗概、主创名单、权利声明、AI使用说明",weights=W1,quota=30),
     dict(edition_id=ed,code="P",name="项目提案组",grp="项目提案",materials="大纲、人物小传、美术概念图、两支30—60秒概念片、总预算与算力估算、制作计划",weights=W2,quota=20)]
ins("tracks",tracks)
aw=[]
for tid in (1,3):
    for n in ["最佳叙事作品","最佳动画作品","最佳视觉表达"]: aw.append(dict(track_id=tid,name=n))
for tid in (2,4):
    for n in ["年度潜力项目","最佳项目提案"]: aw.append(dict(track_id=tid,name=n))
ins("awards",aw)
# awards ids: 1-3 track1, 4-6 track3, 7-8 track2, 9-10 track4

assets=[
 dict(owner_id=1,title="霓虹渡口",form="AI剧集",genre="都市悬疑",episodes=12,ep_minutes=8,total_minutes=96,stage="已成片",logline="一名摆渡人在雨夜港口发现每一位乘客都来自同一场未发生的事故。",synopsis="港城最后一班渡轮的摆渡人阿渡，在连续十二个雨夜里遇见同一批乘客……（演示数据）",team="林深（导演/编剧）、何川（AIGC美术）、宋雨（剪辑）",ai_tools="视频生成模型+人工精修；配音为授权真人",rights_status="已清权",public_consent=1,cover="noir"),
 dict(owner_id=1,title="山海食肆",form="AI漫剧",genre="东方奇幻·美食",episodes=30,ep_minutes=3,total_minutes=90,stage="开发中",logline="山海经异兽开在人间的一家深夜食堂。",synopsis="以《山海经》为灵感，每集一只异兽、一道菜、一段人间故事。（演示数据）",team="林深、苏芮",ai_tools="图像生成+分镜+视频生成",rights_status="已清权",public_consent=1,cover="myth"),
 dict(owner_id=2,title="星环邮差",form="AIGC电影",genre="科幻·亲情",episodes=1,ep_minutes=72,total_minutes=72,stage="制作中",logline="近未来，一位老邮差用最后一枚纸质邮票寄出给火星女儿的信。",synopsis="（演示数据）跨越两颗星球的家书，探讨数字时代的情感连接。",team="苏芮（制片）、王野（导演）",ai_tools="全链路AIGC工作流",rights_status="已清权",public_consent=1,cover="scifi"),
 dict(owner_id=2,title="长安夜行录",form="微短剧",genre="古装·悬疑",episodes=60,ep_minutes=2,total_minutes=120,stage="试制中",logline="大唐不良人追查一桩只在月圆之夜发生的连环案。",synopsis="（演示数据）竖屏微短剧，强钩子、快节奏。",team="苏芮团队",ai_tools="AI角色一致性+实拍合成",rights_status="待清权",public_consent=0,cover="tang"),
]
ins("assets",assets)
ins("asset_versions",[
 dict(asset_id=1,version="V1.0",note="参赛审片版",checksum="sha256:9f2a…c41e",locked=1),
 dict(asset_id=2,version="V1.0",note="提案包",checksum="sha256:77ab…02d9",locked=1),
 dict(asset_id=3,version="V0.9",note="阶段成片",checksum="sha256:1c0d…aa31",locked=1),
 dict(asset_id=4,version="V0.3",note="试制样片",checksum="sha256:e5f0…9b72",locked=0),
])
cons=json.dumps({"内部评审":True,"现场展映":True,"网络展映":False,"宣传片段":True},ensure_ascii=False)
ins("entries",[
 dict(edition_id=1,track_id=1,asset_id=1,version_id=1,user_id=1,status="获奖",consents=cons,receipt_no="DD2026-F-0001"),
 dict(edition_id=2,track_id=4,asset_id=2,version_id=2,user_id=1,status="评审中",consents=cons,receipt_no="DD2027-P-0001"),
 dict(edition_id=2,track_id=3,asset_id=3,version_id=3,user_id=2,status="评审中",consents=cons,receipt_no="DD2027-F-0002"),
])
ins("review_assignments",[
 dict(entry_id=2,expert_id=3,stage="初审",status="评审中",conflict="无"),
 dict(entry_id=2,expert_id=4,stage="初审",status="待接受"),
 dict(entry_id=3,expert_id=3,stage="初审",status="待接受"),
 dict(entry_id=3,expert_id=5,stage="初审",status="已提交",conflict="无",scores=json.dumps({"叙事":4,"美学":5,"技术完成度":4,"创新":4},ensure_ascii=False),total=85,comment_internal="长片节奏后段偏慢",comment_feedback="视觉完成度高，建议压缩第三幕",submitted_at="2026-10-20 10:00:00"),
])
ins("award_results",[dict(award_id=1,entry_id=1,status="有效",approver1=8,approver2=9,published_at="2026-09-20 20:30:00")])
ins("certificates",[dict(code="DDSD-2026-F01-7K3Q",award_result_id=1,holder="林深 团队",work_title="霓虹渡口",version="V1.0",award_name="最佳叙事作品（完成作品组）",edition_name="2026 迭代盛典（演示届次）",issuer="迭代盛典组委会（演示）",issued_at="2026-09-20",status="有效")])

ins("projects",[
 dict(asset_id=2,owner_id=1,title="山海食肆",package="孵化包",status="制作中",budget_total=680000,compute_grant=120000,compute_used=18600),
 dict(asset_id=3,owner_id=2,title="星环邮差",package="联合开发包",status="待最终验收",budget_total=2400000,compute_grant=400000,compute_used=352000),
 dict(asset_id=4,owner_id=2,title="长安夜行录",package="试制包",status="待专业评审",budget_total=350000,compute_grant=20000,compute_used=4200),
])
ms=[("M0","开发确认","剧本版本、权利清单、分镜、预算、计划",0),("M1","技术试制","代表性镜头、角色一致性测试、实际费用",10),("M2","样章验证","3—5分钟连续叙事样章、声音字幕、修订预算",25),("M3","阶段成片","合同约定阶段内容、素材台账",40),("M4","成片与交付","母版、字幕、音轨、权利及技术质检报告",25)]
st={1:["已通过","已通过","验收中","未开始","未开始"],2:["已通过","已通过","已通过","已通过","验收中"],3:["已通过","进行中","未开始","未开始","未开始"]}
mrows=[]
for pid in (1,2,3):
    for i,(c,n,d,p) in enumerate(ms): mrows.append(dict(project_id=pid,code=c,name=n,deliverables=d,release_pct=p,status=st[pid][i]))
ins("milestones",mrows)
ins("usage_ledger",[
 dict(project_id=1,kind="授予",amount=120000,unit="元面值",provider="算力供应商（待签）",external_id="GR-0001",note="孵化包授予"),
 dict(project_id=1,kind="已消费",amount=18600,unit="元面值",provider="视频生成API",external_id="TX-88001",note="M1技术试制"),
 dict(project_id=2,kind="授予",amount=400000,unit="元面值",provider="算力供应商（待签）",external_id="GR-0002",note="联合开发包"),
 dict(project_id=2,kind="已消费",amount=352000,unit="元面值",provider="视频生成API",external_id="TX-88002",note="M1-M3累计"),
])

ins("listings",[
 dict(asset_id=1,seller_id=1,type="成片版权许可",title="《霓虹渡口》中国大陆网络独家信息网络传播权",summary="12集×8分钟AI悬疑剧集，2026迭代盛典最佳叙事作品（演示）。",territory="中国大陆",media="网络视频",language="中文",start_date="2027-01-01",end_date="2028-12-31",exclusive=1,price_mode="面议",price_hint="接受采购或保底+分成",visibility="公开摘要",status="已发布"),
 dict(asset_id=2,seller_id=1,type="项目联合开发",title="《山海食肆》AI漫剧联合开发",summary="30集东方奇幻美食漫剧，寻求联合出品与发行方。",territory="全球",media="全媒体",language="全语种",start_date="2027-03-01",end_date="2030-02-28",exclusive=0,price_mode="面议",price_hint="开放联合出品份额洽谈",visibility="认证机构可见",status="已发布"),
 dict(asset_id=3,seller_id=2,type="剧本/IP开发",title="《星环邮差》海外改编期权",summary="72分钟AIGC科幻电影，开放北美及欧洲改编期权（90天）。",territory="北美",media="全媒体",language="英文",start_date="2027-01-01",end_date="2027-03-31",exclusive=1,price_mode="报价",price_hint="期权费可抵扣",visibility="公开摘要",status="已发布"),
 dict(asset_id=4,seller_id=2,type="成片版权许可",title="《长安夜行录》短剧平台首发",summary="60集竖屏古装悬疑微短剧，待清权完成。",territory="中国大陆",media="短剧平台",language="中文",start_date="2027-02-01",end_date="2028-01-31",exclusive=1,price_mode="面议",price_hint="",visibility="公开摘要",status="审核中"),
])
ins("demands",[
 dict(org_user_id=6,org="认证发行机构（演示）",title="东方奇幻AI漫剧采购需求",genre="东方奇幻/国风",duration="60—100集×1—3分钟",region="中国大陆+东南亚",language="中文/英文字幕",budget_band="单部30—80万",rights="信息网络传播权（独家优先）",deadline="2027-01-31"),
 dict(org_user_id=6,org="认证发行机构（演示）",title="出海英文AI短剧定制征集",genre="都市/悬疑/逆袭",duration="50—80集×1—2分钟",region="北美/欧洲",language="英文",budget_band="单部10—30万美元",rights="海外网络独家",deadline="2027-03-15"),
 dict(org_user_id=6,org="认证发行机构（演示）",title="中长篇AIGC电影片单",genre="科幻/现实主义",duration="60分钟以上",region="全球",language="不限",budget_band="面议",rights="全球网络+电视",deadline="2027-05-30"),
])
ins("deals",[dict(listing_id=1,asset_id=1,buyer_id=6,seller_id=1,deal_type="成片版权许可",territory="中国大陆",media="网络视频",language="中文",start_date="2027-01-01",end_date="2028-12-31",exclusive=1,amount=360000,status="履约中",contract_hash="sha256:ab12…ff09")])
ins("rights_reservations",[dict(asset_id=1,source="deal",source_id=1,territory="中国大陆",media="网络视频",language="中文",start_date="2027-01-01",end_date="2028-12-31",exclusive=1)])
ins("access_grants",[dict(listing_id=2,requester_id=6,level="故事大纲",purpose="联合出品评估",nda_signed=1,status="已批准",expires_at="2027-01-31")])

# 渠道：公开信息建档，状态均为“候选/未接入”——不代表已签约或已接入（AT15）
ch=[
 ("腾讯视频","国内长视频／网络影视","中国大陆","采购/分账/会员","横屏，H.264/H.265，字幕SRT","腾讯在线视频设AI影视表达工作室（公开报道）"),
 ("爱奇艺","国内长视频／网络影视","中国大陆","采购/分账","横屏，按平台片源规范","长视频平台，网络电影分账模式公开"),
 ("优酷","国内长视频／网络影视","中国大陆","采购/分账","横屏","长视频平台"),
 ("芒果TV","国内长视频／网络影视","中国大陆","采购/定制","横屏","长视频平台"),
 ("红果短剧","短剧／微短剧","中国大陆","免费+广告分成","竖屏9:16，分集1—3分钟","QuestMobile：2025年9月月活约2.36亿（财新报道）"),
 ("抖音短剧","短剧／微短剧","中国大陆","付费/广告/投流","竖屏9:16","微短剧主要分发平台之一"),
 ("快手短剧","短剧／微短剧","中国大陆","付费/广告","竖屏9:16","微短剧主要分发平台之一"),
 ("咪咕视频","广电／IPTV／OTT／运营商","中国大陆","集成分发","按运营商规范","运营商视频平台"),
 ("IPTV/OTT集成播控","广电／IPTV／OTT／运营商","中国大陆分省","集成分发","节目编码+播控规范","需相关播出及内容许可"),
 ("艺术影院/校园放映","院线／艺术放映／线下展映","中国大陆","场租/票务分成","DCP/ProRes","需放映许可与首映核查"),
 ("ReelShort","海外视频账号／短剧APP","北美/全球","付费解锁/订阅","竖屏，英文","出海短剧头部应用之一（公开报道）"),
 ("DramaBox","海外视频账号／短剧APP","全球","付费解锁/广告","竖屏，多语种","出海短剧应用之一（公开报道）"),
 ("YouTube","海外视频账号／社交渠道","全球","广告分成","横/竖屏，多语字幕","账号运营授权与地域许可"),
 ("航空机上娱乐","行业专用渠道","全球航线","固定许可费","按航司IFE规范","场景专属授权"),
]
ins("channels",[dict(name=a,type=b,region=c,model=d,specs=e,public_info=f,biz_status="候选",tech_status="未接入") for a,b,c,d,e,f in ch])
# 合作中渠道演示（明确“演示样本”）
out.append("UPDATE channels SET biz_status='已签（演示样本）', tech_status='人工导入' WHERE name='腾讯视频';")
ins("releases",[dict(asset_id=1,channel_id=1,deal_id=1,region="中国大陆",language="中文",media="网络视频",window_start="2027-01-01",window_end="2028-12-31",exclusive=1,status="送审")])

ins("events",[
 dict(title="2027迭代盛典 · 开发中项目线上路演（第一季）",kind="路演",date="2026-12-12",city="线上",venue="迭代影交汇直播间",capacity=300,booked=126,intro="8分钟展示+7分钟问答；机构需完成认证与NDA"),
 dict(title="AI漫剧出海发行需求闭门会",kind="发行需求会",date="2026-11-28",city="北京",venue="朝阳区（场地待定）",capacity=60,booked=41,intro="发行机构发布题材、地区、权利与交付规格需求"),
 dict(title="院校专场：北京影视院校毕业作品展映",kind="展映",date="2026-11-16",city="北京",venue="海淀区（场地待定）",capacity=200,booked=88,intro="仅展映已取得现场展映授权的作品"),
 dict(title="算力预算校准工作坊",kind="工作坊",date="2026-11-22",city="上海",venue="徐汇区（场地待定）",capacity=80,booked=52,intro="10—20个代表镜头试制，校准一轮通过率q"),
 dict(title="2027迭代盛典颁奖典礼与行业交易展演",kind="盛典",date="2027-06-18",city="待定",venue="待定",capacity=1200,booked=0,intro="展映·路演·IP洽谈·算力服务·海外发行交流五大板块"),
])
ins("insights",[
 dict(title="捷成股份2025年度报告摘要：版权运营为核心，拓展短剧与AI赋能",source="新浪财经·公司公告",url="http://money.finance.sina.com.cn/corp/view/vCB_AllBulletinDetail.php?stockid=300182&id=12197905",date="2026-04-25",summary="公司坚持内容版权运营“一体”战略，积极拓展短剧微短剧、短视频、数字营销等版权创新业务，AI赋能版权运营；2025年度营业总收入26.45亿元。",tag="产业伙伴"),
 dict(title="捷成股份新设AI产能中心，储备优质IP超100个",source="证券时报网",url="https://www.stcn.com/article/detail/4110390.html",date="2026-08-24",summary="在AI短剧生产方面新设AI产能中心，聚焦AI影视智能化创作，可实现年产精品项目50部以上（公司披露口径）。",tag="产业伙伴"),
 dict(title="2025年中国微短剧市场规模突破1000亿元",source="中国网络视听节目服务协会",url="http://www.cnsa.cn/art/2026/8/6/art_1955_49147.html",date="2026-08-06",summary="2025年中国微短剧市场规模突破1000亿元；报告预测2026年全球短剧市场规模将超过150亿美元。",tag="市场数据"),
 dict(title="微短剧用户规模6.96亿，日均观看超过长视频",source="财新网",url="https://m.caixin.com/m/2025-11-11/102381466.html",date="2025-11-11",summary="我国微短剧用户整体规模为6.96亿人；红果短剧9月月活达2.36亿（QuestMobile）。",tag="市场数据"),
 dict(title="DataEye：2025年漫剧市场规模估计接近200亿元",source="DataEye研究院《2025年微短剧行业数据报告》",url="https://pdf.dfcfw.com/pdf/H3_AP202601211818183880_1.pdf",date="2026-01-21",summary="免费真人微短剧市场规模超500亿，约占真人微短剧整体三分之二；漫剧市场规模估计接近200亿元。",tag="市场数据"),
 dict(title="第十六届北影节AIGC电影单元：14国2840部作品参赛",source="中国传媒大学新闻网",url="https://www.cuc.edu.cn/cucnews/_t114/2026/0506/c1976a269895/page.psp",date="2026-05-06",summary="长片组最佳影片《七日浮生》、短片组最佳影片《牡丹记》、最佳AI剧集《大烟囱》；参评作品三年从430部增至3000余部。",tag="行业标杆"),
 dict(title="AI漫剧行情升温：探访影视行业生产变局",source="中国证券报",url="https://jnzstatic.cs.com.cn/zzb/htmlInfo/38d582e151a0054d43583aa5358866a7.html",date="2026-10-14",summary="AI正在改变分镜设计、镜头生成和后期制作，但完整作品的叙事、表演和质量管理仍需专业团队。",tag="行业趋势"),
 dict(title="2026中国创新影像大赛开设AIGC等五大赛道",source="中国电影电视技术学会等联合主办",url="https://www.aibetas.com/aigc_events/579",date="2026-08",summary="由中国电影电视技术学会、中国传媒大学、北京电影学院等联合主办，AIGC为重点赛道。",tag="行业赛事"),
])
cs=[("创意开发","从灵感到一句话梗概：AIGC时代的类型叙事","入门",8,1,"高概念、钩子与人物弧光"),
 ("剧本结构","中剧结构：12—30集的分集节奏设计","进阶",10,1,"分集钩子、季终高潮与留存"),
 ("分镜美术","角色一致性与美术设定集制作","进阶",9,1,"角色三视图、风格锚点与提示词资产"),
 ("生成工作流","全链路AIGC工作流：图→视频→声音→剪辑","进阶",12,0,"多模型协同、返工控制与版本管理"),
 ("预算","算力预算生成器实战：q值校准与三场景","入门",6,1,"G=N×k÷q×(1+r) 的工程化使用"),
 ("权利合规","AIGC作品权利链、肖像声音授权与生成合成标识","必修",7,1,"训练/推理分项许可与地区合规"),
 ("发行交付","渠道交付包：母版、字幕、元数据与送审","进阶",8,0,"多渠道规格版本化与整改")]
ins("courses",[dict(path=a,title=b,level=c,lessons=d,free=e,intro=f) for a,b,c,d,e,f in cs])
ins("tickets",[dict(kind="挂牌邀请",object="entry:1",detail="award.published：《霓虹渡口》获奖，邀请权利人申请影市精选（不自动上架）",status="已处理",created_by=8)])
ins("audit_logs",[
 dict(actor_id=8,actor="运营主管",action="award.approve",object="award_result:1",detail="审批人1批准"),
 dict(actor_id=9,actor="合规主管",action="award.approve",object="award_result:1",detail="审批人2批准"),
 dict(actor_id=8,actor="运营主管",action="award.publish",object="award_result:1",detail="发布快照并生成证书 DDSD-2026-F01-7K3Q"),
])
print("\n".join(out))
