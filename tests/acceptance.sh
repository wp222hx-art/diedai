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

# ===== 光年计划 =====
check "LY01 未完成任务不可领取" $(req POST /lightyear/claim $C '{"code":"predict"}') 409
check "LY02 已完成挂牌任务领取" $(req POST /lightyear/claim $C '{"code":"listing"}') 200
check "LY03 重复领取被拒" $(req POST /lightyear/claim $C '{"code":"listing"}') 409
check "LY04 匿名可预测（不入库）" $(req POST /lightyear/predict "" '{"form":"series","style":"oriental","minutes":60,"model":"mix"}') 200
python3 -c 'import json;d=json.load(open("/tmp/r.json"));print("    ↳ 基准",d["base"]["std"],"标准Token ¥",d["base"]["cost"],"周期",d["totalWeeks"],"周")'
check "LY05 登录预测入库" $(req POST /lightyear/predict $C '{"asset_id":1,"form":"series","style":"realistic","minutes":96,"model":"mix"}') 200
PID=$(python3 -c 'import json;print(json.load(open("/tmp/r.json"))["prediction_id"])')
check "LY06 不满足条件的星级被拒(光年)" $(req POST /lightyear/apply $C "{\"asset_id\":1,\"tier\":\"光年\",\"prediction_id\":$PID}") 409
check "LY07 获奖作品申请星耀" $(req POST /lightyear/apply $C "{\"asset_id\":1,\"tier\":\"星耀\",\"prediction_id\":$PID}") 200
check "LY08 机构不能领取创作者算力" $(req POST /lightyear/claim $O '{"code":"join"}') 403
check "LY09 生成登记幂等" $(req POST /lightyear/usage $C '{"model":"2.5","resolution":"720p","seconds":30,"request_id":"ly-r1"}') 200
check "    重复请求不重复扣减" $(req POST /lightyear/usage $C '{"model":"2.5","resolution":"720p","seconds":30,"request_id":"ly-r1"}') 200
check "LY10 2.0 单段超15秒被拒" $(req POST /lightyear/usage $C '{"model":"2.0","resolution":"720p","seconds":20,"request_id":"ly-r2"}') 422

echo; echo "通过 $pass，失败 $fail"
