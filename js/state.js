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
  // De una figura a otra en un par de segundos, sin saltos.
  const k = 1 - Math.exp(-dt * 1.2);
  for (const key in state.fig) {
    state.fig[key] += ((state.figura === key ? 1 : 0) - state.fig[key]) * k;
  }
}

// Un tap = el "1" de un compás de vals (3/4).
export function tap(now) {
  state.pulse = Math.min(state.pulse + 1, 1.6);
  const taps = state.taps;
  if (taps.length && now - taps[taps.length - 1] > 4) taps.length = 0;
  taps.push(now);
  while (taps.length > 6) taps.shift();
  if (taps.length >= 2) state.compases = 60 / ((taps[taps.length - 1] - taps[0]) / (taps.length - 1));
}
