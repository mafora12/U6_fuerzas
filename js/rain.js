import { rgba } from './palette.js';

// LLUVIA CON FLOW FIELD.
// El campo es una rejilla de direcciones sobre la pantalla: casi todas apuntan hacia abajo,
// pero el ruido las tuerce y cambia con el tiempo. Cada gota es un agente que solo mira
// la flecha de la celda donde está y gira hacia ella (steering de Reynolds).
// El campo guarda direcciones; la regla con la que la gota lo sigue está en update().

const CELL = 40;            // tamaño de cada celda del campo, en píxeles
const TURB = 1.4;           // cuánto puede torcerse la dirección (radianes)
const DROPS = 140;

// Ruido suave 3D (value noise): valores entre 0 y 1 que cambian poco a poco.
function hash(x, y, z) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
const smooth = (t) => t * t * (3 - 2 * t);
function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const u = smooth(x - xi), v = smooth(y - yi), w = smooth(z - zi);
  const l = (a, b, t) => a + (b - a) * t;
  const c = (dx, dy, dz) => hash(xi + dx, yi + dy, zi + dz);
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), u), l(c(0, 1, 0), c(1, 1, 0), u), v),
    l(l(c(0, 0, 1), c(1, 0, 1), u), l(c(0, 1, 1), c(1, 1, 1), u), v),
    w
  );
}

export class Rain {
  constructor() {
    this.cols = 0; this.rows = 0;
    this.angle = new Float32Array(0);
    this.drops = [];
    this.lastT = null;
  }

  _resize(W, H) {
    this.W = W; this.H = H;
    this.cols = Math.ceil(W / CELL) + 1;
    this.rows = Math.ceil(H / CELL) + 1;
    this.angle = new Float32Array(this.cols * this.rows);
    this.drops = Array.from({ length: DROPS }, () => this._newDrop(Math.random() * H));
  }

  _newDrop(y) {
    const speed = 2 + Math.random() * 3;
    return {
      x: Math.random() * this.W, y,
      vx: 0, vy: speed,
      speed,                                  // velocidad máxima de esta gota
      len: 3 + Math.random() * 6,             // largo de la pincelada
      w: 1 + Math.random() * 2.5,
      a: 0.05 + Math.random() * 0.13,
    };
  }

  // El campo: dirección de cada celda = hacia abajo + torsión por ruido que evoluciona.
  _updateField(t) {
    const { cols, rows, angle } = this;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const n = noise3(i * 0.18, j * 0.18, t * 0.25);
        angle[i + j * cols] = Math.PI / 2 + (n - 0.5) * 2 * TURB;
      }
    }
  }

  update(W, H, t) {
    if (W !== this.W || H !== this.H) this._resize(W, H);
    const dt60 = this.lastT === null ? 1 : Math.min(3, (t - this.lastT) * 60);
    this.lastT = t;
    this._updateField(t);

    const { cols, rows, angle } = this;
    for (const d of this.drops) {
      // Percibe solo la celda donde está.
      const i = Math.min(cols - 1, Math.max(0, Math.floor(d.x / CELL)));
      const j = Math.min(rows - 1, Math.max(0, Math.floor(d.y / CELL)));
      const a = angle[i + j * cols];
      // Velocidad deseada = dirección del campo × su velocidad; steering = deseada − actual.
      let sx = Math.cos(a) * d.speed - d.vx;
      let sy = Math.sin(a) * d.speed - d.vy;
      const f = Math.hypot(sx, sy), maxF = 0.12;
      if (f > maxF) { sx *= maxF / f; sy *= maxF / f; }
      d.vx += sx * dt60;
      d.vy += sy * dt60;
      d.x += d.vx * dt60;
      d.y += d.vy * dt60;
      // Al salir de la pantalla vuelve a caer desde arriba.
      if (d.y > H + 20) Object.assign(d, this._newDrop(-20));
      if (d.x < -20) d.x = W + 20;
      else if (d.x > W + 20) d.x = -20;
    }
  }

  draw(ctx, pal, horizon) {
    ctx.lineCap = 'round';
    for (const d of this.drops) {
      // Sobre el piso la lluvia se ve más tenue.
      const fade = d.y < horizon ? 1 : Math.max(0.25, 1 - (d.y - horizon) / 300);
      ctx.strokeStyle = rgba(pal.streak, d.a * fade);
      ctx.lineWidth = d.w;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - d.vx * d.len, d.y - d.vy * d.len);
      ctx.stroke();
    }
  }
}
