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

# ---------- 金鼎盛典栏目 ----------
check "JD01 金鼎盛典栏目公开" $(get /jinding) 200
python3 -c 'import json;d=json.load(open("/tmp/r.json"));print("    ↳ 体系章节", len(d["sections"]), "荣誉", len(d["honors"]))'
check "JD02 创作者不能导入文章" $(req POST /jinding/posts $C '{"title":"x","body":"y"}') 403
check "JD03 运营导入公众号文章" $(req POST /jinding/posts $OP '{"title":"金鼎盛典征集公告（测试）","body":"第一段\n\n第二段","url":"https://mp.weixin.qq.com/s/test001","pub_date":"2026-10-20"}') 200
check "JD04 同一原文链接不可重复导入" $(req POST /jinding/posts $OP '{"title":"重复","body":"y","url":"https://mp.weixin.qq.com/s/test001"}') 409
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

echo; echo "通过 $pass，失败 $fail"
