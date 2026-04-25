import { cargarOrganizador } from '../storage.js';

export function render(root, estado) {
  const organizadorInput = root.querySelector('input[name="organizador"]');
  if (organizadorInput && !organizadorInput.value) {
    organizadorInput.value = estado?.config?.organizador || cargarOrganizador();
  }
}

export function capturarConfig(root) {
  const form = root.querySelector('.formulario-setup');
  const fd = new FormData(form);
  return {
    numEquipos: Number(fd.get('equipos') || 3),
    segundosPorQuenda: Number(fd.get('segundos') || 90),
    nivel: fd.get('nivel') || 'mesturado',
    modo: 'roldas',
    obxectivo: Number(fd.get('obxectivo') || 5),
    saltosPermitidos: 3,
    organizador: String(fd.get('organizador') || '').trim().slice(0, 60)
  };
}
