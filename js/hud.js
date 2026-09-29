import { SCORE, sectionAt } from './score.js';

const fmt = (s) => {
  s = Math.max(0, s | 0);
  return `${(s / 60) | 0}:${String(s % 60).padStart(2, '0')}`;
};

// Panel de guía (tecla H): tiempo de la música, pasaje del score y estado de los controles.
export class Hud {
  constructor() {
    this.el = document.getElementById('hud');
    this.aviso = document.getElementById('aviso');
    this.next = 0;
    this.avisoTimer = 0;
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

  update(st, audio, musicaOk) {
    const now = performance.now();
    if (this.el.classList.contains('oculto') || now < this.next) return;
    this.next = now + 100;

    const time = audio.currentTime || 0;
    const k = sectionAt(time);
    const sec = SCORE[k];
    const sig = SCORE[k + 1];
    const bar = (v) => `<div class="barra"><i style="width:${Math.round(v * 100)}%"></i></div>`;

    this.el.innerHTML = `
      <div class="tiempo">${fmt(time)}${audio.paused ? ' · pausa' : ''}</div>
      ${musicaOk ? '' : '<div class="nota">Falta la música: assets/musica.mp3</div>'}
      <div class="seccion">${sec.titulo}</div>
      <div class="nota">${sec.musica}</div>
      <div>${sec.hacer}</div>
      ${sig ? `<div class="siguiente">En ${fmt(sig.t - time)}: ${sig.titulo}</div>` : ''}
      <div class="barras">
        <span>abrazo</span>${bar(st.abrazo)}
        <span>tempo</span>${bar(st.tempo)}
        <span>Emily</span>${bar(st.emily)}
        <span>salón</span>${bar(st.mundo)}
        <span>paso</span>${bar(Math.min(1, st.pulse))}
      </div>
      <div class="siguiente">${st.compases ? `${st.compases.toFixed(0)} compases/min` : 'Espacio en el 1 del compás'}</div>
    `;
  }
}
