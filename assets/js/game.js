// game.js — lóxica do xogo. Mantemos todas as operacións sobre `estado`
// centralizadas aquí para que a UI só teña que chamar e re-renderizar.

export function crearEquipos(n) {
  return Array.from({ length: n }, (_, i) => ({
    nome: `Equipo ${i + 1}`,
    puntos: 0,
    acertos: [],
    prohibidas: [],
    saltos: []
  }));
}

export function crearPartida(config, palabras) {
  const dispoñibles = filtrarPorNivel(palabras, config.nivel);
  const mazoInicial = dispoñibles.slice();
  return {
    id: xerarUuid(),
    inicio: Date.now(),
    fin: null,
    equipoActivo: 0,
    rolda: 1,
    mazoInicial,
    mazo: mesturar(dispoñibles.slice()),
    palabraActual: null,
    palabrasDaQuenda: [],
    palabrasXogadas: [],
    saltosUsadosNestaQuenda: 0
  };
}

export function iniciarQuenda(estado) {
  estado.partida.palabrasDaQuenda = [];
  estado.partida.saltosUsadosNestaQuenda = 0;
  if (!estado.partida.palabraActual) {
    seguintePalabra(estado);
  }
  return estado;
}

export function finalizarQuenda(estado) {
  // A palabra activa no momento en que acabou o tempo non se conta (CLAUDE.md §5.2).
  estado.partida.palabraActual = null;
  return estado;
}

export function seguintePalabra(estado) {
  if (estado.partida.mazo.length === 0) {
    estado.partida.mazo = mesturar(estado.partida.mazoInicial.slice());
  }
  estado.partida.palabraActual = estado.partida.mazo.pop();
  return estado.partida.palabraActual;
}

export function acertar(estado, tempoAcertoSeg) {
  const palabra = estado.partida.palabraActual;
  if (!palabra) return estado;
  const equipo = estado.config.equipos[estado.partida.equipoActivo];
  equipo.puntos += 1;
  equipo.acertos.push(palabra.palabra);
  rexistrarXogada(estado, palabra, 'acerto', tempoAcertoSeg);
  seguintePalabra(estado);
  return estado;
}

export function anular(estado) {
  // Invalida a carta sen penalizar nin gastar saltos.
  // Rexístrase como 'anulada' para o resumo da quenda; non conta en stats.
  const palabra = estado.partida.palabraActual;
  if (!palabra) return estado;
  rexistrarXogada(estado, palabra, 'anulada');
  seguintePalabra(estado);
  return estado;
}

export function saltar(estado) {
  const palabra = estado.partida.palabraActual;
  if (!palabra) return estado;
  if (!podeSaltar(estado)) return estado;
  const equipo = estado.config.equipos[estado.partida.equipoActivo];
  equipo.saltos.push(palabra.palabra);
  estado.partida.saltosUsadosNestaQuenda += 1;
  rexistrarXogada(estado, palabra, 'saltada');
  seguintePalabra(estado);
  return estado;
}

export function podeSaltar(estado) {
  return estado.partida.saltosUsadosNestaQuenda < estado.config.saltosPermitidos;
}

export function seguinteEquipo(estado) {
  const n = estado.config.numEquipos;
  estado.partida.equipoActivo = (estado.partida.equipoActivo + 1) % n;
  if (estado.partida.equipoActivo === 0) {
    estado.partida.rolda += 1;
  }
  return estado;
}

export function haiGañador(estado) {
  // Chámase DESPOIS de seguinteEquipo. equipoActivo === 0 indica rolda completa.
  const rolda_completa = estado.partida.equipoActivo === 0;
  if (estado.config.modo === 'puntos') {
    const alguenChegou = estado.config.equipos.some(e => e.puntos >= estado.config.obxectivo);
    return alguenChegou && rolda_completa;
  }
  // modo roldas: rolda incrementouse xa; se supera o obxectivo, remata.
  return estado.partida.rolda > estado.config.obxectivo;
}

export function clasificacion(estado) {
  return estado.config.equipos
    .map((e, i) => ({ ...e, posicion: i + 1 }))
    .sort((a, b) => b.puntos - a.puntos || a.posicion - b.posicion);
}

export function duracionMinutos(estado) {
  const inicio = estado.partida.inicio;
  const fin = estado.partida.fin || Date.now();
  return Math.max(1, Math.round((fin - inicio) / 60000));
}

// ---------- internos ----------

function rexistrarXogada(estado, palabra, resultado, tempo = null) {
  const rexistro = {
    palabra: palabra.palabra,
    resultado,
    equipo: estado.partida.equipoActivo,
    rolda: estado.partida.rolda
  };
  if (tempo != null) rexistro.tempo = Math.round(tempo * 10) / 10;
  estado.partida.palabrasDaQuenda.push(rexistro);
  estado.partida.palabrasXogadas.push(rexistro);
}

function filtrarPorNivel(palabras, nivel) {
  if (nivel === 'mesturado') return palabras.slice();
  return palabras.filter(p => p.nivel === nivel);
}

function mesturar(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function xerarUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}
