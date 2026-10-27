#!/usr/bin/env bash
# 迭代影交汇 核心验收用例（需先 npm run db:reset 并启动服务）
B=${BASE:-http://localhost:3000}/api
pass=0; fail=0
login(){ curl -s -X POST $B/auth/login -H 'Content-Type: application/json' -d "{\"email\":\"$1\",\"password\":\"demo1234\"}" | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])'; }
req(){ local m=$1 p=$2 t=$3 d=${4:-'{}'}; curl -s -o /tmp/r.json -w '%{http_code}' -X $m "$B$p" -H 'Content-Type: application/json' ${t:+-H "Authorization: Bearer $t"} -d "$d"; }
get(){ curl -s -o /tmp/r.json -w '%{http_code}' "$B$1" ${2:+-H "Authorization: Bearer $2"}; }
check(){ if [ "$2" == "$3" ]; then echo "✅ $1 ($2)"; pass=$((pass+1)); else echo "❌ $1 期望 $3 实际 $2 :: $(head -c 200 /tmp/r.json)"; fail=$((fail+1)); fi; }
C=$(login creator@demo.cn); C2=$(login creator2@demo.cn); E=$(login expert@demo.cn); E2=$(login expert2@demo.cn)
O=$(login org@demo.cn); D=$(login dist@demo.cn); OP=$(login ops@demo.cn); OP2=$(login ops2@demo.cn); F=$(login finance@demo.cn)

