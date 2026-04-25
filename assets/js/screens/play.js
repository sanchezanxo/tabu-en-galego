import * as xogo from '../game.js';
import { crearTimer } from '../timer.js';
import * as sons from '../sons.js';

let timer = null;
let inicioPalabraMs = 0;
let rootActiva = null;

export function iniciarQuenda(root, estado, { onFinTempo } = {}) {
  rootActiva = root;
  root.classList.remove('modo-aviso');

  if (!estado.partida.palabraActual) {
    xogo.seguintePalabra(estado);
  }
  inicioPalabraMs = performance.now();

  renderMeta(root, estado);
  renderPalabra(root, estado);

  pararTimer();
  timer = crearTimer({
    duracion: estado.config.segundosPorQuenda,
    onTick: (seg) => {
      actualizarTempo(root, seg, estado.config.segundosPorQuenda);
      if (seg > 0 && seg <= 5) sons.tick();
    },
    onWarning: () => root.classList.add('modo-aviso'),
    onEnd: () => {
      pararTimer();
      sons.buzzer();
      onFinTempo && onFinTempo();
    }
  });
  timer.comezar();
}

export function pararTimer() {
  if (timer) {
    timer.parar();
    timer = null;
  }
}

export function pausarTimer() {
  if (timer) timer.pausar();
}

export function retomarTimer() {
  if (timer) timer.retomar();
}

export function accionAcerto(root, estado) {
  if (!estado.partida?.palabraActual) return;
  const tempoS = (performance.now() - inicioPalabraMs) / 1000;
  xogo.acertar(estado, tempoS);
  sons.acerto();
  inicioPalabraMs = performance.now();
  renderPalabra(root, estado);
  renderMeta(root, estado);
}

export function accionSaltar(root, estado) {
  if (!estado.partida?.palabraActual) return;
  if (!xogo.podeSaltar(estado)) return;
  xogo.saltar(estado);
  inicioPalabraMs = performance.now();
  renderPalabra(root, estado);
  renderMeta(root, estado);
}

export function accionAnular(root, estado) {
  if (!estado.partida?.palabraActual) return;
  xogo.anular(estado);
  inicioPalabraMs = performance.now();
  renderPalabra(root, estado);
  renderMeta(root, estado);
}

// ---------- render ----------

function renderPalabra(root, estado) {
  const palabra = estado.partida.palabraActual;
  if (!palabra) return;
  root.querySelector('.tarxeta-palabra__principal').textContent = palabra.palabra;
  root.querySelector('.tarxeta-palabra__nivel').textContent =
    `${nomeNivel(palabra.nivel)} · ${palabra.categoria}`;
  const lista = root.querySelector('.lista-prohibidas');
  lista.innerHTML = palabra.prohibidas
    .map(p => `<li>${escapar(p)}</li>`)
    .join('');
}

function renderMeta(root, estado) {
  const equipo = estado.config.equipos[estado.partida.equipoActivo];
  const saltosPermitidos = estado.config.saltosPermitidos;
  const saltosRestantes = saltosPermitidos - estado.partida.saltosUsadosNestaQuenda;

  const metaEquipo = root.querySelector('.xogo-meta__equipo');
  metaEquipo.innerHTML = `${escapar(equipo.nome)} · <strong>${equipo.puntos}</strong> pts`;

  const metaSaltos = root.querySelector('.xogo-meta__saltos');
  if (metaSaltos) {
    if (saltosPermitidos === 0) {
      metaSaltos.hidden = true;
    } else {
      metaSaltos.hidden = false;
      metaSaltos.textContent = `Saltos: ${saltosRestantes}`;
    }
  }

  const btnSaltar = root.querySelector('[data-accion="saltar"]');
  if (btnSaltar) {
    if (saltosPermitidos === 0) {
      btnSaltar.hidden = true;
    } else {
      btnSaltar.hidden = false;
      btnSaltar.disabled = !xogo.podeSaltar(estado);
    }
  }
}

function actualizarTempo(root, seg, duracionTotal) {
  const mm = Math.floor(seg / 60);
  const ss = seg % 60;
  const tempoEl = root.querySelector('.xogo-meta__tempo');
  if (tempoEl) tempoEl.textContent = `${mm}:${ss.toString().padStart(2, '0')}`;
  const pct = Math.max(0, (seg / duracionTotal) * 100);
  const barra = root.querySelector('.barra-tempo__enchida');
  if (barra) barra.style.width = pct + '%';
}

function nomeNivel(nivel) {
  return { facil: 'fácil', medio: 'medio', dificil: 'difícil' }[nivel] || nivel;
}

function escapar(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}
