/* Progressive enhancement: without JavaScript all research stories remain readable. */
(function () {
  "use strict";
  document.querySelectorAll("[data-carousel]").forEach(function (root) {
    var slides = Array.from(root.querySelectorAll("[data-slide]"));
    var track = root.querySelector(".research-carousel__track");
    var dots = Array.from(root.querySelectorAll("[data-go]"));
    var videos = Array.from(root.querySelectorAll("video"));
    var index = 0, inView = false, pageActive = true, start = null;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    var manualPlay = new WeakSet(), manualPause = new WeakSet();
    var loaded = new WeakSet(), resumeTimes = new WeakMap();
    var generations = new WeakMap(), pending = new WeakMap(), failures = new WeakSet(), playRetries = new WeakMap();
    if (slides.length < 2) return;

    function allowed(video) {
      return !document.hidden && pageActive && inView && slides[index].contains(video) &&
        !manualPause.has(video) && (!reduced.matches || manualPlay.has(video));
    }
    function buttonState(video) {
      var button = video.closest("[data-slide]").querySelector("[data-video-toggle]");
      if (!button) return;
      button.hidden = false;
      button.textContent = failures.has(video) ? "Retry video" : (video.paused ? "Play video" : "Pause video");
      button.setAttribute("aria-label", button.textContent);
    }
    function clearIssue(video) {
      failures.delete(video);
      var message = video.closest("[data-slide]").querySelector("[data-video-message]");
      if (message) { message.hidden = true; message.textContent = ""; }
    }
    function showIssue(video, text) {
      failures.add(video);
      var message = video.closest("[data-slide]").querySelector("[data-video-message]");
      if (message) { message.hidden = false; message.textContent = text; }
      buttonState(video);
    }
    function loadActiveVideo(video) {
      if (loaded.has(video)) return;
      clearIssue(video);
      generations.set(video, (generations.get(video) || 0) + 1);
      loaded.add(video);
      if (!video.canPlayType('video/mp4; codecs="avc1.42E01E"')) {
        showIssue(video, "This browser does not support H.264 MP4 playback. Open this page in Google Chrome or Microsoft Edge to watch the video.");
        return;
      }
      // An active, visible video should actually buffer; inactive videos remain unloaded.
      video.preload = "auto";
      video.src = video.dataset.src;
      video.load();
    }
    function releaseVideo(video) {
      if (!loaded.has(video)) return;
      resumeTimes.set(video, video.currentTime || 0);
      loaded.delete(video);
      generations.set(video, (generations.get(video) || 0) + 1);
      pending.delete(video);
      video.removeAttribute("src");
      video.preload = "none";
      video.load();
      clearIssue(video);
    }
    function syncMedia() {
      videos.forEach(function (video) {
        if (!allowed(video)) {
          video.pause();
          if (!slides[index].contains(video) || !inView || !pageActive || document.hidden) releaseVideo(video);
          buttonState(video);
          return;
        }
        loadActiveVideo(video);
        if (failures.has(video) || pending.has(video) || !video.paused) return;
        // Wait for decoded frames instead of racing play() against video.load().
        // The canplay handler will call syncMedia() once decoding is ready.
        if (video.readyState < 3) return;
        var generation = generations.get(video);
        var play;
        try {
          play = video.play();
        } catch (error) {
          // Synchronous playback errors must not break the carousel.
          buttonState(video);
          return;
        }
        if (play && play.then) {
          pending.set(video, play);
          play.then(function () {
            if (generations.get(video) !== generation) return;
            pending.delete(video);
            if (!allowed(video)) video.pause();
            buttonState(video);
          }).catch(function (error) {
            if (generations.get(video) !== generation) return;
            pending.delete(video);
            // A load/seek race can reject play() with AbortError just before canplay.
            // Retry a small, bounded number of times if this video is still the active one.
            var retries = playRetries.get(video) || 0;
            if (error && error.name === "AbortError" && allowed(video) && retries < 2) {
              playRetries.set(video, retries + 1);
              window.setTimeout(syncMedia, 80);
            }
            // Autoplay rejection leaves a usable manual play control.
            buttonState(video);
          });
        }
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
        clearIssue(video);
        if (time > 0 && Number.isFinite(video.duration)) {
          try { video.currentTime = Math.min(time, Math.max(0, video.duration - 0.1)); } catch (error) { resumeTimes.delete(video); }
        }
      });
      // Loading and play() can race: retry once the active source is actually playable.
      video.addEventListener("canplay", function () {
        if (allowed(video) && video.paused && !pending.has(video) && !failures.has(video)) syncMedia();
      });
      video.addEventListener("loadeddata", function () {
        if (allowed(video) && video.readyState >= 3 && video.paused && !pending.has(video)) syncMedia();
      });
      video.addEventListener("play", function () {
        playRetries.delete(video);
        if (!allowed(video)) video.pause();
        buttonState(video);
      });
      video.addEventListener("pause", function () { buttonState(video); });
      var button = video.closest("[data-slide]").querySelector("[data-video-toggle]");
      if (button) button.addEventListener("click", function () {
        if (failures.has(video)) { releaseVideo(video); manualPause.delete(video); manualPlay.add(video); }
        else if (video.paused) { manualPause.delete(video); manualPlay.add(video); }
        else { manualPlay.delete(video); manualPause.add(video); }
        syncMedia();
      });
      video.addEventListener("error", function () {
        // Resource release and late events from an old load are not playback failures.
        if (!loaded.has(video) || !video.getAttribute("src") || !video.error) return;
        failures.add(video);
        pending.delete(video);
        var message = video.closest("[data-slide]").querySelector("[data-video-message]");
        if (message) {
          message.hidden = false;
          message.textContent = "Video could not be loaded (error " + video.error.code + "). Retry or open the full-size video.";
        }
        buttonState(video);
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
    function updateInView() {
      var rect = viewport.getBoundingClientRect();
      setInView(rect.bottom > 0 && rect.top < window.innerHeight &&
        rect.right > 0 && rect.left < window.innerWidth);
    }
    function setInView(visible) {
      if (inView === visible) return;
      inView = visible;
      syncMedia();
    }
    window.addEventListener("pagehide", function () { pageActive = false; syncMedia(); });
    window.addEventListener("pageshow", function () { pageActive = true; updateInView(); syncMedia(); });
    if (reduced.addEventListener) reduced.addEventListener("change", syncMedia);
    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        var entry = entries[0];
        setInView(entry.isIntersecting && entry.intersectionRect.width > 0 && entry.intersectionRect.height > 0);
      }, { threshold: 0 });
      observer.observe(viewport);
    } else {
      window.addEventListener("scroll", updateInView, { passive: true });
      window.addEventListener("resize", updateInView);
      updateInView();
    }
    root.classList.add("is-enhanced");
    root.querySelector("[data-carousel-controls]").hidden = false;
    show(0, false);
  });
}());