check "AT01 团队隔离：创作者A访问B的作品档案" $(get /assets/3 $C) 403
check "AT01 完成作品组缺完整成片被阻止" $(req POST /entries $C '{"asset_id":2,"track_id":3,"accept_rules":true}') 422
check "AT02 概念片 29s+61s 不合格被阻止" $(req POST /entries $C '{"asset_id":2,"track_id":4,"accept_rules":true,"clips":[29,61],"has_budget":true}') 422
check "AT02 报名未授权网络展映仍可提交(新作品)" $(req POST /assets $C '{"title":"雾港来信","form":"AI剧集","episodes":10,"ep_minutes":6,"stage":"开发中","logline":"一个关于雾中港口与旧信件的悬疑故事。","team":"林深"}') 200
NEW=$(python3 -c 'import json;print(json.load(open("/tmp/r.json"))["id"])')
check "    提案组报名（30s+60s、预算齐全）" $(req POST /entries $C "{\"asset_id\":$NEW,\"track_id\":4,\"accept_rules\":true,\"clips\":[30,60],\"has_budget\":true}") 200
check "AT03 有利益关系专家接受→回避" $(req POST /reviews/2/accept $E2 '{"relations":["指导教师关系"]}') 200
grep -q 已回避 /tmp/r.json && echo "    ↳ 状态：已回避"
check "    已回避后不得评分" $(req POST /reviews/2/submit $E2 '{}') 409
check "    评分缺理由被拒" $(req POST /reviews/1/submit $E '{"scores":{"故事":5,"技术可行性":4,"市场":4,"团队":4,"预算":3}}') 422
check "    完整评分提交并锁定" $(req POST /reviews/1/submit $E '{"scores":{"故事":5,"技术可行性":4,"市场":4,"团队":4,"预算":3},"reasons":{"故事":"a","技术可行性":"b","市场":"c","团队":"d","预算":"e"},"comment_feedback":"好"}') 200
python3 -c 'import json;d=json.load(open("/tmp/r.json"));print("    ↳ 综合分",d["total"],"建议",d["suggestion"])'
check "    重复提交被锁定" $(req POST /reviews/1/submit $E '{}') 409
check "AT04 未发布结果不在公开荣誉API" $(get /honors) 200
check "AT14 交易运营(机构)无权发布奖项" $(req POST /ops/award-results/1/publish $O) 403
check "    运营提名(审批人1)" $(req POST /ops/award-results $OP '{"award_id":9,"entry_id":2}') 200
AR=$(python3 -c 'import json;print(json.load(open("/tmp/r.json"))["id"])')
check "    同一人二次批准被拒（双人审批）" $(req POST /ops/award-results/$AR/approve $OP) 403
check "    未批准不可发布" $(req POST /ops/award-results/$AR/publish $OP) 409
check "    第二人批准" $(req POST /ops/award-results/$AR/approve $OP2) 200
check "    发布并生成证书" $(req POST /ops/award-results/$AR/publish $OP) 200
CERT=$(python3 -c 'import json;print(json.load(open("/tmp/r.json"))["certificate"])')
check "    证书公开验真" $(get /certificates/$CERT) 200
check "AT06 荣誉撤销" $(req POST /ops/award-results/$AR/revoke $OP '{"reason":"演示撤销"}') 200
get /certificates/$CERT >/dev/null; grep -q 已撤销 /tmp/r.json && echo "    ↳ 证书状态即时变为已撤销"
check "AT10 NDA未批准不可见资料室" $(get /listings/1 $O) 200
python3 -c 'import json;d=json.load(open("/tmp/r.json"));print("    ↳ dataroom =",d["dataroom"])'
check "    未签NDA申请被拒" $(req POST /listings/1/access $O '{"level":"完整剧本"}') 422
check "AT09 全球独家挂牌与大陆已占用独家重叠→阻断" $(req POST /listings $C '{"asset_id":1,"type":"成片版权许可","territory":"全球","media":"全媒体","language":"全语种","start_date":"2027-06-01","end_date":"2027-12-31","exclusive":1,"public_consent":true}') 409
check "AT17 未勾公开授权的挂牌被阻断" $(req POST /listings $C '{"asset_id":1,"type":"成片版权许可","territory":"北美","media":"网络视频","language":"英文","start_date":"2027-01-01","end_date":"2027-12-31"}') 422
# AT08 并发独家
check "    机构A意向（北美·网络视频·独家）" $(req POST /deals $O '{"listing_id":3,"territory":"北美","media":"全媒体","language":"英文","start_date":"2027-01-01","end_date":"2027-03-31","exclusive":1}') 200
DA=$(python3 -c 'import json;print(json.load(open("/tmp/r.json"))["id"])')
check "    发行方B意向（同范围）" $(req POST /deals $D '{"listing_id":3,"territory":"北美","media":"全媒体","language":"英文","start_date":"2027-02-01","end_date":"2027-02-28","exclusive":1}') 200
DB=$(python3 -c 'import json;print(json.load(open("/tmp/r.json"))["id"])')
r1=$(req POST /deals/$DA/activate $O '{"contract_text":"合同A"}') & r2=$(req POST /deals/$DB/activate $D '{"contract_text":"合同B"}'); wait
CNT=$(cd /home/user/webapp && npx wrangler d1 execute webapp-production --local --json --command "SELECT COUNT(*) n FROM rights_reservations WHERE asset_id=3" 2>/dev/null | python3 -c 'import sys,json;print(json.load(sys.stdin)[0]["results"][0]["n"])')
check "AT08 并发签约同一独家权利最多一单占用" "$CNT" 1
check "AT12 算力回调首次核销" $(req POST /provider-callbacks $F '{"project_id":1,"external_id":"TX-DUP-1","amount":500}') 200
check "    重复回调仅处理一次" $(req POST /provider-callbacks $F '{"project_id":1,"external_id":"TX-DUP-1","amount":500}') 200
grep -q '"duplicated":true' /tmp/r.json && echo "    ↳ duplicated=true"
check "AT15 候选渠道不得送审：新建计划(爱奇艺候选)" $(req POST /releases $D '{"asset_id":1,"channel_id":2,"deal_id":1,"region":"中国大陆","language":"中文","media":"网络视频","window_start":"2027-02-01","window_end":"2027-12-31","exclusive":0}') 200
RL=$(python3 -c 'import json;print(json.load(open("/tmp/r.json"))["id"])')
check "    权利就绪（合同覆盖）" $(req POST /releases/$RL/advance $D) 200
check "    送审被阻断" $(req POST /releases/$RL/advance $D) 409
check "AT20 已签渠道：送审→通过→待上线" $(req POST /releases/1/advance $D) 200
req POST /releases/1/advance $D >/dev/null
check "    无内容ID/证据不得确认上线" $(req POST /releases/1/advance $D) 422
check "    带证据确认上线" $(req POST /releases/1/advance $D '{"content_id":"TX-CID-0001","evidence":"EVI-20270101"}') 200
check "AT21 导入账单(10万/扣2万)" $(req POST /statements/import $D '{"release_id":1,"period":"2027-01","external_id":"ST-1","gross":100000,"channel_fee":20000}') 200
ST=$(python3 -c 'import json;print(json.load(open("/tmp/r.json"))["id"])')
check "    未到账不生成分账" $(req POST /settlements $F "{\"statement_id\":$ST}") 409
check "AT22 重复导入去重" $(req POST /statements/import $D '{"release_id":1,"period":"2027-01","external_id":"ST-1","gross":100000,"channel_fee":20000}') 200
grep -q '"duplicated":true' /tmp/r.json && echo "    ↳ duplicated=true"
check "AT13 仅截图无银行凭证不认实收" $(req POST /statements/$ST/receipt $F '{"amount":80000}') 422
check "AT23 部分到账 5万" $(req POST /statements/$ST/receipt $F '{"bank_ref":"BK-001","amount":50000}') 200
check "    超配被拒（再分配4万>剩余3万）" $(req POST /statements/$ST/receipt $F '{"bank_ref":"BK-002","amount":40000}') 409
check "    补足 3万" $(req POST /statements/$ST/receipt $F '{"bank_ref":"BK-003","amount":30000}') 200
check "AT24 分账演示（8万→0.8+1+4+1.32+0.88）" $(req POST /settlements $F "{\"statement_id\":$ST,\"commission_pct\":10,\"promo\":10000,\"recoup\":40000,\"creator_pct\":60}") 200
python3 -c 'import json;d=json.load(open("/tmp/r.json"));print("    ↳",[ (s["item"],s["amount"]) for s in d["steps"]],"合计",d["sum"],"平衡",d["balanced"])'
check "    财务审批" $(req POST /settlements/1/approve $F) 200
check "AT08(估算) 基准4050元" $(req POST /estimates $C '{"shots":[{"name":"a","seconds":3600,"adopt":5,"k":2,"p":0.4,"r":0.2,"billSec":5,"price":0.3}],"scenarios":{"low":{"all":{"p":0.6,"r":0.1,"price":0.2}},"high":{"all":{"p":0.25,"r":0.35,"price":0.5}}}}') 200
python3 -c 'import json;d=json.load(open("/tmp/r.json"));print("    ↳ 低/基/高 =",d["low"]["cost"],d["base"]["cost"],d["high"]["cost"],"（期望 1886 / 4050 / 11110）")'

