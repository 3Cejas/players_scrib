(function initScribDramaturgiaHistorySnapshots(root, factory) {
    const api = factory(root || {});
    if (typeof module === "object" && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.ScribDramaturgiaHistorySnapshots = api;
    }
})(typeof window !== "undefined" ? window : globalThis, function createHistorySnapshotsApi(runtime) {
    "use strict";

    /**
     * Stable role order shared by the live monitor and the historical archive.
     * IDs are deliberately data-only so this module can also run in Node tests.
     */
    const SCREEN_IDS = Object.freeze([
        "control",
        "spectator",
        "jury",
        "writer1",
        "musa1",
        "actor1",
        "writer2",
        "musa2",
        "actor2"
    ]);
    const SCREEN_ID_SET = new Set(SCREEN_IDS);
    const DB_VERSION = 1;
    const DEFAULT_DB_NAME = "scrib-dramaturgia-history";
    const DEFAULT_MAX_BYTES = 96 * 1024 * 1024;
    const DEFAULT_MAX_CHECKPOINTS = 720;

    function finiteInteger(value, fallback = 0) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
    }

    function positiveTimestamp(value, fallback = 0) {
        const parsed = finiteInteger(value, fallback);
        return parsed > 0 ? parsed : fallback;
    }

    function text(value, maxLength = 240) {
        return String(value == null ? "" : value).trim().slice(0, maxLength);
    }

    function uniqueStrings(values, maxLength = 240) {
        const output = [];
        (Array.isArray(values) ? values : []).forEach((value) => {
            const candidate = typeof value === "object" && value
                ? text(value.id || value.eventId || value.event_id, maxLength)
                : text(value, maxLength);
            if (candidate && !output.includes(candidate)) output.push(candidate);
        });
        return output;
    }

    function cloneValue(value) {
        if (value == null || typeof value !== "object") return value;
        try {
            if (typeof runtime.structuredClone === "function") {
                return runtime.structuredClone(value);
            }
        } catch (_error) {
            // Some host objects cannot be structured-cloned; JSON is sufficient here.
        }
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (_error) {
            return value;
        }
    }

    function eventSequence(event) {
        const parsed = Number(event && event.seq);
        return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : null;
    }

    function eventTimestamp(event) {
        const parsed = Number(event && event.ts);
        return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : null;
    }

    function compareEventEntries(left, right) {
        const leftSeq = eventSequence(left.event);
        const rightSeq = eventSequence(right.event);
        if (leftSeq !== null && rightSeq !== null && leftSeq !== rightSeq) {
            return leftSeq - rightSeq;
        }
        if (leftSeq !== null && rightSeq === null) return -1;
        if (leftSeq === null && rightSeq !== null) return 1;
        const leftTs = eventTimestamp(left.event);
        const rightTs = eventTimestamp(right.event);
        if (leftTs !== null && rightTs !== null && leftTs !== rightTs) {
            return leftTs - rightTs;
        }
        if (leftTs !== null && rightTs === null) return -1;
        if (leftTs === null && rightTs !== null) return 1;
        return left.index - right.index;
    }

    function eventCauses(event) {
        if (!event || typeof event !== "object") return [];
        return uniqueStrings(event.causa_ids || event.cause_ids || event.causes || []);
    }

    function lookupPreviousCheckpoint(source, eventId) {
        if (!source || !eventId) return "";
        let found;
        if (typeof source === "function") {
            found = source(eventId);
        } else if (typeof source.get === "function") {
            found = source.get(eventId);
        } else if (Object.prototype.hasOwnProperty.call(source, eventId)) {
            found = source[eventId];
        }
        if (found && typeof found === "object") {
            return text(found.id || found.checkpointId || found.checkpoint_id, 360);
        }
        return text(found, 360);
    }

    function smallStableHash(value) {
        const source = String(value || "");
        let hash = 2166136261;
        for (let index = 0; index < source.length; index += 1) {
            hash ^= source.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0).toString(16).padStart(8, "0");
    }

    /**
     * Builds one visual checkpoint from a journal batch. Events are copied and
     * stably ordered by seq, then ts, then input position. Explicit event causes
     * become links to older checkpoints through previousCheckpointByEvent, which
     * may be a Map, plain object or lookup function. The lookup is never mutated.
     */
    function groupEventsIntoCheckpoint(events, sessionId, previousCheckpointByEvent) {
        const session = text(sessionId || "session", 240) || "session";
        const entries = (Array.isArray(events) ? events : [])
            .map((event, index) => ({
                event: event && typeof event === "object" ? cloneValue(event) : {},
                index
            }))
            .sort(compareEventEntries);
        if (!entries.length) return null;

        const normalizedEvents = entries.map(({ event }, index) => {
            const seq = eventSequence(event);
            const ts = eventTimestamp(event);
            const id = text(
                event.id || `${session}:${seq !== null ? seq : `t${ts || 0}`}:${index}`,
                360
            );
            return {
                ...event,
                id,
                seq: seq === null ? 0 : seq,
                ts: ts === null ? 0 : ts,
                causa_ids: eventCauses(event)
            };
        });
        const eventIds = normalizedEvents.map((event) => event.id);
        const currentIds = new Set(eventIds);
        const causeEventIds = [];
        const causes = [];
        const previousCheckpointIds = [];

        normalizedEvents.forEach((event) => {
            event.causa_ids.forEach((causeEventId) => {
                if (!causeEventIds.includes(causeEventId)) causeEventIds.push(causeEventId);
                const checkpointId = currentIds.has(causeEventId)
                    ? ""
                    : lookupPreviousCheckpoint(previousCheckpointByEvent, causeEventId);
                if (checkpointId && !previousCheckpointIds.includes(checkpointId)) {
                    previousCheckpointIds.push(checkpointId);
                }
                if (!causes.some((cause) => (
                    cause.eventId === causeEventId && cause.checkpointId === checkpointId
                ))) {
                    causes.push({ eventId: causeEventId, checkpointId });
                }
            });
        });

        const seqValues = normalizedEvents.map(eventSequence).filter((value) => value !== null);
        const tsValues = normalizedEvents.map(eventTimestamp).filter((value) => value !== null);
        const seqStart = seqValues.length ? Math.min(...seqValues) : 0;
        const seqEnd = seqValues.length ? Math.max(...seqValues) : 0;
        const startedAt = tsValues.length ? Math.min(...tsValues) : 0;
        const capturedAt = tsValues.length ? Math.max(...tsValues) : Date.now();
        const fingerprint = smallStableHash(eventIds.join("\u001f"));

        return {
            schemaVersion: 1,
            id: `checkpoint:${session}:${seqStart}-${seqEnd}:${fingerprint}`,
            sessionId: session,
            seq: seqEnd,
            seqStart,
            seqEnd,
            ts: capturedAt,
            startedAt,
            capturedAt,
            primaryEventId: eventIds[eventIds.length - 1],
            eventIds,
            causeEventIds,
            previousCheckpointIds,
            causes,
            events: normalizedEvents,
            roles: {}
        };
    }

    function checkpointComparator(left, right) {
        const leftSeq = finiteInteger(left && (left.seq ?? left.seqEnd), 0);
        const rightSeq = finiteInteger(right && (right.seq ?? right.seqEnd), 0);
        if (leftSeq && rightSeq && leftSeq !== rightSeq) return leftSeq - rightSeq;
        const leftTs = positiveTimestamp(left && (left.ts ?? left.capturedAt), 0);
        const rightTs = positiveTimestamp(right && (right.ts ?? right.capturedAt), 0);
        if (leftTs !== rightTs) return leftTs - rightTs;
        return text(left && left.id, 360).localeCompare(text(right && right.id, 360));
    }

    function normalizeRoles(roles) {
        const output = {};
        const source = roles && typeof roles === "object" ? roles : {};
        SCREEN_IDS.forEach((screenId) => {
            const hash = text(source[screenId], 240);
            if (hash) output[screenId] = hash;
        });
        return output;
    }

    function normalizeCheckpoint(input) {
        const source = input && typeof input === "object" ? cloneValue(input) : {};
        const sessionId = text(source.sessionId || source.session_id || "session", 240) || "session";
        const events = Array.isArray(source.events) ? source.events : [];
        const eventIds = uniqueStrings(source.eventIds || events.map((event) => event && event.id), 360);
        const seq = Math.max(0, finiteInteger(source.seq ?? source.seqEnd, 0));
        const ts = positiveTimestamp(source.ts ?? source.capturedAt, Date.now());
        const id = text(
            source.id || `checkpoint:${sessionId}:${seq}:${smallStableHash(eventIds.join("\u001f") || ts)}`,
            500
        );
        return {
            ...source,
            schemaVersion: Math.max(1, finiteInteger(source.schemaVersion ?? source.schema_version, 1)),
            id,
            sessionId,
            seq,
            seqStart: Math.max(0, finiteInteger(source.seqStart, seq)),
            seqEnd: Math.max(0, finiteInteger(source.seqEnd, seq)),
            ts,
            capturedAt: positiveTimestamp(source.capturedAt, ts),
            eventIds,
            causeEventIds: uniqueStrings(source.causeEventIds || source.causa_ids || [], 360),
            previousCheckpointIds: uniqueStrings(
                source.previousCheckpointIds || source.previous_checkpoint_ids || [],
                500
            ),
            events: cloneValue(events),
            roles: normalizeRoles(source.roles)
        };
    }

    /**
     * Small synchronous, bounded working store for the UI. Persistence is handled
     * separately by openArchive(). Returned checkpoint values are defensive copies.
     */
    function createHistoryStore(options = {}) {
        const maxCheckpoints = Math.max(
            1,
            finiteInteger(options.maxCheckpoints, DEFAULT_MAX_CHECKPOINTS)
        );
        const checkpoints = new Map();
        const checkpointByEvent = new Map();

        function rebuildEventIndex() {
            checkpointByEvent.clear();
            [...checkpoints.values()].sort(checkpointComparator).forEach((checkpoint) => {
                checkpoint.eventIds.forEach((eventId) => checkpointByEvent.set(eventId, checkpoint.id));
            });
        }

        function trim() {
            const ordered = [...checkpoints.values()].sort(checkpointComparator);
            while (ordered.length > maxCheckpoints) {
                const removed = ordered.shift();
                if (removed) checkpoints.delete(removed.id);
            }
            rebuildEventIndex();
        }

        function putCheckpoint(checkpoint) {
            const normalized = normalizeCheckpoint(checkpoint);
            checkpoints.set(normalized.id, normalized);
            trim();
            return cloneValue(normalized);
        }

        function getCheckpoint(checkpointId) {
            const found = checkpoints.get(text(checkpointId, 500));
            return found ? cloneValue(found) : null;
        }

        function listCheckpoints(sessionId) {
            const session = text(sessionId, 240);
            return [...checkpoints.values()]
                .filter((checkpoint) => !session || checkpoint.sessionId === session)
                .sort(checkpointComparator)
                .map(cloneValue);
        }

        function checkpointForEvent(eventId) {
            return checkpointByEvent.get(text(eventId, 360)) || "";
        }

        function clearSession(sessionId) {
            const session = text(sessionId, 240);
            let removed = 0;
            [...checkpoints.values()].forEach((checkpoint) => {
                if (!session || checkpoint.sessionId === session) {
                    checkpoints.delete(checkpoint.id);
                    removed += 1;
                }
            });
            rebuildEventIndex();
            return removed;
        }

        return {
            maxCheckpoints,
            putCheckpoint,
            addCheckpoint: putCheckpoint,
            getCheckpoint,
            listCheckpoints,
            checkpointForEvent,
            clearSession,
            clear: () => clearSession(""),
            get size() {
                return checkpoints.size;
            }
        };
    }

    function markBooleanAttribute(element, name, enabled) {
        if (enabled) element.setAttribute(name, "");
        else element.removeAttribute(name);
    }

    function copyLiveElementState(document, cloneRoot) {
        const sourceInputs = [...document.querySelectorAll("input")];
        const cloneInputs = [...cloneRoot.querySelectorAll("input")];
        sourceInputs.forEach((source, index) => {
            const clone = cloneInputs[index];
            if (!clone) return;
            const type = String(source.type || "text").toLowerCase();
            const redact = type === "password" || type === "file"
                || source.hasAttribute("data-snapshot-redact")
                || Boolean(source.closest("[data-snapshot-redact]"));
            if (type === "checkbox" || type === "radio") {
                markBooleanAttribute(clone, "checked", Boolean(source.checked));
            } else if (redact) {
                clone.removeAttribute("value");
                clone.setAttribute("data-snapshot-redacted", "");
                if (type !== "file") clone.setAttribute("value", "••••••");
            } else {
                clone.setAttribute("value", String(source.value == null ? "" : source.value));
            }
        });

        const sourceTextareas = [...document.querySelectorAll("textarea")];
        const cloneTextareas = [...cloneRoot.querySelectorAll("textarea")];
        sourceTextareas.forEach((source, index) => {
            const clone = cloneTextareas[index];
            if (!clone) return;
            const redact = source.hasAttribute("data-snapshot-redact")
                || Boolean(source.closest("[data-snapshot-redact]"));
            clone.textContent = redact ? "••••••" : String(source.value == null ? "" : source.value);
            if (redact) clone.setAttribute("data-snapshot-redacted", "");
        });

        const sourceSelects = [...document.querySelectorAll("select")];
        const cloneSelects = [...cloneRoot.querySelectorAll("select")];
        sourceSelects.forEach((source, index) => {
            const clone = cloneSelects[index];
            if (!clone) return;
            const redact = source.hasAttribute("data-snapshot-redact")
                || Boolean(source.closest("[data-snapshot-redact]"));
            [...clone.options].forEach((option, optionIndex) => {
                const selected = !redact && Boolean(source.options[optionIndex]?.selected);
                markBooleanAttribute(option, "selected", selected);
                if (redact) option.textContent = optionIndex === 0 ? "••••••" : "";
            });
            if (redact) clone.setAttribute("data-snapshot-redacted", "");
        });

        ["details", "dialog"].forEach((selector) => {
            const sourceElements = [...document.querySelectorAll(selector)];
            const cloneElements = [...cloneRoot.querySelectorAll(selector)];
            sourceElements.forEach((source, index) => {
                if (cloneElements[index]) {
                    markBooleanAttribute(cloneElements[index], "open", Boolean(source.open));
                }
            });
        });

        const sourceCanvases = [...document.querySelectorAll("canvas")];
        const cloneCanvases = [...cloneRoot.querySelectorAll("canvas")];
        sourceCanvases.forEach((source, index) => {
            const clone = cloneCanvases[index];
            if (!clone || typeof source.toDataURL !== "function") return;
            try {
                const dataUrl = source.toDataURL("image/png");
                const previousStyle = clone.getAttribute("style") || "";
                clone.setAttribute(
                    "style",
                    `${previousStyle};background-image:url(\"${dataUrl}\");background-size:100% 100%;`
                );
                clone.setAttribute("data-snapshot-canvas", "");
            } catch (_error) {
                // Cross-origin canvases cannot be read; keep their original element.
            }
        });
    }

    function executableUrl(value, attributeName) {
        const normalized = String(value || "").replace(/[\u0000-\u0020]+/g, "").toLowerCase();
        if (String(attributeName || "").toLowerCase() === "srcset") {
            return normalized.split(",").some((candidate) => /^(?:javascript|vbscript):/.test(candidate));
        }
        if (/^(?:javascript|vbscript):/.test(normalized)) return true;
        return /^(?:href|xlink:href|action|formaction)$/i.test(attributeName)
            && /^data:(?:text\/html|application\/xhtml\+xml)/.test(normalized);
    }

    function sanitizeElementAttributes(element) {
        [...element.attributes].forEach((attribute) => {
            const name = attribute.name.toLowerCase();
            const value = attribute.value;
            if (name.startsWith("on") || name === "srcdoc" || name === "ping") {
                element.removeAttribute(attribute.name);
                return;
            }
            if (name === "action" || name === "formaction") {
                element.removeAttribute(attribute.name);
                return;
            }
            if ([
                "href", "src", "xlink:href", "poster", "data", "srcset",
                "background", "cite", "longdesc", "usemap", "manifest", "codebase", "archive"
            ].includes(name)
                && executableUrl(value, name)) {
                element.removeAttribute(attribute.name);
                return;
            }
            if (name === "style" && /(?:javascript\s*:|vbscript\s*:|expression\s*\(|-moz-binding)/i.test(value)) {
                element.removeAttribute("style");
            }
        });
        element.removeAttribute("contenteditable");
        element.removeAttribute("autofocus");
    }

    function sanitizeContainer(container) {
        if (container.nodeType === 1) sanitizeElementAttributes(container);
        const forbidden = "script,iframe,object,embed";
        [...container.querySelectorAll(forbidden)].forEach((element) => element.remove());
        [...container.querySelectorAll("meta")].forEach((meta) => {
            const directive = String(meta.getAttribute("http-equiv") || "").toLowerCase();
            if (directive === "refresh" || directive === "content-security-policy") meta.remove();
        });
        [...container.querySelectorAll("link")].forEach((link) => {
            const rel = String(link.getAttribute("rel") || "").toLowerCase();
            const as = String(link.getAttribute("as") || "").toLowerCase();
            if (rel.includes("modulepreload") || (rel.includes("preload") && as === "script")) {
                link.remove();
            }
        });
        [...container.querySelectorAll("*")].forEach((element) => {
            sanitizeElementAttributes(element);
            if (element.tagName && element.tagName.toLowerCase() === "template" && element.content) {
                sanitizeContainer(element.content);
            }
        });
    }

    function safeBaseUrl(candidate, fallback) {
        const choices = [candidate, fallback];
        for (const choice of choices) {
            if (!choice) continue;
            try {
                const parsed = new URL(String(choice), String(fallback || "http://snapshot.invalid/"));
                if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.href;
            } catch (_error) {
                // Try the next candidate.
            }
        }
        return "https://snapshot.invalid/";
    }

    function serializeDoctype(document) {
        const doctype = document.doctype;
        if (!doctype || !doctype.name) return "<!DOCTYPE html>";
        const name = text(doctype.name, 40).replace(/[^a-z0-9:_-]/gi, "") || "html";
        return `<!DOCTYPE ${name}>`;
    }

    /**
     * Synchronously serializes the exact live DOM state into inert HTML. It keeps
     * styles/assets through a safe base URL while removing executable/navigation
     * surfaces and monitor-only overlays. The returned string is ready for hashing.
     */
    function serializeDocument(document, options = {}) {
        if (!document || !document.documentElement || typeof document.documentElement.cloneNode !== "function") {
            throw new TypeError("serializeDocument requires a browser Document");
        }
        const cloneRoot = document.documentElement.cloneNode(true);
        copyLiveElementState(document, cloneRoot);

        [...cloneRoot.querySelectorAll(".scrib-monitor-shield")].forEach((element) => element.remove());
        [...cloneRoot.querySelectorAll("style")].forEach((style) => {
            if (/\.scrib-monitor-shield|\.scrib-dramaturgia-monitor/.test(style.textContent || "")) {
                style.remove();
            }
        });
        [...cloneRoot.querySelectorAll("[data-scrib-monitor-style],#scrib-monitor-style")]
            .forEach((element) => element.remove());
        cloneRoot.querySelectorAll(".scrib-dramaturgia-monitor").forEach((element) => {
            element.classList.remove("scrib-dramaturgia-monitor");
        });
        cloneRoot.classList.remove("scrib-dramaturgia-monitor");

        [...cloneRoot.querySelectorAll("[data-snapshot-redact]")].forEach((element) => {
            const tag = String(element.tagName || "").toLowerCase();
            if (!/^(?:input|textarea|select|option)$/.test(tag)) {
                element.replaceChildren(document.createTextNode("[redactado]"));
            }
            element.removeAttribute("src");
            element.removeAttribute("srcset");
            element.removeAttribute("href");
            element.setAttribute("data-snapshot-redacted", "");
        });

        sanitizeContainer(cloneRoot);
        [...cloneRoot.querySelectorAll("base")].forEach((base) => base.remove());

        let head = cloneRoot.querySelector("head");
        if (!head) {
            head = document.createElement("head");
            cloneRoot.insertBefore(head, cloneRoot.firstChild);
        }
        const base = document.createElement("base");
        base.setAttribute("href", safeBaseUrl(options.baseUrl, document.baseURI));
        const csp = document.createElement("meta");
        csp.setAttribute("http-equiv", "Content-Security-Policy");
        csp.setAttribute(
            "content",
            "default-src 'none'; script-src 'none'; object-src 'none'; frame-src 'none'; "
                + "connect-src 'none'; form-action 'none'; base-uri http: https:; "
                + "img-src data: blob: http: https:; media-src data: blob: http: https:; "
                + "font-src data: http: https:; style-src 'unsafe-inline' http: https:"
        );
        const freezeStyle = document.createElement("style");
        freezeStyle.setAttribute("data-scrib-snapshot-freeze", "");
        freezeStyle.textContent = "html[data-scrib-snapshot-frozen] body *,html[data-scrib-snapshot-frozen] body *::before,html[data-scrib-snapshot-frozen] body *::after{animation:none!important;transition:none!important;caret-color:transparent!important;}html[data-scrib-snapshot-frozen] body .feedback-tiempo-float{opacity:1!important;transform:none!important;animation:none!important;}html,body{scroll-behavior:auto!important;}body{pointer-events:none!important;}";
        head.insertBefore(base, head.firstChild);
        head.insertBefore(csp, head.firstChild);
        head.appendChild(freezeStyle);

        let body = cloneRoot.querySelector("body");
        if (body) body.setAttribute("inert", "");
        const candidateScreenId = text(options.screenId, 80);
        const screenId = SCREEN_ID_SET.has(candidateScreenId) ? candidateScreenId : "";
        const width = Math.max(0, finiteInteger(options.width, 0));
        const height = Math.max(0, finiteInteger(options.height, 0));
        const capturedAt = positiveTimestamp(options.capturedAt, Date.now());
        cloneRoot.setAttribute("data-scrib-snapshot-frozen", "");
        if (screenId) cloneRoot.setAttribute("data-snapshot-screen-id", screenId);
        if (width) cloneRoot.setAttribute("data-snapshot-width", String(width));
        if (height) cloneRoot.setAttribute("data-snapshot-height", String(height));
        cloneRoot.setAttribute("data-snapshot-captured-at", String(capturedAt));

        return `${serializeDoctype(document)}\n${cloneRoot.outerHTML}`;
    }

    function utf8Bytes(value) {
        const source = String(value == null ? "" : value);
        if (typeof runtime.TextEncoder === "function") return new runtime.TextEncoder().encode(source);
        const bytes = [];
        for (let index = 0; index < source.length; index += 1) {
            let point = source.charCodeAt(index);
            if (point >= 0xd800 && point <= 0xdbff) {
                const next = source.charCodeAt(index + 1);
                if (next >= 0xdc00 && next <= 0xdfff) {
                    point = 0x10000 + ((point - 0xd800) << 10) + (next - 0xdc00);
                    index += 1;
                } else {
                    point = 0xfffd;
                }
            } else if (point >= 0xdc00 && point <= 0xdfff) {
                point = 0xfffd;
            }
            if (point <= 0x7f) bytes.push(point);
            else if (point <= 0x7ff) {
                bytes.push(0xc0 | (point >>> 6), 0x80 | (point & 0x3f));
            } else if (point <= 0xffff) {
                bytes.push(
                    0xe0 | (point >>> 12),
                    0x80 | ((point >>> 6) & 0x3f),
                    0x80 | (point & 0x3f)
                );
            } else {
                bytes.push(
                    0xf0 | (point >>> 18),
                    0x80 | ((point >>> 12) & 0x3f),
                    0x80 | ((point >>> 6) & 0x3f),
                    0x80 | (point & 0x3f)
                );
            }
        }
        return Uint8Array.from(bytes);
    }

    function bytesToHex(bytes) {
        return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    }

    function pureSha256(bytes) {
        const constants = new Uint32Array([
            0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
            0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
            0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
            0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
            0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
            0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
            0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
            0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
        ]);
        const initial = new Uint32Array([
            0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
            0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
        ]);
        const bitLength = bytes.length * 8;
        const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
        const padded = new Uint8Array(paddedLength);
        padded.set(bytes);
        padded[bytes.length] = 0x80;
        const view = new DataView(padded.buffer);
        view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000), false);
        view.setUint32(paddedLength - 4, bitLength >>> 0, false);
        const schedule = new Uint32Array(64);

        for (let offset = 0; offset < paddedLength; offset += 64) {
            for (let index = 0; index < 16; index += 1) {
                schedule[index] = view.getUint32(offset + index * 4, false);
            }
            for (let index = 16; index < 64; index += 1) {
                const x = schedule[index - 15];
                const y = schedule[index - 2];
                const sigma0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
                const sigma1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
                schedule[index] = (schedule[index - 16] + sigma0 + schedule[index - 7] + sigma1) >>> 0;
            }
            let [a, b, c, d, e, f, g, h] = initial;
            for (let index = 0; index < 64; index += 1) {
                const sum1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
                const choose = (e & f) ^ (~e & g);
                const temp1 = (h + sum1 + choose + constants[index] + schedule[index]) >>> 0;
                const sum0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
                const majority = (a & b) ^ (a & c) ^ (b & c);
                const temp2 = (sum0 + majority) >>> 0;
                h = g;
                g = f;
                f = e;
                e = (d + temp1) >>> 0;
                d = c;
                c = b;
                b = a;
                a = (temp1 + temp2) >>> 0;
            }
            initial[0] = (initial[0] + a) >>> 0;
            initial[1] = (initial[1] + b) >>> 0;
            initial[2] = (initial[2] + c) >>> 0;
            initial[3] = (initial[3] + d) >>> 0;
            initial[4] = (initial[4] + e) >>> 0;
            initial[5] = (initial[5] + f) >>> 0;
            initial[6] = (initial[6] + g) >>> 0;
            initial[7] = (initial[7] + h) >>> 0;
        }
        const output = new Uint8Array(32);
        const outputView = new DataView(output.buffer);
        initial.forEach((word, index) => outputView.setUint32(index * 4, word, false));
        return output;
    }

    /** Returns a lowercase SHA-256 hex digest in browsers and Node. */
    async function hashSnapshot(value) {
        const bytes = utf8Bytes(value);
        try {
            if (runtime.crypto && runtime.crypto.subtle) {
                const digest = await runtime.crypto.subtle.digest("SHA-256", bytes);
                return bytesToHex(new Uint8Array(digest));
            }
        } catch (_error) {
            // Older/private browser contexts may expose subtle but reject digest.
        }
        try {
            if (typeof require === "function") {
                const crypto = require("node:crypto");
                return crypto.createHash("sha256").update(bytes).digest("hex");
            }
        } catch (_error) {
            // The pure implementation below keeps unsupported browsers functional.
        }
        return bytesToHex(pureSha256(bytes));
    }

    function byteLength(value) {
        return utf8Bytes(value).length;
    }

    function archiveLimits(options = {}) {
        const maxBytes = Math.max(1, finiteInteger(options.maxBytes, DEFAULT_MAX_BYTES));
        const maxCheckpoints = Math.max(
            1,
            finiteInteger(options.maxCheckpoints, DEFAULT_MAX_CHECKPOINTS)
        );
        return { maxBytes, maxCheckpoints };
    }

    function buildPrunePlan(checkpoints, blobs, limits) {
        const kept = [...checkpoints].sort(checkpointComparator);
        const removedCheckpointIds = [];
        while (kept.length > limits.maxCheckpoints) {
            const removed = kept.shift();
            if (removed) removedCheckpointIds.push(removed.id);
        }

        function referencedHashes() {
            const hashes = new Set();
            kept.forEach((checkpoint) => {
                Object.values(checkpoint.roles || {}).forEach((hash) => {
                    if (hash) hashes.add(hash);
                });
            });
            return hashes;
        }

        let references = referencedHashes();
        const blobByHash = new Map(blobs.map((blob) => [blob.hash, blob]));
        function referencedSize() {
            let total = 0;
            references.forEach((hash) => {
                total += Math.max(0, finiteInteger(blobByHash.get(hash)?.size, 0));
            });
            return total;
        }
        while (referencedSize() > limits.maxBytes && kept.length) {
            const removed = kept.shift();
            if (removed && !removedCheckpointIds.includes(removed.id)) {
                removedCheckpointIds.push(removed.id);
            }
            references = referencedHashes();
        }
        const removedBlobHashes = blobs
            .filter((blob) => !references.has(blob.hash))
            .map((blob) => blob.hash);
        return {
            kept,
            references,
            removedCheckpointIds,
            removedBlobHashes,
            totalBytes: referencedSize()
        };
    }

    function makeBlobRecord(hash, html, meta) {
        const body = String(html == null ? "" : html);
        const metadata = meta && typeof meta === "object" ? cloneValue(meta) : {};
        return {
            hash: text(hash, 240),
            html: body,
            meta: metadata,
            size: byteLength(body),
            createdAt: positiveTimestamp(metadata.capturedAt, Date.now())
        };
    }

    function createMemoryArchive(options = {}) {
        const limits = archiveLimits(options);
        const blobs = new Map();
        const checkpoints = new Map();

        async function prune(overrides = {}) {
            const plan = buildPrunePlan(
                [...checkpoints.values()],
                [...blobs.values()],
                archiveLimits({ ...limits, ...overrides })
            );
            plan.removedCheckpointIds.forEach((id) => checkpoints.delete(id));
            plan.removedBlobHashes.forEach((hash) => blobs.delete(hash));
            return {
                removedCheckpoints: plan.removedCheckpointIds.length,
                removedBlobs: plan.removedBlobHashes.length,
                totalBytes: plan.totalBytes,
                totalCheckpoints: plan.kept.length
            };
        }

        return {
            kind: "memory",
            persistent: false,
            name: text(options.name || options.dbName || DEFAULT_DB_NAME, 180),
            async putBlob(hash, html, meta = {}) {
                const resolvedHash = text(hash, 240) || await hashSnapshot(html);
                const record = makeBlobRecord(resolvedHash, html, meta);
                blobs.set(record.hash, record);
                return cloneValue(record);
            },
            async getBlob(hash) {
                const found = blobs.get(text(hash, 240));
                return found ? cloneValue(found) : null;
            },
            async putCheckpoint(checkpoint) {
                const normalized = normalizeCheckpoint(checkpoint);
                checkpoints.set(normalized.id, normalized);
                await prune();
                return cloneValue(normalized);
            },
            async getCheckpoint(checkpointId) {
                const found = checkpoints.get(text(checkpointId, 500));
                return found ? cloneValue(found) : null;
            },
            async listCheckpoints(sessionId) {
                const session = text(sessionId, 240);
                return [...checkpoints.values()]
                    .filter((checkpoint) => !session || checkpoint.sessionId === session)
                    .sort(checkpointComparator)
                    .map(cloneValue);
            },
            async clearSession(sessionId) {
                const session = text(sessionId, 240);
                let removed = 0;
                [...checkpoints.values()].forEach((checkpoint) => {
                    if (!session || checkpoint.sessionId === session) {
                        checkpoints.delete(checkpoint.id);
                        removed += 1;
                    }
                });
                await prune();
                return removed;
            },
            prune,
            close() {}
        };
    }

    function requestResult(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error("IndexedDB request failed"));
        });
    }

    function transactionDone(transaction) {
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error || new Error("IndexedDB transaction failed"));
            transaction.onabort = () => reject(transaction.error || new Error("IndexedDB transaction aborted"));
        });
    }

    function openDatabase(indexedDB, name) {
        return new Promise((resolve, reject) => {
            let settled = false;
            const request = indexedDB.open(name, DB_VERSION);
            request.onupgradeneeded = () => {
                const database = request.result;
                const blobs = database.objectStoreNames.contains("blobs")
                    ? request.transaction.objectStore("blobs")
                    : database.createObjectStore("blobs", { keyPath: "hash" });
                if (!blobs.indexNames.contains("createdAt")) blobs.createIndex("createdAt", "createdAt");
                const checkpoints = database.objectStoreNames.contains("checkpoints")
                    ? request.transaction.objectStore("checkpoints")
                    : database.createObjectStore("checkpoints", { keyPath: "id" });
                if (!checkpoints.indexNames.contains("sessionId")) {
                    checkpoints.createIndex("sessionId", "sessionId", { unique: false });
                }
                if (!checkpoints.indexNames.contains("ts")) checkpoints.createIndex("ts", "ts");
            };
            request.onsuccess = () => {
                if (!settled) {
                    settled = true;
                    resolve(request.result);
                } else {
                    request.result.close();
                }
            };
            request.onerror = () => {
                if (!settled) {
                    settled = true;
                    reject(request.error || new Error("IndexedDB could not be opened"));
                }
            };
            request.onblocked = () => {
                if (!settled) {
                    settled = true;
                    reject(new Error("IndexedDB upgrade is blocked"));
                }
            };
        });
    }

    function createIndexedDbArchive(database, options = {}) {
        const limits = archiveLimits(options);

        async function getAll(storeName) {
            const transaction = database.transaction(storeName, "readonly");
            const done = transactionDone(transaction);
            const records = await requestResult(transaction.objectStore(storeName).getAll());
            await done;
            return records;
        }

        async function prune(overrides = {}) {
            const [checkpoints, blobs] = await Promise.all([getAll("checkpoints"), getAll("blobs")]);
            const plan = buildPrunePlan(
                checkpoints,
                blobs,
                archiveLimits({ ...limits, ...overrides })
            );
            if (plan.removedCheckpointIds.length || plan.removedBlobHashes.length) {
                const transaction = database.transaction(["checkpoints", "blobs"], "readwrite");
                const done = transactionDone(transaction);
                const checkpointStore = transaction.objectStore("checkpoints");
                const blobStore = transaction.objectStore("blobs");
                plan.removedCheckpointIds.forEach((id) => checkpointStore.delete(id));
                plan.removedBlobHashes.forEach((hash) => blobStore.delete(hash));
                await done;
            }
            return {
                removedCheckpoints: plan.removedCheckpointIds.length,
                removedBlobs: plan.removedBlobHashes.length,
                totalBytes: plan.totalBytes,
                totalCheckpoints: plan.kept.length
            };
        }

        async function listCheckpoints(sessionId) {
            const session = text(sessionId, 240);
            const transaction = database.transaction("checkpoints", "readonly");
            const done = transactionDone(transaction);
            const store = transaction.objectStore("checkpoints");
            const request = session && store.indexNames.contains("sessionId")
                ? store.index("sessionId").getAll(session)
                : store.getAll();
            const records = await requestResult(request);
            await done;
            return records.sort(checkpointComparator).map(cloneValue);
        }

        return {
            kind: "indexeddb",
            persistent: true,
            name: database.name,
            async putBlob(hash, html, meta = {}) {
                const resolvedHash = text(hash, 240) || await hashSnapshot(html);
                const record = makeBlobRecord(resolvedHash, html, meta);
                const transaction = database.transaction("blobs", "readwrite");
                const done = transactionDone(transaction);
                transaction.objectStore("blobs").put(record);
                await done;
                return cloneValue(record);
            },
            async getBlob(hash) {
                const transaction = database.transaction("blobs", "readonly");
                const done = transactionDone(transaction);
                const found = await requestResult(transaction.objectStore("blobs").get(text(hash, 240)));
                await done;
                return found ? cloneValue(found) : null;
            },
            async putCheckpoint(checkpoint) {
                const normalized = normalizeCheckpoint(checkpoint);
                const transaction = database.transaction("checkpoints", "readwrite");
                const done = transactionDone(transaction);
                transaction.objectStore("checkpoints").put(normalized);
                await done;
                await prune();
                return cloneValue(normalized);
            },
            async getCheckpoint(checkpointId) {
                const transaction = database.transaction("checkpoints", "readonly");
                const done = transactionDone(transaction);
                const found = await requestResult(
                    transaction.objectStore("checkpoints").get(text(checkpointId, 500))
                );
                await done;
                return found ? cloneValue(found) : null;
            },
            listCheckpoints,
            async clearSession(sessionId) {
                const session = text(sessionId, 240);
                const records = await listCheckpoints(session);
                if (records.length) {
                    const transaction = database.transaction("checkpoints", "readwrite");
                    const done = transactionDone(transaction);
                    const store = transaction.objectStore("checkpoints");
                    records.forEach((checkpoint) => store.delete(checkpoint.id));
                    await done;
                }
                await prune();
                return records.length;
            },
            prune,
            close() {
                database.close();
            }
        };
    }

    /**
     * Opens persistent IndexedDB when available. Any unavailable/blocked/open-error
     * environment transparently receives the same async API backed by volatile RAM.
     */
    async function openArchive(options = {}) {
        const name = text(options.name || options.dbName || DEFAULT_DB_NAME, 180) || DEFAULT_DB_NAME;
        const hasExplicitFactory = Object.prototype.hasOwnProperty.call(options, "indexedDB");
        const indexedDB = hasExplicitFactory ? options.indexedDB : runtime.indexedDB;
        if (options.forceMemory || !indexedDB || typeof indexedDB.open !== "function") {
            return createMemoryArchive({ ...options, name });
        }
        try {
            const database = await openDatabase(indexedDB, name);
            return createIndexedDbArchive(database, { ...options, name });
        } catch (_error) {
            return createMemoryArchive({ ...options, name });
        }
    }

    return {
        SCREEN_IDS,
        createHistoryStore,
        groupEventsIntoCheckpoint,
        serializeDocument,
        hashSnapshot,
        openArchive
    };
});
