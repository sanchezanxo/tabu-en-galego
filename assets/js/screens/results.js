import * as xogo from '../game.js';
import * as api from '../api.js';

const ESTADO_ENVIO = new WeakMap(); // estado.partida → { enviada: boolean }

export function render(root, estado) {
  const clasif = xogo.clasificacion(estado);
  const ganador = clasif[0];

  const subtitulo = root.querySelector('.pantalla__cabeceira .subtitulo');
  if (subtitulo) subtitulo.textContent = `Parabéns, ${ganador.nome}!`;

  const podio = root.querySelector('.podio');
  if (podio) {
    podio.innerHTML = '';
    clasif.forEach((e, i) => {
      const li = document.createElement('li');
      li.className = 'podio__posto' + (i === 0 ? ' podio__posto--primeiro' : '');
      li.append(
        crearSpan('podio__num', String(i + 1)),
        crearSpan('podio__nome', e.nome),
        crearSpan('podio__puntos', `${e.puntos} pts`)
      );
      podio.appendChild(li);
    });
  }

  const totalAcertos = estado.config.equipos.reduce((a, e) => a + e.acertos.length, 0);
  const totalSaltos  = estado.config.equipos.reduce((a, e) => a + e.saltos.length, 0);
  const dds = root.querySelectorAll('.stats-partida dd');
  if (dds[0]) dds[0].textContent = totalAcertos;
  if (dds[1]) dds[1].textContent = totalSaltos;
  if (dds[2]) dds[2].textContent = xogo.duracionMinutos(estado) + ' min';

  prepararConsentimento(root, estado);
}

function prepararConsentimento(root, estado) {
  const zona = root.querySelector('[data-zona="ranking-consentimento"]');
  const check = root.querySelector('[data-zona="ranking-check"]');
  const boton = root.querySelector('[data-accion="enviar-ranking"]');
  const estadoEl = root.querySelector('[data-zona="ranking-estado"]');
  if (!zona || !check || !boton || !estadoEl) return;

  // Reset visual cada vez que se abre a pantalla.
  check.checked = false;
  boton.disabled = true;
  boton.textContent = 'Gardar';
  estadoEl.textContent = '';
  estadoEl.removeAttribute('data-tipo');
  zona.hidden = false;

  // Se xa se enviou para esta partida, evitar dobre envío.
  if (estado.partida && ESTADO_ENVIO.get(estado.partida)?.enviada) {
    boton.disabled = true;
    boton.textContent = 'Gardado';
    check.checked = true;
    check.disabled = true;
    estadoEl.textContent = 'Esta partida xa está no ranking.';
    estadoEl.dataset.tipo = 'ok';
    return;
  }

  // Conectar checkbox cun listener específico (evitar duplicados ao re-render).
  check.onchange = () => {
    boton.disabled = !check.checked;
  };

  boton.onclick = async () => {
    if (!check.checked) return;
    boton.disabled = true;
    estadoEl.textContent = 'Gardando…';
    estadoEl.dataset.tipo = 'pendente';

    try {
      const carga = api.construirCargaPartida(estado);
      await api.enviarPartida(carga);
      ESTADO_ENVIO.set(estado.partida, { enviada: true });
      boton.textContent = 'Gardado';
      check.disabled = true;
      estadoEl.textContent = 'Gardado correctamente. Grazas por contribuír!';
      estadoEl.dataset.tipo = 'ok';
    } catch (err) {
      boton.disabled = false;
      const msx = err?.codigo === 'DUPLICADO'
        ? 'Esta partida xa estaba gardada.'
        : (err?.message || 'Non se puido gardar. Téntao de novo.');
      estadoEl.textContent = msx;
      estadoEl.dataset.tipo = 'erro';
    }
  };
}

function crearSpan(clase, texto) {
  const s = document.createElement('span');
  s.className = clase;
  s.textContent = texto;
  return s;
}
