// highlight current page in nav
const path = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('nav a').forEach(a => {
  if (a.getAttribute('href') === path) a.classList.add('active');
});

// landing: point-cloud chrysanthemums
const canvas = document.getElementById('field');
if (canvas) {
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GOLD = Math.PI * (3 - Math.sqrt(5));
  const rand = (a, b) => a + Math.random() * (b - a);

  // one chrysanthemum in local coords; z = flower axis. 4th value: 1 = stem/leaf
  function chrysanthemum(nPetals, ptsPerPetal) {
    const pts = [];
    for (let i = 0; i < nPetals; i++) {
      const r = Math.sqrt((i + 1) / nPetals);          // 0 = centre, 1 = outer ring
      const theta = i * GOLD + rand(-0.03, 0.03);
      const L = 0.18 + 0.82 * r;                        // inner petals shorter
      const pitch = 0.12 + Math.pow(1 - r, 1.3) * 1.35;   // inner petals upright -> dome
      const curl = r > 0.8 ? -0.9 * (r - 0.8) * 5 * 0.35 : 1.1 * (1 - r);  // outer droop, inner incurve
      const hwMax = 0.03 + 0.045 * r;
      const ux = Math.cos(theta), uy = Math.sin(theta), nx = -uy, ny = ux;
      for (let k = 0; k < ptsPerPetal; k++) {
        const s = Math.min(1, (k + Math.random() * 0.6) / ptsPerPetal * 1.02);
        const phi = pitch + curl * s * s;
        const rad = L * s * Math.cos(phi);
        const z = L * s * Math.sin(phi) * 0.8;
        const hw = hwMax * Math.sqrt(Math.max(0, Math.sin(Math.PI * Math.pow(s, 0.75)))) * (Math.random() < 0.9 ? 1 : Math.random());
        const side = Math.random() < 0.5 ? -1 : 1;
        pts.push([rad * ux + side * hw * nx, rad * uy + side * hw * ny, z, 0]);
      }
    }
    // dense centre
    for (let k = 0; k < nPetals; k++) {
      const a = Math.random() * Math.PI * 2, rr = 0.06 * Math.sqrt(Math.random());
      pts.push([rr * Math.cos(a), rr * Math.sin(a), 0.42 + rand(-0.02, 0.02), 0]);
    }
    // stem curving away from the bloom
    const bend = rand(-0.5, 0.5);
    for (let k = 0; k < 380; k++) {
      const t = Math.random();
      pts.push([bend * t * t * 1.2 + rand(-0.01, 0.01), rand(-0.01, 0.01), -0.1 - t * 3.2, 1]);
    }
    return pts;
  }

  // wilted flower for the 404 page: stem arcs over, bloom hangs, petals on the ground
  function wiltedFlower() {
    const pts = [];
    const n = 80;
    for (let i = 0; i < n; i++) {
      if (Math.random() < 0.3) continue;                       // a few petals already gone
      const r = Math.sqrt((i + 1) / n), th = i * GOLD;
      const c0 = 0.2 + 1.05 * r, L = 0.45 + 0.6 * r, hwMax = 0.03 + 0.04 * r;
      const ct = Math.cos(th), st = Math.sin(th);
      for (let k = 0; k < 34; k++) {
        const s = (k + Math.random() * 0.6) / 34;
        const c = c0 * (1 - 0.55 * s);                          // gravity pulls tips down
        const hw = hwMax * Math.sqrt(Math.max(0, Math.sin(Math.PI * Math.pow(s, 0.75)))) * (Math.random() < 0.5 ? -1 : 1);
        pts.push([s * L * Math.sin(c) * ct - hw * st, s * L * Math.cos(c), s * L * Math.sin(c) * st + hw * ct, 0]);
      }
    }
    for (let k = 0; k < 90; k++) {                              // receptacle
      const a = Math.random() * 6.28, rr = 0.07 * Math.sqrt(Math.random());
      pts.push([rr * Math.cos(a), -0.02 + rand(-0.03, 0.03), rr * Math.sin(a), 0]);
    }
    const G = 2.3;                                              // ground level
    const P0 = [1.7, G], P1 = [1.55, -2.5], P2 = [0, -0.06];    // stem as a bezier arc
    for (let k = 0; k < 700; k++) {
      const t = Math.random(), u = 1 - t;
      pts.push([u * u * P0[0] + 2 * u * t * P1[0] + t * t * P2[0] + rand(-0.008, 0.008),
                u * u * P0[1] + 2 * u * t * P1[1] + t * t * P2[1], rand(-0.008, 0.008), 0]);
    }
    for (let k = 0; k < 260; k++) pts.push([rand(-1.9, 2.7), G + rand(-0.004, 0.004), rand(-0.3, 0.3), 0]);  // ground
    for (let q = 0; q < 7; q++) {                               // fallen petals
      const gx = rand(-1.4, 1.3), gz = rand(-0.4, 0.4), ang = rand(0, Math.PI), len = rand(0.35, 0.55);
      for (let k = 0; k < 36; k++) {
        const s = Math.random(), hw = 0.045 * Math.sin(Math.PI * s) * (Math.random() < 0.5 ? -1 : 1);
        pts.push([gx + s * len * Math.cos(ang) - hw * Math.sin(ang), G - 0.01, gz + s * len * Math.sin(ang) + hw * Math.cos(ang), 0]);
      }
    }
    return pts;
  }

  // layout as fractions of the viewport; size relative to min(w, h)
  const mode = canvas.dataset.layout || 'landing';
  const inner = mode === 'inner';
  const wiltedLayout = [
    { x: 0.45, y: 0.28, size: 0.17, tilt: 0.12, spin: 0, wilt: true,
      yaw: 0.08, tiltOff: 0, roll: 0, gain: 0.3 }
  ];
  const innerLayout = [
    { x: 0.90, y: 0.58, size: 0.55, tilt: 0.80, spin: 0.00004 },
    { x: 0.64, y: 1.02, size: 0.32, tilt: 0.60, spin: -0.00006 },
    { x: 1.00, y: 0.06, size: 0.24, tilt: 1.00, spin: 0.00007 }
  ];
  const layout = [
    { x: 0.70, y: 0.42, size: 0.46, tilt: 0.75, spin: 0.00005 },
    { x: 0.22, y: 0.24, size: 0.32, tilt: 1.00, spin: -0.00007 },
    { x: 0.44, y: 0.82, size: 0.28, tilt: 0.55, spin: 0.00009 },
    { x: 0.96, y: 0.92, size: 0.26, tilt: 1.10, spin: -0.00006 },
    { x: 0.03, y: 0.66, size: 0.22, tilt: 0.85, spin: 0.00008 },
    { x: 0.43, y: 0.10, size: 0.17, tilt: 0.65, spin: -0.00010 },
    { x: 0.90, y: 0.15, size: 0.17, tilt: 0.95, spin: 0.00007 }
  ];
  const chosen = (mode === 'wilted' ? wiltedLayout : inner ? innerLayout : layout)
    .map(f => ({ ...f, petals: Math.round(55 + f.size * 130), ppp: Math.round(26 + f.size * 50) }));
  const flowers = chosen.map(f => ({
    ...f,
    pts: f.wilt ? wiltedFlower() : chrysanthemum(f.petals, f.ppp),
    phase: Math.random() * 6.28,
    gain: f.gain ?? rand(0.45, 1.25),  // how strongly it turns to the mouse
    ease: rand(0.015, 0.07),           // how quickly it follows
    swayA: rand(0.04, 0.12), swayF: rand(0.00025, 0.0007),
    rockA: rand(0.08, 0.22), rockF: rand(0.0002, 0.0006),
    driftA: rand(4, 12), driftF: rand(0.00015, 0.0004),
    yaw: f.yaw ?? rand(-0.9, 0.9),          // base facing left / right
    tiltOff: f.tiltOff ?? rand(-0.45, 0.35), // base facing up / down
    roll: f.roll ?? rand(-0.9, 0.9),        // lean in the screen plane (stem direction)
    rollA: rand(0.05, 0.15), rollF: rand(0.0002, 0.0005),
    lx: 0, ly: 0
  }));

  let w, h, dpr;
  const target = { x: 0, y: 0 };
  const mouse = { x: -1e4, y: -1e4 }, REPEL = 120;
  const LEVELS = 10;
  const buckets = Array.from({ length: LEVELS }, () => []);

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    for (const b of buckets) b.length = 0;

    const m = Math.min(w, h);
    for (const f of flowers) {
      const spin = f.wilt ? 0 : f.phase + t * f.spin;
      f.lx += (target.x * f.gain - f.lx) * f.ease;
      f.ly += (target.y * f.gain - f.ly) * f.ease;
      const sway = f.swayA * Math.sin(t * f.swayF + f.phase);
      const rock = f.rockA * Math.sin(t * f.rockF + f.phase * 1.7);
      const cs = Math.cos(spin), ss = Math.sin(spin);
      const ax = f.tilt + f.tiltOff + sway + f.ly;       // tilt towards / away
      const ay = f.yaw + rock + f.lx;                    // turn left / right
      const rl = f.roll + f.rollA * Math.sin(t * f.rollF + f.phase * 0.7);
      const cr = Math.cos(rl), sr = Math.sin(rl);
      const cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay);
      const S = m * f.size;
      const ox = f.x * w + f.driftA * Math.sin(t * f.driftF + f.phase);
      const oy = f.y * h + f.driftA * Math.cos(t * f.driftF * 0.8 + f.phase * 2.3);

      // projected bloom centre and radius, used to hide stem points behind the bloom
      const R2 = (S * 0.95) * (S * 0.95);
      for (const [x0, y0, z0, isStem] of f.pts) {
        const x = x0 * cs - y0 * ss, y = x0 * ss + y0 * cs, z = z0;  // spin about own axis
        const y1 = y * cx - z * sx, z1 = y * sx + z * cx;              // tilt about x
        const x2 = x * cy + z1 * sy, z2 = -x * sy + z1 * cy;           // turn about y
        const p = 4 / (4 - z2);
        if (isStem && z2 < 0) {
          const dx = x2 * S, dy = y1 * S;
          if (dx * dx + dy * dy < R2) continue;
        }
        const lvl = Math.max(0, Math.min(LEVELS - 1, Math.round((z2 + 1) / 2.2 * (LEVELS - 1))));
        const xr = x2 * cr - y1 * sr, yr = x2 * sr + y1 * cr;        // lean in screen plane
        let px = ox + xr * S * p, py = oy + yr * S * p;
        const mx = px - mouse.x, my = py - mouse.y, md = mx * mx + my * my;
        if (md < REPEL * REPEL && md > 0.01) {
          const k = 1 - Math.sqrt(md) / REPEL;   // gentle lens: pushes outwards without leaving a hole
          px += mx * 0.55 * k * k; py += my * 0.55 * k * k;
        }
        buckets[lvl].push(px, py, p);
      }
    }

    for (let l = 0; l < LEVELS; l++) {
      const b = buckets[l];
      ctx.fillStyle = `rgba(255,255,255,${0.12 + 0.88 * l / (LEVELS - 1)})`;
      ctx.beginPath();
      for (let i = 0; i < b.length; i += 3) {
        const s = 1.05 * b[i + 2];
        ctx.rect(b[i], b[i + 1], s, s);
      }
      ctx.fill();
    }
    if (!reduce) requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', e => {
    target.x = (e.clientX / w - 0.5) * 0.7;
    target.y = -(e.clientY / h - 0.5) * 0.5;
    mouse.x = e.clientX; mouse.y = e.clientY;
  });
  document.addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; });
  resize();
  requestAnimationFrame(draw);
}

