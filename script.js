/* ==========================================================================
   Killergfx interactions
   ========================================================================== */

(function () {
  "use strict";

  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------------
     Smooth scrolling (Lenis)
     ------------------------------------------------------------------------ */
  if (!reducedMotion && typeof window.Lenis === "function") {
    const lenis = new window.Lenis({
      duration: 1.2,
      easing: function (t) {
        return Math.min(1, 1.001 - Math.pow(2, -10 * t));
      },
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 1,
      touchMultiplier: 1,
      anchors: false,
      autoRaf: false,
      stopInertiaOnNavigate: true
    });

    function lenisFrame(time) {
      lenis.raf(time);
      window.requestAnimationFrame(lenisFrame);
    }

    window.requestAnimationFrame(lenisFrame);

    document.addEventListener("click", function (event) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      ) {
        return;
      }

      const link = event.target.closest('a[href^="#"]');
      if (!link) return;

      const hash = link.getAttribute("href");
      if (!hash || hash === "#") return;

      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (!target) return;

      event.preventDefault();
      lenis.scrollTo(target, { duration: 1.35 });

      if (window.history && window.history.pushState) {
        window.history.pushState(null, "", hash);
      }
    });
  }

  /* ------------------------------------------------------------------------
     Intro
     ------------------------------------------------------------------------ */
  function startIntro() {
    requestAnimationFrame(function () {
      root.classList.add("is-ready");
    });
  }

  if (document.readyState === "complete") {
    startIntro();
  } else if (document.fonts && document.fonts.ready) {
    Promise.race([
      document.fonts.ready,
      new Promise(function (resolve) { setTimeout(resolve, 500); })
    ]).then(startIntro);
    window.addEventListener("load", startIntro, { once: true });
  } else {
    window.addEventListener("load", startIntro, { once: true });
  }

  /* ------------------------------------------------------------------------
     Marquee rows
     ------------------------------------------------------------------------ */
  const rows = Array.prototype.slice.call(document.querySelectorAll(".marquee-row"));

  rows.forEach(function (row) {
    const track = row.querySelector(".marquee-track");
    if (!track) return;

    const originals = Array.prototype.slice.call(track.children);
    if (!originals.length) return;

    const gap = parseFloat(window.getComputedStyle(track).columnGap) || 16;
    const cardWidth = originals[0].getBoundingClientRect().width || 438;
    const unit = originals.length * (cardWidth + gap);

    // Repeat the set so there is never an empty edge while looping.
    for (let copy = 0; copy < 3; copy += 1) {
      originals.forEach(function (card) {
        const clone = card.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        clone.querySelectorAll("img").forEach(function (img) {
          img.setAttribute("loading", "lazy");
          img.setAttribute("alt", "");
        });
        track.appendChild(clone);
      });
    }

    const direction = row.getAttribute("data-direction") === "right" ? "right" : "left";
    const speed = parseFloat(row.getAttribute("data-speed")) || 50;
    const offset = parseFloat(row.getAttribute("data-offset")) || 0;

    if (reducedMotion) {
      track.style.transform = "translate3d(0, 0, 0)";
      return;
    }

    let start = null;

    function tick(timestamp) {
      if (start === null) start = timestamp;
      const elapsed = (timestamp - start) / 1000;
      const delta = (elapsed * speed + offset) % unit;
      const x = direction === "left" ? -delta : delta - unit;
      track.style.transform = "translate3d(" + x.toFixed(2) + "px, 0, 0)";
      window.requestAnimationFrame(tick);
    }

    const initial = direction === "left" ? -(offset % unit) : (offset % unit) - unit;
    track.style.transform = "translate3d(" + initial.toFixed(2) + "px, 0, 0)";
    window.requestAnimationFrame(tick);
  });

  /* ------------------------------------------------------------------------
     Testimonial ticker
     ------------------------------------------------------------------------ */
  const testiTrack = document.getElementById("testiTrack");

  if (testiTrack) {
    const originals = Array.prototype.slice.call(testiTrack.children);

    for (let copy = 0; copy < 2; copy += 1) {
      originals.forEach(function (card) {
        const clone = card.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        testiTrack.appendChild(clone);
      });
    }

    if (!reducedMotion) {
      const gap = parseFloat(window.getComputedStyle(testiTrack).columnGap) || 10;
      const cardWidth = originals[0].getBoundingClientRect().width || 290;
      const unit = originals.length * (cardWidth + gap);
      const speed = 101;
      let start = null;

      function tickTicker(timestamp) {
        if (start === null) start = timestamp;
        const elapsed = (timestamp - start) / 1000;
        const x = -((elapsed * speed) % unit);
        testiTrack.style.transform = "translate3d(" + x.toFixed(2) + "px, 0, 0)";
        window.requestAnimationFrame(tickTicker);
      }

      window.requestAnimationFrame(tickTicker);
    }
  }

  /* ------------------------------------------------------------------------
     FAQ accordion
     ------------------------------------------------------------------------ */
  const faqItems = Array.prototype.slice.call(document.querySelectorAll(".faq-item"));

  function closeFaq(item) {
    item.classList.remove("is-open");
    const btn = item.querySelector(".faq-btn");
    if (btn) btn.setAttribute("aria-expanded", "false");
  }

  faqItems.forEach(function (item) {
    const btn = item.querySelector(".faq-btn");
    if (!btn) return;

    btn.addEventListener("click", function () {
      const wasOpen = item.classList.contains("is-open");

      if (wasOpen) {
        closeFaq(item);
      } else {
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ------------------------------------------------------------------------
     Years stat
     The live site holds "1+" until the results card is in view, then swaps
     instantly to the final "3+".
     ------------------------------------------------------------------------ */
  const yearsStat = document.querySelector("[data-years]");

  if (yearsStat) {
    function finishYears() {
      yearsStat.textContent = "3+";
    }

    if (reducedMotion || !("IntersectionObserver" in window)) {
      finishYears();
    } else {
      const yearsObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              finishYears();
              yearsObserver.disconnect();
            }
          });
        },
        { threshold: 0.5 }
      );

      yearsObserver.observe(yearsStat);
    }
  }

  /* ------------------------------------------------------------------------
     Contact form
     ------------------------------------------------------------------------ */
  const form = document.getElementById("contactForm");

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const button = form.querySelector(".contact-submit");
      const original = button ? button.textContent : "";

      if (button) {
        button.textContent = "Message Sent ✓";
        button.disabled = true;
        button.style.opacity = "0.85";
      }

      form.reset();

      window.setTimeout(function () {
        if (button) {
          button.textContent = original;
          button.disabled = false;
          button.style.opacity = "";
        }
      }, 2600);
    });
  }
})();
