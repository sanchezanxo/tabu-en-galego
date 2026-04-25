import * as api from '../api.js';

let periodoActivo = 'semana';

export async function render(root) {
  const lista = root.querySelector('[data-zona="ranking-lista"]');
  const mensaxe = root.querySelector('[data-zona="ranking-mensaxe"]');

  // Botóns de período (só atar listener unha vez).
  const filtros = root.querySelectorAll('.chip--boton[data-periodo]');
  filtros.forEach((btn) => {
    if (btn.dataset.atado) return;
    btn.dataset.atado = '1';
    btn.addEventListener('click', async () => {
      filtros.forEach((b) => {
        const activo = b === btn;
        b.classList.toggle('is-activo', activo);
        b.setAttribute('aria-selected', activo ? 'true' : 'false');
      });
      periodoActivo = btn.dataset.periodo;
      await cargarRanking(lista, mensaxe);
    });
  });

  // Estado inicial visible.
  filtros.forEach((b) => {
    const activo = b.dataset.periodo === periodoActivo;
    b.classList.toggle('is-activo', activo);
    b.setAttribute('aria-selected', activo ? 'true' : 'false');
  });

  await Promise.all([
    cargarRanking(lista, mensaxe),
    cargarStats(root)
  ]);
}

async function cargarRanking(lista, mensaxe) {
  if (!lista) return;
  lista.innerHTML = '';
  if (mensaxe) mensaxe.textContent = 'Cargando ranking…';

  try {
    const datos = await api.obterRanking({ periodo: periodoActivo, top: 20 });
    if (!datos.ranking || datos.ranking.length === 0) {
      if (mensaxe) mensaxe.textContent = 'Aínda non hai partidas neste período.';
      return;
    }
    if (mensaxe) mensaxe.textContent = '';
    datos.ranking.forEach((entrada, i) => {
      const li = document.createElement('li');
      li.className = 'ranking-item' + (i === 0 ? ' ranking-item--primeiro' : '');

      const pos = document.createElement('span');
      pos.className = 'ranking-item__pos';
      pos.textContent = (i + 1) + '.';

      const corpo = document.createElement('div');
      corpo.className = 'ranking-item__corpo';

      const nome = document.createElement('span');
      nome.className = 'ranking-item__nome';
      nome.textContent = entrada.nome;
      corpo.appendChild(nome);

      const meta = document.createElement('span');
      meta.className = 'ranking-item__meta';
      const partes = [];
      if (entrada.organizador) partes.push('org. ' + entrada.organizador);
      if (entrada.nivel) partes.push(formatarNivel(entrada.nivel));
      partes.push(formatarData(entrada.data));
      meta.textContent = partes.join(' · ');
      corpo.appendChild(meta);

      const puntos = document.createElement('span');
      puntos.className = 'ranking-item__puntos';
      puntos.textContent = entrada.puntos + ' pts';

      li.append(pos, corpo, puntos);
      lista.appendChild(li);
    });
  } catch (err) {
    if (mensaxe) mensaxe.textContent = `Non se puido cargar o ranking: ${err.message}`;
  }
}

async function cargarStats(root) {
  const resumo = root.querySelector('[data-zona="stats-resumen"]');
  try {
    const datos = await api.obterStats();
    if (resumo) {
      const t = datos.totais || {};
      resumo.textContent = `${t.partidas || 0} partidas xogadas · ${t.palabras || 0} palabras con datos.`;
    }
    encherListaTaxa(root.querySelector('[data-zona="stats-mais-acertadas"]'),  datos.masAcertadas);
    encherListaTaxa(root.querySelector('[data-zona="stats-menos-acertadas"]'), datos.menosAcertadas);
  } catch (err) {
    if (resumo) resumo.textContent = `Non se puideron cargar as estatísticas: ${err.message}`;
  }
}

function encherListaTaxa(contedor, filas) {
  if (!contedor) return;
  contedor.innerHTML = '';
  if (!filas || !filas.length) {
    contedor.innerHTML = '<p class="stats-vacio">Sen datos abondo aínda.</p>';
    return;
  }
  const ul = document.createElement('ul');
  ul.className = 'stats-lista';
  filas.forEach((f) => {
    const pct = Math.round((f.taxa || 0) * 100);
    const li = document.createElement('li');
    li.className = 'stats-item';

    const nome = document.createElement('span');
    nome.className = 'stats-item__nome';
    nome.textContent = f.palabra;

    const barra = document.createElement('span');
    barra.className = 'stats-item__barra';
    const enchida = document.createElement('span');
    enchida.className = 'stats-item__enchida';
    enchida.style.width = pct + '%';
    barra.appendChild(enchida);

    const valor = document.createElement('span');
    valor.className = 'stats-item__valor';
    valor.textContent = pct + '%';

    li.append(nome, barra, valor);
    ul.appendChild(li);
  });
  contedor.appendChild(ul);
}

function formatarNivel(nivel) {
  return ({ facil: 'fácil', medio: 'medio', dificil: 'difícil', mesturado: 'mestura' })[nivel] || nivel;
}

function formatarData(s) {
  if (!s) return '';
  // s vén como "YYYY-MM-DD HH:MM:SS" (UTC).
  const ms = Date.parse(s.replace(' ', 'T') + 'Z');
  if (Number.isNaN(ms)) return s;
  const d = new Date(ms);
  return d.toLocaleDateString('gl-ES', { day: 'numeric', month: 'short' });
}
