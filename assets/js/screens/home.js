export function render(root, estado) {
  const haiEnCurso = !!(estado?.partida && !estado.partida.fin);
  const btnContinuar = root.querySelector('[data-accion="continuar-partida"]');
  const btnComezar = root.querySelector('[data-ir-a="setup"]');
  if (btnContinuar) btnContinuar.hidden = !haiEnCurso;
  if (btnComezar) btnComezar.textContent = haiEnCurso ? 'Nova partida' : 'Comezar partida';
}
