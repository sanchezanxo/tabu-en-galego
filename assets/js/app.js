// app.js — orquestador. Router de pantallas + manexo global de accións.

import * as almacen from './storage.js';
import * as xogo from './game.js';
import * as home from './screens/home.js';
import * as setup from './screens/setup.js';
import * as play from './screens/play.js';
import * as turnEnd from './screens/turn-end.js';
import * as results from './screens/results.js';
import * as ranking from './screens/ranking.js';
import * as segmento from './segmento.js';
import * as sons from './sons.js';
import * as reporte from './reporte.js';

const PANTALLAS = ['home', 'setup', 'play', 'turn-end', 'results', 'ranking', 'como-se-xoga', 'legal'];
const POR_DEFECTO = 'home';

let estado = almacen.cargarEstado() || estadoBaleiro();
let palabras = [];

function estadoBaleiro() {
  return { config: null, partida: null, pantalla: 'home' };
}

async function cargarPalabras() {
  const resp = await fetch('/data/palabras.json', { cache: 'no-cache' });
  if (!resp.ok) throw new Error('Non se puideron cargar as palabras');
  const json = await resp.json();
  palabras = json.palabras || [];
}

function gardar() {
  almacen.gardarEstado(estado);
}

function raizDe(pantalla) {
  return document.querySelector(`.pantalla[data-pantalla="${pantalla}"]`);
}

function irA(nome) {
  if (!PANTALLAS.includes(nome)) nome = POR_DEFECTO;

  // Parar o temporizador sempre que saiamos de play
  if (nome !== 'play') play.pararTimer();

  // Redireccións se o estado non permite a pantalla
  if (nome === 'play' && (!estado.config || !estado.partida)) nome = 'setup';
  if (nome === 'turn-end' && !estado.partida) nome = 'home';
  if (nome === 'results' && !estado.config) nome = 'home';

  const root = raizDe(nome);
  if (!root) return;

  // Hidratar contido con estado real antes de mostrar
  switch (nome) {
    case 'home':     home.render(root, estado); break;
    case 'setup':    setup.render(root, estado); break;
    case 'play':     play.iniciarQuenda(root, estado, { onFinTempo: finalizarQuendaPorTempo }); break;
    case 'turn-end': turnEnd.render(root, estado); break;
    case 'results':  results.render(root, estado); break;
    case 'ranking':  ranking.render(root); break;
  }

  // Conmutar visibilidade
  document.querySelectorAll('.pantalla').forEach((el) => {
    el.hidden = el.dataset.pantalla !== nome;
  });
  document.body.dataset.pantallaActiva = nome;

  // Activar indicadores dos segmented controls da pantalla activa.
  requestAnimationFrame(() => segmento.activar(root));

  const hashNovo = '#' + nome;
  if (location.hash !== hashNovo) history.replaceState(null, '', hashNovo);
  window.scrollTo(0, 0);

  const heading = root.querySelector('h1, h2');
  if (heading) {
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }

  estado.pantalla = nome;
  gardar();

  // GA4: rexistro de cambio de pantalla (SPA, hash routes).
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_title: 'Tabú · ' + nome,
      page_location: location.origin + '/#' + nome,
      page_path: '/#' + nome
    });
  }
}

function finalizarQuendaPorTempo() {
  xogo.finalizarQuenda(estado);
  gardar();
  irA('turn-end');
}

// ---------- accións ----------

const accions = {
  'continuar-partida'() {
    irA('play');
  },

  'empezar-partida'() {
    if (!palabras.length) return alert('Aínda non se cargaron as palabras.');
    const config = setup.capturarConfig(raizDe('setup'));
    config.equipos = xogo.crearEquipos(config.numEquipos);
    estado.config = config;
    estado.partida = xogo.crearPartida(config, palabras);
    xogo.iniciarQuenda(estado);
    if (config.organizador) almacen.gardarOrganizador(config.organizador);
    gardar();
    irA('play');
  },

  'acerto'() {
    play.accionAcerto(raizDe('play'), estado);
    gardar();
  },

  'saltar'() {
    play.accionSaltar(raizDe('play'), estado);
    gardar();
  },

  'anular'() {
    play.accionAnular(raizDe('play'), estado);
    gardar();
  },

  'seguinte-equipo'() {
    xogo.seguinteEquipo(estado);
    if (xogo.haiGañador(estado)) {
      estado.partida.fin = Date.now();
      gardar();
      return irA('results');
    }
    estado.partida.palabraActual = null;
    xogo.iniciarQuenda(estado);
    gardar();
    irA('play');
  },

  'rematar-partida'() {
    if (estado.partida) estado.partida.fin = Date.now();
    gardar();
    irA('results');
  },

  'rematar-desde-play'() {
    if (!confirm('Queres rematar a partida agora? Calcularemos o gañador cos puntos actuais.')) return;
    play.pararTimer();
    if (estado.partida) {
      estado.partida.palabraActual = null;
      estado.partida.fin = Date.now();
    }
    gardar();
    irA('results');
  },

  'nova-partida'() {
    estado.config = null;
    estado.partida = null;
    gardar();
    irA('setup');
  },

  'volver-home'() {
    irA('home');
  },

  'alternar-son'() {
    const novoActivo = sons.alternar();
    actualizarBotonSon(novoActivo);
  },

  'abrir-reporte'() {
    const palabra = estado.partida?.palabraActual?.palabra;
    if (!palabra) return;
    play.pausarTimer();
    reporte.abrir(palabra, { aoPechar: () => play.retomarTimer() });
  },

  'pechar-reporte'() {
    reporte.pechar();
  }
};

function actualizarBotonSon(estaActivo) {
  // aria-pressed=true = mute activo (son OFF). false = son ON.
  document.querySelectorAll('[data-accion="alternar-son"]').forEach((b) => {
    b.setAttribute('aria-pressed', estaActivo ? 'false' : 'true');
  });
}

// Sincronizar o estado inicial dos botóns mute coa preferencia gardada.
document.addEventListener('DOMContentLoaded', () => actualizarBotonSon(sons.activo()));

document.addEventListener('click', (ev) => {
  const obxectivo = ev.target.closest('[data-accion], [data-ir-a]');
  if (!obxectivo) return;
  const accion = obxectivo.dataset.accion;
  if (accion && accions[accion]) {
    ev.preventDefault();
    accions[accion]();
    return;
  }
  if (obxectivo.dataset.irA) {
    ev.preventDefault();
    irA(obxectivo.dataset.irA);
  }
});

// Atallos de teclado na pantalla play
document.addEventListener('keydown', (ev) => {
  if (document.body.dataset.pantallaActiva !== 'play') return;
  if (ev.target instanceof HTMLInputElement) return;
  const teclas = {
    'ArrowRight': 'acerto',
    ' ':          'acerto',
    'Enter':      'acerto',
    'ArrowLeft':  'saltar',
    'ArrowDown':  'saltar',
    'ArrowUp':    'saltar'
  };
  const accion = teclas[ev.key];
  if (accion && accions[accion]) {
    ev.preventDefault();
    accions[accion]();
  }
});

window.addEventListener('hashchange', () => {
  const nome = location.hash.replace(/^#/, '') || POR_DEFECTO;
  irA(nome);
});

(async () => {
  try {
    await cargarPalabras();
  } catch (e) {
    console.error(e);
  }
  const inicial = location.hash.replace(/^#/, '') || estado.pantalla || POR_DEFECTO;
  irA(inicial);
})();