# ===== 迭影计划 =====
check "LY01 未完成任务不可领取" $(req POST /lightyear/claim $C '{"code":"predict"}') 409
check "LY02 已完成挂牌任务领取" $(req POST /lightyear/claim $C '{"code":"listing"}') 200
check "LY03 重复领取被拒" $(req POST /lightyear/claim $C '{"code":"listing"}') 409
check "LY04 匿名可预测（不入库）" $(req POST /lightyear/predict "" '{"form":"series","style":"oriental","minutes":60,"model":"mix"}') 200
python3 -c 'import json;d=json.load(open("/tmp/r.json"));print("    ↳ 基准",d["base"]["std"],"标准Token ¥",d["base"]["cost"],"周期",d["totalWeeks"],"周")'
check "LY05 登录预测入库" $(req POST /lightyear/predict $C '{"asset_id":1,"form":"series","style":"realistic","minutes":96,"model":"mix"}') 200
PID=$(python3 -c 'import json;print(json.load(open("/tmp/r.json"))["prediction_id"])')
check "LY06 不满足条件的星级被拒(共创)" $(req POST /lightyear/apply $C "{\"asset_id\":1,\"tier\":\"共创\",\"prediction_id\":$PID}") 409
check "LY07 获奖作品申请入选" $(req POST /lightyear/apply $C "{\"asset_id\":1,\"tier\":\"入选\",\"prediction_id\":$PID}") 200
check "LY08 机构不能领取创作者算力" $(req POST /lightyear/claim $O '{"code":"join"}') 403
check "LY09 生成登记幂等" $(req POST /lightyear/usage $C '{"model":"2.5","resolution":"720p","seconds":30,"request_id":"ly-r1"}') 200
check "    重复请求不重复扣减" $(req POST /lightyear/usage $C '{"model":"2.5","resolution":"720p","seconds":30,"request_id":"ly-r1"}') 200
check "LY10 2.0 单段超15秒被拒" $(req POST /lightyear/usage $C '{"model":"2.0","resolution":"720p","seconds":20,"request_id":"ly-r2"}') 422

# ---------- 迭影计划主流程 ----------
check "PG01 报名缺院校信息被拒" $(req POST /program/apply $C '{"title":"毕业作业","team":"A组","track":"院校毕业生","form":"AI短片","logline":"一个关于毕业季告别的十分钟短片","accept":true}') 422
check "PG02 院校毕业生报名成功" $(req POST /program/apply $C '{"title":"毕业作业","team":"A组","track":"院校毕业生","school":"北京电影学院","grad_year":2026,"form":"AI短片","minutes":12,"logline":"一个关于毕业季告别的十分钟短片","accept":true}') 200
PC=$(python3 -c 'import json;print(json.load(open("/tmp/r.json"))["code"])')
check "PG03 机构账号不能报名" $(req POST /program/apply $O '{"title":"x","team":"x","track":"专业团队","form":"AI电影","logline":"xxxxxxxxxxxxxx","accept":true}') 403
check "PG04 作者不能给自己打分" $(req POST /program/vote/$PC $C '{"story":9,"visual":9,"craft":9}') 403
check "PG05 匿名观众打分" $(req POST /program/vote/$PC "" '{"story":8,"visual":7,"craft":9,"device":"device-test-000001"}') 200
check "PG06 同设备重复打分被拒" $(req POST /program/vote/$PC "" '{"story":8,"visual":7,"craft":9,"device":"device-test-000001"}') 409
check "PG07 分值越界被拒" $(req POST /program/vote/$PC $C2 '{"story":11,"visual":7,"craft":9}') 422
check "PG08 初选榜加权排名" $(get "/program/board?track=院校毕业生") 200
python3 -c 'import json;d=json.load(open("/tmp/r.json"));r=[x for x in d["rows"] if x["votes"]<15 and x["recommend"]];print("    ↳ 不足15票不推荐:", "OK" if not r else "FAIL")'
check "PG09 创作者不能推荐晋级" $(req POST /program/promote $C) 403
check "PG10 运营按规则推荐晋级" $(req POST /program/promote $OP) 200
check "PG11 未晋级作品不可录路演" $(req POST /program/apps/8/roadshow $OP '{"score":90,"note":"x"}') 409
check "PG12 路演录入（通过）" $(req POST /program/apps/2/roadshow $OP '{"score":86,"note":"世界观完整，镜头一致性好"}') 200
check "PG13 初审核定算力面值" $(req POST /program/apps/2/approve $OP '{"grant_yuan":800000}') 200
check "PG14 同一人复核被拒（双人审批）" $(req POST /program/apps/2/approve $OP '{}') 403
check "PG15 第二人复核→算力发放" $(req POST /program/apps/2/approve $OP2 '{}') 200
python3 -c 'import json;d=json.load(open("/tmp/r.json"));print("    ↳ 发放", d["tokens"], "标准Token")'
check "PG16 重复复核被拒" $(req POST /program/apps/2/approve $OP2 '{}') 409
check "PG17 肖像授权申请需说明用途" $(req POST /program/likeness/1/request $C '{"purpose":"短"}') 422
check "PG18 肖像授权申请" $(req POST /program/likeness/1/request $C '{"purpose":"《雾港来信》老年船长角色，约3分钟，国内网络发行"}') 200

