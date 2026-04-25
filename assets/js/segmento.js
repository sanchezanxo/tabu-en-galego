// segmento.js — anima o indicador branco dos segmented controls (.chip-grupo).
// Crea un <span> absoluto que se desliza ao chip activo con transform.

const PROCESADO = 'segmentoListo';

export function activar(root = document) {
  root.querySelectorAll('.chip-grupo').forEach(grupo => {
    if (grupo.dataset[PROCESADO] === '1') {
      colocar(grupo, /*animar=*/false);
      return;
    }
    grupo.dataset[PROCESADO] = '1';

    const indicador = document.createElement('span');
    indicador.className = 'chip-grupo__indicador';
    indicador.setAttribute('aria-hidden', 'true');
    grupo.prepend(indicador);

    grupo.addEventListener('change', () => colocar(grupo, true));
    grupo.addEventListener('click', (ev) => {
      // Para botóns (filtros do ranking) que non son inputs.
      if (ev.target.closest('button[data-periodo]')) {
        // O propio handler do ranking marca .is-activo; despois colocamos.
        requestAnimationFrame(() => colocar(grupo, true));
      }
    });

    // Posición inicial sen animación.
    colocar(grupo, /*animar=*/false);
  });
}

function colocar(grupo, animar) {
  const indicador = grupo.querySelector(':scope > .chip-grupo__indicador');
  if (!indicador) return;

  const activo = grupo.querySelector('.chip:has(input:checked)')
              || grupo.querySelector('button.is-activo');

  if (!activo) {
    indicador.hidden = true;
    return;
  }

  const rectGrupo = grupo.getBoundingClientRect();
  const rectChip  = activo.getBoundingClientRect();
  const x = rectChip.left - rectGrupo.left;
  const w = rectChip.width;

  if (!animar) {
    const previo = indicador.style.transition;
    indicador.style.transition = 'none';
    indicador.style.transform = `translateX(${x}px)`;
    indicador.style.width = w + 'px';
    indicador.hidden = false;
    // Forzar reflow e restaurar transición.
    void indicador.offsetWidth;
    indicador.style.transition = previo;
  } else {
    indicador.style.transform = `translateX(${x}px)`;
    indicador.style.width = w + 'px';
    indicador.hidden = false;
  }
}

// Re-colocar todos os indicadores ao redimensionar a xanela.
let raf = null;
window.addEventListener('resize', () => {
  if (raf) cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => {
    document.querySelectorAll('.chip-grupo').forEach(g => colocar(g, false));
  });
});