// desktop-style windows: close / minimise / expand / drag / focus / reopen from dock
const wins = [...document.querySelectorAll('.win')];
const dock = document.getElementById('dock');
if (wins.length && dock) {
  let top = 10;
  const mobile = () => window.matchMedia('(max-width: 700px)').matches;
  const focus = w => { w.style.zIndex = ++top; };

  // keep minimised windows stacked in the bottom-right corner on mobile
  const restack = () => {
    const dh = mobile() && dock.children.length ? dock.offsetHeight + 6 : 0;
    wins.forEach(w => w.style.setProperty('--dock', dh + 'px'));
    ['about', 'research-win', 'software-win'].map(id => document.getElementById(id))   // same order as the dock
      .filter(w => w && w.classList.contains('min') && !w.classList.contains('closed'))
      .forEach((w, i) => w.style.setProperty('--stack', i));
  };

  const renderDock = () => {
    dock.innerHTML = '';
    const order = ['about', 'research-win', 'software-win'];   // dock order: about, research, software
    order.map(id => document.getElementById(id))
      .filter(w => w && w.classList.contains('closed')).forEach(w => {
      const b = document.createElement('button');
      b.textContent = w.dataset.title;
      b.addEventListener('click', () => {
        w.classList.remove('closed', 'min', 'max');
        w.classList.add('shown');
        w.style.left = ''; w.style.top = '';
        focus(w); renderDock(); restack();
      });
      dock.appendChild(b);
    });
  };

  // mobile: tuck research.txt behind about.txt so only its link row peeks out
  const about = document.getElementById('about');
  const research = document.getElementById('research-win');
  const layoutMobile = () => {
    if (!about || !research || research.style.left) return;   // leave it alone once dragged
    if (!mobile()) { research.style.removeProperty('--y'); return; }
    const aboutTop = window.innerHeight * 0.46 - about.offsetHeight / 2;
    research.style.setProperty('--y', (aboutTop + 12 - research.offsetHeight / 2) + 'px');
  };
  layoutMobile();
  window.addEventListener('resize', layoutMobile);

  wins.forEach(w => {
    w.addEventListener('animationend', () => w.classList.add('shown'));
    w.addEventListener('pointerdown', () => focus(w));

    w.querySelectorAll('.dot').forEach(btn => btn.addEventListener('click', e => {
      e.stopPropagation();
      const act = btn.dataset.act;
      w.classList.add('shown');
      if (act === 'close') { w.classList.add('closed'); w.classList.remove('min'); renderDock(); }
      if (act === 'min') { w.classList.toggle('min'); w.classList.remove('max'); }
      if (act === 'max') { w.classList.toggle('max'); w.classList.remove('min'); }
      restack();
    }));

    // drag by title bar (not while minimised on mobile)
    const bar = w.querySelector('.win-bar');
    let drag = null;
    bar.addEventListener('pointerdown', e => {
      if (e.target.closest('.dot')) return;
      if (mobile() && w.classList.contains('min')) return;
      const r = w.getBoundingClientRect();
      drag = { dx: e.clientX - (r.left + r.width / 2), dy: e.clientY - (r.top + r.height / 2) };
      bar.setPointerCapture(e.pointerId);
    });
    bar.addEventListener('pointermove', e => {
      if (!drag) return;
      w.classList.add('shown');
      w.style.left = (e.clientX - drag.dx) + 'px';
      w.style.top = (e.clientY - drag.dy) + 'px';
    });
    const end = () => { drag = null; };
    bar.addEventListener('pointerup', end);
    bar.addEventListener('pointercancel', end);
  });
}

// scroll reveal for list entries on every tab
const entries = document.querySelectorAll('.entry');
if (entries.length && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('js-reveal');
  const io = new IntersectionObserver(items => {
    items.forEach(it => {
      if (!it.isIntersecting) return;
      // stagger rows that enter together
      const i = [...entries].indexOf(it.target);
      setTimeout(() => it.target.classList.add('in'), (i % 4) * 120);
      io.unobserve(it.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
  entries.forEach(e => io.observe(e));
}