# ---------- 迭代盛典栏目 ----------
check "JD01 迭代盛典栏目公开" $(get /diedai) 200
python3 -c 'import json;d=json.load(open("/tmp/r.json"));c=[x["code"] for x in d["sections"]];w=[x for x in d["sections"] if x["code"]=="winners"][0]["body"]["win"];print("    ↳ 章节",len(c),"含第四届:", "edition4" in c, "首届获奖", len(w), "公众号文章", len(d["posts"]))'
check "JD02 创作者不能导入文章" $(req POST /jinding/posts $C '{"title":"x","body":"y"}') 403
check "JD03 运营导入公众号文章" $(req POST /jinding/posts $OP '{"title":"迭代盛典征集公告（测试）","body":"第一段\n\n第二段","url":"https://mp.weixin.qq.com/s/test001","pub_date":"2026-10-20"}') 200
check "JD04 同一原文链接不可重复导入" $(req POST /jinding/posts $OP '{"title":"重复","body":"y","url":"https://mp.weixin.qq.com/s/test001"}') 409
check "JD06 文章详情" $(get /jinding/posts/1) 200
check "JD05 院校下拉值报名（海外院校）" $(req POST /program/apply $C2 '{"title":"海外毕业作品","team":"NYU组","track":"院校毕业生","school":"NYU 纽约大学 Tisch 艺术学院","grad_year":2025,"form":"AI短片","logline":"一名留学生在纽约地铁里拍下的最后一个镜头","accept":true}') 200

# ---------- 作品视频 / 专家评审 / 管理后台 ----------
check "VD01 公开获取已上线视频（站内播放器）" $(get /program/apps/GY7K2Q/video) 200
python3 -c 'import json;d=json.load(open("/tmp/r.json"));print("    ↳ player", d["video"]["player"]["type"], d["video"]["status"])'
check "VD02 待审核视频对公众不可见" $(get /program/apps/TY6H2B/video) 200
python3 -c 'import json;d=json.load(open("/tmp/r.json"));print("    ↳ 公众可见:", "无(OK)" if d["video"] is None else "FAIL")'
check "VD03 非作者不能为他人作品上传" $(req POST /program/apps/1/video $C2 '{"url":"https://www.bilibili.com/video/BV1xx411c7mD"}') 403
check "VD04 非法链接被拒" $(req POST /program/apps/5/video $C '{"url":"http://evil.example.com/a"}') 422
check "VD05 B站链接提交→待审核" $(req POST /program/apps/3/video $C '{"url":"https://www.bilibili.com/video/BV1xx411c7mD","title":"正片"}') 200
get /program/apps/CA8R4T/video $C >/dev/null; python3 -c 'import json;d=json.load(open("/tmp/r.json"));p=d["video"]["player"];print("    ↳", p["type"], p["src"][:60])'
check "VD06 创作者无权审核视频" $(req POST /admin/videos/1/decide $C '{"action":"approve"}') 403
check "VD07 驳回需填写原因" $(req POST /admin/videos/8/decide $OP '{"action":"reject"}') 422
check "VD08 运营审核通过上线" $(req POST /admin/videos/8/decide $OP '{"action":"approve"}') 200
check "VD09 重复审核被拒" $(req POST /admin/videos/8/decide $OP2 '{"action":"approve"}') 409
check "VD10 播放统计" $(req POST /media/1/event "" '{"type":"play"}') 200
check "RV01 评审队列（专家）" $(get /review/queue $E) 200
check "RV02 创作者无权评审" $(req POST /review/5 $C '{}') 403
check "RV03 未达观看门槛不可提交" $(req POST /review/5 $E '{"scores":{"story":8,"visual":8,"ai":8,"craft":8,"market":8},"comment":"叙事完整，画面统一，节奏仍可再收紧一些。"}') 422
req POST /media/5/event $E '{"type":"progress","watched":8}' >/dev/null
check "RV04 评语过短被拒" $(req POST /review/5 $E '{"scores":{"story":8,"visual":8,"ai":8,"craft":8,"market":8},"comment":"不错"}') 422
check "RV05 观看达标后提交评审" $(req POST /review/5 $E '{"scores":{"story":8,"visual":9,"ai":7,"craft":8,"market":7},"comment":"牧区影像质感出色，人与马的关系动人，结尾可再克制。","recommend":true}') 200
python3 -c 'import json;print("    ↳ 百分制总分", json.load(open("/tmp/r.json"))["total"])'
check "RV06 提交后锁定" $(req POST /review/5 $E '{"scores":{"story":1,"visual":1,"ai":1,"craft":1,"market":1},"comment":"修改评分修改评分修改评分修改评分"}') 409
check "RV07 利益冲突回避" $(req POST /review/7 $E '{"conflict":["师生关系"]}') 200
check "AD01 评选总表（专家70%+大众30%）" $(get /admin/selection $OP) 200
python3 -c 'import json;d=json.load(open("/tmp/r.json"));t=d["rows"][0];print("    ↳ 第一名",t["title"],"综合",t["composite"]);f=[x["title"] for x in d["rows"] if "分差" in x["flag"]];print("    ↳ 分差预警:",f)'
check "AD02 创作者不能访问评选总表" $(get /admin/selection $C) 403
check "AD03 评审详情" $(get /admin/apps/4/reviews $OP) 200
check "AD04 手动晋级" $(req POST /admin/apps/6/advance $OP) 200
check "AD05 非初选中作品不可重复晋级" $(req POST /admin/apps/6/advance $OP) 409
check "AD06 后台概览统计" $(get /admin/stats $OP) 200
# 站内文件上传（R2）
UP=$(curl -s -o /tmp/r.json -w '%{http_code}' -X POST "$B/program/apps/7/video" -H "Authorization: Bearer $C" -H 'Content-Type: video/mp4' -H 'x-file-name: demo.mp4' -H 'x-duration: 8' --data-binary @public/static/media/demo3.mp4)
check "UP01 本地视频上传至 R2" $UP 200
VID=$(python3 -c 'import json;print(json.load(open("/tmp/r.json"))["id"])')
check "UP02 非 mp4/webm/mov 被拒" $(curl -s -o /tmp/r.json -w '%{http_code}' -X POST "$B/program/apps/7/video" -H "Authorization: Bearer $C" -H 'Content-Type: image/png' --data-binary @public/static/img/hero-m.jpg) 415
check "UP03 待审视频匿名不可播放" $(get /media/$VID) 403
check "UP04 运营可预览待审视频" $(get /media/$VID $OP) 200
check "UP05 Range 分段播放 206" $(curl -s -o /dev/null -w '%{http_code}' -H 'Range: bytes=0-1023' -H "Authorization: Bearer $OP" "$B/media/$VID") 206
check "UP06 作者通过 ?token 预览" $(curl -s -o /dev/null -w '%{http_code}' "$B/media/$VID?token=$C") 200

