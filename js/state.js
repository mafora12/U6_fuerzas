// Estado compartido: todo lo que la intérprete controla en vivo.
// Los agentes leen estos valores, pero cada uno sigue calculando su propia respuesta.
export const state = {
  abrazo: 0.4,        // 0 = se buscan de lejos · 1 = abrazo cerrado (↑ ↓)
  tempo: 0.35,        // velocidad del vals (← →)
  emily: 0,           // presencia actual de Emily (0..1)
  emilyTarget: 0,     // E
  mundo: 0,           // 0 = noche azul · 1 = salón dorado
  mundoTarget: 0,     // Tab
  pulse: 0,           // impulso del último "1" del compás (Espacio), decae solo
  release: 0,         // 0 = abrazados · 1 = sueltos (mientras se sostiene Q)
  releaseHeld: false,
  taps: [],
  compases: 0,
  // Pulso del vals que marca la intérprete con Espacio (no escucha el audio):
  // después de dos taps sigue el tempo marcado, y cada tap lo vuelve a sincronizar.
  measure: 0,         // segundos por compás (0 = todavía no se ha marcado)
  phase: 0,           // posición dentro del compás (0 = el "1")
  accent: 0,          // 0..1: fuerte en el 1, suave en el 2 y el 3
  tapAt: -10,         // momento del último tap (para la onda en el piso)
  // Figura de baile (W A S D). fig guarda cuánto pesa cada una: cambian suavemente.
  figura: 'W',
  fig: { W: 1, A: 0, S: 0, D: 0 },
};

export const FIGURAS = {
  W: 'Vals por el salón',
  A: 'Vuelta en el sitio',
  S: 'Paseo lado a lado',
  D: 'Vals al revés',
};

export function easeState(dt) {
  state.emily += (state.emilyTarget - state.emily) * (1 - Math.exp(-dt * 0.6));
  state.mundo += (state.mundoTarget - state.mundo) * (1 - Math.exp(-dt * 0.35));
  state.pulse *= Math.exp(-dt * 1.8);
  state.release += ((state.releaseHeld ? 1 : 0) - state.release) * (1 - Math.exp(-dt * 2));
  // El compás avanza al tempo marcado; el acento del 3/4 es fuerte en el 1.
  if (state.measure > 0) {
    state.phase = (state.phase + dt / state.measure) % 1;
    const bump = (x) => { x = ((x % 1) + 1.5) % 1 - 0.5; return Math.exp(-((x / 0.07) ** 2)); };
    state.accent = bump(state.phase) + 0.35 * bump(state.phase - 1 / 3) + 0.35 * bump(state.phase - 2 / 3);
  }
  // De una figura a otra en un par de segundos, sin saltos.
  const k = 1 - Math.exp(-dt * 1.2);
  for (const key in state.fig) {
    state.fig[key] += ((state.figura === key ? 1 : 0) - state.fig[key]) * k;
  }
}

// Un tap = el "1" de un compás de vals (3/4).
export function tap(now) {
  state.pulse = Math.min(state.pulse + 1, 1.6);
  state.tapAt = now;
  state.phase = 0;    // cada tap es el "1": vuelve a sincronizar el compás
  const taps = state.taps;
  if (taps.length && now - taps[taps.length - 1] > 4) taps.length = 0;
  taps.push(now);
  while (taps.length > 6) taps.shift();
  if (taps.length >= 2) {
    state.measure = (taps[taps.length - 1] - taps[0]) / (taps.length - 1);
    state.compases = 60 / state.measure;
  }
}
