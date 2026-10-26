# 迭影计划 · 迭代 × 捷成世纪 AI 影视扶持

> **品牌定名（2026-10-25）**：迭影计划 / ITER·FILM Program　Slogan：**每一次迭代，离银幕更近一帧**
> 原工作名“光年计划”与 2024 广东时装周“光年计划”青年设计师孵化行动重名，已弃用；额度档位同步去星空化：体验 → 入选 → 孵化 → 共创。
> 上线前待办：第 41 / 9 / 42 类商标检索，域名与公众号、抖音、小红书同名账号注册。

> **v3（2026-10-25）品牌主线重构**：整站收敛为一个活动——“迭影计划”。5,000 万元 Seedance 2.0 / 2.5 算力，面向国内 AI 专业电影团队与影视院校毕业生，提供 **免费算力 · 完片孵化 · 发行支持**。原平台能力（盛典、影市、发行、工作台）退为配套，入口收进抽屉与页脚。

## v3.2 更新（2026-10-26）
- **影视院校库** `public/static/schools.js`：169 所，8 个分组（内地专业影视院校 / 艺术美术院校 / 综合大学影视学院 / 港澳台 / 北美 / 英国·欧洲 / 亚太 / 拉美·其他）；报名表为“搜索框 + 分组原生下拉 + 其他手填”，手机端调用系统滚轮
- **金鼎盛典栏目** `#/jinding`（一级导航）：关于、体系架构、赛道与奖项、评审机制、年度日历、荣誉与证书、公众号文章 7 个章节
  - 体系内容存 D1 `jd_sections`（状态“草案”），运营可 `PUT /api/jinding/sections/:code` 更新
  - 公众号文章存 `jd_posts`，运营在栏目页“导入公众号文章”（`POST /api/jinding/posts`，原文链接去重）
  - ⚠️ 公开渠道未检索到影视类“金鼎盛典”公众号的可抓取文章（同名结果为净水、地产、储能等行业奖项），待提供公众号名称/文章链接后导入

## 信息架构（5 个一级入口，手机底栏同步）
| 入口 | 路径 | 内容 |
|---|---|---|
| 迭影计划（首页） | `#/` | 主视觉、三项扶持、评选流程、评审导师精选、初选榜 Top6、配套入口、报名 CTA |
| 初选榜 | `#/board`、`#/vote/:code` | 赛道切换；作品页 1—10 分三维打分 + 邀请链接 |
| 评审导师 | `#/jury` | 12 位评审 + 8 位导师，附公开报道来源 |
| 配套支持 | `#/support`、`/likeness`、`/predict` | 专家库、老艺术家肖像/声音授权库、算力与周期测算 |
| 出海交易 | `#/export` | 海外市场数据（带来源）、出海服务、渠道矩阵、链接影市/发行中心 |
| 报名 / 我的 | `#/apply`、`#/me` | 两赛道报名表；报名进度条、评分排名、算力余额；运营登录后为审批台 |

手机底栏：计划 · 初选榜 · **报名（中心按钮）** · 评审 · 我的。

## 评选机制
1. **线上初选**：任何人可为作品打分（叙事 / 视觉 / 完成度，各 1—10 分）；登录用户按账号、匿名按设备去重；作者不能自评。
   - 排名分 = `v/(v+m)·R + m/(v+m)·C`（m=10，C=全站均分），抑制少量刷分
   - 赛道（专业团队 / 院校毕业生）前 25% 且 ≥15 人评分 → 推荐晋级路演
2. **路演**：运营录入路演综合分（≥70 通过）与评议意见
3. **双人审批**：初审核定算力面值（1 万—300 万元）→ 另一名运营复核 → 从“路演扶持池 / 院校专项池”原子扣减并发放标准 Token

## 新增 API（`src/routes/program.ts`）
`GET /api/program/overview` · `GET /api/program/board?track=` · `GET /api/program/apps/:code` · `POST /api/program/vote/:code` · `POST /api/program/apply` · `GET /api/program/mine` · `GET /api/program/likeness` · `POST /api/program/likeness/:id/request` · `GET /api/program/admin` · `POST /api/program/promote` · `POST /api/program/apps/:id/roadshow` · `POST /api/program/apps/:id/approve`

数据表（`migrations/0003_program.sql`）：`program_apps`、`program_votes`、`program_people`、`likeness_library`；演示数据 `seed_program.sql`。

## 数据真实性说明
- 评审 / 导师：取自公开报道中的院校与电影节评审经历（北影节 AIGC 单元、北京电影学院“学生导演奖”、北影节创投等），页面附来源链接，状态均标“邀约中”
- 出海数据：DataEye / 虎嗅 / 钛媒体公开报道，页面附来源
- 肖像授权库：为合作模式演示条目（未指名具体艺人），以正式授权合同为准
- 报名作品与评分：演示数据

## 测试
`bash tests/acceptance.sh` → **73 项通过**（新增 PG01—PG18：报名校验、自评拦截、去重、加权排名、晋级规则、路演、双人审批、肖像申请）

