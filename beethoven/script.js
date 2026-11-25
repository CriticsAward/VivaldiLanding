import { chapters } from "./story.mjs";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const chapterMenu = $("#chapter-menu");
const rail = $("#rail-index");
const chapterTrigger = $(".chapter-trigger");
const chapterNumber = $(".chapter-number");
const chapterCurrent = $(".chapter-current");
const title = $("#track-title");
const status = $("#audio-status");
const playButton = $("#play-toggle");
const modeButton = $("#mode-toggle");
const audio = [$("#music-a"), $("#music-b")];
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let current = chapters[0];
let currentIndex = 0;
let activeAudio = 0;
let fullListen = false;
let requestedPlayback = false;
const movements = chapters.filter((chapter) => chapter.track);
let playlistIndex = 0;

function makeNavigation() {
  chapters.forEach((chapter, index) => {
    const a = document.createElement("a");
    a.href = `#${chapter.id}`;
    a.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><span>${chapter.title}</span><span>${chapter.date}</span>`;
    chapterMenu.append(a);
    const li = document.createElement("li");
    const railLink = document.createElement("a");
    railLink.href = `#${chapter.id}`;
    railLink.textContent = String(index + 1).padStart(2, "0");
    railLink.setAttribute("aria-label", `${index + 1}. ${chapter.title}`);
    li.append(railLink);
    rail.append(li);
  });
}

function setChapter(chapter) {
  if (!chapter || chapter.id === current.id) return;
  current = chapter;
  currentIndex = chapters.indexOf(chapter);
  chapterNumber.textContent = String(currentIndex + 1).padStart(2, "0");
  chapterCurrent.textContent = chapter.title;
  $$("#rail-index a").forEach((link, index) => {
    if (index === currentIndex) link.setAttribute("aria-current", "true");
    else link.removeAttribute("aria-current");
  });
  if (!fullListen && requestedPlayback) playChapterTrack(chapter);
  document.documentElement.dataset.chapter = chapter.id;
}

function toggleMenu(force) {
  const open = force ?? chapterTrigger.getAttribute("aria-expanded") !== "true";
  chapterTrigger.setAttribute("aria-expanded", String(open));
  chapterMenu.hidden = !open;
  chapterTrigger.querySelector("b").textContent = open ? "−" : "＋";
}

function stopAudio() {
  audio.forEach((player) => {
    player.pause();
    player.removeAttribute("src");
    player.load();
  });
  playButton.textContent = "▶";
  playButton.setAttribute("aria-label", "Воспроизвести музыку");
}

function trackPath(chapter) {
  return chapter.track ? new URL(`./media/${chapter.track}`, import.meta.url).href : "";
}

async function playChapterTrack(chapter) {
  if (!chapter.track) {
    audio.forEach((player) => player.pause());
    title.textContent = "Музыкальный фрагмент этой главы не задан";
    playButton.textContent = "▶";
    return;
  }
  const player = audio[activeAudio];
  const path = trackPath(chapter);
  if (player.src !== path) {
    audio[1 - activeAudio].pause();
    player.src = path;
    player.currentTime = 0;
  }
  title.textContent = chapter.title;
  status.textContent = "";
  try {
    await player.play();
    playButton.textContent = "Ⅱ";
    playButton.setAttribute("aria-label", "Приостановить музыку");
  } catch {
    requestedPlayback = false;
    playButton.textContent = "▶";
    status.textContent = "Запись не загружена. Добавьте лицензированный файл в beethoven/media.";
  }
}

function updatePlayLabel() {
  const playing = audio.some((player) => !player.paused);
  playButton.textContent = playing ? "Ⅱ" : "▶";
  playButton.setAttribute("aria-label", playing ? "Приостановить музыку" : "Воспроизвести музыку");
}

makeNavigation();
chapterTrigger.addEventListener("click", () => toggleMenu());
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") toggleMenu(false);
});
chapterMenu.addEventListener("click", (event) => {
  if (event.target.closest("a")) toggleMenu(false);
});
document.addEventListener("click", (event) => {
  if (!chapterMenu.hidden && !event.target.closest(".chapter-menu,.chapter-trigger")) toggleMenu(false);
});

