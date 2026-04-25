// api.js — cliente das chamadas ao backend PHP.

const BASE = '/api';
let csrfToken = null;

async function pedir(ruta, opcions = {}) {
  const resp = await fetch(BASE + ruta, {
    credentials: 'include',
    ...opcions
  });
  let json = null;
  try { json = await resp.json(); } catch { /* sen JSON */ }
  if (!resp.ok || !json || json.ok === false) {
    const erro = (json && json.erro) || `Erro ${resp.status}`;
    const codigo = (json && json.codigo) || 'HTTP_' + resp.status;
    throw Object.assign(new Error(erro), { codigo, status: resp.status });
  }
  return json.datos || {};
}

export async function obterToken() {
  const datos = await pedir('/token');
  csrfToken = datos.csrf || null;
  return csrfToken;
}

async function asegurarToken() {
  if (!csrfToken) await obterToken();
  return csrfToken;
}

export async function enviarPartida(carga) {
  const token = await asegurarToken();
  return pedir('/game-end', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': token
    },
    body: JSON.stringify(carga)
  });
}

export async function obterRanking({ periodo = 'todo', top = 20 } = {}) {
  const params = new URLSearchParams({ periodo, top: String(top) });
  return pedir('/ranking?' + params.toString());
}

export async function obterStats() {
  return pedir('/stats');
}

export async function reportarPalabra({ palabra, motivo, detalle = '' }) {
  const token = await asegurarToken();
  return pedir('/report-word', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': token
    },
    body: JSON.stringify({ palabra, motivo, detalle })
  });
}

// Constrúe o payload de game-end a partir do estado interno.
export function construirCargaPartida(estado) {
  const cfg = estado.config;
  const par = estado.partida;
  return {
    id: par.id,
    organizador: cfg.organizador || null,
    config: {
      num_equipos: cfg.numEquipos,
      nivel: cfg.nivel,
      modo: cfg.modo,
      obxectivo: cfg.obxectivo,
      segundos_quenda: cfg.segundosPorQuenda
    },
    inicio: par.inicio,
    fin: par.fin || Date.now(),
    equipos: cfg.equipos.map(e => ({
      nome: e.nome,
      puntos: e.puntos,
      acertos: e.acertos,
      prohibidas: e.prohibidas,
      saltos: e.saltos
    })),
    palabras: (par.palabrasXogadas || []).map(p => ({
      palabra: p.palabra,
      resultado: p.resultado,
      tempo: p.tempo ?? null
    }))
  };
}
