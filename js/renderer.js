import { rgba } from './palette.js';
import { params } from './couple.js';
import { Rain } from './rain.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Dibuja el salón en perspectiva: el piso es un círculo visto de lado (una elipse),
// los bailarines son figuras de pie con su reflejo en el piso mojado.
export class Renderer {
  constructor(canvas) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.paint = document.createElement('canvas');   // la huella del baile en el piso
    this.pctx = this.paint.getContext('2d');
    this.rain = new Rain();   // lluvia de luz que sigue un flow field
    this.last = new Map();
    this.resize();
    addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.W = innerWidth; this.H = innerHeight;
    for (const cv of [this.c, this.paint]) {
      cv.width = Math.round(this.W * dpr);
      cv.height = Math.round(this.H * dpr);
    }
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.cx = this.W / 2;
    this.cy = this.H * 0.66;
    this.rx = Math.min(this.W * 0.46, this.H * 1.0);
    this.ry = this.rx * 0.34;
    this.horizon = this.cy - this.ry * 1.25;
    this.fresh = true;
    this.last.clear();
  }

  toScreen(x, y) { return [this.cx + x * this.rx, this.cy + y * this.ry]; }
  toWorld(sx, sy) { return [(sx - this.cx) / this.rx, (sy - this.cy) / this.ry]; }
  // Más abajo en pantalla = más cerca = más grande.
  depth(y) { return 0.78 + 0.32 * (y + 1) / 2; }

  draw(st, couple, pal, t) {
    if (this.W !== innerWidth || this.H !== innerHeight) this.resize();
    const { ctx, W, H } = this;
    if (!W || !H) return;   // ventana minimizada u oculta
    const { victor: v, emily: e } = couple;
    const ea = clamp(st.emily, 0, 1);

    // ---- 1. Fondo con persistencia: lo que se mueve deja una pincelada ----
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = this.fresh ? 1 : 0.3;
    this.fresh = false;
    const hz = this.horizon / H;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    // El horizonte es una franja difusa, no una línea.
    g.addColorStop(0, rgba(pal.skyTop));
    g.addColorStop(Math.max(0, hz - 0.08), rgba(pal.skyLow));
    g.addColorStop(Math.min(1, hz + 0.06), rgba(pal.floorFar));
    g.addColorStop(1, rgba(pal.floorNear));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    // ---- 2. Luna (o candelabro) y lluvia de luz, como en la pintura ----
    ctx.globalCompositeOperation = 'lighter';
    const mx = W * 0.5, my = this.horizon - H * 0.2, mr = H * 0.085 * (1 + 0.08 * st.pulse);
    const halo = ctx.createRadialGradient(mx, my, 0, mx, my, mr * 4.5);
    halo.addColorStop(0, rgba(pal.moon, 0.22));
    halo.addColorStop(1, rgba(pal.moon, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(mx - mr * 5, my - mr * 5, mr * 10, mr * 10);
    const core = ctx.createRadialGradient(mx, my, 0, mx, my, mr);
    core.addColorStop(0, rgba(pal.moon, 0.9));
    core.addColorStop(0.8, rgba(pal.moon, 0.55));
    core.addColorStop(1, rgba(pal.moon, 0));
    ctx.fillStyle = core;
    ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fill();

    this.rain.update(W, H, t);
    this.rain.draw(ctx, pal, this.horizon);

    // ---- 3. La huella del baile en el piso (se borra despacio) ----
    const p = this.pctx;
    p.globalCompositeOperation = 'destination-out';
    p.fillStyle = 'rgba(0,0,0,0.01)';
    p.fillRect(0, 0, W, H);
    p.globalCompositeOperation = 'lighter';
    p.lineCap = 'round';
    for (const [d, col, a] of [[v, pal.trailV, 1], [e, pal.trailE, ea]]) {
      const [sx, sy] = this.toScreen(d.x, d.y);
      const prev = this.last.get(d);
      if (prev && a > 0.05) {
        p.strokeStyle = rgba(col, 0.3 * a);
        p.lineWidth = 5 * this.depth(d.y);
        p.beginPath(); p.moveTo(prev[0], prev[1]); p.lineTo(sx, sy); p.stroke();
      }
      this.last.set(d, [sx, sy]);
    }
    ctx.drawImage(this.paint, 0, 0, W, H);

    // ---- 4. Un foco suave sobre el piso que acompaña a la pareja (solo decoración) ----
    const [lx, ly] = this.toScreen((v.x + e.x * ea) / (1 + ea), (v.y + e.y * ea) / (1 + ea));
    ctx.save();
    ctx.translate(lx, ly);
    ctx.scale(1, this.ry / this.rx);
    const pool = ctx.createRadialGradient(0, 0, 0, 0, 0, this.rx * 0.28);
    pool.addColorStop(0, rgba(pal.light, 0.16 + 0.12 * st.pulse));
    pool.addColorStop(1, rgba(pal.light, 0));
    ctx.fillStyle = pool;
    ctx.beginPath(); ctx.arc(0, 0, this.rx * 0.28, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // ---- 5. Reflejos y figuras, de atrás hacia adelante ----
    const figs = [
      { d: v, kind: 'victor', a: 1 },
      { d: e, kind: 'emily', a: ea },
    ].filter((f) => f.a > 0.02).sort((a, b) => a.d.y - b.d.y);

    ctx.globalCompositeOperation = 'lighter';
    for (const f of figs) this._figure(f, pal, st, t, true);
    ctx.globalCompositeOperation = 'source-over';
    for (const f of figs) this._figure(f, pal, st, t, false);

    // ---- 6. Las manos: cuando se perciben y están cerca, se toman ----
    const pr = params(st);
    const dist = Math.hypot(e.x - v.x, e.y - v.y);
    if (v.sees && dist < pr.ideal * 1.8 && ea > 0.3) this._hold(v, e, pal, ea);
  }

  // Dibuja una figura (o su reflejo) de pie sobre su punto del piso.
  _figure({ d, kind, a }, pal, st, t, reflection) {
    const { ctx } = this;
    const [sx, sy] = this.toScreen(d.x, d.y);
    const s = this.depth(d.y);
    const h = this.H * 0.34 * s * (1 + 0.1 * st.pulse);
    const vxs = d.vx * this.rx;                       // velocidad horizontal en pantalla
    const lean = clamp(vxs * 0.035, -0.14, 0.14) * h;  // se inclina hacia donde va
    const sway = -clamp(vxs * 0.06, -0.3, 0.3) * h;    // la falda queda atrás

    ctx.save();
    ctx.translate(sx, sy);
    if (reflection) {
      ctx.scale(1, -0.5);
      ctx.globalAlpha = 0.3 * a;
    } else {
      ctx.globalAlpha = a;
    }

    const shoulderY = -0.8 * h, waistY = -0.53 * h, headY = -0.91 * h;
    const sxL = lean * 0.85 - 0.075 * h, sxR = lean * 0.85 + 0.075 * h;

    if (kind === 'emily') {
      const glow = pal.emily;
      ctx.shadowColor = rgba(glow, 0.9);
      ctx.shadowBlur = reflection ? 0 : 24 * s;
      const grad = ctx.createLinearGradient(0, shoulderY, 0, 0);
      grad.addColorStop(0, rgba(glow, 0.95));
      grad.addColorStop(1, rgba(glow, 0.35));
      ctx.fillStyle = grad;
      // Vestido: hombros → cintura → falda acampanada que se mece.
      const wL = lean * 0.6 - 0.045 * h, wR = lean * 0.6 + 0.045 * h;
      const hemL = sway - 0.22 * h, hemR = sway + 0.22 * h;
      ctx.beginPath();
      ctx.moveTo(sxL, shoulderY);
      ctx.lineTo(wL, waistY);
      ctx.bezierCurveTo(wL - 0.08 * h, -0.3 * h, hemL - 0.02 * h, -0.08 * h, hemL, 0);
      const n = 6;
      for (let k = 1; k <= n; k++) {
        const x0 = hemL + ((hemR - hemL) * (k - 0.5)) / n;
        const x1 = hemL + ((hemR - hemL) * k) / n;
        const wave = Math.sin(t * 4 + k * 1.3 + d.step) * 0.03 * h;
        ctx.quadraticCurveTo(x0, wave + 0.02 * h, x1, 0);
      }
      ctx.bezierCurveTo(hemR + 0.02 * h, -0.08 * h, wR + 0.08 * h, -0.3 * h, wR, waistY);
      ctx.lineTo(sxR, shoulderY);
      ctx.closePath();
      ctx.fill();
      // Velo que flota detrás de la cabeza.
      ctx.strokeStyle = rgba(glow, 0.35);
      ctx.lineWidth = 0.02 * h;
      ctx.beginPath();
      ctx.moveTo(lean, headY);
      ctx.quadraticCurveTo(lean + sway * 0.8, headY + 0.2 * h, sway * 1.4, waistY + 0.1 * h);
      ctx.stroke();
      ctx.fillStyle = rgba(glow, 1);
    } else {
      const body = pal.victorBody, rim = pal.victorRim;
      ctx.shadowColor = rgba(rim, 0.9);
      ctx.shadowBlur = reflection ? 0 : 16 * s;
      const torso = ctx.createLinearGradient(0, shoulderY, 0, -0.3 * h);
      torso.addColorStop(0, rgba(rim, 0.55));
      torso.addColorStop(1, rgba(body, 0.95));
      ctx.fillStyle = torso;
      ctx.strokeStyle = rgba(rim, 0.95);
      ctx.lineWidth = Math.max(1.2, 0.012 * h);
      // Piernas: se abren y cierran con el paso.
      const stride = Math.sin(d.step) * 0.06 * h;
      ctx.lineCap = 'round';
      ctx.lineWidth = 0.05 * h;
      ctx.strokeStyle = rgba(rim, 0.75);
      for (const [hx, fx] of [[-0.03, -0.05 + stride / h], [0.03, 0.05 - stride / h]]) {
        ctx.beginPath();
        ctx.moveTo(lean * 0.4 + hx * h, -0.47 * h);
        ctx.lineTo(fx * h, 0);
        ctx.stroke();
      }
      // Torso con frac: hombros → cintura, y los faldones que vuelan atrás.
      ctx.strokeStyle = rgba(rim, 0.95);
      ctx.lineWidth = Math.max(1.2, 0.012 * h);
      ctx.beginPath();
      ctx.moveTo(sxL, shoulderY);
      ctx.lineTo(sxR, shoulderY);
      ctx.lineTo(lean * 0.45 + 0.05 * h, -0.47 * h);
      ctx.lineTo(sway * 0.5 + 0.02 * h, -0.3 * h);
      ctx.lineTo(sway * 0.5 - 0.03 * h, -0.33 * h);
      ctx.lineTo(lean * 0.45 - 0.05 * h, -0.47 * h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = rgba(rim, 1);
    }

    // Cabeza.
    ctx.beginPath();
    ctx.arc(lean, headY, 0.055 * h, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    d._shoulder = [sx + lean * 0.85, sy + shoulderY];
    d._waist = [sx + lean * 0.6, sy + waistY];
  }

  _hold(v, e, pal, a) {
    const { ctx } = this;
    if (!v._shoulder || !e._shoulder) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 12;
    ctx.shadowColor = rgba(pal.emily, 0.8);
    // Manos tomadas, en alto.
    const [ax, ay] = v._shoulder, [bx, by] = e._shoulder;
    ctx.strokeStyle = rgba(pal.emily, 0.55 * a);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.quadraticCurveTo((ax + bx) / 2, Math.min(ay, by) - 30, bx, by);
    ctx.stroke();
    // El brazo de Victor en la cintura de Emily.
    const [wx, wy] = e._waist;
    ctx.strokeStyle = rgba(pal.victorRim, 0.5 * a);
    ctx.beginPath();
    ctx.moveTo(ax, ay + 8);
    ctx.quadraticCurveTo((ax + wx) / 2, (ay + wy) / 2 + 12, wx, wy);
    ctx.stroke();
    ctx.restore();
  }
}
