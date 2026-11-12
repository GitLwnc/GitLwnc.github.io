/* Progressive enhancement: without JavaScript all research stories remain readable. */
(function () {
  "use strict";
  document.querySelectorAll("[data-carousel]").forEach(function (root) {
    var slides = Array.from(root.querySelectorAll("[data-slide]"));
    var track = root.querySelector(".research-carousel__track");
    var dots = Array.from(root.querySelectorAll("[data-go]"));
    var videos = Array.from(root.querySelectorAll("video"));
    var index = 0, inView = false, start = null;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    var manualPlay = new WeakSet(), manualPause = new WeakSet();
    var loaded = new WeakSet(), resumeTimes = new WeakMap();
    if (slides.length < 2) return;

    function allowed(video) {
      return !document.hidden && inView && slides[index].contains(video) &&
        !manualPause.has(video) && (!reduced.matches || manualPlay.has(video));
    }
    function buttonState(video) {
      var button = video.closest("[data-slide]").querySelector("[data-video-toggle]");
      if (!button) return;
      button.textContent = video.paused ? "Play video" : "Pause video";
      button.setAttribute("aria-label", button.textContent);
    }
    function loadActiveVideo(video) {
      if (loaded.has(video)) return;
      video.querySelectorAll("source[data-src]").forEach(function (source) { source.src = source.dataset.src; });
      loaded.add(video);
      video.load();
    }
    function releaseVideo(video) {
      if (!loaded.has(video)) return;
      resumeTimes.set(video, video.currentTime || 0);
      video.querySelectorAll("source").forEach(function (source) { source.removeAttribute("src"); });
      loaded.delete(video);
      video.load();
    }
    function syncMedia() {
      videos.forEach(function (video) {
        if (!allowed(video)) {
          video.pause();
          if (!slides[index].contains(video) || !inView || document.hidden) releaseVideo(video);
          buttonState(video);
          return;
        }
        loadActiveVideo(video);
        var play = video.play();
        if (play && play.then) play.then(function () {
          // A switch or visibility change can finish before play() resolves.
          if (!allowed(video)) video.pause();
          buttonState(video);
        }).catch(function () {
          // Autoplay may be denied. The explicit play control remains usable.
          buttonState(video);
        });
      });
    }
    function show(next, announce) {
      index = (next + slides.length) % slides.length;
      track.style.transform = "translateX(-" + (index * 100) + "%)";
      slides.forEach(function (slide, i) {
        slide.setAttribute("aria-hidden", String(i !== index));
        slide.inert = i !== index;
        slide.querySelectorAll("a, button").forEach(function (el) {
          if (i !== index) el.setAttribute("tabindex", "-1");
          else el.removeAttribute("tabindex");
        });
      });
      dots.forEach(function (dot, i) { dot.setAttribute("aria-current", String(i === index)); });
      if (announce) root.querySelector("[data-carousel-status]").textContent = slides[index].getAttribute("aria-label");
      syncMedia();
    }
    videos.forEach(function (video) {
      video.muted = true;
      var sound = video.closest("[data-slide]").querySelector("[data-sound-toggle]");
      if (sound) {
        sound.addEventListener("click", function () { video.muted = !video.muted; });
        video.addEventListener("volumechange", function () {
          sound.textContent = video.muted ? "Unmute" : "Mute";
          sound.setAttribute("aria-label", video.muted ? "Unmute video" : "Mute video");
          sound.setAttribute("aria-pressed", String(!video.muted));
        });
      }
      video.addEventListener("loadedmetadata", function () {
        var time = resumeTimes.get(video) || 0;
        if (time > 0 && Number.isFinite(video.duration)) video.currentTime = Math.min(time, Math.max(0, video.duration - 0.1));
      });
      video.addEventListener("play", function () {
        if (!allowed(video)) video.pause();
        buttonState(video);
      });
      video.addEventListener("pause", function () { buttonState(video); });
      var button = video.closest("[data-slide]").querySelector("[data-video-toggle]");
      if (button) button.addEventListener("click", function () {
        if (video.paused) { manualPause.delete(video); manualPlay.add(video); }
        else { manualPlay.delete(video); manualPause.add(video); }
        syncMedia();
      });
      video.addEventListener("error", function () {
        var message = video.parentElement.querySelector("[data-video-message]");
        if (message) { message.hidden = false; message.textContent = "Video unavailable. You can still read the paper below."; }
        if (button) button.hidden = true;
      });
    });
    root.querySelector("[data-prev]").addEventListener("click", function () { show(index - 1, true); });
    root.querySelector("[data-next]").addEventListener("click", function () { show(index + 1, true); });
    dots.forEach(function (dot) { dot.addEventListener("click", function () { show(Number(dot.dataset.go), true); }); });
    root.addEventListener("keydown", function (event) {
      if (event.target.closest("video, [data-sound-toggle]")) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault(); show(index + (event.key === "ArrowRight" ? 1 : -1), true);
      }
    });
    var viewport = root.querySelector(".research-carousel__viewport");
    viewport.addEventListener("pointerdown", function (event) {
      if (event.pointerType === "mouse" || event.target.closest("button, a")) return;
      start = { x: event.clientX, y: event.clientY, id: event.pointerId };
      viewport.setPointerCapture(event.pointerId);
    });
    viewport.addEventListener("pointerup", function (event) {
      if (!start || start.id !== event.pointerId) return;
      var dx = event.clientX - start.x, dy = event.clientY - start.y; start = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) show(index + (dx < 0 ? 1 : -1), true);
    });
    viewport.addEventListener("pointercancel", function () { start = null; });
    document.addEventListener("visibilitychange", syncMedia);
    window.addEventListener("pagehide", function () { inView = false; syncMedia(); });
    window.addEventListener("pageshow", function () {
      var rect = root.getBoundingClientRect();
      inView = rect.bottom > 0 && rect.top < window.innerHeight; syncMedia();
    });
    if (reduced.addEventListener) reduced.addEventListener("change", syncMedia);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) { inView = entries[0].isIntersecting; syncMedia(); }, { threshold: 0.1 }).observe(root);
    } else {
      inView = true;
    }
    root.classList.add("is-enhanced");
    root.querySelector("[data-carousel-controls]").hidden = false;
    show(0, false);
  });
}());
