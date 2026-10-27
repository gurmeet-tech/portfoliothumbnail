/* ==========================================================================
   Killergfx interactions
   ========================================================================== */

(function () {
  "use strict";

  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let lenis = null;

  /* ------------------------------------------------------------------------
     Smooth scrolling (Lenis)
     ------------------------------------------------------------------------ */
  if (!reducedMotion && typeof window.Lenis === "function") {
    lenis = new window.Lenis({
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
     Mobile navigation
     ------------------------------------------------------------------------ */
  const nav = document.querySelector(".nav");
  const navToggle = document.querySelector(".nav-toggle");
  const mobileMenu = document.getElementById("mobileMenu");

  if (nav && navToggle && mobileMenu) {
    let menuOpen = false;

    function setMenu(open, restoreFocus) {
      if (menuOpen === open) return;
      menuOpen = open;

      nav.classList.toggle("is-open", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      mobileMenu.setAttribute("aria-hidden", open ? "false" : "true");
      mobileMenu.inert = !open;
      document.body.classList.toggle("menu-open", open);

      if (open) {
        if (lenis) {
          lenis.stop();
        } else {
          document.documentElement.style.overflow = "hidden";
        }

        window.setTimeout(function () {
          if (!menuOpen) return;
          const firstLink = mobileMenu.querySelector("a");
          if (firstLink) firstLink.focus({ preventScroll: true });
        }, 80);
      } else {
        if (lenis) {
          lenis.start();
        } else {
          document.documentElement.style.overflow = "";
        }

        if (restoreFocus !== false) {
          navToggle.focus({ preventScroll: true });
        }
      }
    }

    navToggle.addEventListener("click", function () {
      setMenu(!menuOpen);
    });

    mobileMenu.addEventListener("click", function (event) {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest("a");
      if (!link) return;

      const href = link.getAttribute("href");
      setMenu(false, false);

      // The clicked link disappears with the panel, so move focus to the
      // destination for keyboard and screen-reader users.
      if (href && href.charAt(0) === "#" && href.length > 1) {
        const target = document.getElementById(decodeURIComponent(href.slice(1)));

        if (target) {
          window.setTimeout(function () {
            if (!target.hasAttribute("tabindex")) {
              target.setAttribute("tabindex", "-1");
            }
            target.setAttribute("data-menu-focus", "");
            target.focus({ preventScroll: true });
          }, 80);
        }
      }
    });

    document.addEventListener("keydown", function (event) {
      if (!menuOpen) return;

      if (event.key === "Escape") {
        setMenu(false);
        return;
      }

      if (event.key === "Tab") {
        const focusables = mobileMenu.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (!focusables.length) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (!mobileMenu.contains(document.activeElement)) {
          event.preventDefault();
          first.focus({ preventScroll: true });
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus({ preventScroll: true });
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus({ preventScroll: true });
        }
      }
    });

    const desktopNav = window.matchMedia("(min-width: 1200px)");
    const closeOnDesktop = function (event) {
      if (event.matches) setMenu(false, false);
    };

    if (desktopNav.addEventListener) {
      desktopNav.addEventListener("change", closeOnDesktop);
    } else if (desktopNav.addListener) {
      desktopNav.addListener(closeOnDesktop);
    }
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

    let gap = parseFloat(window.getComputedStyle(track).columnGap) || 16;
    let unit = originals.length * (originals[0].getBoundingClientRect().width + gap);

    function measureRow() {
      gap = parseFloat(window.getComputedStyle(track).columnGap) || 16;
      const cardWidth = originals[0].getBoundingClientRect().width || 438;
      unit = Math.max(1, originals.length * (cardWidth + gap));
    }

    measureRow();

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

    if ("ResizeObserver" in window) {
      const rowObserver = new ResizeObserver(measureRow);
      rowObserver.observe(originals[0]);
    } else {
      window.addEventListener("resize", measureRow, { passive: true });
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
     Desktop keeps the continuous ticker. Touch layouts switch to a native,
     snap-scrolling rail instead.
     ------------------------------------------------------------------------ */
  const testiTrack = document.getElementById("testiTrack");

  if (testiTrack) {
    const originals = Array.prototype.slice.call(testiTrack.children);
    const desktopTicker = window.matchMedia("(min-width: 1200px)");
    let tickerFrame = null;
    let tickerStart = null;
    let unit = 1;

    function clearTickerClones() {
      testiTrack.querySelectorAll("[data-ticker-clone]").forEach(function (clone) {
        clone.remove();
      });
    }

    function stopTicker() {
      if (tickerFrame !== null) {
        window.cancelAnimationFrame(tickerFrame);
        tickerFrame = null;
      }
      tickerStart = null;
      testiTrack.style.transform = "";
    }

    function tickTicker(timestamp) {
      if (tickerStart === null) tickerStart = timestamp;
      const elapsed = (timestamp - tickerStart) / 1000;
      const x = -((elapsed * 101) % unit);
      testiTrack.style.transform = "translate3d(" + x.toFixed(2) + "px, 0, 0)";
      tickerFrame = window.requestAnimationFrame(tickTicker);
    }

    function buildTicker() {
      stopTicker();
      clearTickerClones();

      // The mobile rail is a horizontal scroll container, so it only needs
      // the original cards and no cloned duplicates.
      if (!desktopTicker.matches) return;

      for (let copy = 0; copy < 2; copy += 1) {
        originals.forEach(function (card) {
          const clone = card.cloneNode(true);
          clone.setAttribute("aria-hidden", "true");
          clone.setAttribute("data-ticker-clone", "true");
          testiTrack.appendChild(clone);
        });
      }

      if (reducedMotion) return;

      const gap = parseFloat(window.getComputedStyle(testiTrack).columnGap) || 10;
      const cardWidth = originals[0].getBoundingClientRect().width || 290;
      unit = Math.max(1, originals.length * (cardWidth + gap));
      tickerFrame = window.requestAnimationFrame(tickTicker);
    }

    buildTicker();

    if (desktopTicker.addEventListener) {
      desktopTicker.addEventListener("change", buildTicker);
    } else if (desktopTicker.addListener) {
      desktopTicker.addListener(buildTicker);
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
