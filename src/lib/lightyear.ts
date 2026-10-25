// ================================================================
// 光年计划 · Seedance 影视算力预测引擎（光年公式 LY-1.0）
// Token 口径（火山引擎公开）：tokens = (输入视频秒 + 输出视频秒) × 宽 × 高 × 帧率 / 1024
// 刊例价（公开报道）：Seedance 2.0 不含视频输入 46 元/百万、含视频输入 28 元/百万
//                    Seedance 2.5 不含视频输入 70 元/百万、含视频输入 42 元/百万
// 标准Token（STD）= 折算到 Seedance 2.0 不含视频输入 46 元/百万 的等值 Token
// ================================================================
export const POOL_YUAN = 50_000_000
export const STD_PRICE = 46
export const POOL_STD = Math.round((POOL_YUAN / STD_PRICE) * 1e6)

export const RES: Record<string, { w: number; h: number; label: string }> = {
  '480p': { w: 854, h: 480, label: '480p 标清' },
  '720p': { w: 1280, h: 720, label: '720p 高清' },
  '1080p': { w: 1920, h: 1080, label: '1080p 全高清' },
}
export const FPS = 24
export const tokPerSec = (res: string) => (RES[res].w * RES[res].h * FPS) / 1024

export const MODELS: Record<string, { name: string; maxClip: number; price: number; priceVideoIn: number; overhead: number; passBoost: number }> = {
  '2.0': { name: 'Seedance 2.0', maxClip: 15, price: 46, priceVideoIn: 28, overhead: 1.25, passBoost: 1.0 },
  '2.5': { name: 'Seedance 2.5', maxClip: 30, price: 70, priceVideoIn: 42, overhead: 1.1, passBoost: 1.12 },
}

// 风格：对单候选可用率 p 的系数、返工比例 r、前期设定周数系数
export const STYLES: Record<string, { label: string; p: number; r: number; prep: number; desc: string }> = {
  realistic: { label: '写实电影感', p: 0.85, r: 0.35, prep: 1.2, desc: '真人质感、光影与表演一致性要求最高' },
  oriental: { label: '东方国风', p: 0.95, r: 0.28, prep: 1.15, desc: '服化道与古典美术设定需前置' },
  scifi: { label: '赛博科幻', p: 0.9, r: 0.3, prep: 1.1, desc: '特效奇观多，场景资产复用价值高' },
  anime: { label: '二次元动漫', p: 1.12, r: 0.2, prep: 1.0, desc: '角色一致性易控，适合漫剧量产' },
  cartoon3d: { label: '3D卡通', p: 1.05, r: 0.22, prep: 1.05, desc: '造型稳定，动作表现力强' },
  ink: { label: '水墨实验', p: 1.0, r: 0.4, prep: 0.9, desc: '风格自由度高，审美筛选更严' },
}

// 镜头类：基础单候选可用率 p0
export const SHOTS: Record<string, { label: string; p0: number }> = {
  dialog: { label: '对白文戏', p0: 0.45 },
  action: { label: '运动动作', p0: 0.25 },
  vfx: { label: '特效奇观', p0: 0.2 },
  crowd: { label: '群像大场面', p0: 0.18 },
  ambient: { label: '空镜氛围', p0: 0.6 },
}

export const FORMS: Record<string, { label: string; shotLen: number; post: number; prepBase: number }> = {
  film: { label: 'AIGC电影', shotLen: 4.0, post: 8, prepBase: 4 },
  series: { label: 'AI剧集', shotLen: 3.5, post: 6, prepBase: 3 },
  micro: { label: '微短剧', shotLen: 2.5, post: 4, prepBase: 2 },
  comic: { label: 'AI漫剧', shotLen: 3.0, post: 3.5, prepBase: 2 },
}
export const EXP: Record<string, { label: string; f: number; speed: number }> = {
  novice: { label: '新手团队', f: 0.8, speed: 0.7 },
  skilled: { label: '熟练团队', f: 1.0, speed: 1.0 },
  pro: { label: '专业团队', f: 1.2, speed: 1.3 },
}

export type PredictInput = {
  form: string; style: string; minutes: number; coverage: number; resolution: string; model: string // '2.0' | '2.5' | 'mix'
  mix: Record<string, number>; experience: string; k: number; refRatio: number; operators: number
}

