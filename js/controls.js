import { state, tap } from './state.js';

// Teclas que se sostienen: flechas, WASD (mover la luz) y Q (soltarse).
const ARROWS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ'];
const held = new Set();

export function initControls({ toWorld, audio, hud, onStart }) {
  addEventListener('keydown', (e) => {
    onStart();
    if (ARROWS.includes(e.code)) {
      held.add(e.code);
      e.preventDefault();
      return;
    }
    if (e.repeat) return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        tap(performance.now() / 1000);
        break;
      case 'KeyE':
        state.emilyTarget = state.emilyTarget > 0.5 ? 0 : 1;
        hud.notify(state.emilyTarget ? 'Emily aparece' : 'Emily se desvanece', 2);
        break;
      case 'Tab':
        e.preventDefault();
        state.mundoTarget = state.mundoTarget > 0.5 ? 0 : 1;
        hud.notify(state.mundoTarget ? 'Salón dorado' : 'Noche azul', 2);
        break;
      case 'Enter':
        if (audio.paused) {
          audio.play().catch(() => hud.notify('No encuentro la música: ponla en assets/musica.mp3', 6));
        } else {
          audio.pause();
        }
        break;
      case 'KeyR':
        audio.currentTime = 0;
        break;
      case 'KeyF':
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen().catch(() => {});
        break;
      case 'KeyH':
        hud.toggle();
        break;
      case 'KeyV':
        state.debug = !state.debug;
        break;
    }
  });

  addEventListener('keyup', (e) => held.delete(e.code));
  addEventListener('blur', () => held.clear());

  // El mouse mueve la luz del salón (se proyecta sobre el piso).
  addEventListener('pointermove', (e) => {
    let [x, y] = toWorld(e.clientX, e.clientY);
    const r = Math.hypot(x, y);
    if (r > 0.7) { x *= 0.7 / r; y *= 0.7 / r; }
    state.lightTarget.x = x;
    state.lightTarget.y = y;
  });
  addEventListener('pointerdown', onStart);
}

// Las flechas se sostienen: el cambio es gradual, como un gesto.
export function updateHeld(dt) {
  const r = 0.35 * dt;
  const clamp = (v) => Math.min(1, Math.max(0, v));
  if (held.has('ArrowUp')) state.abrazo = clamp(state.abrazo + r);
  if (held.has('ArrowDown')) state.abrazo = clamp(state.abrazo - r);
  if (held.has('ArrowRight')) state.tempo = clamp(state.tempo + r);
  if (held.has('ArrowLeft')) state.tempo = clamp(state.tempo - r);

  // WASD: la luz recorre el salón y la pareja la sigue bailando.
  const m = 0.55 * dt;
  const L = state.lightTarget;
  if (held.has('KeyW')) L.y -= m;
  if (held.has('KeyS')) L.y += m;
  if (held.has('KeyA')) L.x -= m;
  if (held.has('KeyD')) L.x += m;
  const lr = Math.hypot(L.x, L.y);
  if (lr > 0.7) { L.x *= 0.7 / lr; L.y *= 0.7 / lr; }

  // Q sostenida: se sueltan. Al soltar la tecla, vuelven a buscarse.
  state.releaseHeld = held.has('KeyQ');
}
