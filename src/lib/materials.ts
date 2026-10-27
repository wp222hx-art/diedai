// 迭影计划 · 创作者申报材料指南 V1.0（2026-10-26）结构化
// 首轮：远程预审 10 项；二轮：六人联合评审 9 项。kind 指推荐提交方式（file 可上传 PDF/表格/视频，link 可填网盘链接）

export type Item = { code: string; no: string; name: string; spec: string; judge: string; accept: string[]; required: boolean; video?: boolean }

export const ROUND1: Item[] = [
  { code: 'r1_sheet', no: '01', name: '项目速览表', spec: '1页。项目名、类型、总时长／集数、一句话故事、目标观众、当前阶段、主创、申请算力、现金缺口、预计交付时间。', judge: '先看是否符合征集方向、资源需求是否可承受。', accept: ['form', 'pdf'], required: true },
  { code: 'r1_deck', no: '02', name: '项目案', spec: '核心正文6—10页，可包含速览、美术、团队和计划。说明创作意图、独特卖点、选择AI的原因及希望获得的支持。', judge: '项目的核心价值，以及AI在其中承担什么任务。', accept: ['pdf'], required: true },
  { code: 'r1_story', no: '03', name: '故事大纲与场戏', spec: '大纲约1500—3000字，讲完整起承转合与结局；系列附分集走向。另附一场代表性剧本约2—5页，可用现有片段。', judge: '故事能否支撑计划篇幅，人物行动、对白与场面是否成立。', accept: ['pdf', 'doc'], required: true },
  { code: 'r1_chars', no: '04', name: '人物小传', spec: '3—5名关键人物，每人约200—400字。写目标、阻力、关系、关键选择与变化；人物少可按实际提交。', judge: '人物是否推动故事，是否具有可持续的戏剧冲突。', accept: ['pdf', 'doc'], required: true },
  { code: 'r1_art', no: '05', name: '美术概念与海报', spec: '约6—10张：角色、关键场景、色彩和视觉风格，含1张概念海报。标注自制、AI生成或参考图及来源。', judge: '视觉是否服务故事，角色与风格能否保持一致。', accept: ['pdf', 'image'], required: true },
  { code: 'r1_teaser', no: '06', name: '两条先导片', spec: '同一申报项目，各30—60秒。A片呈现故事、人物与情绪；B片呈现生产能力，至少保留一段连续叙事或同一角色跨镜头。允许使用现有素材重剪。', judge: '既看吸引力，也看连续镜头、人物表演、声音与剪辑能否成立。', accept: ['video'], required: true, video: true },
  { code: 'r1_making', no: '07', name: '样片制作说明', spec: '1—2页，附少量截图或记录。选2—3个代表镜头，含1个难镜头，写明模型版本、本人分工、生成次数、耗时、计费用量、采用结果与失败原因。', judge: '样片是否由申报团队真实完成；效果能否重复，单个好镜头能否推广到全片。', accept: ['pdf'], required: true },
  { code: 'r1_team', no: '08', name: '主创与团队证明', spec: '1—2页，列负责人、导演／编剧、AI制作、后期等实际承担者与分工，允许一人兼任。附最多2个既往作品链接，注明本人职责和可投入时间；新人可用本项目过程证明。', judge: '谁实际做，是否有完成作品的能力和可投入时间；缺岗是否有补齐方案。', accept: ['pdf'], required: true },
  { code: 'r1_budget', no: '09', name: '预算与进度简表', spec: '至少分列全项目总需求、本次申请、现金成本、已落实资源与缺口。列模型／供应商／计量单位、预计用量、计价依据及日期、试制实耗和返工假设；附阶段排期。', judge: '申请是否有依据，算力之外的资金和人手是否足以支撑完片。', accept: ['sheet'], required: true },
  { code: 'r1_rights', no: '10', name: '权利状态与合作说明', spec: '1页清单。原创／改编来源、团队提报权限、音乐及肖像声音等素材状态、既有投资／独家／其他扶持、是否允许评审访问。未取得的权益明确写待取得。', judge: '是否有可推进的权利基础，是否存在冲突承诺及影响项目继续的障碍。', accept: ['pdf'], required: true },
]

