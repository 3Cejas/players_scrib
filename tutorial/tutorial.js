(function () {
  "use strict";

  const slides = Array.from(document.querySelectorAll(".slide"));
  const previous = document.getElementById("prev");
  const next = document.getElementById("next");
  const current = document.getElementById("current");
  const total = document.getElementById("total");
  const chapter = document.getElementById("chapter");
  const progress = document.getElementById("progress");
  const slideTime = document.getElementById("slideTime");
  const totalTime = document.getElementById("totalTime");
  let index = 0;
  let touchStartX = null;

  const minutes = slides.reduce((sum, slide) => sum + (Number(slide.dataset.minutes) || 0), 0);
  total.textContent = String(slides.length).padStart(2, "0");
  totalTime.textContent = `${Math.round(minutes)} MIN · INCLUYE PREGUNTAS`;

  function resetSlideAnimations(slide) {
    const animated = Array.from(slide.children);
    animated.forEach((element) => {
      element.style.animation = "none";
      void element.offsetWidth;
      element.style.animation = "";
    });
  }

  function show(target, direction) {
    const nextIndex = Math.max(0, Math.min(slides.length - 1, target));
    if (nextIndex === index) return;
    const outgoing = slides[index];
    outgoing.classList.remove("is-active");
    outgoing.classList.add(direction > 0 ? "is-exiting-left" : "is-exiting-right");
    window.setTimeout(() => outgoing.classList.remove("is-exiting-left", "is-exiting-right"), 650);
    index = nextIndex;
    slides[index].classList.add("is-active");
    resetSlideAnimations(slides[index]);
    update();
  }

  function update() {
    const slide = slides[index];
    current.textContent = String(index + 1).padStart(2, "0");
    chapter.textContent = slide.dataset.chapter || "";
    progress.style.width = `${((index + 1) / slides.length) * 100}%`;
    const value = Number(slide.dataset.minutes) || 0;
    slideTime.textContent = `${String(value).replace(".", ",")} MIN`;
    previous.disabled = index === 0;
    next.disabled = index === slides.length - 1;
    document.title = `${index + 1}/${slides.length} · ${slide.getAttribute("aria-label")} · <SCRI> B`;
  }

  previous.addEventListener("click", () => show(index - 1, -1));
  next.addEventListener("click", () => show(index + 1, 1));
  document.addEventListener("keydown", (event) => {
    if (["ArrowRight", "PageDown", " "].includes(event.key)) {
      event.preventDefault();
      show(index + 1, 1);
    } else if (["ArrowLeft", "PageUp"].includes(event.key)) {
      event.preventDefault();
      show(index - 1, -1);
    } else if (event.key === "Home") {
      event.preventDefault();
      show(0, -1);
    } else if (event.key === "End") {
      event.preventDefault();
      show(slides.length - 1, 1);
    }
  });
  document.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });
  document.addEventListener("touchend", (event) => {
    if (touchStartX === null) return;
    const distance = event.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(distance) < 60) return;
    show(index + (distance < 0 ? 1 : -1), distance < 0 ? 1 : -1);
  }, { passive: true });

  update();
}());
