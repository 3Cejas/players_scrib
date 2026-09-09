(function () {
  "use strict";

  var state = { entries: [], filtered: [], active: null };
  var grid = document.getElementById("archive-grid");
  var empty = document.getElementById("archive-empty");
  var search = document.getElementById("archive-search");
  var authorFilter = document.getElementById("author-filter");
  var sortFilter = document.getElementById("sort-filter");
  var dialog = document.getElementById("reader-dialog");
  var manuscript = dialog.querySelector(".reader-manuscript");
  var progress = document.getElementById("reader-progress");
  var progressLabel = document.getElementById("reader-progress-label");
  var formatter = new Intl.NumberFormat("es-ES");

  function normalize(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function formatDate(entry) {
    if (!entry.date) return entry.dateLabel || "Fecha sin identificar";
    var parts = entry.date.split("-");
    var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" })
      .format(date).replace(/\./g, "").toUpperCase();
  }

  function populateTotals() {
    var authors = new Set(state.entries.map(function (entry) { return entry.author; }));
    var words = state.entries.reduce(function (sum, entry) { return sum + (entry.wordCount || 0); }, 0);
    document.getElementById("total-texts").textContent = formatter.format(state.entries.length);
    document.getElementById("total-words").textContent = formatter.format(words);
    document.getElementById("total-authors").textContent = formatter.format(authors.size);
  }

  function populateAuthors() {
    Array.from(new Set(state.entries.map(function (entry) { return entry.author; })))
      .sort(function (a, b) { return a.localeCompare(b, "es"); })
      .forEach(function (author) {
        var option = document.createElement("option");
        option.value = author;
        option.textContent = author;
        authorFilter.appendChild(option);
      });
  }

  function cardFor(entry, index) {
    var card = document.getElementById("archive-card-template").content.firstElementChild.cloneNode(true);
    var number = state.entries.indexOf(entry) + 1;
    card.dataset.id = entry.id;
    card.classList.add("archive-card--" + (["cyan", "red", "amber"][index % 3]));
    card.style.setProperty("--card-delay", Math.min(index, 9) * 55 + "ms");
    card.querySelector(".archive-card__number").textContent = String(number).padStart(2, "0");
    var time = card.querySelector("time");
    time.dateTime = entry.date || "";
    time.textContent = formatDate(entry);
    card.querySelector("h3").textContent = entry.author;
    card.querySelector("blockquote").textContent = entry.excerpt;
    card.querySelector(".archive-card__words").textContent = formatter.format(entry.wordCount) + " PALABRAS";
    var duration = card.querySelector(".archive-card__duration");
    duration.textContent = entry.stats && entry.stats.duration ? entry.stats.duration + " EN DIRECTO" : "ESCRITURA EN VIVO";
    card.querySelector(".archive-read").addEventListener("click", function () { openReader(entry); });
    var pdf = card.querySelector(".archive-pdf");
    pdf.href = entry.pdf;
    pdf.download = entry.pdf.split("/").pop();
    return card;
  }

  function render() {
    var fragment = document.createDocumentFragment();
    state.filtered.forEach(function (entry, index) { fragment.appendChild(cardFor(entry, index)); });
    grid.replaceChildren(fragment);
    grid.setAttribute("aria-busy", "false");
    empty.hidden = state.filtered.length !== 0;
    document.getElementById("result-count").textContent = state.filtered.length === 1
      ? "1 EXPEDIENTE"
      : state.filtered.length + " EXPEDIENTES";
  }

  function applyFilters() {
    var query = normalize(search.value.trim());
    var author = authorFilter.value;
    state.filtered = state.entries.filter(function (entry) {
      var haystack = normalize([entry.author, entry.dateLabel, entry.text].join(" "));
      return (!query || haystack.indexOf(query) !== -1) && (!author || entry.author === author);
    });
    state.filtered.sort(function (a, b) {
      if (sortFilter.value === "author") return a.author.localeCompare(b.author, "es") || b.date.localeCompare(a.date);
      if (sortFilter.value === "oldest") return a.date.localeCompare(b.date);
      return b.date.localeCompare(a.date);
    });
    render();
  }

  function setOptionalStat(rowId, valueId, value) {
    document.getElementById(rowId).hidden = !value;
    document.getElementById(valueId).textContent = value || "—";
  }

  function openReader(entry, options) {
    state.active = entry;
    var number = state.entries.indexOf(entry) + 1;
    document.getElementById("reader-number").textContent = String(number).padStart(2, "0");
    document.getElementById("reader-author").textContent = entry.author;
    var date = document.getElementById("reader-date");
    date.dateTime = entry.date || "";
    date.textContent = entry.dateLabel;
    document.getElementById("reader-words").textContent = formatter.format(entry.wordCount);
    setOptionalStat("reader-duration-row", "reader-duration", entry.stats && entry.stats.duration);
    setOptionalStat("reader-rhythm-row", "reader-rhythm", entry.stats && entry.stats.rhythm);
    ["reader-download", "reader-download-top"].forEach(function (id) {
      var link = document.getElementById(id);
      link.href = entry.pdf;
      link.download = entry.pdf.split("/").pop();
    });
    var text = document.getElementById("reader-text");
    text.replaceChildren();
    entry.text.split(/\n\s*\n/).forEach(function (paragraph) {
      var p = document.createElement("p");
      p.textContent = paragraph;
      if (/^\s*\(/.test(paragraph)) p.className = "stage-direction";
      text.appendChild(p);
    });
    manuscript.scrollTop = 0;
    updateProgress();
    if (!dialog.open) dialog.showModal();
    document.body.classList.add("reader-open");
    if (!options || !options.fromHistory) {
      var url = new URL(window.location.href);
      url.searchParams.set("texto", entry.id);
      window.history.pushState({ textId: entry.id }, "", url);
    }
  }

  function closeReader(options) {
    if (!dialog.open) return;
    dialog.close();
    state.active = null;
    document.body.classList.remove("reader-open");
    if (!options || !options.fromHistory) {
      var url = new URL(window.location.href);
      url.searchParams.delete("texto");
      window.history.pushState({}, "", url);
    }
  }

  function updateProgress() {
    var maximum = manuscript.scrollHeight - manuscript.clientHeight;
    var ratio = maximum > 0 ? Math.min(1, manuscript.scrollTop / maximum) : 0;
    progress.style.width = Math.round(ratio * 100) + "%";
    progressLabel.textContent = Math.round(ratio * 100) + " %";
  }

  function openFromLocation() {
    var id = new URL(window.location.href).searchParams.get("texto");
    var entry = id && state.entries.find(function (item) { return item.id === id; });
    if (entry) openReader(entry, { fromHistory: true });
    else closeReader({ fromHistory: true });
  }

  search.addEventListener("input", applyFilters);
  authorFilter.addEventListener("change", applyFilters);
  sortFilter.addEventListener("change", applyFilters);
  manuscript.addEventListener("scroll", updateProgress, { passive: true });
  dialog.querySelectorAll("[data-close-reader]").forEach(function (element) {
    element.addEventListener("click", function () { closeReader(); });
  });
  dialog.addEventListener("cancel", function (event) { event.preventDefault(); closeReader(); });
  window.addEventListener("popstate", openFromLocation);

  fetch("./data/textos.json")
    .then(function (response) { if (!response.ok) throw new Error("No se pudo abrir el archivo"); return response.json(); })
    .then(function (data) {
      state.entries = data.entries || [];
      populateTotals();
      populateAuthors();
      applyFilters();
      openFromLocation();
    })
    .catch(function () {
      grid.setAttribute("aria-busy", "false");
      grid.innerHTML = '<p class="archive-error">El archivo no ha respondido. Prueba a recargar la página.</p>';
    });
}());
