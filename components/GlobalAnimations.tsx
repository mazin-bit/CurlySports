"use client";
import { useEffect } from "react";

/**
 * Global interactive animations that work across ALL routes:
 * - Cursor trail stars
 * - Custom cursor dot with sticky rubber-band
 * - Card corner peel effect
 * - Section entrance shockwave
 * - Scroll progress bar
 * - Click confetti burst
 * - Text wave effect on headings
 * - Section background gradient follow
 * - Magnetic everything (pills, tags, badges)
 * - Elastic hover bounce on cards/buttons
 * - Cursor color shift per section
 * - Image parallax inner movement
 * - Hover ripple effect
 * - Click-and-hold charge effect
 */
export default function GlobalAnimations() {
  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reducedMotion) return;

    const cleanups: (() => void)[] = [];
    let mouseX = 0;
    let mouseY = 0;
    const onGlobalMouse = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener("mousemove", onGlobalMouse, { passive: true });
    cleanups.push(() => window.removeEventListener("mousemove", onGlobalMouse));

    // ── SVG star symbol (injected once) ──
    let starDefs = document.getElementById("global-star-defs");
    if (!starDefs) {
      starDefs = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      ) as unknown as HTMLElement;
      starDefs.id = "global-star-defs";
      (starDefs as unknown as SVGSVGElement).setAttribute("width", "0");
      (starDefs as unknown as SVGSVGElement).setAttribute("height", "0");
      starDefs.style.cssText = "position:absolute;pointer-events:none;";
      starDefs.innerHTML = `<defs><symbol id="g-star" viewBox="0 0 40 40"><path d="M 20 4 L 23 16 L 36 18 L 26 26 L 30 38 L 20 31 L 10 38 L 14 26 L 4 18 L 17 16 Z" fill="#ff5b3d" stroke="#0c0a1d" stroke-width="2"/></symbol></defs>`;
      document.body.appendChild(starDefs);
      cleanups.push(() => starDefs!.remove());
    }

    // ── Cursor trail stars ──
    const TRAIL_COUNT = 12;
    const trailPool: SVGSVGElement[] = [];
    const ns = "http://www.w3.org/2000/svg";
    for (let i = 0; i < TRAIL_COUNT; i++) {
      const svg = document.createElementNS(ns, "svg") as SVGSVGElement;
      svg.setAttribute("viewBox", "0 0 40 40");
      svg.style.cssText =
        "position:fixed;pointer-events:none;z-index:9998;width:22px;height:22px;opacity:0;will-change:transform,opacity;";
      const use = document.createElementNS(ns, "use");
      use.setAttribute("href", "#g-star");
      svg.appendChild(use);
      document.body.appendChild(svg);
      trailPool.push(svg);
    }
    cleanups.push(() => trailPool.forEach((s) => s.remove()));

    // Current section color for trail color shift
    let currentSectionColor = "#ff5b3d"; // default orange

    let trailIdx = 0;
    let lastTrailTime = 0;
    const onTrailMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastTrailTime < 40) return;
      lastTrailTime = now;
      const star = trailPool[trailIdx % TRAIL_COUNT];
      const size = 14 + Math.random() * 14;
      const rotation = Math.random() * 360;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${e.clientX - size / 2}px`;
      star.style.top = `${e.clientY - size / 2}px`;
      star.style.opacity = "0.85";
      star.style.transform = `rotate(${rotation}deg) scale(1)`;
      star.style.transition = "none";
      // Apply section-based color to star path
      const path = star.querySelector("path");
      if (path) path.setAttribute("fill", currentSectionColor);
      void star.getBBox();
      star.style.transition = "opacity 1s ease, transform 1s ease";
      star.style.opacity = "0";
      star.style.transform = `rotate(${rotation + 90}deg) scale(0.1)`;
      trailIdx++;
    };
    window.addEventListener("mousemove", onTrailMove, { passive: true });
    cleanups.push(() =>
      window.removeEventListener("mousemove", onTrailMove)
    );

    // ── Custom cursor ──
    const customCursor = document.createElement("div");
    customCursor.className = "g-custom-cursor";
    document.body.appendChild(customCursor);
    cleanups.push(() => customCursor.remove());

    let cursorX = 0,
      cursorY = 0,
      cursorTargetX = 0,
      cursorTargetY = 0;
    let isStuck = false;
    let stuckEl: HTMLElement | null = null;

    const getStickTargets = () =>
      document.querySelectorAll<HTMLElement>(
        "a, button, [role='button'], .card, .l-btn-orange, .l-btn-lime, .l-btn-dark, .l-sport-card, .l-feat-card, .l-news-card"
      );

    const stickListeners = new WeakMap<
      HTMLElement,
      { enter: () => void; leave: () => void }
    >();
    const attachStick = (target: HTMLElement) => {
      if (stickListeners.has(target)) return;
      const enter = () => {
        isStuck = true;
        stuckEl = target;
        customCursor.style.width = "40px";
        customCursor.style.height = "40px";
        customCursor.style.borderColor = "var(--orange)";
        customCursor.style.background = "rgba(255,91,61,0.1)";
        target.style.transition =
          "transform 0.3s cubic-bezier(.22,1,.36,1)";
      };
      const leave = () => {
        isStuck = false;
        stuckEl = null;
        customCursor.style.width = "14px";
        customCursor.style.height = "14px";
        customCursor.style.borderColor = "var(--accent, #c8ff3d)";
        customCursor.style.background = "transparent";
        target.style.transform = "";
      };
      target.addEventListener("mouseenter", enter);
      target.addEventListener("mouseleave", leave);
      stickListeners.set(target, { enter, leave });
    };

    const detachStick = (target: HTMLElement) => {
      const fns = stickListeners.get(target);
      if (!fns) return;
      target.removeEventListener("mouseenter", fns.enter);
      target.removeEventListener("mouseleave", fns.leave);
      stickListeners.delete(target);
    };

    getStickTargets().forEach(attachStick);
    const stickyObserver = new MutationObserver(() => {
      getStickTargets().forEach(attachStick);
    });
    stickyObserver.observe(document.body, { childList: true, subtree: true });
    cleanups.push(() => {
      stickyObserver.disconnect();
      getStickTargets().forEach(detachStick);
    });

    let cursorRaf: number;
    const updateCursor = () => {
      if (isStuck && stuckEl) {
        const rect = stuckEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        cursorTargetX += (centerX - cursorTargetX) * 0.15;
        cursorTargetY += (centerY - cursorTargetY) * 0.15;
        const pullX = (cursorX - centerX) * 0.06;
        const pullY = (cursorY - centerY) * 0.06;
        stuckEl.style.transform = `translate(${pullX}px, ${pullY}px) scale(1.02)`;
      } else {
        cursorTargetX += (cursorX - cursorTargetX) * 0.2;
        cursorTargetY += (cursorY - cursorTargetY) * 0.2;
      }
      const w = parseFloat(customCursor.style.width || "14");
      customCursor.style.transform = `translate(${cursorTargetX - w / 2}px, ${cursorTargetY - w / 2}px)`;
      cursorRaf = requestAnimationFrame(updateCursor);
    };
    cursorRaf = requestAnimationFrame(updateCursor);
    cleanups.push(() => cancelAnimationFrame(cursorRaf));

    const onCursorMove = (e: MouseEvent) => {
      cursorX = e.clientX;
      cursorY = e.clientY;
    };
    window.addEventListener("mousemove", onCursorMove, { passive: true });
    cleanups.push(() =>
      window.removeEventListener("mousemove", onCursorMove)
    );

    // ── Card corner peel effect ──
    const peelMap = new WeakMap<HTMLElement, HTMLDivElement>();
    const attachPeel = (card: HTMLElement) => {
      if (peelMap.has(card)) return;
      const peel = document.createElement("div");
      peel.className = "g-card-peel";
      card.style.position = "relative";
      card.style.overflow = "hidden";
      card.appendChild(peel);
      peelMap.set(card, peel);
      card.addEventListener("mouseenter", () => {
        peel.style.width = "36px";
        peel.style.height = "36px";
      });
      card.addEventListener("mouseleave", () => {
        peel.style.width = "0";
        peel.style.height = "0";
      });
    };

    const getPeelCards = () =>
      document.querySelectorAll<HTMLElement>(
        ".card, .l-feat-card, .l-news-card, .l-debate-post"
      );
    getPeelCards().forEach(attachPeel);
    const peelObserver = new MutationObserver(() => {
      getPeelCards().forEach(attachPeel);
    });
    peelObserver.observe(document.body, { childList: true, subtree: true });
    cleanups.push(() => peelObserver.disconnect());

    // ── Scroll progress bar ──
    const progressBar = document.createElement("div");
    progressBar.className = "g-scroll-progress";
    document.body.appendChild(progressBar);
    cleanups.push(() => progressBar.remove());

    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = `${pct}%`;
    };
    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();
    cleanups.push(() =>
      window.removeEventListener("scroll", updateProgress)
    );

    // ── Section entrance shockwave ──
    const shockwaveShown = new WeakSet<Element>();
    const shockObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !shockwaveShown.has(entry.target)) {
            shockwaveShown.add(entry.target);
            const wave = document.createElement("div");
            wave.className = "g-shockwave-ring";
            const rect = entry.target.getBoundingClientRect();
            wave.style.left = `${mouseX - rect.left}px`;
            wave.style.top = `${mouseY - rect.top}px`;
            (entry.target as HTMLElement).style.position = "relative";
            entry.target.appendChild(wave);
            setTimeout(() => wave.remove(), 900);
          }
        });
      },
      { threshold: 0.15 }
    );

    const observeSections = () => {
      document
        .querySelectorAll(
          ".l-problem, .l-preview-section, .l-features, .l-founder, .l-debate, .l-news, .l-cta-final, .l-download, .app-main section, .app-main .card"
        )
        .forEach((s) => {
          if (!shockwaveShown.has(s)) shockObs.observe(s);
        });
    };
    observeSections();
    const shockMut = new MutationObserver(observeSections);
    shockMut.observe(document.body, { childList: true, subtree: true });
    cleanups.push(() => {
      shockObs.disconnect();
      shockMut.disconnect();
    });

    // ══════════════════════════════════════════
    // ── NEW EFFECT 1: Click Confetti Burst ──
    // ══════════════════════════════════════════
    const CONFETTI_COUNT = 24;
    const confettiPool: HTMLDivElement[] = [];
    const confettiContainer = document.createElement("div");
    confettiContainer.style.cssText =
      "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;overflow:hidden;";
    document.body.appendChild(confettiContainer);
    cleanups.push(() => confettiContainer.remove());

    for (let i = 0; i < CONFETTI_COUNT; i++) {
      const p = document.createElement("div");
      p.className = "g-confetti-particle";
      confettiContainer.appendChild(p);
      confettiPool.push(p);
    }

    const confettiColors = [
      "#c8ff3d",
      "#ff5b3d",
      "#a855f7",
      "#38bdf8",
      "#fb923c",
      "#f472b6",
    ];
    const onConfettiClick = (e: MouseEvent) => {
      for (let i = 0; i < CONFETTI_COUNT; i++) {
        const p = confettiPool[i];
        const angle = (Math.PI * 2 * i) / CONFETTI_COUNT + (Math.random() - 0.5) * 0.5;
        const velocity = 80 + Math.random() * 160;
        const dx = Math.cos(angle) * velocity;
        const dy = Math.sin(angle) * velocity - 60; // upward bias
        const size = 4 + Math.random() * 6;
        const color =
          confettiColors[Math.floor(Math.random() * confettiColors.length)];
        const rotation = Math.random() * 720 - 360;
        const isRect = Math.random() > 0.5;

        p.style.cssText = `
          position:absolute;pointer-events:none;
          left:${e.clientX}px;top:${e.clientY}px;
          width:${isRect ? size * 2.5 : size}px;height:${size}px;
          background:${color};
          border-radius:${isRect ? "2px" : "50%"};
          opacity:1;
          transform:translate(0,0) rotate(0deg) scale(1);
          transition:none;
        `;
        void p.offsetWidth;
        p.style.transition =
          "transform 1s cubic-bezier(.15,.8,.3,1), opacity 1s ease";
        p.style.transform = `translate(${dx}px,${dy}px) rotate(${rotation}deg) scale(0.2)`;
        p.style.opacity = "0";
      }
    };
    window.addEventListener("click", onConfettiClick);
    cleanups.push(() =>
      window.removeEventListener("click", onConfettiClick)
    );

    // ══════════════════════════════════════════════
    // ── NEW EFFECT 2: Text Wave on Heading Hover ──
    // ══════════════════════════════════════════════
    const waveTargets = new WeakSet<HTMLElement>();
    const WAVE_SELECTOR = "h1, h2, h3";

    const attachWave = (el: HTMLElement) => {
      if (waveTargets.has(el)) return;
      // Skip if already wrapped or has complex children (images, svgs, etc.)
      if (
        el.querySelector("img, svg, canvas, video") ||
        el.dataset.waved === "1"
      )
        return;
      // Don't wrap if text content is too short or element has many child elements
      const text = el.textContent || "";
      if (text.length < 3 || text.length > 200) return;
      waveTargets.add(el);
      el.dataset.waved = "1";

      // Wrap each character in a span
      let charIdx = 0;
      const wrapChars = (node: Node): Node[] => {
        if (node.nodeType === Node.TEXT_NODE) {
          const frag: Node[] = [];
          const txt = node.textContent || "";
          for (let i = 0; i < txt.length; i++) {
            if (/\s/.test(txt[i])) {
              // Preserve whitespace — use a span with pre to prevent collapse
              const ws = document.createElement("span");
              ws.innerHTML = "&nbsp;";
              ws.style.display = "inline-block";
              ws.style.width = "0.3em";
              frag.push(ws);
              charIdx++;
              continue;
            }
            const span = document.createElement("span");
            span.className = "g-wave-char";
            span.textContent = txt[i];
            span.style.display = "inline-block";
            span.style.transition = `transform 0.4s cubic-bezier(.22,1,.36,1) ${charIdx * 18}ms`;
            charIdx++;
            frag.push(span);
          }
          return frag;
        }
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          !(node as HTMLElement).querySelector("img, svg")
        ) {
          const el = node as HTMLElement;
          const children = Array.from(el.childNodes);
          const newChildren: Node[] = [];
          children.forEach((c) => {
            newChildren.push(...wrapChars(c));
          });
          el.textContent = "";
          newChildren.forEach((c) => el.appendChild(c));
        }
        return [node];
      };

      charIdx = 0;
      const origHTML = el.innerHTML;
      const children = Array.from(el.childNodes);
      el.innerHTML = "";
      children.forEach((c) => {
        const wrapped = wrapChars(c);
        wrapped.forEach((w) => el.appendChild(w));
      });

      el.addEventListener("mouseenter", () => {
        const chars = el.querySelectorAll<HTMLSpanElement>(".g-wave-char");
        chars.forEach((ch, i) => {
          ch.style.transform = "translateY(-6px)";
          setTimeout(() => {
            ch.style.transform = "translateY(0)";
          }, 120 + i * 18);
        });
      });
    };

    const initWaves = () => {
      document
        .querySelectorAll<HTMLElement>(WAVE_SELECTOR)
        .forEach(attachWave);
    };
    // Delay to let page render first
    const waveTimer = setTimeout(initWaves, 800);
    const waveMut = new MutationObserver(() => {
      setTimeout(initWaves, 300);
    });
    waveMut.observe(document.body, { childList: true, subtree: true });
    cleanups.push(() => {
      clearTimeout(waveTimer);
      waveMut.disconnect();
    });

    // ════════════════════════════════════════════════════
    // ── NEW EFFECT 3: Section Background Gradient Follow ──
    // ════════════════════════════════════════════════════
    const gradientSections = new WeakSet<HTMLElement>();
    const attachGradientFollow = (section: HTMLElement) => {
      if (gradientSections.has(section)) return;
      gradientSections.add(section);
      section.addEventListener("mousemove", (e: MouseEvent) => {
        const rect = section.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        section.style.setProperty("--gf-x", `${x}%`);
        section.style.setProperty("--gf-y", `${y}%`);
      });
    };

    const GRADIENT_SECTIONS_SEL =
      "section, .l-problem, .l-preview-section, .l-features, .l-founder, .l-debate, .l-news, .l-cta-final, .l-download, .app-main, main";
    const initGradientFollow = () => {
      document
        .querySelectorAll<HTMLElement>(GRADIENT_SECTIONS_SEL)
        .forEach(attachGradientFollow);
    };
    initGradientFollow();
    const gradMut = new MutationObserver(initGradientFollow);
    gradMut.observe(document.body, { childList: true, subtree: true });
    cleanups.push(() => gradMut.disconnect());

    // ═══════════════════════════════════════════════════
    // ── NEW EFFECT 4: Magnetic Everything (pills, tags) ──
    // ═══════════════════════════════════════════════════
    const magnetMap = new WeakMap<HTMLElement, { reset: () => void }>();
    const MAGNET_SELECTOR =
      ".chip, .pill, .badge, .tag, .sport-chip, .l-section-tag, .l-evidence-chip, .l-ticker-item, .l-download-stat, .l-btn-orange, .l-btn-lime, .l-btn-dark, [class*='pill'], [class*='chip'], [class*='badge'], [class*='tag']";
    const MAGNET_RADIUS = 60;

    let magnetRaf: number;
    const magnetElements: HTMLElement[] = [];

    const updateMagnets = () => {
      for (const el of magnetElements) {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = mouseX - cx;
        const dy = mouseY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAGNET_RADIUS) {
          const force = (1 - dist / MAGNET_RADIUS) * 0.35;
          el.style.transform = `translate(${dx * force}px, ${dy * force}px)`;
          el.style.transition = "transform 0.15s ease-out";
        } else if (el.style.transform) {
          el.style.transform = "";
          el.style.transition = "transform 0.5s cubic-bezier(.22,1,.36,1)";
        }
      }
      magnetRaf = requestAnimationFrame(updateMagnets);
    };

    const initMagnets = () => {
      document.querySelectorAll<HTMLElement>(MAGNET_SELECTOR).forEach((el) => {
        if (magnetMap.has(el)) return;
        magnetElements.push(el);
        magnetMap.set(el, {
          reset: () => {
            el.style.transform = "";
          },
        });
      });
    };
    initMagnets();
    magnetRaf = requestAnimationFrame(updateMagnets);
    const magnetMut = new MutationObserver(initMagnets);
    magnetMut.observe(document.body, { childList: true, subtree: true });
    cleanups.push(() => {
      cancelAnimationFrame(magnetRaf);
      magnetMut.disconnect();
      magnetElements.forEach((el) => {
        el.style.transform = "";
      });
    });

    // ════════════════════════════════════════════════════════
    // ── NEW EFFECT 5: Elastic Hover Bounce on cards/buttons ──
    // ════════════════════════════════════════════════════════
    const bounceMap = new WeakSet<HTMLElement>();
    const BOUNCE_SELECTOR =
      ".card, .l-feat-card, .l-news-card, .l-debate-post, .l-sport-card, button, .l-btn-orange, .l-btn-lime, .l-btn-dark, .l-download-badge";

    const attachBounce = (el: HTMLElement) => {
      if (bounceMap.has(el)) return;
      bounceMap.add(el);
      el.classList.add("g-elastic-bounce");
    };

    const initBounce = () => {
      document
        .querySelectorAll<HTMLElement>(BOUNCE_SELECTOR)
        .forEach(attachBounce);
    };
    initBounce();
    const bounceMut = new MutationObserver(initBounce);
    bounceMut.observe(document.body, { childList: true, subtree: true });
    cleanups.push(() => bounceMut.disconnect());

    // ══════════════════════════════════════════════════════
    // ── NEW EFFECT 6: Cursor Color Shift Per Section ──
    // ══════════════════════════════════════════════════════
    const sectionColors: Record<string, string> = {
      "l-hero": "#c8ff3d", // lime
      "l-problem": "#ff5b3d", // orange
      "l-sports-carousel": "#38bdf8", // blue
      "l-preview-section": "#a855f7", // purple
      "l-features": "#fb923c", // amber
      "l-founder": "#f472b6", // pink
      "l-debate": "#c8ff3d", // lime
      "l-news": "#ff5b3d", // orange
      "l-cta-final": "#a855f7", // purple
      "l-download": "#c8ff3d", // lime
      // Dashboard & mobile fallback
      "app-main": "#c8ff3d",
      "dashboard": "#c8ff3d",
    };

    const colorObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            for (const [cls, color] of Object.entries(sectionColors)) {
              if (el.classList.contains(cls)) {
                currentSectionColor = color;
                customCursor.style.borderColor = color;
                break;
              }
            }
          }
        });
      },
      { threshold: 0.3 }
    );

    const initColorSections = () => {
      const selectors = Object.keys(sectionColors)
        .map((c) => `.${c}`)
        .join(", ");
      document.querySelectorAll(selectors).forEach((s) => colorObs.observe(s));
    };
    initColorSections();
    const colorMut = new MutationObserver(initColorSections);
    colorMut.observe(document.body, { childList: true, subtree: true });
    cleanups.push(() => {
      colorObs.disconnect();
      colorMut.disconnect();
    });

    // ═══════════════════════════════════════════════════
    // ── NEW EFFECT 7: Image Parallax Inner Movement ──
    // ═══════════════════════════════════════════════════
    const parallaxImages = new WeakSet<HTMLElement>();
    const IMG_PARALLAX_SEL = "img, .l-founder-portrait, .l-preview-img, .l-news-thumb, .news-thumb, .match-img";

    const attachImageParallax = (el: HTMLElement) => {
      if (parallaxImages.has(el)) return;
      // Skip tiny images and icons
      if (el.offsetWidth < 80 || el.offsetHeight < 80) return;
      parallaxImages.add(el);
      el.style.overflow = "hidden";
      el.classList.add("g-img-parallax");
      el.addEventListener("mousemove", (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.setProperty("--img-px", `${x * -8}px`);
        el.style.setProperty("--img-py", `${y * -8}px`);
      });
      el.addEventListener("mouseleave", () => {
        el.style.setProperty("--img-px", "0px");
        el.style.setProperty("--img-py", "0px");
      });
    };

    const initImgParallax = () => {
      document
        .querySelectorAll<HTMLElement>(IMG_PARALLAX_SEL)
        .forEach(attachImageParallax);
    };
    setTimeout(initImgParallax, 500);
    const imgMut = new MutationObserver(() =>
      setTimeout(initImgParallax, 200)
    );
    imgMut.observe(document.body, { childList: true, subtree: true });
    cleanups.push(() => imgMut.disconnect());

    // ══════════════════════════════════════════════════
    // ── NEW EFFECT 8: Hover Ripple on Cards/Buttons ──
    // ══════════════════════════════════════════════════
    const rippleMap = new WeakSet<HTMLElement>();
    const RIPPLE_SELECTOR =
      ".card, .l-feat-card, .l-news-card, .l-debate-post, .l-sport-card, button, .l-btn-orange, .l-btn-lime, .l-btn-dark, a";

    const attachRipple = (el: HTMLElement) => {
      if (rippleMap.has(el)) return;
      rippleMap.add(el);
      el.addEventListener("mouseenter", (e: MouseEvent) => {
        const ring = document.createElement("div");
        ring.className = "g-hover-ripple";
        const rect = el.getBoundingClientRect();
        ring.style.left = `${e.clientX - rect.left}px`;
        ring.style.top = `${e.clientY - rect.top}px`;
        const origPos = getComputedStyle(el).position;
        if (origPos === "static") el.style.position = "relative";
        el.style.overflow = "hidden";
        el.appendChild(ring);
        setTimeout(() => ring.remove(), 700);
      });
    };

    const initRipple = () => {
      document
        .querySelectorAll<HTMLElement>(RIPPLE_SELECTOR)
        .forEach(attachRipple);
    };
    initRipple();
    const rippleMut = new MutationObserver(initRipple);
    rippleMut.observe(document.body, { childList: true, subtree: true });
    cleanups.push(() => rippleMut.disconnect());

    // ════════════════════════════════════════════════
    // ── NEW EFFECT 9: Footer Big Word Reveal ──
    // ════════════════════════════════════════════════
    const footerObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("g-footer-revealed");
          } else {
            (entry.target as HTMLElement).classList.remove("g-footer-revealed");
          }
        });
      },
      { threshold: 0.1 }
    );

    const initFooterReveal = () => {
      document
        .querySelectorAll<HTMLElement>(
          "footer, .l-footer, .footer, [class*='footer']"
        )
        .forEach((f) => {
          f.classList.add("g-footer-dramatic");
          footerObs.observe(f);
        });
    };
    initFooterReveal();
    const footerMut = new MutationObserver(initFooterReveal);
    footerMut.observe(document.body, { childList: true, subtree: true });
    cleanups.push(() => {
      footerObs.disconnect();
      footerMut.disconnect();
    });

    // ══════════════════════════════════════════════
    // ── NEW EFFECT 10: Click-and-Hold Charge ──
    // ══════════════════════════════════════════════
    const chargeRing = document.createElement("div");
    chargeRing.className = "g-charge-ring";
    document.body.appendChild(chargeRing);
    cleanups.push(() => chargeRing.remove());

    let chargeTimer: ReturnType<typeof setTimeout> | null = null;
    let chargeStartTime = 0;
    let chargeRaf2: number;
    let isCharging = false;

    const onChargeDown = (e: MouseEvent) => {
      // Only on buttons/interactive elements
      const target = e.target as HTMLElement;
      if (
        !target.closest(
          "button, a, [role='button'], .l-btn-orange, .l-btn-lime, .l-btn-dark, .card"
        )
      )
        return;

      chargeStartTime = performance.now();
      isCharging = true;
      chargeRing.style.left = `${e.clientX}px`;
      chargeRing.style.top = `${e.clientY}px`;
      chargeRing.style.opacity = "1";
      chargeRing.style.transition = "none";

      const updateCharge = () => {
        if (!isCharging) return;
        const elapsed = performance.now() - chargeStartTime;
        const progress = Math.min(elapsed / 1000, 1); // 1s to full charge
        const size = 20 + progress * 40;
        chargeRing.style.width = `${size}px`;
        chargeRing.style.height = `${size}px`;
        chargeRing.style.borderWidth = `${2 + progress * 3}px`;
        chargeRing.style.borderColor = `hsl(${70 + progress * 30}, 100%, ${50 + progress * 10}%)`;

        if (progress >= 1) {
          // Full charge — pulse!
          chargeRing.classList.add("g-charge-pulse");
          const btn = target.closest(
            "button, a, [role='button'], .l-btn-orange, .l-btn-lime, .l-btn-dark"
          );
          if (btn) {
            (btn as HTMLElement).style.boxShadow =
              "0 0 30px rgba(200,255,61,0.5)";
            setTimeout(() => {
              (btn as HTMLElement).style.boxShadow = "";
            }, 600);
          }
          return;
        }
        chargeRaf2 = requestAnimationFrame(updateCharge);
      };
      chargeRaf2 = requestAnimationFrame(updateCharge);
    };

    const onChargeUp = () => {
      isCharging = false;
      cancelAnimationFrame(chargeRaf2);
      chargeRing.style.transition = "opacity 0.3s, width 0.3s, height 0.3s";
      chargeRing.style.opacity = "0";
      chargeRing.style.width = "0";
      chargeRing.style.height = "0";
      chargeRing.classList.remove("g-charge-pulse");
    };

    window.addEventListener("mousedown", onChargeDown);
    window.addEventListener("mouseup", onChargeUp);
    window.addEventListener("mouseleave", onChargeUp);
    cleanups.push(() => {
      window.removeEventListener("mousedown", onChargeDown);
      window.removeEventListener("mouseup", onChargeUp);
      window.removeEventListener("mouseleave", onChargeUp);
      if (chargeTimer) clearTimeout(chargeTimer);
      cancelAnimationFrame(chargeRaf2);
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
