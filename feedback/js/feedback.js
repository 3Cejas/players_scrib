(function () {
    const form = document.getElementById("feedback_form");
    const status = document.getElementById("feedback_status");
    const submitButton = document.getElementById("feedback_submit");
    const successPanel = document.getElementById("feedback_success");
    const isLocalFilePreview = window.location.protocol === "file:";

    if (!form || !submitButton) {
        return;
    }

    const ratingCards = Array.from(form.querySelectorAll(".rating-card"));
    const canUseAjaxSubmit =
        typeof window.fetch === "function" &&
        typeof window.URLSearchParams === "function" &&
        typeof window.FormData === "function";

    const syncRatingCards = function () {
        ratingCards.forEach(function (card) {
            const hasValue = Boolean(card.querySelector('input[type="radio"]:checked'));
            card.classList.toggle("has-value", hasValue);
        });
    };

    const setStatus = function (message, kind) {
        if (!status) {
            return;
        }

        status.textContent = message;
        status.classList.remove("is-error", "is-success");
        if (kind) {
            status.classList.add(kind);
        }
    };

    form.addEventListener("change", syncRatingCards);
    syncRatingCards();

    if (!canUseAjaxSubmit && !isLocalFilePreview) {
        if (window.location.search.indexOf("enviado=1") !== -1 && successPanel) {
            successPanel.hidden = false;
        }
        return;
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        if (submitButton.disabled) {
            return;
        }

        if (isLocalFilePreview) {
            submitButton.disabled = true;
            window.location.href = new URL("./gracias/index.html?local=1", window.location.href).toString();
            return;
        }

        const formData = new FormData(form);
        formData.set("entry_point", window.location.pathname || "/feedback/");
        formData.set("submitted_at", new Date().toISOString());

        submitButton.disabled = true;
        setStatus("Enviando feedback...", "");

        fetch("/feedback/", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams(formData).toString()
        })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error("submit_failed");
                }

                form.reset();
                syncRatingCards();
                setStatus("Gracias. Tu lectura del juego ya ha quedado guardada.", "is-success");

                if (successPanel) {
                    successPanel.hidden = false;
                }

                if (window.history && typeof window.history.replaceState === "function") {
                    window.history.replaceState({}, "", "/feedback/?enviado=1");
                }
            })
            .catch(function () {
                setStatus("No se pudo enviar ahora mismo. Intentalo de nuevo en unos segundos.", "is-error");
            })
            .finally(function () {
                submitButton.disabled = false;
            });
    });

    if (window.location.search.indexOf("enviado=1") !== -1 && successPanel) {
        successPanel.hidden = false;
    }
}());