const observer = new IntersectionObserver((entries) => {
  const mostVisible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (mostVisible) setChapter(chapters.find((chapter) => chapter.id === mostVisible.target.id));
}, { rootMargin: "-18% 0px -30% 0px", threshold: [0, .12, .3, .55, .8] });
chapters.forEach(({ id }) => observer.observe(document.getElementById(id)));

playButton.addEventListener("click", async () => {
  if (audio.some((player) => !player.paused)) {
    audio.forEach((player) => player.pause());
    requestedPlayback = false;
    updatePlayLabel();
    return;
  }
  requestedPlayback = true;
  if (fullListen) {
    if (!audio[activeAudio].src) await startFullListen();
    else {
      try { await audio[activeAudio].play(); } catch { status.textContent = "Файл записи недоступен."; }
    }
  } else {
    const trackChapter = chapters[currentIndex].track ? chapters[currentIndex] : chapters.slice(0, currentIndex + 1).reverse().find((chapter) => chapter.track) || chapters.find((chapter) => chapter.track);
    await playChapterTrack(trackChapter);
  }
});

modeButton.addEventListener("click", async () => {
  fullListen = !fullListen;
  modeButton.setAttribute("aria-pressed", String(fullListen));
  modeButton.textContent = fullListen ? "МУЗЫКАЛЬНОЕ ПУТЕШЕСТВИЕ" : "ПОЛНОЕ ПРОСЛУШИВАНИЕ";
  audio.forEach((player) => player.pause());
  playButton.textContent = "▶";
  if (fullListen && requestedPlayback) await startFullListen();
  else if (!fullListen && requestedPlayback) await playChapterTrack(current);
});

async function startFullListen() {
  status.textContent = "Полное прослушивание: три последовательные части";
  playlistIndex = 0;
  const first = movements[playlistIndex];
  currentIndex = chapters.indexOf(first);
  current = first;
  activeAudio = 0;
  audio[activeAudio].src = trackPath(first);
  const playNext = async () => {
    playlistIndex += 1;
    const nextChapter = movements[playlistIndex];
    if (!nextChapter) { requestedPlayback = false; updatePlayLabel(); status.textContent = "Полное прослушивание завершено."; return; }
    currentIndex = chapters.indexOf(nextChapter);
    current = nextChapter;
    activeAudio = 1 - activeAudio;
    audio[activeAudio].src = trackPath(nextChapter);
    try { await audio[activeAudio].play(); title.textContent = nextChapter.title; }
    catch { requestedPlayback = false; status.textContent = "Следующая запись недоступна."; }
  };
  audio.forEach((player) => { player.onended = playNext; });
  try {
    await audio[activeAudio].play();
    title.textContent = first.title;
    status.textContent = "";
    updatePlayLabel();
  } catch {
    requestedPlayback = false;
    status.textContent = "Записи не загружены. Добавьте три лицензированных MP3 в beethoven/media.";
  }
}

audio.forEach((player) => player.addEventListener("play", updatePlayLabel));
audio.forEach((player) => player.addEventListener("pause", updatePlayLabel));
window.addEventListener("pagehide", stopAudio);
window.addEventListener("hashchange", () => {
  const chapter = chapters.find(({ id }) => id === location.hash.slice(1));
  if (chapter) setChapter(chapter);
});

const initial = chapters.find(({ id }) => id === location.hash.slice(1));
if (initial) {
  current = initial;
  currentIndex = chapters.indexOf(initial);
}
chapterNumber.textContent = String(currentIndex + 1).padStart(2, "0");
chapterCurrent.textContent = current.title;
$$ ("#rail-index a").forEach((link, index) => { if (index === currentIndex) link.setAttribute("aria-current", "true"); });
if (reducedMotion.matches) document.documentElement.classList.add("reduced-motion");
reducedMotion.addEventListener?.("change", ({ matches }) => document.documentElement.classList.toggle("reduced-motion", matches));
