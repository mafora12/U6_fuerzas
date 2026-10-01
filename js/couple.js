// STEERING BEHAVIORS (Reynolds): dos agentes autónomos, Victor y Emily.
//
// El salón es un círculo de radio 1 centrado en (0, 0).
// Cada bailarín solo percibe: dónde está su pareja y hacia dónde va (si está dentro
// de su radio de percepción), la luz del salón y la pared.
// Ninguna regla dice "la pareja gira": cada uno da un paso de lado ALREDEDOR del otro,
// a la distancia del abrazo, y no puede detenerse. Como los dos lo hacen a la vez,
// la pareja rota sobre un centro común que ninguno de los dos calcula.

const TAU = Math.PI * 2;
const lerp = (a, b, t) => a + (b - a) * t;
const TRAIL = 160;       // pasos recientes (huella en el piso)
const MEMORY = 600;      // pasos de Emily que Victor recuerda

export class Dancer {
  constructor(name, x, y, heading) {
    this.name = name;
    this.x = x; this.y = y;
    this.vx = Math.cos(heading) * 0.004;
    this.vy = Math.sin(heading) * 0.004;
    this.ax = 0; this.ay = 0;
    this.fax = 0; this.fay = 0;   // fuerza con inercia
    this.wanderAngle = Math.random() * TAU;
    this.sees = false;          // ¿percibe a su pareja ahora?
    this.target = null;         // el punto que está buscando (para la vista D)
    this.step = 0;              // fase del paso (para dibujar las piernas)
    this.svx = this.vx; this.svy = this.vy;   // velocidad suavizada (solo para dibujar)
    this.trail = [];
  }

  get speed() { return Math.hypot(this.vx, this.vy); }

  // Fuerza de steering = velocidad deseada − velocidad actual, limitada a maxForce.
  steer(dx, dy, w, p) {
    let sx = dx - this.vx, sy = dy - this.vy;
    const f = Math.hypot(sx, sy);
    if (f > p.maxForce) { sx *= p.maxForce / f; sy *= p.maxForce / f; }
    this.ax += sx * w;
    this.ay += sy * w;
  }

  // SEEK: ir hacia un punto a velocidad máxima.
  seek(tx, ty, w, p) {
    const dx = tx - this.x, dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 1e-6) return;
    this.steer((dx / d) * p.maxSpeed, (dy / d) * p.maxSpeed, w, p);
  }

  // FLEE: alejarse de otro agente (lo contrario de seek), solo si está cerca.
  flee(o, w, p) {
    if (w <= 0) return;
    const dx = this.x - o.x, dy = this.y - o.y;
    const d = Math.hypot(dx, dy);
    if (d < 1e-6 || d > 0.5) return;
    this.steer((dx / d) * p.maxSpeed, (dy / d) * p.maxSpeed, w, p);
  }

  // GIRAR CON LA PAREJA (seek a un punto desplazado): mira dónde está el otro y busca
  // el punto que queda a la distancia del abrazo, pero un ángulo "turn" más adelante
  // alrededor de él. Es un paso de lado alrededor de la pareja.
  turnWith(o, dist, turn, w, p) {
    const a = Math.atan2(this.y - o.y, this.x - o.x) + turn;
    const tx = o.x + o.vx * 8 + Math.cos(a) * dist;
    const ty = o.y + o.vy * 8 + Math.sin(a) * dist;
    this.target = [tx, ty];
    this.seek(tx, ty, w, p);
  }

  // ALIGNMENT: ir en la misma dirección que el otro (copiar su velocidad).
  align(o, w, p) {
    if (w <= 0) return;
    const sp = Math.hypot(o.vx, o.vy);
    if (sp < 1e-6) return;
    this.steer((o.vx / sp) * p.maxSpeed, (o.vy / sp) * p.maxSpeed, w, p);
  }

  // LÍNEA DE BAILE: buscar un punto un poco más adelante sobre el anillo del salón.
  // dir = +1 recorre el salón en un sentido, −1 en el contrario.
  lineOfDance(dir, w, p) {
    if (w <= 0) return;
    const a = Math.atan2(this.y, this.x) + 0.6 * dir;
    this.seek(Math.cos(a) * 0.5, Math.sin(a) * 0.5, w, p);
  }

  // ARRIVE a una distancia: acercarse si está lejos del abrazo, alejarse si está muy cerca,
  // frenando a medida que llega a la distancia ideal.
  keepDistance(o, ideal, w, p) {
    const dx = o.x - this.x, dy = o.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 1e-6) return;
    const err = d - ideal;
    const mag = p.maxSpeed * Math.min(1, Math.abs(err) / (0.5 * ideal));
    const s = (Math.sign(err) * mag) / d;
    this.steer(dx * s, dy * s, w, p);
  }

  // WANDER: un punto que se mueve al azar sobre un círculo frente al agente.
  // jitter: cuánto cambia el punto al azar en cada cuadro (poco = paseo tranquilo).
  wander(w, p, jitter = 0.5) {
    this.wanderAngle += (Math.random() - 0.5) * jitter;
    const sp = this.speed || 1e-6;
    const cx = this.x + (this.vx / sp) * 0.12;
    const cy = this.y + (this.vy / sp) * 0.12;
    this.seek(cx + Math.cos(this.wanderAngle) * 0.06, cy + Math.sin(this.wanderAngle) * 0.06, w, p);
  }

  // PATH FOLLOWING: seguir un camino guardado (las huellas de Emily).
  followPath(path, w, p) {
    if (path.length < 10) return;
    let best = 0, bd = Infinity;
    for (let k = 0; k < path.length; k += 3) {
      const d = (path[k][0] - this.x) ** 2 + (path[k][1] - this.y) ** 2;
      if (d < bd) { bd = d; best = k; }
    }
    const t = path[Math.min(path.length - 1, best + 12)];
    this.target = [t[0], t[1]];
    this.seek(t[0], t[1], w, p);
  }

  integrate(p, dt) {
    // La suma de todas las fuerzas también tiene un límite: así el giro es suave
    // y la dirección no se pasa de largo de un cuadro a otro.
    const a = Math.hypot(this.ax, this.ay), maxA = p.maxForce * 1.5;
    if (a > maxA) { this.ax *= maxA / a; this.ay *= maxA / a; }
    // Inercia: la fuerza no cambia de golpe de un cuadro a otro (un cuerpo tiene peso).
    // Sin esto, cada cuadro corregía de más y el bailarín zigzagueaba.
    this.fax += (this.ax - this.fax) * 0.25 * dt;
    this.fay += (this.ay - this.fay) * 0.25 * dt;
    this.vx += this.fax * dt;
    this.vy += this.fay * dt;
    const sp = Math.hypot(this.vx, this.vy) || 1e-6;
    // Un bailarín nunca se queda quieto.
    const k = sp > p.maxSpeed ? p.maxSpeed / sp : sp < p.minSpeed ? p.minSpeed / sp : 1;
    this.vx *= k; this.vy *= k;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.ax = this.ay = 0;
    this.step += this.speed * dt * 40;
    this.svx += (this.vx - this.svx) * 0.08 * dt;
    this.svy += (this.vy - this.svy) * 0.08 * dt;
    this.trail.push([this.x, this.y]);
    if (this.trail.length > TRAIL) this.trail.shift();
  }
}

