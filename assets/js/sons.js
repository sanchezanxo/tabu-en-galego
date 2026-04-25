// sons.js — sons sintéticos vía Web Audio API. Sen ficheiros.
// Tres efectos: tick (últimos segundos), buzzer (fin de tempo), acerto.

const CLAVE = 'tabu-galego-son';

let ctx = null;
let activado = (localStorage.getItem(CLAVE) ?? 'on') === 'on';

function asegurar() {
  if (!ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function pulse(c, { frecuencia, duracion, tipo = 'sine', volume = 0.22, atraso = 0 }) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = tipo;
  o.frequency.value = frecuencia;
  o.connect(g);
  g.connect(c.destination);
  const t0 = c.currentTime + atraso;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(volume, t0 + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duracion);
  o.start(t0);
  o.stop(t0 + duracion);
}

export function tick() {
  if (!activado) return;
  const c = asegurar();
  if (!c) return;
  pulse(c, { frecuencia: 880, duracion: 0.06, tipo: 'square', volume: 0.16 });
}

export function buzzer() {
  if (!activado) return;
  const c = asegurar();
  if (!c) return;
  pulse(c, { frecuencia: 220, duracion: 0.20, tipo: 'sawtooth', volume: 0.22 });
  pulse(c, { frecuencia: 160, duracion: 0.32, tipo: 'sawtooth', volume: 0.22, atraso: 0.20 });
}

export function acerto() {
  if (!activado) return;
  const c = asegurar();
  if (!c) return;
  pulse(c, { frecuencia: 880,  duracion: 0.12, volume: 0.20 });
  pulse(c, { frecuencia: 1320, duracion: 0.16, volume: 0.20, atraso: 0.07 });
}

export function activo() { return activado; }

export function fixar(novo) {
  activado = !!novo;
  localStorage.setItem(CLAVE, activado ? 'on' : 'off');
  return activado;
}

export function alternar() {
  fixar(!activado);
  if (activado) {
    // Confirmación curta cando se acaba de activar.
    const c = asegurar();
    if (c) pulse(c, { frecuencia: 660, duracion: 0.08, volume: 0.18 });
  }
  return activado;
}
