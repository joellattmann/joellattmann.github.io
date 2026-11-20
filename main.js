// highlight current page in nav
const path = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('nav a').forEach(a => {
  if (a.getAttribute('href') === path) a.classList.add('active');
});

// landing: slowly rotating monochrome point cloud
const canvas = document.getElementById('field');
if (canvas) {
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const N = 2200;
  const pts = [];
  // points on a gently deformed torus-knot-ish shell
  for (let i = 0; i < N; i++) {
    const u = Math.random() * Math.PI * 2;
    const v = Math.random() * Math.PI * 2;
    const R = 1 + 0.18 * Math.sin(3 * u);
    const r = 0.38 + 0.06 * Math.cos(5 * v + u);
    pts.push([
      (R + r * Math.cos(v)) * Math.cos(u),
      (R + r * Math.cos(v)) * Math.sin(u),
      r * Math.sin(v) + 0.25 * Math.sin(2 * u)
    ]);
  }

  let w, h, dpr;
  const target = { x: 0, y: 0 }, tilt = { x: 0, y: 0 };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    tilt.x += (target.x - tilt.x) * 0.04;
    tilt.y += (target.y - tilt.y) * 0.04;

    const a = t * 0.00012 + tilt.x;      // rotation around y
    const b = 0.9 + tilt.y;              // rotation around x
    const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
    const s = Math.min(w, h) * 0.22, cx = w / 2, cy = h * 0.44;

    for (const [x, y, z] of pts) {
      const x1 = x * ca + z * sa, z1 = -x * sa + z * ca;
      const y2 = y * cb - z1 * sb, z2 = y * sb + z1 * cb;
      const p = 3 / (3 + z2);
      const alpha = Math.max(0.08, Math.min(1, 0.55 - z2 * 0.45));
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      const size = 1.1 * p;
      ctx.fillRect(cx + x1 * s * p, cy + y2 * s * p, size, size);
    }
    if (!reduce) requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', e => {
    target.x = -(e.clientX / w - 0.5) * 0.6;
    target.y = (e.clientY / h - 0.5) * 0.4;
  });
  resize();
  requestAnimationFrame(draw);
}

// about window: close / minimise / expand / drag / reopen
const win = document.getElementById('about');
const reopen = document.getElementById('reopen');
if (win && reopen) {
  win.addEventListener('animationend', () => win.classList.add('shown'));

  win.querySelectorAll('.dot').forEach(btn => btn.addEventListener('click', e => {
    e.stopPropagation();
    const act = btn.dataset.act;
    if (act === 'close') { win.classList.add('closed'); reopen.classList.add('show'); }
    if (act === 'min') win.classList.toggle('min');
    if (act === 'max') win.classList.toggle('max');
  }));

  reopen.addEventListener('click', () => {
    win.classList.remove('closed', 'min');
    win.classList.add('shown');
    win.style.left = ''; win.style.top = '';
    reopen.classList.remove('show');
  });

  // drag by title bar
  const bar = win.querySelector('.win-bar');
  let drag = null;
  bar.addEventListener('pointerdown', e => {
    if (e.target.closest('.dot')) return;
    const r = win.getBoundingClientRect();
    drag = { dx: e.clientX - (r.left + r.width / 2), dy: e.clientY - (r.top + r.height / 2) };
    bar.setPointerCapture(e.pointerId);
  });
  bar.addEventListener('pointermove', e => {
    if (!drag) return;
    win.classList.add('shown');
    win.style.left = (e.clientX - drag.dx) + 'px';
    win.style.top = (e.clientY - drag.dy) + 'px';
  });
  bar.addEventListener('pointerup', () => { drag = null; });
}
