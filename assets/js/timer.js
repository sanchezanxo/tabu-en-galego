// timer.js — temporizador preciso baseado en performance.now().
// Pausa automaticamente se a pestana perde o foco.

export function crearTimer({ duracion, onTick, onWarning, onEnd, avisoSeg = 10 }) {
  let idRaf = null;
  let inicio = 0;
  let acumuladoS = 0;
  let pausado = false;
  let parouDefinitivamente = false;
  let xaAvisouLimiar = false;
  let ultimoSegEmitido = -1;

  function tick() {
    if (pausado || parouDefinitivamente) return;
    const agoraMs = performance.now();
    const transcurridoS = acumuladoS + (agoraMs - inicio) / 1000;
    const segRestantes = Math.max(0, Math.ceil(duracion - transcurridoS));

    if (segRestantes !== ultimoSegEmitido) {
      ultimoSegEmitido = segRestantes;
      onTick && onTick(segRestantes);
    }

    if (!xaAvisouLimiar && segRestantes <= avisoSeg && segRestantes > 0) {
      xaAvisouLimiar = true;
      onWarning && onWarning(segRestantes);
    }

    if (segRestantes <= 0) {
      parar();
      onEnd && onEnd();
      return;
    }
    idRaf = requestAnimationFrame(tick);
  }

  function comezar() {
    parouDefinitivamente = false;
    pausado = false;
    xaAvisouLimiar = false;
    ultimoSegEmitido = -1;
    acumuladoS = 0;
    inicio = performance.now();
    cancelarFrame();
    onTick && onTick(duracion);
    idRaf = requestAnimationFrame(tick);
    document.addEventListener('visibilitychange', onVisibilidade);
  }

  function pausar() {
    if (pausado || parouDefinitivamente) return;
    pausado = true;
    acumuladoS += (performance.now() - inicio) / 1000;
    cancelarFrame();
  }

  function retomar() {
    if (!pausado || parouDefinitivamente) return;
    pausado = false;
    inicio = performance.now();
    idRaf = requestAnimationFrame(tick);
  }

  function parar() {
    parouDefinitivamente = true;
    pausado = true;
    cancelarFrame();
    document.removeEventListener('visibilitychange', onVisibilidade);
  }

  function cancelarFrame() {
    if (idRaf !== null) {
      cancelAnimationFrame(idRaf);
      idRaf = null;
    }
  }

  function onVisibilidade() {
    if (document.visibilityState === 'hidden') pausar();
    else retomar();
  }

  return { comezar, pausar, retomar, parar };
}
