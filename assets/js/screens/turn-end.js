export function render(root, estado) {
  const equipo = estado.config.equipos[estado.partida.equipoActivo];
  const delta = calcularDelta(estado.partida.palabrasDaQuenda);

  const subtitulo = root.querySelector('.pantalla__cabeceira .subtitulo');
  if (subtitulo) subtitulo.textContent = equipo.nome;

  const puntosEl = root.querySelector('.resumo-quenda__puntos');
  if (puntosEl) puntosEl.textContent = (delta >= 0 ? '+' : '') + delta;

  const lista = root.querySelector('.lista-resumo');
  if (!lista) return;

  if (estado.partida.palabrasDaQuenda.length === 0) {
    lista.innerHTML = `<li class="lista-resumo__baleira">Non se xogaron palabras nesta quenda.</li>`;
    return;
  }

  lista.innerHTML = estado.partida.palabrasDaQuenda.map((entry) => {
    const cls = entry.resultado === 'acerto' ? 'acerto'
              : entry.resultado === 'prohibida' ? 'prohibida'
              : entry.resultado === 'anulada' ? 'anulada'
              : 'saltada';
    const icona = entry.resultado === 'acerto' ? '✓'
                : entry.resultado === 'prohibida' ? '✗'
                : entry.resultado === 'anulada' ? '⊘'
                : '→';
    return `<li class="lista-resumo__item lista-resumo__item--${cls}">
      <span class="lista-resumo__icona" aria-hidden="true">${icona}</span>
      <span>${escapar(entry.palabra)}</span>
    </li>`;
  }).join('');
}

function calcularDelta(palabrasDaQuenda) {
  return palabrasDaQuenda.reduce((acc, e) => {
    if (e.resultado === 'acerto') return acc + 1;
    if (e.resultado === 'prohibida') return acc - 1;
    return acc;
  }, 0);
}

function escapar(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}