// Parámetros comunes que la intérprete transforma en vivo.
export function params(st) {
  // El tempo, el tap y el acento del compás (fuerte en el 1) cambian la velocidad.
  const maxSpeed = (0.003 + 0.014 * st.tempo) * (1 + 0.2 * st.accent + 0.35 * st.pulse);
  return {
    maxSpeed,
    minSpeed: 0.55 * maxSpeed,
    // En el salón dorado los giros son más amplios; en la noche, más cerrados.
    maxForce: maxSpeed * lerp(0.14, 0.08, st.mundo),
    // Distancia de abrazo. Al soltarse (Q) la distancia deseada crece: se abren.
    ideal: lerp(0.42, 0.07, st.abrazo) + 0.45 * st.release,
    perception: lerp(0.5, 1.6, st.abrazo) + 0.5 * st.release,   // hasta dónde se perciben
    // Cuánto adelanta el paso alrededor de la pareja. El signo es el sentido del giro:
    // W y A giran hacia un lado (A más cerrado), D hacia el otro; S casi no gira.
    turn: (0.5 + 0.12 * st.accent + 0.4 * st.pulse) * (st.fig.W + 2.2 * st.fig.A - st.fig.D),
  };
}

export class Couple {
  constructor() {
    this.victor = new Dancer('Victor', -0.25, 0.1, 0);
    this.emily = new Dancer('Emily', 0.3, -0.15, Math.PI);
    this.memory = [];
  }

  update(st, dt = 1) {
    const p = params(st);
    const { victor: v, emily: e } = this;
    const d = Math.hypot(e.x - v.x, e.y - v.y);

    // Percepción limitada: solo se perciben dentro de p.perception, y solo si Emily está.
    v.sees = e.sees = st.emily > 0.3 && d < p.perception;

    const f = st.fig;   // peso de cada figura (W, A, S, D); cambian suavemente
    for (const [me, other, presence] of [[v, e, 1], [e, v, st.emily]]) {
      me.target = null;
      if (me.sees) {
        // Abrazados giran juntos; sueltos (Q) se alejan y cada uno baila solo.
        me.turnWith(other, p.ideal, p.turn, 1.4 * (1 - st.release) * (1 - f.S), p);
        me.keepDistance(other, p.ideal, 0.8 + 0.6 * st.release, p);
        me.flee(other, 0.9 * st.release, p);
        // S, paseo: caminan juntos en la misma dirección.
        me.align(other, 1.3 * f.S * (1 - st.release), p);
        me.wander(0.12 + 0.8 * st.release + 0.25 * f.S, p, 0.12 + 0.3 * st.release);
        // Nunca se atraviesan: si quedan demasiado cerca, se apartan con fuerza.
        if (Math.hypot(other.x - me.x, other.y - me.y) < 0.06) me.flee(other, 3, p);
      } else {
        me.wander(0.9, p);
      }
      // W y D: recorren el salón por la línea de baile, en sentidos contrarios.
      me.lineOfDance(1, 0.9 * f.W * presence, p);
      me.lineOfDance(-1, 0.9 * f.D * presence, p);
      // Paredes del salón.
      const r = Math.hypot(me.x, me.y);
      if (r > 0.8) me.seek(0, 0, (r - 0.8) * 12, p);
    }

    // Cuando Emily no está, Victor sigue sus huellas.
    if (st.emily < 0.95) v.followPath(this.memory, 1.3 * (1 - st.emily), p);

    v.integrate(p, dt);
    e.integrate(p, dt);

    if (st.emily > 0.3) {
      this.memory.push([e.x, e.y]);
      if (this.memory.length > MEMORY) this.memory.shift();
    }
  }
}
