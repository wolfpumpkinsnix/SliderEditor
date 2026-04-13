import type { Presentation, Entity } from '../models/types.ts'

export function exportPresentation(presentation: Presentation): string {
  const { theme, slides, title } = presentation

  const tailwindTheme = `
    @theme {
      --color-bg: ${theme.colors.bg};
      --color-bg-deep: ${theme.colors.bgDeep};
      --color-surface: ${theme.colors.surface};
      --color-text: ${theme.colors.text};
      --color-text-secondary: ${theme.colors.textSecondary};
      --color-text-muted: ${theme.colors.textMuted};
      --color-accent-1: ${theme.colors.accent1};
      --color-accent-2: ${theme.colors.accent2};
      --color-accent-3: ${theme.colors.accent3};
      --color-glass-bg: ${theme.colors.glassBg};
      --color-glass-border: ${theme.colors.glassBorder};
      --color-vignette: ${theme.colors.vignette};
      --font-display: '${theme.fonts.display}', Georgia, serif;
      --font-body: '${theme.fonts.body}', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    }
  `

  const css = `
    :root { --color-bg: ${theme.colors.bg}; --color-text: ${theme.colors.text}; --glow-color-rgb: ${theme.colors.glowColorRgb}; }
    *, *::before, *::after { box-sizing: border-box; }
    html, body { background: var(--color-bg); margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden; }
    body { font-family: '${theme.fonts.body}', system-ui, sans-serif; color: ${theme.colors.text}; }
    .deck { width: 100vw; height: 100vh; position: relative; }
    .slide { position: absolute; inset: 0; background: var(--color-bg); display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; transform: scale(0.95); transition: opacity 0.7s ease, transform 0.7s ease; pointer-events: none; overflow: hidden; }
    .slide.active { opacity: 1; transform: scale(1); pointer-events: all; }
    .slide > .slide-content { position: relative; z-index: 2; width: 100%; max-width: 1100px; padding: 80px; }
    .slide.text-center > .slide-content { text-align: center; }
    .nav-controls { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 16px; z-index: 100; background: ${theme.colors.glassBg}; backdrop-filter: blur(10px); padding: 10px 24px; border-radius: 40px; border: 1px solid ${theme.colors.glassBorder}; }
    .nav-btn { width: 40px; height: 40px; border: none; background: rgba(15,23,42,0.9); color: #e0f2fe; border-radius: 50%; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.3s, transform 0.2s; }
    .nav-btn:hover { background: rgba(30,64,175,0.9); transform: translateY(-1px); }
    .slide-dots { display: flex; gap: 8px; }
    .slide-dots .dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(148,163,184,0.6); cursor: pointer; transition: background 0.3s, transform 0.3s; }
    .slide-dots .dot.active { background: ${theme.colors.accent1}; transform: scale(1.3); }
    .slide-counter { font-size: 0.8rem; color: ${theme.colors.textMuted}; min-width: 40px; text-align: center; }
    .reveal { opacity: 0; transform: translateY(20px); }
    @keyframes float-slow { 0%{transform:translate(0,0) scale(1);} 25%{transform:translate(60px,-50px) scale(1.12);} 50%{transform:translate(-40px,40px) scale(0.9);} 75%{transform:translate(50px,20px) scale(1.08);} 100%{transform:translate(0,0) scale(1);} }
    @keyframes float-drift { 0%{transform:translate(0,0) scale(1) rotate(0deg);} 33%{transform:translate(-50px,-60px) scale(1.15) rotate(3deg);} 66%{transform:translate(40px,30px) scale(0.88) rotate(-2deg);} 100%{transform:translate(0,0) scale(1) rotate(0deg);} }
    @keyframes float { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-15px);} }
    .gradient-mesh { position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
    .blob { position: absolute; border-radius: 50%; filter: blur(80px); animation: float-slow 14s ease-in-out infinite; }
    .blob:nth-child(2) { animation: float-drift 18s ease-in-out infinite; }
    .blob:nth-child(3) { animation: float-slow 22s ease-in-out infinite reverse; }
    .slide::before { content:''; position:absolute; inset:0; z-index:1; pointer-events:none; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E"); background-repeat:repeat; background-size:256px 256px; opacity:0.03; mix-blend-mode:overlay; }
    .slide::after { content:''; position:absolute; inset:0; z-index:1; pointer-events:none; background:radial-gradient(ellipse at center, transparent 50%, ${theme.colors.vignette} 100%); }
    .mouse-spotlight { position: fixed; inset: 0; z-index: 99; pointer-events: none; }
    .metric-card { background: rgba(15,23,42,0.9); border-radius: 18px; border: 1px solid rgba(148,163,184,0.6); padding: 1.5rem; box-shadow: 0 18px 45px rgba(15,23,42,0.75); transition: transform 0.2s, box-shadow 0.2s; }
    .metric-card:hover { transform: translateY(-4px); box-shadow: 0 22px 56px rgba(15,23,42,0.9); }
    @media (prefers-reduced-motion:reduce) { *,*::before,*::after { animation-duration:0.01ms !important; transition-duration:0.2s !important; } }
  `

  const slidesHTML = slides.map((slide, i) => {
    const blobsHTML = slide.background.blobs.map(blob => {
      const pos = [
        blob.top ? `top:${blob.top}` : '',
        blob.bottom ? `bottom:${blob.bottom}` : '',
        blob.left ? `left:${blob.left}` : '',
        blob.right ? `right:${blob.right}` : '',
      ].filter(Boolean).join(';')
      return `        <div class="blob" style="width:${blob.width}px;height:${blob.height}px;${pos};background:${blob.color};opacity:${blob.opacity};"></div>`
    }).join('\n')

    const contentClass = slide.layout === 'center' ? 'slide-content text-center' : 'slide-content'

    return `    <div class="slide${i === 0 ? ' active' : ''}" data-slide="${i + 1}">
        <div class="gradient-mesh">
${blobsHTML}
        </div>
        ${slide.hasParticles ? '<canvas class="particle-canvas" style="position:absolute;inset:0;z-index:1;"></canvas>' : ''}
        <div class="${contentClass}">
${slide.entities.map(el => exportEntityHTML(el)).join('\n')}
        </div>
    </div>`
  }).join('\n')

  const navHTML = `<div class="nav-controls">
    <button class="nav-btn" onclick="changeSlide(-1)">&#8249;</button>
    <div class="slide-dots" id="dots"></div>
    <button class="nav-btn" onclick="changeSlide(1)">&#8250;</button>
    <span class="slide-counter" id="counter">1 / ${slides.length}</span>
</div>`

  const displayFont = theme.fonts.display.replace(/'/g, '')
  const bodyFont = theme.fonts.body.replace(/'/g, '')
  const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(displayFont)}:ital@0;1&family=${encodeURIComponent(bodyFont)}:wght@300;400;500;600;700;900&display=swap`

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escHtml(title)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="${fontUrl}" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"><\/script>
    <style type="text/tailwindcss">
${tailwindTheme}
    </style>
    <style>
${css}
    </style>
</head>
<body>
<div class="mouse-spotlight"></div>
<div class="deck">
${slidesHTML}
</div>

${navHTML}

<script>
${buildJS()}
<\/script>
</body>
</html>`
}

function exportEntityHTML(entity: Entity, indent = '            '): string {
  let innerHtml = ''

  entity.components.forEach(comp => {
    switch (comp.type) {
      case 'text': {
        const tag = comp.fontSize === 'h1' ? 'h1' : comp.fontSize === 'h2' ? 'h2' : 'p'
        let textClasses = 'comp-text reveal '
        
        switch (comp.fontSize) {
          case 'h1': textClasses += 'font-display text-[4.5rem] tracking-tight mb-4 leading-tight '; break
          case 'h2': textClasses += 'font-display text-[3rem] mb-6 leading-tight '; break
          case 'label': textClasses += 'text-sm uppercase tracking-widest mb-2 '; break
          case 'body': textClasses += 'text-xl leading-relaxed '; break
          case 'small': textClasses += 'text-base '; break
          default: textClasses += 'text-lg '
        }
        
        if (comp.fontWeight === 'bold') textClasses += 'font-bold '
        if (comp.fontWeight === 'black') textClasses += 'font-black '
        
        if (comp.gradient) textClasses += 'bg-linear-to-br from-accent-1 via-accent-2 to-accent-1 bg-clip-text text-transparent '
        if (comp.align === 'center') textClasses += 'mx-auto text-center '
        if (comp.variant === 'muted') textClasses += 'text-text-muted '
        else if (comp.variant === 'secondary') textClasses += 'text-text-secondary '

        let styleStr = comp.maxWidth ? ` style="max-width: ${comp.maxWidth}"` : ''
        
        innerHtml += `\n${indent}  <${tag} class="${textClasses.trim()}"${styleStr}>${escHtml(comp.content)}</${tag}>`
        break
      }
      
      case 'icon': {
        let iconClasses = 'comp-icon mb-5 drop-shadow-xl mx-auto select-none reveal '
        if (comp.animated) iconClasses += 'animate-[float_3s_ease-in-out_infinite] '
        let styleStr = comp.size ? ` style="font-size: ${comp.size}px"` : ''
        innerHtml += `\n${indent}  <div class="${iconClasses.trim()}"${styleStr}>${escHtml(comp.value)}</div>`
        break
      }
      
      case 'list': {
        const tag = comp.style === 'numbered' ? 'ol' : 'ul'
        let listClasses = 'comp-list pl-6 space-y-1 reveal '
        listClasses += comp.style === 'numbered' ? 'list-decimal ' : 'list-disc '
        listClasses += (comp.variant ?? 'muted') === 'muted' ? 'text-text-muted ' : 'text-text-secondary '
        
        const items = comp.items.map(i => `${indent}    <li>${escHtml(i)}</li>`).join('\n')
        innerHtml += `\n${indent}  <${tag} class="${listClasses.trim()}">\n${items}\n${indent}  </${tag}>`
        break
      }
    }
  })

  let entityClasses = 'entity '
  let entityStyle = ''

  entity.components.forEach(comp => {
    if (comp.type === 'background') {
      entityClasses += 'comp-background '
      if (comp.variant === 'glass') {
        entityClasses += 'bg-glass-bg border border-glass-border backdrop-blur-xl reveal '
      } else if (comp.variant === 'metric') {
        entityClasses += 'bg-white/5 border border-white/10 reveal metric-card transition '
      }
      
      if (comp.rounded) entityClasses += 'rounded-2xl '
      if (comp.color) entityStyle += `background-color: ${comp.color};`
      if (comp.padding) entityStyle += `padding: ${comp.padding};`
    }
    if (comp.type === 'layout') {
      entityClasses += 'comp-layout '
      if (comp.layoutType === 'grid') {
        entityClasses += 'grid '
        if (comp.columns === 3) entityClasses += 'grid-cols-3 '
        else entityClasses += 'grid-cols-2 '
        if (comp.gap !== undefined) entityStyle += `gap: ${comp.gap}px;`
      } else {
        entityClasses += 'flex '
        if (comp.direction === 'column') entityClasses += 'flex-col '
        if (comp.alignItems === 'center') entityClasses += 'items-center '
      }
    }
  })

  let childrenHtml = ''
  if (entity.children && entity.children.length > 0) {
    childrenHtml = entity.children.map(child => exportEntityHTML(child, indent + '    ')).join('\n')
    innerHtml += `\n${childrenHtml}\n${indent}`
  }

  let attrStr = ''
  if (entityClasses.trim().length > 0) attrStr += ` class="${entityClasses.trim()}"`
  if (entityStyle.trim().length > 0) attrStr += ` style="${entityStyle.trim()}"`

  // Don't format with newlines if it has no children and isn't a container
  if (!childrenHtml && !innerHtml.includes('\n')) {
    return `${indent}<div${attrStr}>${innerHtml}</div>`
  }
  return `${indent}<div${attrStr}>${innerHtml}\n${indent}</div>`
}

function buildJS(): string {
  return `let current = 1;
const total = document.querySelectorAll('.slide').length;
const dotsContainer = document.getElementById('dots');
const counter = document.getElementById('counter');
for (let i = 1; i <= total; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot' + (i === 1 ? ' active' : '');
    dot.onclick = () => goToSlide(i);
    dotsContainer.appendChild(dot);
}
function goToSlide(n) {
    const prev = document.querySelector('.slide.active');
    const next = document.querySelector('.slide[data-slide="' + n + '"]');
    if (prev) prev.classList.remove('active');
    if (next) { next.classList.add('active'); animateSlide(next); }
    current = n;
    updateNav();
}
function changeSlide(dir) {
    let next = current + dir;
    if (next < 1) next = total;
    if (next > total) next = 1;
    goToSlide(next);
}
function updateNav() {
    document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i + 1 === current));
    counter.textContent = current + ' / ' + total;
}
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); changeSlide(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); changeSlide(-1); }
    if (e.key === 'Home') { e.preventDefault(); goToSlide(1); }
    if (e.key === 'End') { e.preventDefault(); goToSlide(total); }
});
let touchStartX = 0;
document.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; });
document.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) changeSlide(diff > 0 ? 1 : -1);
});
function animateSlide(slide) {
    slide.querySelectorAll('.reveal').forEach((el, i) => {
        el.style.transition = 'none';
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.offsetHeight;
        const delay = i * 0.08;
        el.style.transition = 'opacity 0.35s ease ' + delay + 's, transform 0.35s ease ' + delay + 's';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0px)';
    });
}
document.querySelectorAll('.particle-canvas').forEach(canvas => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth || window.innerWidth;
    canvas.height = canvas.offsetHeight || window.innerHeight;
    let mx = -1000, my = -1000;
    const particles = Array.from({ length: 55 }, () => ({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2.5 + 0.8, alpha: Math.random() * 0.35 + 0.1
    }));
    canvas.addEventListener('mousemove', (e) => { const r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
    canvas.addEventListener('mouseleave', () => { mx = -1000; my = -1000; });
    (function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            const dx = p.x - mx, dy = p.y - my, dist = Math.sqrt(dx*dx+dy*dy);
            if (dist < 120) { const f = (120-dist)/120*2; p.vx += (dx/dist)*f*0.1; p.vy += (dy/dist)*f*0.1; }
            p.vx *= 0.98; p.vy *= 0.98;
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(6,182,212,' + p.alpha + ')'; ctx.fill();
        });
        requestAnimationFrame(animate);
    })();
});
const spotlight = document.querySelector('.mouse-spotlight');
document.addEventListener('mousemove', (e) => {
    if (spotlight) spotlight.style.background = 'radial-gradient(600px circle at ' + e.clientX + 'px ' + e.clientY + 'px, rgba(6,182,212,0.10), transparent 40%)';
});
try { animateSlide(document.querySelector('.slide.active')); } catch(e) {}`
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
