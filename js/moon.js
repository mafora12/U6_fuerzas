// LA LUNA CON PHYSARUM.
// La superficie de la luna es un mapa de rastro de 96×96. Sobre él viven 2500 agentes
// Physarum: cada uno huele el rastro con tres sensores (adelante, izquierda, derecha),
// gira hacia donde hay más, avanza y deposita. Juntos tejen una red de venas de luz
// que crece y se transforma sola. No pueden salir del disco de la luna.
// Cada tap (el "1" del compás) los acelera y hace que depositen más: la luna late.

const R = 96;          // resolución del mapa
const N = 2500;        // agentes
const SA = 0.6;        // ángulo de los sensores laterales
const SO = 5;          // distancia de los sensores
const RA = 0.35;       // cuánto giran
const DECAY = 0.9;

export class MoonSlime {
  constructor() {
    this.trail = new Float32Array(R * R);
    this.tmp = new Float32Array(R * R);
    this.ax = new Float32Array(N);
    this.ay = new Float32Array(N);
    this.aa = new Float32Array(N);
    const c = R / 2, rad = R * 0.44;
    for (let k = 0; k < N; k++) {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * rad;
      this.ax[k] = c + Math.cos(a) * r;
      this.ay[k] = c + Math.sin(a) * r;
      this.aa[k] = Math.random() * Math.PI * 2;
    }
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvas.height = R;
    this.ctx = this.canvas.getContext('2d');
    this.img = this.ctx.createImageData(R, R);
    // Máscara circular con borde suave.
    this.mask = new Float32Array(R * R);
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
      const d = Math.hypot(x + 0.5 - c, y + 0.5 - c) / (R * 0.47);
      this.mask[y * R + x] = Math.max(0, Math.min(1, (1 - d) / 0.08));
    }
  }

  sense(x, y, a) {
    const ix = (x + Math.cos(a) * SO) | 0, iy = (y + Math.sin(a) * SO) | 0;
    if (ix < 0 || iy < 0 || ix >= R || iy >= R) return -1;
    return this.trail[iy * R + ix];
  }

  update(pulse, dt60) {
    const { trail, ax, ay, aa } = this;
    const c = R / 2, rad = R * 0.44;
    const speed = 0.55 * (1 + 1.2 * pulse) * dt60;
    const dep = 1 + 2.5 * pulse;
    for (let k = 0; k < N; k++) {
      let x = ax[k], y = ay[k], a = aa[k];
      const f = this.sense(x, y, a), l = this.sense(x, y, a + SA), r = this.sense(x, y, a - SA);
      if (f > l && f > r) { /* derecho */ }
      else if (f < l && f < r) a += (Math.random() < 0.5 ? 1 : -1) * RA;
      else if (l > r) a += RA;
      else if (r > l) a -= RA;
      x += Math.cos(a) * speed;
      y += Math.sin(a) * speed;
      // El borde de la luna: si se sale, vuelve hacia adentro.
      if (Math.hypot(x - c, y - c) > rad) {
        a = Math.atan2(c - y, c - x) + (Math.random() - 0.5) * 1.2;
        x = ax[k]; y = ay[k];
      }
      ax[k] = x; ay[k] = y; aa[k] = a;
      trail[(y | 0) * R + (x | 0)] += dep;
    }
    // Difusión 3×3 + evaporación.
    const t = this.tmp;
    for (let yy = 1; yy < R - 1; yy++) for (let xx = 1; xx < R - 1; xx++) {
      const i = yy * R + xx;
      t[i] = (trail[i - R - 1] + trail[i - R] + trail[i - R + 1] + trail[i - 1] + trail[i] +
              trail[i + 1] + trail[i + R - 1] + trail[i + R] + trail[i + R + 1]) / 9 * DECAY;
    }
    this.trail = t; this.tmp = trail;
  }

  // Pinta la red y la dibuja sobre la luna (centro x, y; radio r).
  draw(ctx, x, y, r, color) {
    const d = this.img.data, tr = this.trail, m = this.mask;
    for (let i = 0; i < R * R; i++) {
      const v = (tr[i] / (tr[i] + 3)) * m[i];
      const p = i * 4;
      d[p] = color[0]; d[p + 1] = color[1]; d[p + 2] = color[2];
      d[p + 3] = v * 255;
    }
    this.ctx.putImageData(this.img, 0, 0);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(this.canvas, x - r, y - r, r * 2, r * 2);
    ctx.restore();
  }
}

