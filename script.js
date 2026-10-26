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
     Dynamic Island navigation
     A small spring simulation drives the island's width and height, so the
     close has a soft Apple-style overshoot. The same loop keeps the scroll
     arc and active section in sync with the page.
     ------------------------------------------------------------------------ */
  const island = document.querySelector("[data-nav-island]");

  if (island) {
    const compactButton = island.querySelector(".island-compact");
    const statusEl = island.querySelector("[data-island-section]");
    const progressEl = island.querySelector("[data-island-progress]");
    const progressArc = island.querySelector("[data-island-progress-arc]");
    const navLinks = Array.prototype.slice.call(
      island.querySelectorAll(".nav-link")
    );
    const desktopNavQuery = window.matchMedia("(min-width: 1200px)");

    const islandSizes = {
      compact: { width: 232, height: 46 },
      expanded: { width: 620, height: 67 }
    };
    const sectionLabels = {
      home: "Home",
      portfolio: "Works",
      about: "About",
      "result-analytics": "Analytics",
      testimonials: "Reviews",
      faq: "FAQ"
    };
    const linkedSections = navLinks
      .map(function (link) {
        const href = link.getAttribute("href") || "";
        const hashIndex = href.indexOf("#");
        if (hashIndex === -1) return null;

        const id = decodeURIComponent(href.slice(hashIndex + 1));
        const section = document.getElementById(id);
        if (!section) return null;

        return { id: id, section: section, link: link };
      })
      .filter(Boolean);

    const widthSpring = {
      value: islandSizes.expanded.width,
      target: islandSizes.expanded.width,
      velocity: 0
    };
    const heightSpring = {
      value: islandSizes.expanded.height,
      target: islandSizes.expanded.height,
      velocity: 0
    };

    let islandExpanded = true;
    let springFrame = 0;
    let lastSpringTime = 0;
    let hovering = false;
    let focused = false;
    let pinned = false;
    let complete = false;
    let activeSection = "";
    let progressTarget = 0;
    let progressValue = 0;
    let progressFrame = 0;
    let lastProgressAnnouncement = -1;
    let scrollFrame = 0;

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function writeIslandSize(width, height) {
      island.style.width = width.toFixed(2) + "px";
      island.style.height = height.toFixed(2) + "px";
    }

    function updateCompactA11y() {
      if (!compactButton) return;
      const label = statusEl ? statusEl.textContent : "navigation";
      compactButton.setAttribute(
        "aria-label",
        (islandExpanded ? "Close" : "Open") +
          " navigation. Current section: " +
          label
      );
    }

    function stepSpring(spring, dt, stiffness, damping) {
      const force =
        -stiffness * (spring.value - spring.target) -
        damping * spring.velocity;
      spring.velocity += force * dt;
      spring.value += spring.velocity * dt;

      return (
        Math.abs(spring.velocity) < 0.08 &&
        Math.abs(spring.value - spring.target) < 0.08
      );
    }

    function runSpring(time) {
      if (!lastSpringTime) lastSpringTime = time;
      const dt = Math.min((time - lastSpringTime) / 1000, 1 / 30) || 1 / 60;
      lastSpringTime = time;

      const stiffness = islandExpanded ? 240 : 300;
      const damping = islandExpanded ? 24 : 18;
      const widthSettled = stepSpring(widthSpring, dt, stiffness, damping);
      const heightSettled = stepSpring(heightSpring, dt, stiffness, damping);

      writeIslandSize(widthSpring.value, heightSpring.value);

      if (widthSettled && heightSettled) {
        writeIslandSize(widthSpring.target, heightSpring.target);
        springFrame = 0;
        lastSpringTime = 0;
      } else {
        springFrame = requestAnimationFrame(runSpring);
      }
    }

    function setIslandExpanded(open, immediate) {
      if (open === islandExpanded && !immediate) return;

      islandExpanded = open;
      island.classList.toggle("is-expanded", open);
      if (compactButton) {
        compactButton.setAttribute("aria-expanded", open ? "true" : "false");
      }
      updateCompactA11y();

      const target = open ? islandSizes.expanded : islandSizes.compact;

      if (immediate || reducedMotion || !desktopNavQuery.matches) {
        widthSpring.value = widthSpring.target = target.width;
        heightSpring.value = heightSpring.target = target.height;
        widthSpring.velocity = 0;
        heightSpring.velocity = 0;
        writeIslandSize(target.width, target.height);

        if (springFrame) {
          cancelAnimationFrame(springFrame);
          springFrame = 0;
        }
        lastSpringTime = 0;
        return;
      }

      widthSpring.target = target.width;
      heightSpring.target = target.height;

      if (!springFrame) {
        lastSpringTime = 0;
        springFrame = requestAnimationFrame(runSpring);
      }
    }

    function maybeCollapseIsland() {
      if (hovering || focused || pinned || (window.scrollY || 0) < 48) return;
      setIslandExpanded(false);
    }

    function updateIslandLabel() {
      if (!statusEl) return;

      let nextLabel = "Contact";
      if (linkedSections.length) {
        nextLabel = complete ? "Complete" : sectionLabels[activeSection] || "Home";
      }

      if (statusEl.textContent === nextLabel) return;

      statusEl.textContent = nextLabel;
      statusEl.classList.remove("is-swapping");
      // Restart the tiny text transition when the section changes.
      void statusEl.offsetWidth;
      statusEl.classList.add("is-swapping");
      updateCompactA11y();
    }

    function renderProgress() {
      const percent = progressValue * 100;
      if (progressArc) {
        progressArc.style.strokeDashoffset = String(100 - percent);
      }
      root.style.setProperty("--scroll-progress", percent.toFixed(2));

      if (progressEl) {
        const rounded = Math.round(percent);
        if (rounded !== lastProgressAnnouncement) {
          lastProgressAnnouncement = rounded;
          progressEl.setAttribute("aria-valuenow", String(rounded));
        }
      }

      const nextComplete = progressTarget >= 0.995;
      if (nextComplete !== complete) {
        complete = nextComplete;
        island.classList.toggle("is-complete", complete);
        updateIslandLabel();
      }
    }

    function runProgress() {
      const difference = progressTarget - progressValue;

      if (Math.abs(difference) < 0.0005) {
        progressValue = progressTarget;
        renderProgress();
        progressFrame = 0;
        return;
      }

      progressValue += difference * 0.17;
      renderProgress();
      progressFrame = requestAnimationFrame(runProgress);
    }

    function readProgress() {
      const scrollTop = window.scrollY || window.pageYOffset || 0;
      const scrollHeight = document.documentElement.scrollHeight;
      const viewport = window.innerHeight;
      const maxScroll = Math.max(1, scrollHeight - viewport);
      const atBottom = scrollTop + viewport >= scrollHeight - 2;

      progressTarget = atBottom ? 1 : clamp(scrollTop / maxScroll, 0, 1);

      if (reducedMotion) {
        progressValue = progressTarget;
        renderProgress();
      } else if (!progressFrame) {
        progressFrame = requestAnimationFrame(runProgress);
      }
    }

    function readActiveSection() {
      if (!linkedSections.length) {
        updateIslandLabel();
        return;
      }

      const scrollTop = window.scrollY || window.pageYOffset || 0;
      const probe = scrollTop + Math.min(window.innerHeight * 0.32, 320);
      let current = linkedSections[0];

      linkedSections.forEach(function (item) {
        const top = item.section.getBoundingClientRect().top + scrollTop;
        if (top <= probe) current = item;
      });

      activeSection = current.id;

      linkedSections.forEach(function (item) {
        const active = item.id === activeSection;
        item.link.classList.toggle("is-active", active);

        if (active) {
          item.link.setAttribute("aria-current", "location");
        } else {
          item.link.removeAttribute("aria-current");
        }
      });

      updateIslandLabel();
    }

    function updateScrollState() {
      const scrollTop = window.scrollY || window.pageYOffset || 0;

      if (scrollTop < 48) {
        setIslandExpanded(true);
      } else if (!hovering && !focused && !pinned) {
        setIslandExpanded(false);
      }

      readProgress();
      readActiveSection();
    }

    island.addEventListener("pointerenter", function (event) {
      if (event.pointerType === "touch") return;
      hovering = true;
      setIslandExpanded(true);
    });

    island.addEventListener("pointerleave", function (event) {
      if (event.pointerType === "touch") return;
      hovering = false;
      pinned = false;
      maybeCollapseIsland();
    });

    island.addEventListener("focusin", function (event) {
      if (event.target === compactButton && !islandExpanded) {
        focused = true;
        return;
      }

      focused = true;
      setIslandExpanded(true);
    });

    island.addEventListener("focusout", function (event) {
      if (island.contains(event.relatedTarget)) return;

      // On touch devices the trigger can lose focus as it fades out. Keep the
      // pinned open state until the user taps outside or presses Escape.
      if (event.target === compactButton && islandExpanded && pinned) return;

      focused = false;
      pinned = false;
      maybeCollapseIsland();
    });

    if (compactButton) {
      compactButton.addEventListener("click", function (event) {
        pinned = true;
        setIslandExpanded(true);

        // Keyboard users go straight to the links; pointer users can simply
        // click whichever link they want. Start from the section in view.
        if (event.detail === 0 && navLinks.length) {
          const focusTarget =
            navLinks.find(function (link) {
              return link.classList.contains("is-active");
            }) || navLinks[0];

          window.setTimeout(function () {
            focusTarget.focus({ preventScroll: true });
          }, 70);
        } else if (event.detail > 0) {
          focused = false;
          if (document.activeElement === compactButton) compactButton.blur();
        }
      });
    }

    navLinks.forEach(function (link) {
      link.addEventListener("click", function (event) {
        if (event.detail === 0) return;

        // A pointer click leaves focus on the link. Blur it so the island can
        // settle back into its compact state once the pointer leaves.
        focused = false;
        pinned = false;
        if (document.activeElement === link) link.blur();
        window.setTimeout(maybeCollapseIsland, 120);
      });
    });

    document.addEventListener(
      "pointerdown",
      function (event) {
        if (island.contains(event.target)) return;

        pinned = false;
        focused = false;
        if (island.contains(document.activeElement)) {
          document.activeElement.blur();
        }
        maybeCollapseIsland();
      },
      { passive: true }
    );

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || !islandExpanded) return;
      if (!island.contains(document.activeElement) && !pinned) return;

      pinned = false;
      focused = false;
      setIslandExpanded(false);

      if (compactButton) {
        compactButton.focus({ preventScroll: true });
      }
    });

    window.addEventListener(
      "scroll",
      function () {
        if (scrollFrame) return;
        scrollFrame = requestAnimationFrame(function () {
          scrollFrame = 0;
          updateScrollState();
        });
      },
      { passive: true }
    );

    window.addEventListener(
      "resize",
      function () {
        if (desktopNavQuery.matches) {
          setIslandExpanded(
            (window.scrollY || 0) < 48 || hovering || focused || pinned,
            true
          );
        }

        readProgress();
        readActiveSection();
      },
      { passive: true }
    );

    const desktopChange = function () {
      if (desktopNavQuery.matches) {
        setIslandExpanded((window.scrollY || 0) < 48, true);
        updateScrollState();
      }
    };

    if (desktopNavQuery.addEventListener) {
      desktopNavQuery.addEventListener("change", desktopChange);
    } else if (desktopNavQuery.addListener) {
      desktopNavQuery.addListener(desktopChange);
    }

    setIslandExpanded((window.scrollY || 0) < 48, true);
    updateScrollState();
    updateIslandLabel();

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(updateScrollState);
    }
    window.addEventListener("load", updateScrollState, { once: true });
  }

  /* ------------------------------------------------------------------------
     Button ripple
     ------------------------------------------------------------------------ */
  const rippleButtons = Array.prototype.slice.call(
    document.querySelectorAll(".btn-saas")
  );

  if (!reducedMotion && rippleButtons.length) {
    rippleButtons.forEach(function (button) {
      function addRipple() {
        const ripple = document.createElement("span");
        ripple.className = "btn-grid-ripple";
        ripple.setAttribute("aria-hidden", "true");
        button.appendChild(ripple);

        window.setTimeout(function () {
          if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
        }, 430);
      }

      button.addEventListener("pointerdown", function (event) {
        if (event.button !== 0) return;
        addRipple();
      });

      button.addEventListener("click", function (event) {
        // Keyboard activation does not emit a pointer event.
        if (event.detail === 0) addRipple();
      });
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
      const label = button ? button.querySelector(".btn-label") : null;
      const original = label
        ? label.textContent
        : button
          ? button.textContent
          : "";

      if (button) {
        if (label) {
          label.textContent = "Message Sent ✓";
        } else {
          button.textContent = "Message Sent ✓";
        }
        button.disabled = true;
        button.style.opacity = "0.85";
      }

      form.reset();

      window.setTimeout(function () {
        if (button) {
          if (label) {
            label.textContent = original;
          } else {
            button.textContent = original;
          }
          button.disabled = false;
          button.style.opacity = "";
        }
      }, 2600);
    });
  }
})();
