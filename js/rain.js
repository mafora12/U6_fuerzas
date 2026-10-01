import { rgba } from './palette.js';

// LUZ EN EL AIRE CON FLOW FIELD.
// El campo es una rejilla de direcciones sobre la pantalla. Un ruido suave que cambia
// con el tiempo decide cada dirección, en cualquier sentido: el campo forma remolinos.
// Cada partícula es un agente que solo mira la flecha de la celda donde está y gira
// hacia ella (steering de Reynolds), con una caída muy leve, como polvo de luz.
// El campo guarda direcciones; la regla con la que la partícula lo sigue está en update().

const CELL = 40;            // tamaño de cada celda del campo, en píxeles
const SCALE = 0.09;         // tamaño de los remolinos (más pequeño = remolinos más grandes)
const DROPS = 230;
const FALL = 0.04;          // caída leve, además del campo

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
    this.drops = Array.from({ length: DROPS }, () => {
      const d = this._newDrop();
      d.age = Math.random() * d.life;   // que no aparezcan todas a la vez
      return d;
    });
  }

  // Nace en un punto al azar de la pantalla: así la luz queda dispersa.
  _newDrop() {
    return {
      x: Math.random() * this.W,
      y: Math.random() * this.H,
      vx: 0, vy: 0,
      speed: 0.3 + Math.random() * 0.9,     // velocidad máxima: lenta, flota
      len: 7 + Math.random() * 12,          // largo de la estela
      w: 0.9 + Math.random() * 1.4,
      a: 0.10 + Math.random() * 0.16,       // visible pero suave
      age: 0,
      life: 3 + Math.random() * 5,          // segundos de vida
    };
  }

  // El campo: cada celda apunta en la dirección que dicta el ruido (cualquier ángulo).
  _updateField(t) {
    const { cols, rows, angle } = this;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        angle[i + j * cols] = noise3(i * SCALE, j * SCALE, t * 0.12) * Math.PI * 4;
      }
    }
  }

  update(W, H, t) {
    if (W !== this.W || H !== this.H) this._resize(W, H);
    const dtSec = this.lastT === null ? 1 / 60 : Math.min(0.05, t - this.lastT);
    const dt60 = dtSec * 60;
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
      const f = Math.hypot(sx, sy), maxF = 0.03;
      if (f > maxF) { sx *= maxF / f; sy *= maxF / f; }
      d.vx += sx * dt60;
      d.vy += (sy + FALL * 0.1) * dt60;
      d.x += d.vx * dt60;
      d.y += (d.vy + FALL) * dt60;
      d.age += dtSec;
      // Al terminar su vida o salir de la pantalla, renace en otro lugar.
      if (d.age > d.life || d.x < -30 || d.x > W + 30 || d.y < -30 || d.y > H + 30) {
        Object.assign(d, this._newDrop());
      }
    }
  }

  draw(ctx, pal, horizon) {
    ctx.lineCap = 'round';
    for (const d of this.drops) {
      // Aparece y se desvanece suavemente a lo largo de su vida.
      const life = Math.sin(Math.PI * Math.min(1, d.age / d.life));
      // Sobre el piso se ve aún más tenue.
      const fade = d.y < horizon ? 1 : Math.max(0.35, 1 - (d.y - horizon) / 300);
      const alpha = d.a * life * fade;
      if (alpha < 0.004) continue;
      ctx.strokeStyle = rgba(pal.streak, alpha);
      ctx.lineWidth = d.w;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - d.vx * d.len, d.y - (d.vy + FALL) * d.len);
      ctx.stroke();
    }
  }
}
