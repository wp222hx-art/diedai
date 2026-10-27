# 迭影计划 · 迭代 × 捷成世纪 AI 影视扶持

> **品牌定名（2026-10-25）**：迭影计划 / ITER·FILM Program　Slogan：**每一次迭代，离银幕更近一帧**
> 原工作名“光年计划”与 2024 广东时装周“光年计划”青年设计师孵化行动重名，已弃用；额度档位同步去星空化：体验 → 入选 → 孵化 → 共创。
> 上线前待办：第 41 / 9 / 42 类商标检索，域名与公众号、抖音、小红书同名账号注册。

> **v3（2026-10-25）品牌主线重构**：整站收敛为一个活动——“迭影计划”。5,000 万元 Seedance 2.0 / 2.5 算力，面向国内 AI 专业电影团队与影视院校毕业生，提供 **免费算力 · 完片孵化 · 发行支持**。原平台能力（盛典、影市、发行、工作台）退为配套，入口收进抽屉与页脚。

- **GitHub**: https://github.com/wp222hx-art/diedai

v3.4 更新（2026-10-26）· 迭代盛典栏目（原“迭代盛典”更正）
- 一级导航「迭代盛典」→ **「迭代盛典」**（`#/diedai`，旧链接 `#/jinding` 自动跳转；接口 `/api/diedai`，`/api/jinding` 仍可用）。
- 内容全部来自公开资料，并逐条标注来源：
  - 公众号「迭代盛典」原文 3 篇：
    - 《筑梦未来-颁奖盛典｜毕业季的主旋律》（2021-02-08）
    - 《“筑梦未来-颁奖盛典”启动发布会圆满开幕!》（2021-03-20）
    - 《2021迭代盛典获奖作品》（2022-02-21）
  - 北京电影学院公众号文章 1 篇（节选与迭代盛典相关的部分）；
  - 新华网、国际在线、中华网、搜狐/南方周刊、北京电影学院、上海戏剧学院、中新网、文汇报的报道 8 篇。
- 栏目结构共 9 个板块：
  - 第四届征集（2026-06-22 在上海启动，八城授牌，五位顾问受聘）；
  - 关于迭代盛典；
  - 历届回顾；
  - 首届获奖名单：11 项获奖、10 项单项提名、14 部优秀入围；
  - 2025 迭代盛典（发起人寄语、迭代巴中战略合作）；
  - 奖项设置；
  - 发起人与顾问；
  - 媒体报道；
  - 公众号文章（运营可继续导入新文章）。
- 首页新增「第四届迭代盛典征集中」横幅；报名页选择院校毕业生赛道时，会提示可同步推荐参评。
- 栏目内容由 `scripts/gen_diedai_seed.py` 根据 `scripts/diedai_articles.json` 生成 `seed_jinding.sql`。
- 尚缺：第二届详细报道、2025 年完整获奖名单、第四届报名细则与截止时间。这些信息公开渠道均未找到，需组委会提供。

## v3.3 更新（2026-10-26）· 视频评选后台 + 清爽科技主题
**一、视频 → 播放 → 评价 → 评选 全流程进后台**
- **作品视频**：创作者在「我的」或作品页上传，支持两种方式：
  - 本地文件（MP4/WebM/MOV，≤300MB）：存入 Cloudflare R2，上传时显示进度条；
  - 平台链接：B站 / 腾讯视频 / 优酷 / YouTube / Vimeo 自动转成站内嵌入播放器，抖音和网盘以外链方式展示。
- **播放器**：点击封面即播放（HTML5 `playsinline`，支持 Range 分段加载）。同一会话内的播放与完播只计一次。
- **运营审核**：视频提交后为「待审核」，此时公众不可见，作者 / 运营 / 专家可凭 token 预览。通过后才公开并进入专家队列；驳回须填写原因并通知作者；重新上传会把旧视频标为「已替换」。
- **专家评审** `#/review`：
  - 5 个维度——叙事 30 / 视听 25 / AI 技术 20 / 完成度 15 / 市场潜力 10，每项 1—10 分，折算百分制；
  - 必须**看完时长的 60%** 才能提交，评语不少于 15 字；
  - 存在利益冲突需申请回避；提交后锁定，全程写入审计日志。
- **统一管理后台** `#/admin`（运营 / 财务可见），分为：
  - 概览：8 项 KPI、评选漏斗、待办事项；
  - 视频审核：在线预览、通过 / 驳回；
  - 评选总表：综合分 = 专家均分 × 70% + 大众分 × 30%；专家分差 ≥20 或评审不足 2 份会自动预警；可查看评审详情、手动晋级、导出 CSV；
  - 路演与审批：双人审批；
  - 算力资金池、内容运营。
- **登录后的落地页**：运营进入后台，专家进入评审台，创作者进入「我的」；手机底栏的入口按角色切换。
- 新增接口在 `src/routes/video.ts`，新增数据表在 `migrations/0005_video_review.sql`，演示数据在 `seed_video.sql`。演示视频为站内生成的 8 秒测试片段，不是真实作品。

**二、视觉：从暗场改为「清爽科技」**
- 冷白底 `#f5f7fb` + 白色卡片 + 科技蓝 `#1f6feb`→青 `#00a3b8` 渐变，色温约 6500K。数字用等宽字体，标题保留衬线以维持影视质感。
- Hero 背景改为冷蓝双色调摄影图，叠加细网格；去掉胶片颗粒；卡片使用轻阴影和圆角。
- 播放器、公式块、海报保留深色作为「放映窗口」，与明亮页面形成层次。