function scenario(inp: PredictInput, adj: { p: number; r: number }) {
  const st = STYLES[inp.style], ex = EXP[inp.experience]
  const E = inp.minutes * 60 * (inp.coverage / 100)
  const total = Object.values(inp.mix).reduce((a, b) => a + b, 0) || 1
  const tps = tokPerSec(inp.resolution)
  const parts = inp.model === 'mix' ? [['2.0', 0.6], ['2.5', 0.4]] as const : [[inp.model, 1]] as const
  let raw = 0, cost = 0, genSec = 0
  const lines: any[] = []
  for (const [key, share] of Object.entries(inp.mix)) {
    if (!share) continue
    const Ej = E * (share / total)
    // 动作/特效/群像在混合策略下优先交给 2.5（长镜头与多参考），对白/空镜交给 2.0
    for (const [mk, ms0] of parts) {
      let ms = ms0 as number
      if (inp.model === 'mix') ms = ['action', 'vfx', 'crowd'].includes(key) ? (mk === '2.5' ? 0.7 : 0.3) : (mk === '2.5' ? 0.2 : 0.8)
      const m = MODELS[mk]
      const p = Math.min(0.85, SHOTS[key].p0 * st.p * ex.f * m.passBoost * adj.p)
      const q = 1 - Math.pow(1 - p, inp.k)
      const r = st.r * adj.r
      const M = (inp.k / q) * (1 + r)          // 迭代倍率
      const outSec = Ej * ms * M * m.overhead  // 实际生成输出秒
      const inSec = outSec * inp.refRatio      // 参考/续写输入视频秒
      const t = (outSec + inSec) * tps
      const price = inp.refRatio > 0 ? m.priceVideoIn : m.price
      raw += t; cost += (t / 1e6) * price; genSec += outSec
      lines.push({ shot: SHOTS[key].label, model: m.name, effSec: +(Ej * ms).toFixed(0), p: +p.toFixed(3), q: +q.toFixed(3), M: +M.toFixed(2), genSec: Math.round(outSec), tokens: Math.round(t), cost: +((t / 1e6) * price).toFixed(0) })
    }
  }
  const previz = 0.08 // 预演/试制 8%
  raw *= 1 + previz; cost *= 1 + previz; genSec *= 1 + previz
  const std = Math.round((cost / STD_PRICE) * 1e6)
  return { raw: Math.round(raw), cost: Math.round(cost), std, genSec: Math.round(genSec), multiplier: +(genSec / Math.max(E, 1)).toFixed(2), lines }
}

export function predict(inp: PredictInput) {
  const base = scenario(inp, { p: 1, r: 1 })
  const low = scenario(inp, { p: 1.25, r: 0.7 })
  const high = scenario(inp, { p: 0.75, r: 1.4 })
  // ---------- 周期预测 ----------
  const st = STYLES[inp.style], fm = FORMS[inp.form], ex = EXP[inp.experience]
  const clipLen = inp.model === '2.0' ? 10 : inp.model === '2.5' ? 20 : 14
  const calls = Math.ceil(base.genSec / clipLen)
  const opHours = (calls * 3.5) / 60 / ex.speed   // 每次调用：提示词/参考准备+审片 约3.5分钟
  const ops = Math.max(1, inp.operators)
  const genWeeks = opHours / (ops * 6 * 5)         // 每人每天6有效小时、每周5天
  const prepWeeks = (fm.prepBase + inp.minutes / 30) * st.prep / ex.speed
  const trialWeeks = 1.5
  const postWeeks = (inp.minutes * fm.post) / (ops * 6 * 5) * 1.0 / ex.speed + 1
  const phases = [
    { name: '前期开发', sub: '剧本定稿·分镜·美术与角色设定', weeks: +prepWeeks.toFixed(1) },
    { name: '技术试制', sub: '10—20个代表镜头校准通过率q', weeks: trialWeeks },
    { name: 'AI生成制作', sub: `约${calls.toLocaleString()}次生成调用`, weeks: +Math.max(1, genWeeks).toFixed(1) },
    { name: '后期合成', sub: '剪辑·调色·声音·字幕·质检', weeks: +postWeeks.toFixed(1) },
  ]
  const totalWeeks = +phases.reduce((a, b) => a + b.weeks, 0).toFixed(1)
  // ---------- 风格与策略建议 ----------
  const heavy = (inp.mix.action || 0) + (inp.mix.vfx || 0) + (inp.mix.crowd || 0)
  const tips: string[] = []
  if (inp.model === '2.0' && heavy >= 35) tips.push('动作/特效/群像占比较高，建议改用「混合策略」：复杂镜头交给 Seedance 2.5 的 30 秒长镜头与多参考能力，可降低返工。')
  if (inp.resolution === '1080p') tips.push('1080p 单秒 Token 为 720p 的 2.25 倍，建议先以 720p 完成样章与审片，定稿镜头再出 1080p。')
  if (inp.experience === 'novice') tips.push('新手团队建议先参加「算力预算校准工作坊」，实测 q 值后预算偏差可明显收窄。')
  if (inp.style === 'realistic') tips.push('写实风格对角色一致性要求高，建议建立角色三视图与参考视频库，减少人物漂移导致的整条重来。')
  if (inp.style === 'anime' || inp.form === 'comic') tips.push('二次元/漫剧风格通过率较高，是用免费算力快速做出完整样章的高性价比路线。')
  if (!tips.length) tips.push('当前组合较均衡，建议用免费额度先完成 M1 技术试制，回填实测通过率后再申请定向额度。')
  // ---------- 补贴覆盖 ----------
  const tiers = TIERS.filter((t) => t.pct).map((t) => {
    const amt = Math.min(t.cap!, Math.round(base.std * t.pct!))
    return { code: t.code, name: t.name, pct: t.pct, cap: t.cap, std: amt, yuan: Math.round((amt / 1e6) * STD_PRICE), coverage: +(Math.min(1, amt / Math.max(base.std, 1)) * 100).toFixed(0) }
  })
  return {
    input: inp, base, low, high, phases, totalWeeks, calls, opHours: Math.round(opHours), tips, tiers,
    tokPerSec: tokPerSec(inp.resolution), poolShare: +((base.std / POOL_STD) * 100).toFixed(4),
    formula: 'Tokens = Σⱼ Eⱼ × Mⱼ × O × (1 + i) × W×H×24/1024 × (1+8%)，Mⱼ = k/qⱼ × (1+r)，qⱼ = 1−(1−pⱼ)^k，pⱼ = p₀ⱼ × 风格系数 × 团队系数 × 模型系数',
    disclaimer: '预测基于公开刊例价与可解释假设，三场景非统计置信区间；不含人力、权利、宣发与税费。实际以试制实测与供应商结算为准。',
  }
}

