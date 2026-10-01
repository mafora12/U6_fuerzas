import { state, tap, FIGURAS } from './state.js';

// Teclas que se sostienen: flechas (abrazo, tempo) y Q (soltarse).
const HELD = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyQ'];
const FIG_KEYS = { KeyW: 'W', KeyA: 'A', KeyS: 'S', KeyD: 'D' };
const held = new Set();

export function initControls({ audio, hud, onStart }) {
  addEventListener('keydown', (e) => {
    onStart();
    if (HELD.includes(e.code)) {
      held.add(e.code);
      e.preventDefault();
      return;
    }
    if (e.repeat) return;

    // W A S D: elegir figura de baile.
    if (FIG_KEYS[e.code]) {
      const f = FIG_KEYS[e.code];
      if (state.figura !== f) {
        state.figura = f;
        hud.notify(FIGURAS[f], 2);
      }
      return;
    }

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
      case 'KeyF':
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen().catch(() => {});
        break;
      case 'KeyH':
        hud.toggle();
        break;
    }
  });

  addEventListener('keyup', (e) => held.delete(e.code));
  addEventListener('blur', () => held.clear());
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

  // Q sostenida: se sueltan. Al soltar la tecla, vuelven a buscarse.
  state.releaseHeld = held.has('KeyQ');
}
