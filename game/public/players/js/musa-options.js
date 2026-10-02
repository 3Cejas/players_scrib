(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root) {
        root.ScribMuseOptions = api;
        api.installPreferences(root, root.document);
    }
})(typeof window !== "undefined" ? window : null, function () {
    "use strict";
    const STORAGE_KEY = "scrib_muse_preferences_v1";
    const LANGUAGES = ["es", "en", "fr"];

    function normalizePreferences(value = {}) {
        const raw = value && typeof value === "object" ? value : {};
        return {
            language: LANGUAGES.includes(raw.language) ? raw.language : "",
            textSize: [1, 1.2, 1.4].includes(Number(raw.textSize)) ? Number(raw.textSize) : 1,
            reducedMotion: raw.reducedMotion === true,
            highContrast: raw.highContrast === true,
            readableFont: raw.readableFont === true
        };
    }

    function readPreferences(storage) {
        try { return normalizePreferences(JSON.parse(storage.getItem(STORAGE_KEY))); }
        catch (_error) { return normalizePreferences(); }
    }

    function savePreferences(storage, preferences) {
        try { storage.setItem(STORAGE_KEY, JSON.stringify(normalizePreferences(preferences))); return true; }
        catch (_error) { return false; }
    }

    function installPreferences(windowRef, documentRef) {
        let storage;
        try { storage = windowRef.localStorage; } catch (_error) {}
        let preferences = readPreferences(storage);
        let serverLanguage = "es";
        const reducedMotion = () => preferences.reducedMotion
            || Boolean(windowRef.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
        function applySizing() {
            const body = documentRef.body;
            if (!body) return;
            // Medimos sin el multiplicador para que nunca se acumule la escala,
            // ni se reduzca un texto que ya era grande en la vista de escritorio.
            body.classList.toggle("musa-large-text", false);
            documentRef.querySelectorAll?.("#texto, #palabra, #calentamiento_input, #peticion, .calentamiento-peticion, .musa-postgame__text").forEach(node => {
                node.style.setProperty("--musa-accessible-base-size", windowRef.getComputedStyle(node).fontSize);
            });
            body.classList.toggle("musa-large-text", preferences.textSize > 1);
        }
        function apply() {
            const body = documentRef.body;
            if (!body) return;
            body.classList.toggle("musa-reduced-motion", reducedMotion());
            body.classList.toggle("musa-high-contrast", preferences.highContrast);
            body.classList.toggle("musa-readable-font", preferences.readableFont);
            body.style.setProperty("--musa-accessible-text-scale", String(preferences.textSize));
            applySizing();
            if (reducedMotion()) windowRef.stopConfetti?.();
            const language = preferences.language || serverLanguage;
            if (windowRef.scribGetLanguage2P?.() !== language) windowRef.scribSetLanguage2P?.(language);
            windowRef.editorLetrasInspiracionMusa?.refrescar();
            windowRef.dispatchEvent(new windowRef.Event("resize"));
        }
        const store = {
            get: () => ({ ...preferences }), reducedMotion,
            set(values) {
                preferences = normalizePreferences({ ...preferences, ...values });
                const saved = savePreferences(storage, preferences);
                apply();
                return saved;
            },
            serverLanguage(language) {
                serverLanguage = LANGUAGES.includes(language) ? language : "es";
                apply();
            }
        };
        windowRef.scribMusePreferences = store;
        apply();
        if (documentRef.readyState === "loading") documentRef.addEventListener("DOMContentLoaded", apply, { once: true });
        windowRef.addEventListener?.("resize", applySizing);
        windowRef.matchMedia?.("(prefers-reduced-motion: reduce)").addEventListener?.("change", apply);
        return store;
    }

    function createController({ windowRef = window, documentRef = document, socket, getName, isReady, applyName }) {
        const preferences = windowRef.scribMusePreferences;
        const get = id => documentRef.getElementById(id);
        const dialog = get("musa_options_dialog");
        const button = get("musa_options_button");
        const nameInput = get("musa_options_name");
        const save = get("musa_options_save");
        const status = get("musa_options_status");
        const language = get("musa_options_language");
        const textSize = get("musa_options_text_size");
        const toggles = {
            reducedMotion: get("musa_options_motion"),
            highContrast: get("musa_options_contrast"),
            readableFont: get("musa_options_font")
        };
        let statusKey = "";
        let pending = false;
        const t = key => windowRef.scribT2P?.(key) || key;
        function message(key) {
            statusKey = key;
            status.textContent = key ? t(`muse.options.${key}`) : "";
        }
        function sync() {
            const values = preferences.get();
            language.value = values.language;
            textSize.value = String(values.textSize);
            Object.entries(toggles).forEach(([key, input]) => { input.checked = values[key]; });
            if (statusKey) message(statusKey);
        }
        function close() { dialog.close(); }
        button.addEventListener("click", () => {
            if (dialog.open) return;
            nameInput.value = getName();
            message("");
            sync();
            dialog.showModal();
            button.setAttribute("aria-expanded", "true");
            get("musa_options_close").focus({ preventScroll: true });
        });
        get("musa_options_close").addEventListener("click", close);
        dialog.addEventListener("click", event => {
            if (event.target !== dialog) return;
            const rect = dialog.getBoundingClientRect();
            if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
        });
        dialog.addEventListener("close", () => {
            button.setAttribute("aria-expanded", "false");
            button.focus({ preventScroll: true });
        });
        function change(values) {
            message(preferences.set(values) ? "preferences_saved" : "storage_unavailable");
        }
        language.addEventListener("change", () => change({ language: language.value }));
        textSize.addEventListener("change", () => change({ textSize: Number(textSize.value) }));
        Object.entries(toggles).forEach(([key, input]) => {
            input.addEventListener("change", () => change({ [key]: input.checked }));
        });
        get("musa_options_name_form").addEventListener("submit", event => {
            event.preventDefault();
            if (pending) return;
            const name = nameInput.value.trim().toUpperCase();
            const valid = /^[A-ZÁÉÍÓÚÜÑ0-9 _.-]{1,10}$/u.test(name) && /[A-ZÁÉÍÓÚÜÑ]/u.test(name);
            if (!valid) { message("invalid_name"); nameInput.focus(); return; }
            if (!socket.connected || !isReady()) { message("offline"); return; }
            pending = true;
            save.disabled = true;
            message("saving");
            let finished = false;
            const finish = payload => {
                if (finished) return;
                finished = true;
                windowRef.clearTimeout(timer);
                pending = false;
                save.disabled = false;
                if (!payload?.ok || !applyName(payload)) { message("name_failed"); return; }
                nameInput.value = getName();
                message("name_saved");
            };
            const timer = windowRef.setTimeout(() => finish(null), 6000);
            socket.emit("cambiar_nombre_musa", {
                nombre: name, client_id: windowRef.musa_client_id, session_id: windowRef.sesion_partida_musa
            }, finish);
        });
        windowRef.scribOnLanguageChange2P?.(sync);
        sync();
        return { close, sync };
    }

    return { STORAGE_KEY, normalizePreferences, readPreferences, savePreferences, installPreferences, createController };
});
