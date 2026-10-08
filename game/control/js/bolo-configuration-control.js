(function (global) {
    'use strict';
    const dialog = document.getElementById('bolo_config_dialog');
    const select = document.getElementById('bolo_config_select');
    const preview = document.getElementById('bolo_config_preview');
    const status = document.getElementById('bolo_config_status');
    const applyButton = document.getElementById('bolo_config_apply');
    const refreshButton = document.getElementById('bolo_config_refresh');
    const labels = {'palabras bonus': 'Palabras benditas', 'letra bendita': 'Letra bendita', tertulia: 'Tertulia', 'letra prohibida': 'Letra maldita', 'palabras prohibidas': 'Palabras malditas', 'frase final': 'Frase final'};
    const paramLabels = {duracion_minutos: 'Duración · minutos', duracion_segundos: 'Duración · segundos', tiempo_votacion: 'Votación · segundos', tiempo_cambio_letra: 'Cambio de letra · segundos', tiempo_cambio_palabras: 'Cambio de palabras · segundos', limite_tiempo_inspiracion: 'Cooldown de musas · segundos', porcentaje_tiempo_desventaja: 'Tramo de desventaja · %', reduccion_tertulia_porcentaje: 'Reducción de tertulia · %', pausa_explicacion_niveles: 'Mantener explicación hasta reanudar', escala_espectador: 'Tamaño interfaz espectador · %', escala_texto_espectador: 'Tamaño texto espectador · %', escala_detonadores_espectador: 'Tamaño detonadores espectador · %'};
    const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[ch]));
    let bolos = [], controlRevision = 0, applying = false, fetching = false;
    const date = value => {
        if (!value || !Number.isFinite(Date.parse(value))) return '';
        return new Intl.DateTimeFormat('es-ES', {dateStyle: 'medium', timeZone: 'Europe/Madrid'}).format(new Date(value));
    };
    const rpc = (event, data = {}) => new Promise((resolve, reject) => {
        if (!socket || !socket.connected) return reject(new Error('Control no está conectado al servidor.'));
        const timer = setTimeout(() => reject(new Error('No se recibió confirmación. Actualiza el estado antes de reintentar.')), 7000);
        socket.emit(event, data, result => {
            clearTimeout(timer);
            if (!result || !result.ok) reject(new Error(result?.error || 'No se pudo cargar la configuración.'));
            else resolve(result);
        });
    });
    function setStatus(message, error = false) {
        status.textContent = message;
        status.dataset.error = error ? '1' : '0';
    }
    function chosen() { return bolos.find(b => b.id === select.value); }
    function renderPreview() {
        const b = chosen();
        applyButton.disabled = applying || fetching || !b?.ready;
        if (!b) { preview.innerHTML = '<p>Selecciona la función que quieres preparar.</p>'; return; }
        const p = b.config?.parametros;
        preview.innerHTML = `<h3>${esc(b.title)}</h3><p class="bolo-config-muted">${esc([date(b.start), b.venue, b.city].filter(Boolean).join(' · '))}</p><div class="bolo-config-teams">${[['1','blue','AZUL'],['2','red','ROJO']].map(([player, team, title]) => `<section class="bolo-config-team ${team}"><small>${title}</small><strong>${esc(b.nombres[player] || 'Falta asignar Escritura')}</strong>${b.elenco.filter(c => c.team === team).map(c => `<p>${esc(c.name)} · ${esc(c.role)}</p>`).join('')}</section>`).join('')}</div>${b.elenco.some(c => c.team === 'general') ? `<p class="bolo-config-muted">${b.elenco.filter(c => c.team === 'general').map(c => `${esc(c.name)} (${esc(c.role)})`).join(' · ')}</p>` : ''}${p ? `<div class="bolo-config-summary"><span>⏱ ${p.duracion_minutos} min ${p.duracion_segundos ? p.duracion_segundos + ' s' : ''}</span><span>🎨 Cooldown: ${p.limite_tiempo_inspiracion} s</span><span>🌐 ${esc(b.config.idioma.toUpperCase())}</span><span>${p.pausa_explicacion_niveles ? '⏸ Explicación manual' : '▶ Explicación automática'}</span></div><p>${b.config.modos.map(m => esc(labels[m] || m)).join(' → ')}</p><details><summary>Ver todos los parámetros y frases finales</summary><dl>${Object.entries(p).map(([key, value]) => `<div><dt>${esc(paramLabels[key] || key)}</dt><dd>${value}</dd></div>`).join('')}</dl>${['1','2'].map(player => `<p>Frase final ${player === '1' ? 'azul' : 'roja'}: ${esc(b.config.frases_finales[player] || 'La elegirán las musas')}</p>`).join('')}</details>` : ''}${[...b.errors, ...b.warnings].map(message => `<p class="bolo-config-warning">⚠ ${esc(message)}</p>`).join('')}<a class="bolo-config-world-link" href="https://sutura-gateway.ddns.net/scrib/#event/${encodeURIComponent(b.id)}" target="_blank" rel="noopener">Editar este bolo en Mundo SCRIB ↗</a>`;
    }
    async function refresh() {
        if (applying || fetching) return;
        fetching = true; refreshButton.disabled = true; applyButton.disabled = true;
        setStatus('Consultando los bolos guardados en Mundo SCRIB…');
        try {
            const previous = select.value;
            const result = await rpc('bolos_configuracion_listar');
            bolos = result.bolos;
            select.replaceChildren(new Option('Selecciona un bolo…', ''), ...bolos.map(b => new Option(`${date(b.start)} · ${b.title}${b.ready ? '' : ' · Revisar ficha'}`, b.id)));
            if (bolos.some(b => b.id === previous)) select.value = previous;
            setStatus(result.matchActive ? 'Hay una partida en curso. Puedes revisar las fichas, pero no cargarlas hasta finalizar.' : bolos.length ? 'Revisa los equipos y parámetros antes de confirmar.' : 'Todavía no hay bolos disponibles. Crea uno en Mundo SCRIB.');
        } catch (error) { setStatus(error.message, true); }
        finally { fetching = false; refreshButton.disabled = false; renderPreview(); }
    }
    async function apply() {
        const b = chosen();
        if (applying || fetching || !b?.ready) return;
        applying = true; applyButton.disabled = true; refreshButton.disabled = true;
        setStatus('Cargando la configuración. Esperando confirmación del servidor…');
        try {
            const result = await rpc('bolo_configuracion_cargar', {id: b.id, revision: b.revision, controlRevision});
            accept(result);
            setStatus('Configuración cargada: nombres, créditos y parámetros sincronizados. La partida no se ha iniciado ni se han borrado textos.');
        } catch (error) { setStatus(error.message, true); }
        finally { applying = false; refreshButton.disabled = false; renderPreview(); }
    }
    function updateState(state = {}) {
        controlRevision = Number(state.revision) || 0;
        const active = document.getElementById('bolo_config_active');
        active.hidden = !state.bolo;
        active.textContent = state.bolo ? `BOLO CARGADO · ${state.bolo.title} · ${date(state.bolo.start)}` : '';
    }
    function accept(result) {
        global.aplicarConfiguracionBoloControl(result);
        updateState(result.control);
    }
    global.abrirConfiguracionBoloControl = () => {
        if (!dialog.open) dialog.showModal();
        refresh();
    };
    document.getElementById('bolo_config_close').addEventListener('click', () => { if (!applying) dialog.close(); });
    dialog.addEventListener('cancel', event => { if (applying) event.preventDefault(); });
    select.addEventListener('change', renderPreview);
    refreshButton.addEventListener('click', refresh);
    applyButton.addEventListener('click', apply);
    socket.on('control_estado', updateState);
    socket.on('bolo_configuracion_cargada', accept);
    socket.on('bolo_informe_archivo', result => {
        let node = document.getElementById('bolo_report_archive_status');
        if (!node) {
            node = document.createElement('p'); node.id = 'bolo_report_archive_status';
            node.setAttribute('role', 'status');
            document.getElementById('bolo_config_active').insertAdjacentElement('afterend', node);
        }
        node.textContent = result.status === 'saved' ? '✓ Informe de partida guardado en Mundo SCRIB.'
            : result.status === 'error' ? '⚠ No se ha podido guardar el informe. Revisa el almacenamiento del servidor.'
            : 'Informe preparado. Pendiente de confirmar el guardado en Mundo SCRIB; se reintentará automáticamente.';
    });
})(window);