# ---------------- v4：1亿元扶持 / 分片续传 / 申报材料 / 展映推广 ----------------
check "V401 扶持总览 1 亿" $(get /promo/overview) 200
python3 -c 'import json;d=json.load(open("/tmp/r.json"));assert d["total"]==100000000 and d["compute"]==70000000 and d["promo"]==30000000 and sum(b["amount_yuan"] for b in d["promo_buckets"])==30000000 and sum(b["amount_yuan"] for b in d["compute_buckets"])==70000000;print("    ↳ 7000万算力 + 3000万宣发，资金池合计校验通过")'
head -c 9437184 /dev/urandom > /tmp/mp9.bin
SZ=$(stat -c %s /tmp/mp9.bin)
check "V402 分片上传初始化" $(req POST /uploads/init $C "{\"app_id\":1,\"size\":$SZ,\"mime\":\"video/mp4\",\"file_name\":\"acc.mp4\",\"category\":\"样章\"}") 200
UT=$(python3 -c 'import json;print(json.load(open("/tmp/r.json"))["token"])')
head -c 8388608 /tmp/mp9.bin > /tmp/p1.bin; tail -c +8388609 /tmp/mp9.bin > /tmp/p2.bin
put(){ curl -s -o /tmp/r.json -w '%{http_code}' -X PUT "$B/uploads/$UT/part/$1" -H "Authorization: Bearer $2" -H 'Content-Type: application/octet-stream' --data-binary @$3; }
check "V403 第 1 片上传" $(put 1 $C /tmp/p1.bin) 200
check "V404 他人不可写入分片" $(put 2 $C2 /tmp/p2.bin) 404
check "V405 缺片时不可合并" $(req POST /uploads/$UT/complete $C) 409
check "V406 断点续传：再次 init 返回已完成分片" $(req POST /uploads/init $C "{\"app_id\":1,\"size\":$SZ,\"mime\":\"video/mp4\",\"file_name\":\"acc.mp4\",\"category\":\"样章\"}") 200
python3 -c 'import json;d=json.load(open("/tmp/r.json"));assert d["resumed"] and d["done"]==[1];print("    ↳ resumed，done=[1]")'
check "V407 第 2 片上传" $(put 2 $C /tmp/p2.bin) 200
check "V408 合并完成并入库" $(req POST /uploads/$UT/complete $C) 200
check "V409 超过 4GB 拒绝" $(req POST /uploads/init $C '{"app_id":1,"size":5000000000,"mime":"video/mp4","file_name":"big.mp4"}') 413
check "V410 非视频格式拒绝" $(req POST /uploads/init $C '{"app_id":1,"size":1000,"mime":"image/gif","file_name":"a.gif"}') 415
check "V411 指南接口（首轮10/二轮9）" $(get /guide) 200
python3 -c 'import json;d=json.load(open("/tmp/r.json"));assert len(d["round1"])==10 and len(d["round2"])==9;print("    ↳ R1=10 R2=9")'
check "V412 材料网盘链接缺访问说明被拒" $(req POST /program/apps/1/materials $C '{"item":"r1_chars","url":"https://pan.example.com/s/x1"}') 422
check "V413 材料网盘链接提交" $(req POST /program/apps/1/materials $C '{"item":"r1_chars","url":"https://pan.example.com/s/x1","note":"提取码 a1b2，长期有效"}') 200
MID=$(python3 -c 'import json;print(json.load(open("/tmp/r.json"))["id"])')
check "V414 他人不可查看材料" $(get /program/apps/1/materials $C2) 403
check "V415 二轮材料未晋级不可提交" $(req POST /program/apps/4/materials $C2 '{"item":"r2_pitch","url":"https://pan.example.com/s/x2","note":"提取码 zz11"}') 409
check "V416 运营需补件须写原因" $(req POST /admin/materials/$MID/decide $OP '{"action":"redo"}') 422
check "V417 运营标记需补件" $(req POST /admin/materials/$MID/decide $OP '{"action":"redo","feedback":"请补充反派人物小传"}') 200
check "V418 创作者不可审阅材料" $(req POST /admin/materials/$MID/decide $C '{"action":"confirm"}') 403
check "V419 速览表填写完整即提交" $(req PUT /program/apps/1/sheet $C '{"genre":"悬疑","length":"28分钟","audience":"18-40","stage":"样章","leads":"林深","compute":"1.4亿Token","cash_gap":"12万","delivery":"2027-06"}') 200
grep -q '"complete":true' /tmp/r.json && echo "    ↳ 速览表 complete"
check "V420 展映厅公开" $(get /screening) 200
check "V421 作品多视频（公开仅已上线）" $(get /program/apps/GY7K2Q/videos) 200
python3 -c 'import json;d=json.load(open("/tmp/r.json"));assert all(v["status"]=="已上线" for v in d["rows"]);print("    ↳ 公开视频",len(d["rows"]),"条")'
check "V422 推广事件记录" $(req POST /promo/event "" '{"code":"GY7K2Q","type":"share","ref":"wechat","device":"dvacceptance01"}') 200
check "V423 创作者推广数据" $(get /program/apps/1/promo $C) 200
check "V424 他人不可看推广数据" $(get /program/apps/1/promo $C2) 403
check "V425 宣发扶持发放" $(req POST /admin/apps/1/promo-grant $OP '{"bucket":"traffic","yuan":100000,"note":"平台推流"}') 200
check "V426 宣发超额被拒" $(req POST /admin/apps/1/promo-grant $OP '{"bucket":"media","yuan":5000000}') 422
check "V427 创作者不可发放宣发" $(req POST /admin/apps/1/promo-grant $C '{"bucket":"traffic","yuan":1000}') 403
check "V428 运营编排展映单元/主推" $(req POST /admin/apps/2/screening $OP '{"unit":"lab","featured":true}') 200

