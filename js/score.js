// Score visual de "Victor's Piano Solo" (tiempos marcados escuchando la pieza).
// Solo se MUESTRA en el panel (tecla H) como guía: no cambia nada automáticamente.
// Las decisiones las toma la intérprete en vivo.
export const SCORE = [
  { t: 0,   titulo: 'Victor solo en la noche', musica: 'agudo, inicio',                     hacer: 'Noche azul · Emily ausente · tempo lento' },
  { t: 25,  titulo: 'Algo aparece',            musica: 'pasa a grave',                      hacer: 'E: Emily aparece lejos de Victor' },
  { t: 30,  titulo: 'Se encuentran',           musica: 'variado, tema de la película',      hacer: 'WASD: llevar la luz entre los dos · ↑ abrazo · taps' },
  { t: 56,  titulo: 'El vals toma fuerza',     musica: 'más rápido, agudo y fuerte',        hacer: '→ tempo · WASD: recorrer el salón · taps marcados' },
  { t: 71,  titulo: 'Un respiro',              musica: 'baja y se hace agudo',              hacer: 'Q: se sueltan y cada uno gira solo' },
  { t: 76,  titulo: 'Tensión: se pierden',     musica: 'rápido, agudo, angustiante',        hacer: 'Soltar Q · ↓ abrazo · → tempo alto · luz a los bordes' },
  { t: 92,  titulo: 'Recuerdo del salón',      musica: 'tranquila, melancólica, tema lento', hacer: 'Tab: salón dorado · ← tempo lento · ↑ abrazo' },
  { t: 125, titulo: 'El baile crece',          musica: 'sube la intensidad',                hacer: '→ tempo · WASD: grandes vueltas por el salón · taps' },
  { t: 142, titulo: 'Suspensión',              musica: 'baja el tono y la velocidad',       hacer: 'Q: se abren · ← tempo al mínimo' },
  { t: 148, titulo: 'Clímax',                  musica: 'sube, dramático',                   hacer: 'Soltar Q: se reencuentran · abrazo y tempo al máximo · taps' },
  { t: 160, titulo: 'Final',                   musica: 'tranquila y grave',                 hacer: 'Tab: noche · E: Emily se va y Victor sigue sus huellas' },
];

export function sectionAt(time) {
  let k = 0;
  for (let i = 0; i < SCORE.length; i++) if (time >= SCORE[i].t) k = i;
  return k;
}
