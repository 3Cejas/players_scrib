(function () {
    "use strict";

    const STORAGE_PREFIX = "scrib_actor_annotations_v1:";
    const SYNC_CHANNEL_PREFIX = "scrib_actor_annotations_sync_v1:";
    const MARK_CLASS = "actor-annotation-mark";
    const DEFAULT_TEXT_COLOR = "#f8f9ff";
    const COLOR_RE = /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|[a-zA-Z]+)$/;
    const INSTANCE_ID = `actor_annotations_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    let textEl = null;
    let toolbarEl = null;
    let marginEl = null;
    let noteEditorEl = null;
    let noteInputEl = null;
    let noteSaveEl = null;
    let noteCancelEl = null;
    let baseHtml = "";
    let annotations = [];
    let pendingSelection = null;
    let noteEditorSelection = null;
    let noteEditorAnnotationId = "";
    let selectionFrame = 0;
    let storageKey = "";
    let lastSavedAnnotationsJson = "";
    let syncChannel = null;

    function getStorageKey() {
        if (storageKey) return storageKey;
        const params = new URLSearchParams(window.location.search);
        const player = params.get("player") || "1";
        storageKey = `${STORAGE_PREFIX}${player}`;
        return storageKey;
    }

    function parseAnnotations(raw) {
        try {
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed)
                ? parsed.filter(isUsableAnnotation).map(normalizeAnnotation)
                : [];
        } catch (error) {
            return [];
        }
    }

    function loadAnnotations() {
        try {
            return parseAnnotations(window.localStorage.getItem(getStorageKey()));
        } catch (error) {
            return [];
        }
    }

    function isUsableAnnotation(annotation) {
        return Boolean(
            annotation
            && typeof annotation === "object"
            && Number.isFinite(Number(annotation.start))
            && Number.isFinite(Number(annotation.end))
            && Number(annotation.end) > Number(annotation.start)
        );
    }

    function escapeCssColor(value) {
        const color = String(value || "").trim();
        return COLOR_RE.test(color) ? color : "";
    }

    function normalizeAnnotation(annotation) {
        return {
            id: String(annotation.id || createId()),
            start: Number(annotation.start),
            end: Number(annotation.end),
            quote: String(annotation.quote || ""),
            underline: Boolean(annotation.underline),
            underlineColor: escapeCssColor(annotation.underlineColor),
            color: escapeCssColor(annotation.color),
            note: String(annotation.note || "").trim(),
            createdAt: Number(annotation.createdAt) || Date.now()
        };
    }

    function serializeAnnotations() {
        return JSON.stringify(annotations.map(normalizeAnnotation));
    }

    function broadcastAnnotations(json) {
        if (!syncChannel || !json) return;
        try {
            syncChannel.postMessage({
                type: "annotations",
                key: getStorageKey(),
                origin: INSTANCE_ID,
                annotationsJson: json
            });
        } catch (error) {
            // La sincronizacion entre pestanas es auxiliar; el guardado local manda.
        }
    }

    function saveAnnotations(options = {}) {
        const json = serializeAnnotations();
        if (json === lastSavedAnnotationsJson) {
            return;
        }
        lastSavedAnnotationsJson = json;
        try {
            window.localStorage.setItem(getStorageKey(), json);
        } catch (error) {
            // Las anotaciones son una ayuda local; si storage falla, la partida sigue.
        }
        if (options.broadcast !== false) {
            broadcastAnnotations(json);
        }
    }

    function applySyncedAnnotations(raw) {
        const nextAnnotations = parseAnnotations(raw || "[]");
        const nextJson = JSON.stringify(nextAnnotations);
        if (nextJson === lastSavedAnnotationsJson) {
            return;
        }
        annotations = nextAnnotations;
        lastSavedAnnotationsJson = nextJson;
        hideToolbar();
        render({ persist: false });
    }

    function handleStorageSync(event) {
        if (!event || event.key !== getStorageKey()) return;
        applySyncedAnnotations(event.newValue || "[]");
    }

    function handleBroadcastSync(event) {
        const data = event && event.data;
        if (!data || data.type !== "annotations") return;
        if (data.origin === INSTANCE_ID || data.key !== getStorageKey()) return;
        applySyncedAnnotations(data.annotationsJson || "[]");
    }

    function setupAnnotationSync() {
        window.addEventListener("storage", handleStorageSync);
        if ("BroadcastChannel" in window) {
            syncChannel = new BroadcastChannel(`${SYNC_CHANNEL_PREFIX}${getStorageKey()}`);
            syncChannel.addEventListener("message", handleBroadcastSync);
            window.addEventListener("beforeunload", () => syncChannel && syncChannel.close(), { once: true });
        }
    }

    function createId() {
        return `ann_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    }

    function getTextNodeRoot(node) {
        if (!node) return null;
        return node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
    }

    function isInsideText(node) {
        const root = getTextNodeRoot(node);
        return Boolean(textEl && root && (root === textEl || textEl.contains(root)));
    }

    function getTextNodes(container) {
        const nodes = [];
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
        let node = walker.nextNode();
        while (node) {
            nodes.push(node);
            node = walker.nextNode();
        }
        return nodes;
    }

    function getPlainText(container) {
        return getTextNodes(container).map((node) => node.nodeValue || "").join("");
    }

    function getOffsetForBoundary(container, targetNode, targetOffset) {
        if (!container || !targetNode) return null;
        if (targetNode === container) {
            const childNodes = Array.from(container.childNodes).slice(0, targetOffset);
            return childNodes.reduce((total, child) => total + (child.textContent || "").length, 0);
        }
        if (targetNode.nodeType !== Node.TEXT_NODE) {
            const range = document.createRange();
            range.selectNodeContents(container);
            try {
                range.setEnd(targetNode, targetOffset);
                return range.toString().length;
            } catch (error) {
                return null;
            }
        }

        let offset = 0;
        const nodes = getTextNodes(container);
        for (const node of nodes) {
            if (node === targetNode) {
                return offset + targetOffset;
            }
            offset += (node.nodeValue || "").length;
        }
        return null;
    }

    function readCurrentSelection() {
        const selection = window.getSelection ? window.getSelection() : null;
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed || !textEl) {
            return null;
        }
        const range = selection.getRangeAt(0);
        if (!isInsideText(range.startContainer) || !isInsideText(range.endContainer)) {
            return null;
        }
        const start = getOffsetForBoundary(textEl, range.startContainer, range.startOffset);
        const end = getOffsetForBoundary(textEl, range.endContainer, range.endOffset);
        if (!Number.isFinite(start) || !Number.isFinite(end) || start === end) {
            return null;
        }
        const safeStart = Math.min(start, end);
        const safeEnd = Math.max(start, end);
        const plainText = getPlainText(textEl);
        const quote = plainText.slice(safeStart, safeEnd);
        if (!String(quote || "").trim()) {
            return null;
        }
        return {
            start: safeStart,
            end: safeEnd,
            quote,
            rect: getVisibleSelectionRect(range)
        };
    }

    function getVisibleSelectionRect(range) {
        const rects = Array.from(range.getClientRects ? range.getClientRects() : []);
        const visible = rects.find((rect) => rect.width > 0 && rect.height > 0);
        return visible || range.getBoundingClientRect();
    }

    function positionToolbar(selectionInfo) {
        if (!toolbarEl || !selectionInfo || !selectionInfo.rect) {
            hideToolbar();
            return;
        }
        const rect = selectionInfo.rect;
        const toolbarWidth = toolbarEl.offsetWidth || 260;
        const toolbarHeight = toolbarEl.offsetHeight || 44;
        const left = Math.min(
            window.innerWidth - toolbarWidth - 10,
            Math.max(10, rect.left + (rect.width / 2) - (toolbarWidth / 2))
        );
        const top = Math.max(10, rect.top - toolbarHeight - 10);
        toolbarEl.style.left = `${left}px`;
        toolbarEl.style.top = `${top}px`;
        toolbarEl.hidden = false;
    }

    function hideToolbar() {
        if (!toolbarEl) return;
        toolbarEl.hidden = true;
    }

    function refreshSelection() {
        selectionFrame = 0;
        const selectionInfo = readCurrentSelection();
        pendingSelection = selectionInfo;
        if (selectionInfo) {
            positionToolbar(selectionInfo);
        } else {
            hideToolbar();
        }
    }

    function scheduleSelectionRefresh() {
        if (selectionFrame) return;
        selectionFrame = window.requestAnimationFrame(refreshSelection);
    }

    function rangesOverlap(aStart, aEnd, bStart, bEnd) {
        return aStart < bEnd && bStart < aEnd;
    }

    function cloneColorSegment(annotation, start, end, plainText) {
        if (end <= start) return null;
        return {
            id: createId(),
            start,
            end,
            quote: String(plainText || "").slice(start, end),
            underline: false,
            underlineColor: "",
            color: annotation.color,
            note: "",
            createdAt: annotation.createdAt || Date.now()
        };
    }

    function replaceColorInSelection(selectionInfo) {
        const plainText = textEl ? getPlainText(textEl) : "";
        const selectionStart = Number(selectionInfo.start);
        const selectionEnd = Number(selectionInfo.end);
        annotations = annotations.reduce((next, annotation) => {
            const start = Number(annotation.start);
            const end = Number(annotation.end);
            const hasColor = Boolean(annotation.color);
            if (!hasColor || !rangesOverlap(start, end, selectionStart, selectionEnd)) {
                next.push(annotation);
                return next;
            }

            if (annotation.underline || annotation.note) {
                next.push({ ...annotation, color: "" });
            }

            const left = cloneColorSegment(annotation, start, Math.min(end, selectionStart), plainText);
            const right = cloneColorSegment(annotation, Math.max(start, selectionEnd), end, plainText);
            if (left) next.push(left);
            if (right) next.push(right);
            return next;
        }, []);
    }

    function cloneUnderlineSegment(annotation, start, end, plainText) {
        if (end <= start) return null;
        return {
            id: createId(),
            start,
            end,
            quote: String(plainText || "").slice(start, end),
            underline: true,
            underlineColor: annotation.underlineColor,
            color: "",
            note: "",
            createdAt: annotation.createdAt || Date.now()
        };
    }

    function replaceUnderlineInSelection(selectionInfo) {
        const plainText = textEl ? getPlainText(textEl) : "";
        const selectionStart = Number(selectionInfo.start);
        const selectionEnd = Number(selectionInfo.end);
        annotations = annotations.reduce((next, annotation) => {
            const start = Number(annotation.start);
            const end = Number(annotation.end);
            if (!annotation.underline || !rangesOverlap(start, end, selectionStart, selectionEnd)) {
                next.push(annotation);
                return next;
            }

            if (annotation.color || annotation.note) {
                next.push({ ...annotation, underline: false, underlineColor: "" });
            }

            const left = cloneUnderlineSegment(annotation, start, Math.min(end, selectionStart), plainText);
            const right = cloneUnderlineSegment(annotation, Math.max(start, selectionEnd), end, plainText);
            if (left) next.push(left);
            if (right) next.push(right);
            return next;
        }, []);
    }

    function addAnnotation(selectionInfo, patch) {
        if (patch.color) {
            replaceColorInSelection(selectionInfo);
        }
        if (patch.underline) {
            replaceUnderlineInSelection(selectionInfo);
        }
        const annotation = {
            id: createId(),
            start: selectionInfo.start,
            end: selectionInfo.end,
            quote: selectionInfo.quote,
            underline: Boolean(patch.underline),
            underlineColor: escapeCssColor(patch.underlineColor),
            color: escapeCssColor(patch.color),
            note: String(patch.note || "").trim(),
            createdAt: Date.now()
        };
        annotations.push(annotation);
        render();
    }

    function clearAnnotationsInSelection(selectionInfo) {
        annotations = annotations.filter((annotation) => (
            !rangesOverlap(annotation.start, annotation.end, selectionInfo.start, selectionInfo.end)
        ));
        render();
    }

    function resolveAnnotationRange(annotation, plainText) {
        const quote = String(annotation.quote || "");
        const start = Math.max(0, Math.min(Number(annotation.start) || 0, plainText.length));
        const end = Math.max(start, Math.min(Number(annotation.end) || start, plainText.length));
        if (quote && plainText.slice(start, end) === quote) {
            return { start, end };
        }
        if (!quote) {
            return end > start ? { start, end } : null;
        }

        const nearbyStart = Math.max(0, start - 80);
        const nearbyIndex = plainText.indexOf(quote, nearbyStart);
        if (nearbyIndex >= 0 && nearbyIndex <= start + 80) {
            return { start: nearbyIndex, end: nearbyIndex + quote.length };
        }

        const firstIndex = plainText.indexOf(quote);
        if (firstIndex >= 0) {
            return { start: firstIndex, end: firstIndex + quote.length };
        }
        return null;
    }

    function createRangeFromOffsets(container, start, end) {
        const range = document.createRange();
        const nodes = getTextNodes(container);
        let offset = 0;
        let startNode = null;
        let startOffset = 0;
        let endNode = null;
        let endOffset = 0;

        for (const node of nodes) {
            const textLength = (node.nodeValue || "").length;
            const nextOffset = offset + textLength;
            if (!startNode && start >= offset && start <= nextOffset) {
                startNode = node;
                startOffset = Math.max(0, Math.min(textLength, start - offset));
            }
            if (!endNode && end >= offset && end <= nextOffset) {
                endNode = node;
                endOffset = Math.max(0, Math.min(textLength, end - offset));
                break;
            }
            offset = nextOffset;
        }

        if (!startNode || !endNode) return null;
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        return range.collapsed ? null : range;
    }

    function applyAnnotationToDom(annotation, noteIndex = "") {
        if (!textEl) return false;
        const range = createRangeFromOffsets(textEl, annotation.start, annotation.end);
        if (!range) return false;

        const span = document.createElement("span");
        span.className = MARK_CLASS;
        span.dataset.annotationId = annotation.id;
        if (annotation.underline) {
            span.classList.add("actor-annotation-mark--underline");
            if (annotation.underlineColor) {
                span.style.setProperty("--annotation-underline-color", annotation.underlineColor);
            }
        }
        if (annotation.note) {
            span.classList.add("actor-annotation-mark--note");
            span.title = annotation.note;
            span.dataset.annotationIndex = String(noteIndex || "");
        }
        if (annotation.color) {
            span.style.color = annotation.color;
        }
        const fragment = range.extractContents();
        span.appendChild(fragment);
        range.insertNode(span);
        return true;
    }

    function getExcerpt(annotation) {
        const quote = String(annotation.quote || "").replace(/\s+/g, " ").trim();
        if (!quote) return "";
        return quote.length > 70 ? `${quote.slice(0, 67)}...` : quote;
    }

    function escapeSelector(value) {
        if (window.CSS && typeof window.CSS.escape === "function") {
            return window.CSS.escape(value);
        }
        return String(value || "").replace(/["\\]/g, "\\$&");
    }

    function renderMargin(activeAnnotations) {
        if (!marginEl) return;
        marginEl.innerHTML = "";
        const notes = activeAnnotations.filter((annotation) => String(annotation.note || "").trim());
        marginEl.classList.toggle("actor-annotation-margin--empty", notes.length === 0);
        if (notes.length === 0) {
            const empty = document.createElement("div");
            empty.className = "actor-annotation-empty";
            empty.textContent = "Sin notas";
            marginEl.appendChild(empty);
            return;
        }

        notes.forEach((annotation, index) => {
            const item = document.createElement("article");
            item.className = "actor-annotation-note";
            item.dataset.annotationId = annotation.id;

            const indexEl = document.createElement("span");
            indexEl.className = "actor-annotation-note__index";
            indexEl.textContent = String(index + 1);

            const body = document.createElement("button");
            body.type = "button";
            body.className = "actor-annotation-note__body";
            body.dataset.annotationTarget = annotation.id;
            body.setAttribute("aria-label", "Ir a la anotacion");

            const excerpt = document.createElement("span");
            excerpt.className = "actor-annotation-note__excerpt";
            excerpt.textContent = getExcerpt(annotation);

            const text = document.createElement("span");
            text.className = "actor-annotation-note__text";
            text.textContent = annotation.note;

            const actions = document.createElement("div");
            actions.className = "actor-annotation-note__actions";

            const edit = document.createElement("button");
            edit.type = "button";
            edit.className = "actor-annotation-note__action";
            edit.dataset.annotationEdit = annotation.id;
            edit.setAttribute("aria-label", "Editar anotacion");
            edit.textContent = "N";

            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "actor-annotation-note__action";
            remove.dataset.annotationDelete = annotation.id;
            remove.setAttribute("aria-label", "Eliminar anotacion");
            remove.textContent = "x";

            body.appendChild(excerpt);
            body.appendChild(text);
            actions.appendChild(edit);
            actions.appendChild(remove);
            item.appendChild(indexEl);
            item.appendChild(body);
            item.appendChild(actions);
            marginEl.appendChild(item);
        });
    }

    function ordenarPorRangoDescendente(a, b) {
        return b.start - a.start || b.end - a.end;
    }

    function aplicarAnotacionesPorCapas(activeAnnotations, noteIndexes) {
        activeAnnotations
            .filter((annotation) => !String(annotation.note || "").trim())
            .slice()
            .sort(ordenarPorRangoDescendente)
            .forEach((annotation) => applyAnnotationToDom(annotation, noteIndexes.get(annotation.id)));

        activeAnnotations
            .filter((annotation) => String(annotation.note || "").trim())
            .slice()
            .sort(ordenarPorRangoDescendente)
            .forEach((annotation) => applyAnnotationToDom(annotation, noteIndexes.get(annotation.id)));
    }

    function render(options = {}) {
        if (!textEl) return;
        const scrollTop = textEl.scrollTop;
        textEl.innerHTML = baseHtml;

        const plainText = getPlainText(textEl);
        const activeAnnotations = [];
        annotations.forEach((annotation) => {
            const range = resolveAnnotationRange(annotation, plainText);
            if (!range) return;
            annotation.start = range.start;
            annotation.end = range.end;
            activeAnnotations.push(annotation);
        });

        const noteIndexes = new Map();
        activeAnnotations
            .filter((annotation) => String(annotation.note || "").trim())
            .forEach((annotation, index) => {
                noteIndexes.set(annotation.id, index + 1);
            });

        aplicarAnotacionesPorCapas(activeAnnotations, noteIndexes);

        renderMargin(activeAnnotations);
        if (options.persist !== false) {
            saveAnnotations({ broadcast: options.broadcast !== false });
        }
        textEl.scrollTop = Math.min(scrollTop, textEl.scrollHeight);
        scheduleSelectionRefresh();
    }

    function getSelectionForCommand() {
        return readCurrentSelection() || pendingSelection;
    }

    function positionNoteEditor(selectionInfo) {
        if (!noteEditorEl) return;
        const rect = selectionInfo && selectionInfo.rect;
        if (!rect) {
            noteEditorEl.style.left = "50%";
            noteEditorEl.style.top = "4.7rem";
            noteEditorEl.style.transform = "translateX(-50%)";
            return;
        }
        const editorWidth = noteEditorEl.offsetWidth || 360;
        const editorHeight = noteEditorEl.offsetHeight || 150;
        const left = Math.min(
            window.innerWidth - editorWidth - 10,
            Math.max(10, rect.left + (rect.width / 2) - (editorWidth / 2))
        );
        const topBelow = rect.bottom + 12;
        const topAbove = rect.top - editorHeight - 12;
        const top = topBelow + editorHeight <= window.innerHeight - 10
            ? topBelow
            : Math.max(10, topAbove);
        noteEditorEl.style.left = `${left}px`;
        noteEditorEl.style.top = `${top}px`;
        noteEditorEl.style.transform = "none";
    }

    function closeNoteEditor() {
        if (!noteEditorEl) return;
        noteEditorEl.hidden = true;
        noteEditorSelection = null;
        noteEditorAnnotationId = "";
        if (noteInputEl) {
            noteInputEl.value = "";
        }
    }

    function openNoteEditor(selectionInfo, options = {}) {
        if (!noteEditorEl || !noteInputEl) return;
        noteEditorSelection = selectionInfo || null;
        noteEditorAnnotationId = String(options.annotationId || "");
        noteInputEl.value = String(options.value || "");
        noteEditorEl.hidden = false;
        positionNoteEditor(selectionInfo);
        hideToolbar();
        window.requestAnimationFrame(() => {
            noteInputEl.focus();
            noteInputEl.select();
        });
    }

    function saveNoteEditor() {
        if (!noteInputEl) return;
        const value = String(noteInputEl.value || "").trim();
        const annotationId = noteEditorAnnotationId;
        const selectionInfo = noteEditorSelection;
        closeNoteEditor();

        if (annotationId) {
            const annotation = annotations.find((item) => item.id === annotationId);
            if (!annotation) return;
            annotation.note = value;
            if (!annotation.note && !annotation.underline && !annotation.color) {
                annotations = annotations.filter((item) => item.id !== annotationId);
            }
            render();
            return;
        }

        if (selectionInfo && value) {
            addAnnotation(selectionInfo, { note: value });
        }
    }

    function handleNoteEditorKeydown(event) {
        if (event.key === "Escape") {
            event.preventDefault();
            closeNoteEditor();
        } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            saveNoteEditor();
        }
    }

    function handleToolbarClick(event) {
        const button = event.target.closest("[data-annotation-action]");
        if (!button) return;
        event.preventDefault();
        event.stopPropagation();

        const selectionInfo = getSelectionForCommand();
        if (!selectionInfo) {
            hideToolbar();
            return;
        }

        const action = button.dataset.annotationAction;
        if (action === "underline") {
            addAnnotation(selectionInfo, { underline: true, underlineColor: button.dataset.underlineColor || "" });
        } else if (action === "color") {
            addAnnotation(selectionInfo, { color: button.dataset.color || DEFAULT_TEXT_COLOR });
        } else if (action === "note") {
            openNoteEditor(selectionInfo);
        } else if (action === "clear") {
            clearAnnotationsInSelection(selectionInfo);
        }
        hideToolbar();
    }

    function flashAnnotation(id) {
        if (!textEl) return;
        const mark = textEl.querySelector(`[data-annotation-id="${escapeSelector(id)}"]`);
        if (!mark) return;
        mark.scrollIntoView({ behavior: "smooth", block: "center" });
        mark.classList.remove("actor-annotation-mark--flash");
        void mark.offsetWidth;
        mark.classList.add("actor-annotation-mark--flash");
    }

    function editNote(id) {
        const annotation = annotations.find((item) => item.id === id);
        if (!annotation) return;
        openNoteEditor(null, { annotationId: id, value: annotation.note || "" });
    }

    function deleteAnnotation(id) {
        annotations = annotations.filter((annotation) => annotation.id !== id);
        render();
    }

    function handleMarginClick(event) {
        event.stopPropagation();
        const deleteButton = event.target.closest("[data-annotation-delete]");
        if (deleteButton) {
            deleteAnnotation(deleteButton.dataset.annotationDelete);
            return;
        }
        const editButton = event.target.closest("[data-annotation-edit]");
        if (editButton) {
            editNote(editButton.dataset.annotationEdit);
            return;
        }
        const targetButton = event.target.closest("[data-annotation-target]");
        if (targetButton) {
            flashAnnotation(targetButton.dataset.annotationTarget);
        }
    }

    function setRemoteHtml(html) {
        baseHtml = String(html || "");
        render();
    }

    function clear(options = {}) {
        annotations = [];
        if (options && Object.prototype.hasOwnProperty.call(options, "html")) {
            baseHtml = String(options.html || "");
        }
        if (options && options.render === false) {
            saveAnnotations();
        } else {
            render();
        }
    }

    function init() {
        textEl = document.getElementById("texto");
        toolbarEl = document.getElementById("actor_annotation_toolbar");
        marginEl = document.getElementById("actor_annotation_margin");
        noteEditorEl = document.getElementById("actor_annotation_note_editor");
        noteInputEl = document.getElementById("actor_annotation_note_input");
        noteSaveEl = document.getElementById("actor_annotation_note_save");
        noteCancelEl = document.getElementById("actor_annotation_note_cancel");
        if (!textEl || !toolbarEl) return;

        baseHtml = textEl.innerHTML || "";
        annotations = loadAnnotations();
        lastSavedAnnotationsJson = serializeAnnotations();
        setupAnnotationSync();

        toolbarEl.addEventListener("mousedown", (event) => {
            event.preventDefault();
            event.stopPropagation();
        });
        toolbarEl.addEventListener("click", handleToolbarClick);

        if (marginEl) {
            marginEl.addEventListener("mousedown", (event) => event.stopPropagation());
            marginEl.addEventListener("click", handleMarginClick);
        }
        if (noteEditorEl) {
            noteEditorEl.addEventListener("mousedown", (event) => event.stopPropagation());
            noteEditorEl.addEventListener("click", (event) => event.stopPropagation());
        }
        if (noteInputEl) {
            noteInputEl.addEventListener("keydown", handleNoteEditorKeydown);
        }
        if (noteSaveEl) {
            noteSaveEl.addEventListener("click", saveNoteEditor);
        }
        if (noteCancelEl) {
            noteCancelEl.addEventListener("click", closeNoteEditor);
        }

        document.addEventListener("selectionchange", scheduleSelectionRefresh);
        window.addEventListener("resize", scheduleSelectionRefresh);
        render();
    }

    window.ScribActorAnnotations = {
        setRemoteHtml,
        clear,
        refresh: render,
        hasSelection: () => Boolean(readCurrentSelection())
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
}());