演示账号（密码 `demo1234`）：creator@demo.cn（创作者）、ops@demo.cn + ops2@demo.cn（双人审批）

---

# 迭代影交汇 · Iteration Film Hub
> 迭代盛典 × 捷成世纪｜AIGC 影视创作、盛典、交易与全渠道发行协作平台（工作名）

依据《内容平台战略与产品落地全案 V1.1》与《平台命名与功能模块技术策划案 V1.1》搭建的**可运行 P0 平台**：一套作品档案 · 四条业务线 · 五类工作台 · 22 个功能模块的核心闭环。

## 已完成功能
| 业务线 | 已实现 |
|---|---|
| 身份 M01 | 注册/登录（PBKDF2 + Session Token）、7 类角色、服务端权限校验 |
| 作品档案 M02 | 建档（字段校验）、版本快照与提交锁定、团队隔离（AT01） |
| 迭代盛典 M03–M05 | 届次/赛道/奖项配置；完成作品组与提案组差异化校验（30—60 秒概念片×2、篇幅≥30 分钟）；分项展映授权；回执；利益冲突申报→回避→重派工单；盲审打分（每维 1—5 分＋理由，综合分=Σ(分÷5×权重)）；提交锁定；分差≥20 自动生成第三评；提名→第二人批准→发布→电子证书；撤销→证书即时失效＋交易复核工单；公开验真页 |
| 迭代影创 M06–M07 | 试制/孵化/联合开发包；M0–M4 里程碑；算力账本；**算力预算生成器**（G=N×k÷q×(1+r)，三场景，演示值 1886/4050/11110 元）；供应商回调幂等核销（AT12） |
| 迭代影市 M08–M10 | 四类挂牌；公开授权单独勾选；权利矩阵；父子地区/媒介/语言冲突检测；NDA＋分级资料室逐机构批准/撤权；意向不锁权；**签约生效原子锁权**（INSERT…WHERE NOT EXISTS，并发最多一单成功，AT08） |
| 发行中心 M15–M21 | 14 个渠道档案（业务/技术状态独立）；发行实例状态机；权利窗口校验；候选渠道禁止送审（AT15）；上线须内容 ID＋证据（AT20）；报表导入幂等去重与更正版（AT22）；银行凭证核验实收、部分到账、禁止超配（AT13/AT23）；分账瀑布（AT24：8 万→0.8+1+4+1.32+0.88）；财务审批 |
| 运营治理 M11/M13/M14 | 活动预约、挂牌审核（未清权不可发布）、专家分派、工单队列、审计日志、事件 Outbox |
| 前端 | 影视风格（暗场黑＋放映金、胶片条、海报卡、证书），**移动端优先**：底部 Tab、抽屉导航、表格转卡片、底部弹出表单、安全区适配 |

## ✨ 迭影计划（5000万元 Seedance 影视算力共享）
- **活动页** `/#/lightyear`：5000万元计数动画、四级星阶（体验→入选→孵化→共创）、体验任务、五池分配环形图、迭影公式、实时点亮、双模型说明；首页新增竖版海报区块与顶部光带入口
- **迭影测算** `/#/lightyear/predict`：输入形态/风格/片长/覆盖率/模型策略（2.0、2.5、智能混合）/分辨率/镜头构成/团队经验/k/操作员/参考视频比例 → 输出三场景标准Token与刊例价、制作周期甘特图、补贴覆盖、风格建议、分镜头类明细
- **迭影算力钱包** `/#/lightyear/wallet`：余额与等级、任务领取（领取动效）、凭预测申请定向额度、生成登记扣减、流水；运营账号进入即为审批台
- **迭影公式 DY-1.0**：`T = Σ Eⱼ × Mⱼ × O × (1+i) × W·H·24/1024 × 1.08`，`Mⱼ = k/qⱼ × (1+r)`，`qⱼ = 1−(1−pⱼ)^k`，`pⱼ = p₀ⱼ × 风格 × 团队 × 模型`
  - Token 口径取自火山引擎公开公式（宽×高×帧率×时长/1024）；刊例价：Seedance 2.0 ¥46/¥28、Seedance 2.5 ¥70/¥42 每百万tokens（不含/含视频输入）
  - 标准Token = 折算到 Seedance 2.0 ¥46/百万 的等值量；5000万元 ≈ 1.087 万亿标准Token
  - 五池：普惠入驻 400万 · 入选扶持 2250万 · 孵化里程碑 1500万 · 盛典荣誉 500万 · 风险机动 350万（元）
- **规则**：体验任务合计最高 3000 万标准Token；入选=预测基准×60%（上限3亿）；孵化=80%（上限10亿）；共创=100%（上限50亿）；荣誉加成 1 亿/奖项。资金池原子扣减、领取唯一约束、生成请求幂等、2.0单段≤15秒/2.5≤30秒
- API：`GET /lightyear/overview`、`POST /lightyear/predict`、`GET /lightyear/me`、`POST /lightyear/claim`、`POST /lightyear/apply`、`GET /lightyear/admin`、`POST /lightyear/grants/:id/decide`、`POST /lightyear/usage`

