async function runHeldLevelIntroChecks(ctx, { reloadRole }) {
  console.log('[held intro] enable option and start');
  const roles = ['writer1', 'writer2', 'spectator', 'musa1', 'musa2', 'actor1'];
  const assertCards = async (visible) => {
    for (const role of roles) {
      await ctx.waitFor(`explanation ${visible ? 'visible' : 'dismissed'} in ${role}`, () => ctx.evaluate(role, () => {
        const root = document.getElementById('level_transition');
        const panel = root?.querySelector('.level-transition__panel');
        if (!root?.classList.contains('is-visible')) return false;
        // A visible class alone is insufficient: the legacy CSS animations
        // faded to opacity zero after seven seconds while waiting for Control.
        const rootStyle = getComputedStyle(root);
        const panelStyle = getComputedStyle(panel);
        return rootStyle.visibility === 'visible' && Number(rootStyle.opacity) > 0.9 && Number(panelStyle.opacity) > 0.9;
      }).then((value) => value === visible), 15000);
    }
  };
  await ctx.click('control', '#pausa_explicacion_niveles');
  const saved = await ctx.evaluate('control', () => new Promise((resolve) => {
    const connection = window.eval('socket');
    connection.once('control_estado', resolve);
    connection.emit('pedir_estado_control');
  }));
  ctx.assert(saved.parametros.pausa_explicacion_niveles === 1, 'intro option is persisted by server');
  await ctx.fillValue('control', '#frase_final_j1', 'Final azul de prueba');
  await ctx.fillValue('control', '#frase_final_j2', 'Final rojo de prueba');
  await ctx.click('control', '#boton_escribir');
  await ctx.waitForState('first level waits for Control', (s) => s.partida.presentacion_nivel_pendiente === true, 15000);
  await assertCards(true);
  console.log('[held intro] cards stay open beyond seven seconds');
  await ctx.sleep(8500); // Longer than the existing seven-second presentation.
  await assertCards(true);
  for (const role of ['writer1', 'writer2']) {
    ctx.assert(await ctx.evaluate(role, () => !document.getElementById('texto').isContentEditable), `${role} cannot type during explanation`);
  }
  const before = await ctx.getState();
  await ctx.sleep(1200);
  const after = await ctx.getState();
  ctx.assert(before.reloj_partida.tiempo_restante_segundos === after.reloj_partida.tiempo_restante_segundos, 'global match time must stay frozen');
  ctx.assert(after.partida.presentacion_nivel_pendiente, 'the hold must not expire');
  await reloadRole(ctx, 'spectator');
  // The initial attribute form is hidden once the match is underway, so the
  // restored game must be checked against its editor, not that start form.
  await ctx.getPageEntry('writer1').page.reload({ waitUntil: 'domcontentloaded' });
  await ctx.waitFor('writer reconnects during explanation', () => ctx.evaluate('writer1', () => window.eval('socket.connected')));
  await ctx.getPageEntry('control').page.reload({ waitUntil: 'domcontentloaded' });
  await ctx.waitFor('Control restores held level and enabled option', () => ctx.evaluate('control', () => (
    window.presentacion_nivel_pendiente_control === true && document.getElementById('pausa_explicacion_niveles').checked
  )));
  console.log('[held intro] reloaded roles still held');
  await assertCards(true);
  await ctx.getPageEntry('control').page.screenshot({ path: `${ctx.runArtifactsDir}/control-held-level.png` });
  await ctx.getPageEntry('musa1').page.screenshot({ path: `${ctx.runArtifactsDir}/musa-held-level.png` });
  await ctx.click('control', '#boton_pausar_reanudar');
  await ctx.waitForState('level released', (s) => !s.partida.presentacion_nivel_pendiente);
  await assertCards(false);
  console.log('[held intro] first level resumed');
  for (const role of ['writer1', 'writer2']) {
    ctx.assert(await ctx.evaluate(role, () => document.getElementById('texto').isContentEditable), `${role} can type once resumed`);
  }
  await ctx.setWriterText('writer1', 'La explicación ya terminó. Ahora escribimos.');
  await ctx.waitForText('spectator', '#texto', (text) => text.includes('Ahora escribimos'), 'spectator sees resumed writing');

  await ctx.invoke('control', 'establecerModoDebug', true);
  for (const mode of ['letra bendita', 'tertulia', 'letra prohibida', 'palabras prohibidas', 'frase final']) {
    console.log(`[held intro] next: ${mode}`);
    // The existing debug action deliberately rejects skips less than 900 ms
    // apart. This test must not mistake that safety cooldown for a lost level.
    await ctx.sleep(1000);
    await ctx.invoke('control', 'saltarSiguienteNivelDebug');
    const state = await ctx.waitForState(`${mode} held`, (s) => s.partida.modo_actual === mode && s.partida.presentacion_nivel_pendiente);
    await assertCards(true);
    const letter = state.partida.letra_bendita || state.partida.letra_prohibida;
    await ctx.click('control', '#boton_pausar_reanudar');
    const resumed = await ctx.waitForState(`${mode} started`, (s) => s.partida.modo_actual === mode && !s.partida.presentacion_nivel_pendiente);
    ctx.assert((resumed.partida.letra_bendita || resumed.partida.letra_prohibida) === letter, 'resume must preserve the presented letter');
    await assertCards(false);
  }

  await ctx.invoke('control', 'finalizarPartidaDebug');
  console.log('[held intro] disabled option restores normal timed cards');
  await ctx.waitForState('finished', (s) => s.partida.fin_del_juego);
  await ctx.click('control', '#pausa_explicacion_niveles');
  await ctx.click('control', '#boton_escribir');
  await ctx.waitForState('normal timed level started', (s) => s.partida.modo_actual === 'palabras bonus' && !s.partida.presentacion_nivel_pendiente, 15000);
  await ctx.waitFor('normal explanation visible', () => ctx.evaluate('spectator', () => document.getElementById('level_transition').classList.contains('is-visible')), 15000);
  await ctx.waitFor('normal explanation automatically dismissed', () => ctx.evaluate('spectator', () => !document.getElementById('level_transition').classList.contains('is-visible')), 10000);
}

module.exports = { runHeldLevelIntroChecks };
