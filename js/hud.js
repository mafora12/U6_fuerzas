// Mini ventana (tecla H) que recuerda los controles durante la presentación.
const CONTROLES = [
  ['Espacio', 'el “1” del compás'],
  ['↑ ↓', 'abrazo'],
  ['← →', 'tempo'],
  ['W A S D', 'llevarlos por el salón'],
  ['Mouse', 'la luz del salón'],
  ['Q', 'sostener: se sueltan'],
  ['E', 'Emily aparece / se va'],
  ['Tab', 'noche ↔ salón dorado'],
  ['Enter', 'música'],
  ['R', 'reiniciar música'],
  ['F', 'pantalla completa'],
  ['H', 'mostrar / ocultar'],
];

export class Hud {
  constructor() {
    this.el = document.getElementById('hud');
    this.aviso = document.getElementById('aviso');
    this.avisoTimer = 0;
    this.musicaOk = null;
    this.el.innerHTML = `
      <div class="titulo">Controles</div>
      <dl>${CONTROLES.map(([k, d]) => `<dt><kbd>${k}</kbd></dt><dd>${d}</dd>`).join('')}</dl>
      <div class="nota" hidden>Falta la música: assets/musica.mp3</div>
    `;
    this.nota = this.el.querySelector('.nota');
  }

  toggle() {
    this.el.classList.toggle('oculto');
  }

  notify(msg, secs = 4) {
    this.aviso.textContent = msg;
    this.aviso.classList.add('visible');
    clearTimeout(this.avisoTimer);
    this.avisoTimer = setTimeout(() => this.aviso.classList.remove('visible'), secs * 1000);
  }

  // Solo actualiza el aviso de la música cuando cambia.
  update(st, audio, musicaOk) {
    if (musicaOk === this.musicaOk) return;
    this.musicaOk = musicaOk;
    this.nota.hidden = musicaOk;
  }
}
