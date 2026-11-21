/* Progressive enhancement: without JavaScript all research stories remain readable. */
(function () {
  "use strict";
  document.querySelectorAll("[data-carousel]").forEach(function (root) {
    var slides = Array.from(root.querySelectorAll("[data-slide]"));
    var dots = Array.from(root.querySelectorAll("[data-go]"));
    var videos = Array.from(root.querySelectorAll("video"));
    var index = 0, inView = false, initialized = false;
    var animations = [], transitionToken = 0;
    var manualPlay = new WeakSet(), manualPause = new WeakSet();
    var loaded = new WeakSet(), resumeTimes = new WeakMap();
    var generations = new WeakMap(), pending = new WeakMap(), failures = new WeakSet();
    var abortRetries = new WeakMap(), retryTimers = new WeakMap();
    if (slides.length < 2) return;

    function allowed(video) {
      return !document.hidden && inView && slides[index].contains(video) &&
        !manualPause.has(video);
    }
    function soundState(video) {
      var sound = video.closest("[data-slide]").querySelector("[data-sound-toggle]");
      if (!sound) return;
      sound.textContent = video.muted ? "Unmute" : "Mute";
      sound.setAttribute("aria-label", video.muted ? "Unmute video" : "Mute video");
      sound.setAttribute("aria-pressed", String(!video.muted));
    }
    function buttonState(video) {
      soundState(video);
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
      abortRetries.set(video, 0);
      if (!video.canPlayType('video/mp4; codecs="avc1.42E01E"')) {
        showIssue(video, "This browser does not support H.264 MP4 playback. Open this page in Google Chrome or Microsoft Edge to watch the video.");
        return;
      }
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
      clearTimeout(retryTimers.get(video));
      retryTimers.delete(video);
      video.removeAttribute("src");
      video.load();
      clearIssue(video);
    }
    function startPlayback(video) {
      if (!allowed(video) || failures.has(video) || pending.has(video) ||
          retryTimers.has(video) || !video.paused || video.readyState < 2) return;
      var generation = generations.get(video), request = {};
      pending.set(video, request);
      function current() {
        return generations.get(video) === generation && pending.get(video) === request;
      }
      function rejected(error) {
        if (!current()) return;
        pending.delete(video);
        if (!allowed(video)) return;
        if (error && error.name === "AbortError" && (abortRetries.get(video) || 0) < 1) {
          abortRetries.set(video, (abortRetries.get(video) || 0) + 1);
          // A new load can abort play() without making the resource invalid.
          // Retry once; readiness events will wake syncMedia if data is still pending.
          retryTimers.set(video, setTimeout(function () {
            retryTimers.delete(video);
            if (generations.get(video) === generation && allowed(video)) syncMedia();
          }, 100));
          buttonState(video);
          return;
        }
        var name = error && error.name || "PlaybackError";
        showIssue(video, name === "NotAllowedError" ?
          "Your browser blocked automatic playback. Press Retry video to play." :
          "Video playback was interrupted (" + name + "). Press Retry video to try again.");
      }
      try {
        var play = video.play();
        Promise.resolve(play).then(function () {
          if (!current()) return;
          pending.delete(video);
          abortRetries.set(video, 0);
          if (!allowed(video)) video.pause();
          buttonState(video);
        }, rejected);
      } catch (error) { rejected(error); }
    }
    function syncMedia() {
      // Stop old media before starting the next film, including rapid reversals.
      videos.forEach(function (video) {
        if (allowed(video)) return;
        video.pause();
        if (!slides[index].contains(video) || !inView || document.hidden) releaseVideo(video);
        buttonState(video);
      });
      videos.forEach(function (video) {
        if (!allowed(video)) return;
        loadActiveVideo(video);
        startPlayback(video);
      });
    }
    function show(next, announce) {
      next = (next + slides.length) % slides.length;
      if (initialized && next === index) return false;
      var outgoing = initialized ? slides[index] : null;
      var outgoingStyle = outgoing ? getComputedStyle(outgoing) : null;
      var fromOpacity = outgoingStyle ? outgoingStyle.opacity : "1";
      var fromTransform = outgoingStyle && outgoingStyle.transform !== "none" ? outgoingStyle.transform : "translateY(0px)";
      var direction = next > index ? 1 : -1;
      var token = ++transitionToken;
      animations.forEach(function (animation) { animation.cancel(); });
      animations = [];
      slides.forEach(function (slide) { slide.classList.remove("is-leaving"); });
      index = next;
      initialized = true;
      root.dataset.activeIndex = String(index);
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
      root.dataset.transitioning = "false";
      if (outgoing && announce && typeof slides[index].animate === "function") {
        outgoing.classList.add("is-leaving");
        var timing = { duration: 260, easing: "ease-out", fill: "both" };
        animations = [
          outgoing.animate([
            { opacity: fromOpacity, transform: fromTransform },
            { opacity: 0, transform: "translateY(" + (-direction * 14) + "px)" }
          ], timing),
          slides[index].animate([
            { opacity: 0, transform: "translateY(" + (direction * 14) + "px)" },
            { opacity: 1, transform: "translateY(0px)" }
          ], timing)
        ];
        root.dataset.transitioning = "true";
        Promise.all(animations.map(function (animation) {
          return animation.finished.catch(function () {});
        })).then(function () {
          if (token !== transitionToken) return;
          outgoing.classList.remove("is-leaving");
          animations.forEach(function (animation) { animation.cancel(); });
          animations = [];
          root.dataset.transitioning = "false";
          updateVisibility();
        });
      }
      // Keep the existing video state machine: only the current, visible film may play.
      inView = mediaVisible();
      syncMedia();
      return true;
    }
    videos.forEach(function (video) {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      var sound = video.closest("[data-slide]").querySelector("[data-sound-toggle]");
      if (sound) {
        sound.addEventListener("click", function () { video.muted = !video.muted; soundState(video); });
        video.addEventListener("volumechange", function () { soundState(video); });
        soundState(video);
      }
      video.addEventListener("loadedmetadata", function () {
        if (!loaded.has(video) || !video.getAttribute("src")) return;
        var time = resumeTimes.get(video) || 0;
        if (time > 0 && Number.isFinite(video.duration)) {
          try { video.currentTime = Math.min(time, Math.max(0, video.duration - 0.1)); } catch (error) { resumeTimes.delete(video); }
        }
      });
      video.addEventListener("loadeddata", syncMedia);
      video.addEventListener("canplay", syncMedia);
      video.addEventListener("play", function () {
        if (!allowed(video)) video.pause();
        buttonState(video);
      });
      video.addEventListener("pause", function () { buttonState(video); });
      var button = video.closest("[data-slide]").querySelector("[data-video-toggle]");
      if (button) button.addEventListener("click", function () {
        if (failures.has(video)) { releaseVideo(video); manualPause.delete(video); manualPlay.add(video); }
        else if (video.paused) { manualPause.delete(video); manualPlay.add(video); }
        else { manualPlay.delete(video); manualPause.add(video); }
        abortRetries.set(video, 0);
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
    var viewport = root.querySelector(".research-carousel__viewport");
    dots.forEach(function (dot) {
      dot.addEventListener("click", function (event) {
        event.preventDefault();
        var changed = show(Number(dot.dataset.go), true);
        // A visible media band needs no scroll, even when the directory is below the card.
        if (changed && window.matchMedia("(max-width: 900px)").matches && !mediaVisible()) {
          viewport.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
      dot.addEventListener("keydown", function (event) {
        // Links already support Enter; add Space without scrolling the page.
        if (event.key === " ") { event.preventDefault(); dot.click(); }
      });
    });
    root.addEventListener("keydown", function (event) {
      if (event.target.closest("video, [data-video-toggle], [data-sound-toggle]") ||
          (event.target.closest("a") && !event.target.closest("[data-go]"))) return;
      var next = index;
      if (event.key === "ArrowDown" || event.key === "ArrowRight") next++;
      else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next--;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = slides.length - 1;
      else return;
      event.preventDefault();
      var target = dots[(next + slides.length) % slides.length];
      target.focus({ preventScroll: true });
      target.click();
    });
    function mediaVisible() {
      // Read the active picture itself; the enlarged paper body and directory never count.
      var media = slides[index].querySelector(".research-slide__media");
      if (!media) return false;
      var rect = media.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.bottom > 0 &&
        rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
    }
    function updateVisibility() {
      var visible = mediaVisible();
      if (visible === inView) return;
      inView = visible;
      syncMedia();
    }
    document.addEventListener("visibilitychange", syncMedia);
    window.addEventListener("pagehide", function () { inView = false; syncMedia(); });
    window.addEventListener("pageshow", function () { inView = mediaVisible(); syncMedia(); });
    // Scroll also detects the moment the picture leaves but the caption remains.
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(updateVisibility, { threshold: [0, 0.1] }).observe(viewport);
    }
    root.classList.add("is-enhanced");
    show(0, false);
  });
}());
