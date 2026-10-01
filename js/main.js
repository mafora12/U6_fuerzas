import { state, easeState } from './state.js';
import { Couple } from './couple.js';
import { Renderer } from './renderer.js';
import { paletteAt } from './palette.js';
import { Hud } from './hud.js';
import { initControls, updateHeld } from './controls.js';

const renderer = new Renderer(document.getElementById('escena'));
const couple = new Couple();
const hud = new Hud();

// Música: tu interpretación va en assets/musica.mp3
const audio = document.getElementById('musica');
const musicaOk = () => audio.networkState !== HTMLMediaElement.NETWORK_NO_SOURCE;

const inicio = document.getElementById('inicio');
let started = false;
function onStart() {
  if (started) return;
  started = true;
  inicio.classList.add('fuera');
}

initControls({ audio, hud, onStart });

// La simulación avanza a 60 pasos por segundo sin importar la pantalla.
const STEP = 1 / 60;
let last = performance.now(), acc = 0, t = 0;

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  t += dt;

  updateHeld(dt);
  easeState(dt);

  acc += dt;
  let steps = 0;
  while (acc >= STEP && steps < 6) {
    couple.update(state, 1);
    acc -= STEP;
    steps++;
  }
  if (steps === 6) acc = 0;

  renderer.draw(state, couple, paletteAt(state.mundo), t);
  hud.update(state, audio, musicaOk());
}
requestAnimationFrame(frame);