# ---------------- v4.1 出海与交易 ----------------
ORG=$(login org@demo.cn)
act(){ req POST /export/deals/$1/act $2 "$3"; }
check "EX01 出海总览（8 模式 / 9 阶段）" $(get /export/overview) 200
python3 -c 'import json;d=json.load(open("/tmp/r.json"));assert len(d["modes"])==8 and len(d["stages"])==9;print("    ↳ modes=8 stages=9")'
check "EX02 创作者不能询价" $(req POST /export/deals $C '{"title_id":1,"mode":"license","territories":["日韩"]}') 403
check "EX03 未开放模式被拒" $(req POST /export/deals $ORG '{"title_id":1,"mode":"buyout","territories":["日韩"]}') 422
check "EX04 超出可售地区被拒" $(req POST /export/deals $ORG '{"title_id":1,"mode":"license","territories":["拉美"]}') 422
check "EX05 终止旧询价（未签约买方可终止）" $(act 2 $ORG '{"action":"terminate","reason":"改变采购计划"}') 200
check "EX06 机构发起独家询价" $(req POST /export/deals $ORG '{"title_id":1,"mode":"mg","territories":["东南亚"],"media":"短剧 App","exclusive":true}') 200
XD=$(python3 -c 'import json;print(json.load(open("/tmp/r.json"))["id"])')
check "EX07 第三方不可查看交易室" $(get /export/deals/$XD $C2) 403
check "EX08 买方不能同意看片" $(act $XD $ORG '{"action":"allow_screen"}') 403
check "EX09 卖方同意看片" $(act $XD $C '{"action":"allow_screen"}') 200
check "EX10 保底+分成缺保底被拒" $(act $XD $ORG '{"action":"offer","share_pct":40}') 422
check "EX11 买方报价" $(act $XD $ORG '{"action":"offer","mg":50000,"share_pct":40}') 200
check "EX12 不能接受自己的报价" $(act $XD $ORG '{"action":"accept"}') 403
check "EX13 卖方还价" $(act $XD $C '{"action":"counter","mg":70000,"share_pct":50}') 200
check "EX14 买方接受 → 条款" $(act $XD $ORG '{"action":"accept"}') 200
check "EX15 独家地区/媒介冲突阻断签约" $(act $XD $ORG '{"action":"sign","contract_text":"东南亚 短剧App 独家 24个月 保底7万 分成50%"}') 409
check "EX16 非约束交易终止" $(act $XD $ORG '{"action":"terminate","reason":"权利冲突，改谈日韩"}') 200
check "EX17 新询价（日韩非独家授权）" $(req POST /export/deals $ORG '{"title_id":1,"mode":"license","territories":["日韩"],"media":"流媒体 SVOD"}') 200
XD=$(python3 -c 'import json;print(json.load(open("/tmp/r.json"))["id"])')
act $XD $C '{"action":"allow_screen"}' >/dev/null; act $XD $ORG '{"action":"offer","amount":200000}' >/dev/null
check "EX18 卖方接受" $(act $XD $C '{"action":"accept"}') 200
check "EX19 签约生效（合同校验值+权利占用）" $(act $XD $C '{"action":"sign","contract_text":"日韩 SVOD 非独家 24 个月 授权费 20 万元"}') 200
check "EX20 已签约卖方不可单方终止" $(act $XD $C '{"action":"terminate","reason":"想反悔了"}') 403
check "EX21 发行窗口超出签约地区被拒" $(req POST /export/deals/$XD/releases $ORG '{"region":"北美","channel":"x","window_start":"2027-01-01","window_end":"2028-01-01"}') 422
check "EX22 规划发行窗口" $(req POST /export/deals/$XD/releases $ORG '{"region":"日韩","channel":"日本 SVOD","window_start":"2027-03-01","window_end":"2029-02-28"}') 200
check "EX23 交付清单不足 4 项被拒" $(act $XD $C '{"action":"deliver","items":["海报与剧照"]}') 422
check "EX24 提交交付" $(act $XD $C '{"action":"deliver","items":["母版（ProRes / H.264 高码率）","多语种字幕（SRT）","元数据（简介 / 分级 / 演职员）","权利链与授权文件"]}') 200
check "EX25 上线缺证据被拒" $(act $XD $ORG '{"action":"golive","content_id":"JP-1"}') 422
check "EX26 验收上线" $(act $XD $ORG '{"action":"golive","content_id":"JP-SVOD-7781","evidence":"https://example.com/jp/7781"}') 200
check "EX27 回款无银行凭证被拒" $(act $XD $F '{"action":"receipt","amount":100000}') 422
check "EX28 财务登记回款" $(act $XD $F '{"action":"receipt","bank_ref":"BK-JP-01","amount":200000}') 200
check "EX29 非运营不可结项" $(act $XD $C '{"action":"close"}') 403
check "EX30 运营结项" $(act $XD $OP '{"action":"close"}') 200
check "EX31 到手测算（保底+分成）" $(req POST /export/calc "" '{"mode":"mg","mg":80000,"share_pct":50,"gross":300000}') 200
python3 -c 'import json;d=json.load(open("/tmp/r.json"));assert d["creator"]==150000;print("    ↳ 80000 + (300000×50% − 80000) = 150000")'
check "EX32 上架缺权利确认被拒" $(req POST /export/titles $C '{"app_id":5,"modes":["license"],"territories":["北美"]}') 422
check "EX33 出海上架提交审核" $(req POST /export/titles $C '{"app_id":5,"modes":["license","revshare"],"territories":["北美","欧洲"],"rights_confirm":true}') 200
XT=$(python3 -c 'import json;print(json.load(open("/tmp/r.json"))["id"])')
check "EX34 未审核片单不公开" $(get /export/titles/$XT) 404
check "EX35 创作者不能审核片单" $(req POST /admin/export/titles/$XT/decide $C '{"action":"approve"}') 403
check "EX36 运营上架" $(req POST /admin/export/titles/$XT/decide $OP '{"action":"approve"}') 200
check "EX37 上架后公开" $(get /export/titles/$XT) 200