## 访问路径
前端（Hash 路由）：`/#/` 首页 · `/#/festival` 盛典（赛道/流程/荣誉库/专家网络/日历）· `/#/incubate` 影创 · `/#/estimator` 算力估算 · `/#/market` 影市 · `/#/listing/:id` 挂牌详情 · `/#/distribution` 发行中心（渠道/流程/交付/模式/分账）· `/#/events` · `/#/academy` · `/#/verify/:code` 证书验真 · `/#/rules` · `/#/login` · `/#/workbench/:section` 工作台

主要 API（`/api`）：
- 公开：`GET /home /editions /honors /certificates/:code /experts /listings /listings/:id /demands /channels /events /courses /insights`
- 身份：`POST /auth/login /auth/register /auth/logout`，`GET /auth/me`
- 工作台：`GET /dashboard`；`POST /assets /entries /reviews/:id/accept /reviews/:id/submit /estimates /projects /provider-callbacks /listings /listings/:id/access /access-grants/:id/decide /deals /deals/:id/activate /releases /releases/:id/advance /statements/import /statements/:id/receipt /settlements /settlements/preview /settlements/:id/approve`
- 运营：`POST /ops/assign /ops/award-results /ops/award-results/:id/(approve|publish|revoke) /ops/listings/:id/review`，`GET /ops/audit`
- 错误码：401 未登录 · 403 无权限 · 409 状态/权利冲突 · 422 材料或参数错误

## 演示账号（密码均为 `demo1234`）
creator@demo.cn（创作者）· creator2@demo.cn · expert@demo.cn / expert2 / expert3（专家）· org@demo.cn（认证机构）· dist@demo.cn（发行运营）· ops@demo.cn / ops2@demo.cn（联合运营，双人审批）· finance@demo.cn（财务）

## 数据架构
- **存储**：Cloudflare D1（SQLite），29 张表，覆盖身份、内容资产、赛事评奖、项目制作、版权交易、发行履约、治理七个域
- **核心实体**：users / assets / asset_versions / editions / tracks / awards / entries / review_assignments / award_results / certificates / projects / milestones / estimates / usage_ledger / listings / demands / access_grants / deals / rights_reservations / channels / releases / statements / settlements / events / tickets / audit_logs / outbox
- **公开资料来源**：专家网络（北京国际电影节 AIGC 单元评委、北京电影学院教授等，来源：中国传媒大学新闻网、北京电影学院官网）；行业数据（捷成股份 2025 年报摘要、中国网络视听节目服务协会、财新、DataEye、中国证券报等）——均附原文链接，并标注“不代表已受邀/已合作”

## 本地开发
```bash
npm run build
npm run db:reset           # 迁移 + 种子数据
pm2 start ecosystem.config.cjs
bash tests/acceptance.sh   # 55 项验收用例（含迭影计划 LY01—LY10）（会改动数据，跑完可再 db:reset）
```
种子数据由 `python3 scripts/gen_seed.py > seed.sql` 生成。

## 尚未实现 / 下一步建议
1. 私有对象存储（R2）：签名直传、病毒扫描、水印转码、短期签名链接
2. 电子签约、支付服务、渠道 API 连接器（M22 P1）、自动技术 QC
3. 本地化任务台（M18）与宣发投放台（M19）的完整台账
4. 学院课程订单、肖像/声音授权申请（M12，P1）
5. 短信/邮件通知、双因素验证、导出审批
6. 正式部署：创建 D1 生产库并替换 `wrangler.jsonc` 中的 database_id

## 部署
- **平台**：Cloudflare Pages + D1 · **技术栈**：Hono + TypeScript + 原生 JS + 自研 CSS 设计系统
- **状态**：沙盒运行中；生产部署待选择路径（自有 Cloudflare 账户 / Genspark 托管）
- **最后更新**：2026-10-25

> 名称与子品牌均为工作方案，未做商标核查；奖项、权重、比例、价格均为讨论稿。平台不提供公众募资、保收益或资金托管；演示数据均已标注。

## 视觉规范 v2（2026-10-25 · 去 AI 化重设计）
- **基调**：电影节节目册 / 行业报告式排版。真实影院摄影 + 衬线标题 + 细线网格 + 单一放映金（#c9a45c）
- **已移除**：AI 生成海报/横幅、发光阴影、渐变文字、星点/扫光/粒子动画、HOT 角标、霓虹多色星阶、环形发光图
- **迭影计划**：首页改为 One-sheet 计划海报（片单式署名栏）；活动页改为 01–06 编号章节：额度档位表、入驻任务清单、资金池分段条、测算方法、模型刊例表、发放记录
- **图片来源**：`public/static/img/hero*.jpg`、`program-*.jpg` 均为 image_search 检索到的 CC / 公有领域影院摄影，经降饱和与压暗处理；上线前建议替换为自有摄影或品牌主视觉