> 本地开发需要 `--r2=VIDEOS`（已写入 `ecosystem.config.cjs`）。部署前需创建 R2 bucket `webapp-videos`；托管部署（hosted）支持 R2 与 D1。

## v3.2 更新（2026-10-26）
- **影视院校库** `public/static/schools.js`：169 所，8 个分组（内地专业影视院校 / 艺术美术院校 / 综合大学影视学院 / 港澳台 / 北美 / 英国·欧洲 / 亚太 / 拉美·其他）；报名表为“搜索框 + 分组原生下拉 + 其他手填”，手机端调用系统滚轮
- **迭代盛典栏目** `#/jinding`（一级导航）：关于、体系架构、赛道与奖项、评审机制、年度日历、荣誉与证书、公众号文章 7 个章节
  - 体系内容存 D1 `jd_sections`（状态“草案”），运营可 `PUT /api/jinding/sections/:code` 更新
  - 公众号文章存 `jd_posts`，运营在栏目页“导入公众号文章”（`POST /api/jinding/posts`，原文链接去重）
  - ⚠️ 公开渠道未检索到影视类“迭代盛典”公众号的可抓取文章（同名结果为净水、地产、储能等行业奖项），待提供公众号名称/文章链接后导入

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

## v4.0 1 亿元扶持 · 影片上传 · 申报材料 · 展映推广（2026-10-27）
> 依据《迭影计划 · 创作者申报材料指南 创作者版 V1.0（2026-10-26）》。1 亿元为合作方拟投入面值，以书面协议为准。

**扶持体系 `#/fund`**：总额 1 亿元 = **AI 算力 7,000 万元**（普惠 560 / 入选 3,150 / 孵化 2,100 / 盛典荣誉 700 / 机动 490 万）+ **宣发扶持 3,000 万元**（首映与展映 800 / 平台推流 900 / 物料制作 450 / 电影节与市场 450 / 媒体与公关 400 万）。全站文案、资金池与算力常量 `POOL_YUAN=7000万`、`PROMO_YUAN=3000万` 已同步。

**影片上传（分片断点续传，R2 multipart）**
- `POST /api/uploads/init` → `PUT /api/uploads/:token/part/:n`（8MB/片，3 路并发，单片重试 3 次）→ `POST /api/uploads/:token/complete`
- 同一文件再次 init 会自动续传；`GET /api/uploads` 列出未完成任务，「我的」与材料页都有续传提示；`DELETE` 可取消
- 单个视频最大 4GB，格式 MP4 / MOV / WebM；分类有正片、预告、先导片A、先导片B、样章、花絮，同类型新版本会替换旧版
- 上传期间保持屏幕常亮（Wake Lock），离开页面会弹出提示；合并后的文件按字节回读校验，与原文件一致

**申报材料 `#/guide` · `#/materials/:appId`**
- 首轮 10 项、二轮 9 项（二轮须晋级路演后开放）；每项可以上传文件（PDF / Word / 表格 / 图片 / MP4）或提交网盘链接（必须注明提取码和有效期）
- 项目速览表可在线填写（9 个字段）；材料有版本号（V1、V2…），完成度以百分比显示；运营可「确认」或「需补件」（必须写原因），创作者那边会收到红色提醒
- 先导片和样章提交后自动进入作品视频，进展映厅和专家评审

**展映厅 `#/screening`**：分五大单元：长片展映 / 剧集单元 / 短片竞赛 / 院校新锐 / 先导实验室。有本周主推、热度榜和最新列表，热度 = 播放 + 评分×6 + 分享×4 + 访问。首页的「正在展映」区域可横向滑动。

**推广拉动**
- 作品页可在多个视频之间切换；分享渠道有系统分享、微信、微博，还能生成分享海报（Canvas 绘制，带二维码，可长按保存）
- 每个渠道用独立的 `?ref=` 链接，访问和分享事件按设备每天去重
- 推广中心 `#/promo/:appId`：展示访问、播放、分享、评分、转化率，近 14 天趋势，来源渠道，全站热度排名，以及宣发扶持记录

**统一后台新增**：「申报材料」审阅，「展映与宣发」（编排单元和主推位，发放宣发扶持，资金池余额校验）。

**新文件**：`src/routes/media.ts`、`src/lib/materials.ts`、`migrations/0006_materials_screening.sql`、`seed_media.sql`、`public/static/{uploader,screening,materials}.js`、`public/static/img/{fund-hero,screening-hall}(-m).jpg`（AI 生成）

**验证**：acceptance 136/136（新增 V401–V428）；iPhone 13 E2E 中各页面无横向溢出、无 JS 错误；浏览器实测 18MB 视频分 3 片上传成功，海报生成正常。

## v3.5 移动端分步报名（2026-10-26）
- 新入口 `#/apply`（可带 `?track=AI专业团队|院校毕业生` 预选赛道），所有"报名"按钮统一指向此处
- 分步向导：账号（未登录时页内直接注册/登录，免跳转）→ 赛道 → 作品 → 团队 → 确认 → 完成页
- 沉浸模式（`body.flow-mode`）：隐藏顶栏/底栏，只保留进度条和固定底部操作栏；输入框在移动端为 16px，防止 iOS 自动缩放
- 校验：错误直接标在对应字段上并自动滚动定位；作品重名（409）时自动回到作品步
- 草稿自动保存（localStorage `dd_apply_draft`）；刷新后停留在当前步（sessionStorage）
- 完成页：报名编号、立即上传视频、系统分享 / 复制链接、跳转「我的」
- 修复：`.fade-in` 动画遗留的 transform 导致 `position:fixed` 失效
- 已验证：iPhone 13 / Pixel 5 E2E 通过、无横向溢出、无 JS 错误；acceptance 108/108 通过