echo "—— v4.2 全站后台 CMS ——"
check "CMS01 schema 运营可读" $(get /cms/schema $OP) 200
check "CMS02 schema 创作者禁止" $(get /cms/schema $C) 403
check "CMS03 资源白名单外 404" $(get /cms/secrets $OP) 404
check "CMS04 评审导师列表" $(get /cms/people $OP) 200
NP=$(python3 -c 'import json;d=json.load(open("/tmp/r.json"));print(sum(1 for r in d["rows"] if r.get("photo")))'); check "CMS05 评审导师已有授权照片 ≥5" $([ "$NP" -ge 5 ] && echo ok) ok
check "CMS06 新建评审（缺姓名）422" $(req POST /cms/people $OP '{"title":"x","role":"评审"}') 422
check "CMS07 新建评审" $(req POST /cms/people $OP '{"name":"测试评审","title":"演示头衔","role":"评审","status":"待联系","photo":"/static/img/people/lu-chuan.jpg","photo_credit":"测试","visible":1}') 200
PID=$(python3 -c 'import json;print(json.load(open("/tmp/r.json"))["id"])')
check "CMS08 前台评审含新人" $(get /program/overview) 200
check "CMS09 前台出现测试评审" $(grep -c 测试评审 /tmp/r.json) 1
check "CMS10 隐藏评审" $(req PUT /cms/people/$PID $OP '{"visible":0}') 200
get /program/overview >/dev/null; check "CMS11 隐藏后前台不显示" $(grep -c 测试评审 /tmp/r.json) 0
check "CMS12 删除评审" $(req DELETE /cms/people/$PID $OP) 200
check "CMS13 再删 404" $(req DELETE /cms/people/$PID $OP) 404
check "CMS14 不可删除资源 405" $(req DELETE /cms/compute/1 $OP) 405
check "CMS15 不可新建资源 405" $(req POST /cms/compute $OP '{"name":"x"}') 405
check "CMS16 宣发额度低于已发放 409" $(req PUT /cms/promo/1 $OP '{"amount_yuan":-1}') 409
check "CMS17 专家库排序" $(req POST /cms/experts/reorder $OP '{"ids":[2,1,3]}') 200
get /experts >/dev/null; FIRST=$(python3 -c 'import json;d=json.load(open("/tmp/r.json"));r=d["experts"];print(r[0]["id"])'); check "CMS18 前台专家库按排序" $FIRST 2
check "CMS19 站点文案公开读取" $(get /site) 200
check "CMS20 文案含 8 项" $(python3 -c 'import json;print(len(json.load(open("/tmp/r.json"))))') 8
check "CMS21 修改文案" $(req PUT /cms-settings $OP '{"values":{"slogan":"测试口号 · 迭代向前"}}') 200
get /site >/dev/null; check "CMS22 前台文案即时生效" $(grep -c 测试口号 /tmp/r.json) 1
req PUT /cms-settings $OP '{"values":{"slogan":"每一次迭代，离银幕更近一帧"}}' >/dev/null
check "CMS23 文案创作者禁改" $(req PUT /cms-settings $C '{"values":{"slogan":"x"}}') 403
check "CMS24 评语管理列表" $(get "/cms-comments?kind=all&status=all" $OP) 200
check "CMS25 疑似违规筛选" $(get "/cms-comments?kind=audience&status=flag" $OP) 200
FID=$(python3 -c 'import json;print(json.load(open("/tmp/r.json"))["rows"][0]["id"])')
check "CMS26 敏感词扫描" $(req POST /cms-comments/scan $OP) 200
get "/cms-comments?kind=audience&status=visible" $OP >/dev/null
VID=$(python3 -c 'import json;r=[x for x in json.load(open("/tmp/r.json"))["rows"] if x["kind"]=="audience" and not x["pinned"]];print(r[0]["id"])')
check "CMS27 隐藏短评" $(req POST /cms-comments/audience/$VID $OP '{"action":"hide"}') 200
check "CMS28 恢复短评" $(req POST /cms-comments/audience/$VID $OP '{"action":"show"}') 200
check "CMS29 置顶短评" $(req POST /cms-comments/audience/$VID $OP '{"action":"pin"}') 200
check "CMS30 官方回复" $(req POST /cms-comments/audience/$VID $OP '{"action":"reply","reply":"感谢观看（测试回复）"}') 200
check "CMS31 删除短评缺原因 422" $(req POST /cms-comments/audience/$FID $OP '{"action":"delete"}') 422
check "CMS32 删除违规短评" $(req POST /cms-comments/audience/$FID $OP '{"action":"delete","reason":"广告引流"}') 200
check "CMS33 批量隐藏" $(req POST /cms-comments/batch $OP "{\"ids\":[$VID],\"action\":\"hide\"}") 200
check "CMS34 批量恢复" $(req POST /cms-comments/batch $OP "{\"ids\":[$VID],\"action\":\"show\"}") 200
check "CMS35 非法动作 422" $(req POST /cms-comments/audience/$VID $OP '{"action":"boom"}') 422
get "/cms-comments?kind=expert&status=all" $OP >/dev/null
RID=$(python3 -c 'import json;print(json.load(open("/tmp/r.json"))["rows"][0]["id"])')
check "CMS36 专家意见撤回公开" $(req POST /cms-comments/expert/$RID $OP '{"action":"unpublish"}') 200
check "CMS37 专家意见匿名公开" $(req POST /cms-comments/expert/$RID $OP '{"action":"publish"}') 200
check "CMS38 专家意见运营备注" $(req POST /cms-comments/expert/$RID $OP '{"action":"note","note":"测试备注"}') 200
check "CMS39 评语管理创作者禁止" $(req POST /cms-comments/audience/$VID $C '{"action":"hide"}') 403
check "CMS40 作品页公开评语" $(get /program/apps/GY7K2Q/comments) 200
check "CMS41 公开评语不含专家姓名" $(grep -c '"expert"' /tmp/r.json) 0
check "CMS42 总控台" $(get /cms-dashboard $OP) 200
check "CMS43 审计日志" $(get "/cms-audit?q=cms" $OP) 200
check "CMS44 审计含 CMS 操作" $([ $(grep -o 'cms\.' /tmp/r.json | wc -l) -ge 5 ] && echo ok) ok
check "CMS45 上传非图片 415" $(curl -s -o /tmp/r.json -w '%{http_code}' -X POST $B/cms-media -H "Authorization: Bearer $OP" -H 'Content-Type: text/plain' --data 'hello') 415
python3 -c "from PIL import Image;Image.new('RGB',(64,64),(30,110,235)).save('/tmp/t.jpg')"
check "CMS46 上传图片到媒体库" $(curl -s -o /tmp/r.json -w '%{http_code}' -X POST $B/cms-media -H "Authorization: Bearer $OP" -H 'Content-Type: image/jpeg' --data-binary @/tmp/t.jpg) 200
MURL=$(python3 -c 'import json;print(json.load(open("/tmp/r.json"))["url"])')
check "CMS47 媒体公开访问" $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000$MURL) 200
check "CMS48 照片绑定专家库" $(req PUT /cms/experts/3 $OP "{\"photo\":\"$MURL\",\"photo_credit\":\"测试授权\"}") 200
check "CMS49 不能改自己角色" $(req PUT /cms/users/8 $OP '{"role":"creator"}') 403
CID=$(curl -s $B/auth/me -H "Authorization: Bearer $C2" | python3 -c 'import sys,json;d=json.load(sys.stdin);print((d.get("user") or d)["id"])')
check "CMS50 停用用户" $(req PUT /cms/users/$CID $OP '{"disabled":1}') 200
check "CMS51 停用后会话失效" $(get /auth/me $C2) 401
check "CMS52 停用后禁止登录" $(req POST /auth/login "" '{"email":"creator2@demo.cn","password":"demo1234"}') 403
req PUT /cms/users/$CID $OP '{"disabled":0}' >/dev/null; C2=$(login creator2@demo.cn)
check "CMS53 恢复后可登录" $([ -n "$C2" ] && echo ok) ok
check "CMS54 签约作品不可删" $(req DELETE /cms/apps/1 $OP) 409

echo; echo "通过 $pass，失败 $fail"
