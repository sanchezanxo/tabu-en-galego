// storage.js — wrapper mínimo sobre localStorage.

const CLAVE_ESTADO = 'tabu-galego-estado-v1';
const CLAVE_ORGANIZADOR = 'tabu-galego-organizador';

export function cargarEstado() {
  try {
    const raw = localStorage.getItem(CLAVE_ESTADO);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function gardarEstado(estado) {
  try {
    localStorage.setItem(CLAVE_ESTADO, JSON.stringify(estado));
  } catch (e) {
    console.warn('Non se pode gardar o estado:', e);
  }
}

export function gardarOrganizador(nome) {
  if (nome) localStorage.setItem(CLAVE_ORGANIZADOR, nome);
  else localStorage.removeItem(CLAVE_ORGANIZADOR);
}

export function cargarOrganizador() {
  return localStorage.getItem(CLAVE_ORGANIZADOR) || '';
}