// ---------- 星级成长与任务 ----------
export const TASKS = [
  { code: 'join', name: '入驻礼', desc: '以创作者身份完成入驻', tokens: 5_000_000, icon: 'fa-door-open' },
  { code: 'asset', name: '建立首个作品档案', desc: '“有项目”是共享算力的门槛', tokens: 5_000_000, icon: 'fa-film' },
  { code: 'predict', name: '完成一次光年预测', desc: '用预测器测算你的项目', tokens: 3_000_000, icon: 'fa-wand-magic-sparkles' },
  { code: 'entry', name: '报名迭代盛典', desc: '任一赛道提交并锁定版本', tokens: 10_000_000, icon: 'fa-trophy' },
  { code: 'listing', name: '挂牌迭代影市', desc: '权利清晰的作品自愿挂牌', tokens: 5_000_000, icon: 'fa-tag' },
  { code: 'event', name: '预约一场路演/工作坊', desc: '线上线下活动均可', tokens: 2_000_000, icon: 'fa-ticket' },
]
export const TIERS = [
  { code: '星火', name: '星火', en: 'SPARK', cond: '入驻并建立作品档案', give: '星火礼包 · 最高 3,000 万标准Token', bucket: 'onboard' },
  { code: '星耀', name: '星耀', en: 'SHINE', cond: '评审 ≥70 分、提名或获奖', give: '预测基准用量 60%，上限 3 亿', pct: 0.6, cap: 300_000_000, bucket: 'selected' },
  { code: '星河', name: '星河', en: 'GALAXY', cond: '签约孵化包', give: '预测基准用量 80%，上限 10 亿，按里程碑释放', pct: 0.8, cap: 1_000_000_000, bucket: 'incubate' },
  { code: '光年', name: '光年', en: 'LIGHT-YEAR', cond: '签约联合开发包', give: '预测基准用量 100%，上限 50 亿，按里程碑释放', pct: 1.0, cap: 5_000_000_000, bucket: 'incubate' },
]
export const HONOR_BONUS = 100_000_000

export function usageTokens(model: string, res: string, seconds: number, inputSeconds = 0) {
  const m = MODELS[model]
  const raw = Math.round((seconds + inputSeconds) * tokPerSec(res))
  const price = inputSeconds > 0 ? m.priceVideoIn : m.price
  const std = Math.round(raw * price / STD_PRICE)
  return { raw, std, yuan: +((raw / 1e6) * price).toFixed(2) }
}