export const ROUND2: Item[] = [
  { code: 'r2_reply', no: '01', name: '更新摘要与问题答复', spec: '1—2页。逐条回应首轮意见，列改了什么、证据在哪里、仍未解决什么；标注大纲、样片和预算的版本变化。', judge: '是否听懂问题并能改进，重大变化是否已经重新评估。', accept: ['pdf'], required: true },
  { code: 'r2_pitch', no: '02', name: '路演材料', spec: '建议10—12页：故事、人物、视觉、观众、团队、技术证据、预算、排期、资源诉求及交付承诺。另备一页资源申请摘要。', judge: '主创是否能清楚解释项目，能否就关键问题作出决定。', accept: ['pdf'], required: true },
  { code: 'r2_script', no: '03', name: '深化剧本资料', spec: '长片提供最新完整大纲、关键场次和可评估的剧本版本；剧集提供全季走向、分集梗概、首集及关键集剧本。已完成全文者提交全文。', judge: '叙事是否具备持续性，制作是否有稳定文本依据。', accept: ['pdf', 'doc'], required: true },
  { code: 'r2_chapter', no: '04', name: '连续片段与技术证据', spec: '沿用两条先导片。若B片已充分展示连续叙事，无需新增；若证据不足，按首轮反馈扩展为约2—3分钟样章或提交对应难点测试，并补试制记录。', judge: '持续叙事、角色一致性、声音和复杂镜头的可行性；真实成本能否支持扩产。', accept: ['video', 'pdf'], required: false, video: true },
  { code: 'r2_exec', no: '05', name: '核心团队执行方案', spec: '明确主创、技术及制片责任人，列工时／驻场可用性、分工、已有承诺、外包范围、空缺岗位及替补方案；由负责人确认。', judge: '能否持续投入；一人兼任是否可承受，是否依赖尚未落实的外部人员。', accept: ['pdf'], required: true },
  { code: 'r2_budget', no: '06', name: '核实后的资源预算', spec: '按开发、试制、样章、阶段成片、最终交付拆分。提交低耗／基准／高耗三个场景；列报价或计价凭据、测试实耗、预计失败与返工、现金配套和缺口。', judge: '资源需求可解释；算力获批后，剩余条件能否满足。', accept: ['sheet'], required: true },
  { code: 'r2_plan', no: '07', name: '制作计划与验收清单', spec: '列各阶段交付物、责任人、工期、资源申请、验收条件与变更触发点。给出优先级和备用模型／工艺；说明资源减少或延期时如何调整。', judge: '是否具备可管理的进度和交付边界，是否能够分批投入和及时止损。', accept: ['pdf', 'sheet'], required: true },
  { code: 'r2_rights', no: '08', name: '权利与主体证明包', spec: '按项目实际情况提供主创提报授权、已有改编许可、关键素材使用依据、已签投资与排他约定、可签约主体及待清事项。敏感证明单独受控提交。', judge: '哪些权利已具备，哪些会限制试制、正式制作、宣传或发行。', accept: ['pdf'], required: true },
  { code: 'r2_audience', no: '09', name: '观众与交付合作说明', spec: '1—2页。目标观众、参考作品及差异、适合渠道、计划交付规格、所需导师／场地／发行协助、愿意承担的配套投入和不可接受条件。已有意向附证据；没有可明确未落实。', judge: '作品做给谁、完成后如何交付，合作预期是否一致。', accept: ['pdf'], required: true },
]

export const ALL_ITEMS = [...ROUND1, ...ROUND2]
export const itemOf = (code: string) => ALL_ITEMS.find((x) => x.code === code)

// 速览表字段（材料 01）
export const SHEET_FIELDS: [string, string, string][] = [
  ['genre', '类型', '如：悬疑 / 东方奇幻 / 科幻'],
  ['length', '总时长／集数', '如：90 分钟 / 12 集 × 8 分钟'],
  ['audience', '目标观众', '如：18—35 岁悬疑剧集观众'],
  ['stage', '当前阶段', '开发 / 试制 / 样章 / 制作中 / 后期'],
  ['leads', '主创', '导演、编剧、AI 制作负责人'],
  ['compute', '申请算力', '模型、单位与额度，如 Seedance 2.0 · 1.2 亿 Token'],
  ['promo', '宣发诉求', '如：海报物料、平台推流、电影节报送'],
  ['cash_gap', '现金缺口', '算力之外尚未解决的现金成本'],
  ['delivery', '预计交付时间', '如：2027 年 8 月'],
]

export const FILE_RULES = {
  naming: '项目名_主创_材料类别_V1_日期',
  formats: '图文材料提交可搜索 PDF，预算提交可编辑表格（xlsx / csv），两条视频采用常见 MP4 格式。',
  netdisk: '使用网盘时，请提供访问方式和到期时间；每次补件注明更新版本和修改内容。',
  privacy: '首轮无需提交身份证号、银行卡、账号密码等无关信息，确需核验的敏感证明另行受控提交。报名不自动转让剧本、作品或既有技术资产；公开展示与宣传另行明确授权。',
  later: '全剧完整剧本、正式发行意向、公司主体登记、全部授权合同和完整工程文件，不统一作为首轮硬门槛。',
}

export const MAT_MIME: Record<string, string[]> = {
  pdf: ['application/pdf'],
  doc: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
  sheet: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
  image: ['image/jpeg', 'image/png', 'image/webp'],
  video: ['video/mp4', 'video/quicktime', 'video/webm'],
}
