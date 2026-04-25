// reporte.js — modal de reporte de palabra mal formada.

import * as api from './api.js';

let palabraActiva = null;
let onPechar = null;
let listenerActivo = false;

function dialogo() { return document.getElementById('dialogo-reporte'); }

export function abrir(palabra, { aoPechar } = {}) {
  const dlg = dialogo();
  if (!dlg) return;

  palabraActiva = palabra;
  onPechar = aoPechar || null;

  dlg.querySelector('[data-zona="reporte-palabra"]').textContent = palabra;
  const estado = dlg.querySelector('[data-zona="reporte-estado"]');
  estado.textContent = '';
  estado.removeAttribute('data-tipo');
  habilitarMotivos(true);

  if (!listenerActivo) atarListeners();
  if (typeof dlg.showModal === 'function') {
    dlg.showModal();
  } else {
    dlg.setAttribute('open', '');
  }
}

export function pechar() {
  const dlg = dialogo();
  if (!dlg) return;
  if (typeof dlg.close === 'function' && dlg.open) {
    dlg.close();
  } else {
    dlg.removeAttribute('open');
  }
  if (typeof onPechar === 'function') onPechar();
}

function habilitarMotivos(estado) {
  dialogo().querySelectorAll('.dialogo__motivo').forEach(b => {
    b.disabled = !estado;
  });
}

async function enviar(motivo) {
  const dlg = dialogo();
  const estado = dlg.querySelector('[data-zona="reporte-estado"]');
  habilitarMotivos(false);
  estado.textContent = 'Enviando…';
  estado.removeAttribute('data-tipo');

  try {
    await api.reportarPalabra({ palabra: palabraActiva, motivo });
    estado.textContent = 'Grazas! Recibimos o teu reporte.';
    estado.dataset.tipo = 'ok';
    setTimeout(() => pechar(), 1100);
  } catch (err) {
    estado.textContent = err?.message || 'Non se puido enviar. Téntao de novo.';
    estado.dataset.tipo = 'erro';
    habilitarMotivos(true);
  }
}

function atarListeners() {
  const dlg = dialogo();
  if (!dlg) return;
  listenerActivo = true;

  dlg.addEventListener('click', (ev) => {
    const motivo = ev.target.closest('[data-motivo]');
    if (motivo) {
      enviar(motivo.dataset.motivo);
      return;
    }
    if (ev.target.closest('[data-accion="pechar-reporte"]')) {
      pechar();
      return;
    }
    // Clic no backdrop: o evento dispárase no propio <dialog>.
    if (ev.target === dlg) pechar();
  });

  dlg.addEventListener('close', () => {
    if (typeof onPechar === 'function') onPechar();
  });
}
