import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { Env, authMiddleware } from './lib/core'
import publicRoutes from './routes/public'
import workRoutes from './routes/work'

const app = new Hono<Env>()

app.use('/api/*', cors())
app.use('/api/*', authMiddleware)
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: '服务异常，请稍后重试', detail: String(err?.message || err) }, 500)
})
app.get('/api/health', (c) => c.json({ ok: true, service: '迭代影交汇', version: '1.1.0' }))
app.route('/api', publicRoutes)
app.route('/api', workRoutes)
app.all('/api/*', (c) => c.json({ error: '接口不存在' }, 404))

const shell = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0b0b0f">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="description" content="迭代影交汇｜迭代盛典 × 捷成世纪 —— AIGC影视创作、盛典、交易与全渠道发行协作平台">
<title>迭代影交汇 · AIGC影视创作、盛典、交易与发行平台</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><circle cx='32' cy='32' r='30' fill='%230b0b0f' stroke='%23d4a94f' stroke-width='4'/><circle cx='32' cy='32' r='8' fill='%23d4a94f'/></svg>">
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<link href="/static/style.css" rel="stylesheet">
</head>
<body>
<div id="grain" aria-hidden="true"></div>
<header id="topbar">
  <a href="#/" class="brand" aria-label="迭代影交汇首页">
    <span class="brand-mark"><i class="fa-solid fa-film"></i></span>
    <span class="brand-text"><b>迭代影交汇</b><small>ITERATION FILM HUB</small></span>
  </a>
  <nav id="main-nav" aria-label="主导航"></nav>
  <div class="top-actions" id="top-actions"></div>
  <button id="menu-btn" class="icon-btn" aria-label="菜单"><i class="fa-solid fa-bars"></i></button>
</header>
<aside id="drawer" aria-hidden="true"></aside>
<main id="app" tabindex="-1"><div class="loading-screen"><div class="reel"></div><p>正在放映…</p></div></main>
<footer id="site-footer"></footer>
<nav id="tabbar" aria-label="移动端导航"></nav>
<div id="toast" role="status" aria-live="polite"></div>
<div id="modal" role="dialog" aria-modal="true" hidden></div>
<script src="/static/app.js"></script>
<script src="/static/pages.js"></script>
<script src="/static/work.js"></script>
</body>
</html>`

app.get('*', (c) => c.html(shell))

export default app
