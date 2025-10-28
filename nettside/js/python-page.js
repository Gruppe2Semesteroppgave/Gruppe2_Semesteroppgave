// python-page.js
// Reveal-on-scroll, fullscreen for images, optional lightbox, and back-to-top.
// (C) Regnbyen Bergen A/S – DAT111/ING100 2025

document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // 1) Reveal on scroll
  // =========================
  const setupReveal = () => {
    const els = document.querySelectorAll(".section, .card");
    els.forEach(el => el.classList.add("reveal"));

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) e.target.classList.add("is-visible");
        });
      },
      { threshold: 0.18 }
    );

    els.forEach(el => io.observe(el));
  };

  // =========================
  // 2) Fullscreen (same page)
  //    - Click .js-fullscreen on any <img>
  //    - If inside .fs-frame, fullscreen the frame (figure/card)
  //    - Else, fullscreen the image itself
  // =========================
  // Fullscreen: only the clicked image goes fullscreen
const setupFullscreen = () => {
  const enterFS = el =>
    el.requestFullscreen?.() ||
    el.webkitRequestFullscreen?.() ||
    el.msRequestFullscreen?.();

  const exitFS = () =>
    document.exitFullscreen?.() ||
    document.webkitExitFullscreen?.() ||
    document.msExitFullscreen?.();

  document.querySelectorAll("img.js-fullscreen").forEach(img => {
    img.style.cursor = "zoom-in";
    img.addEventListener("click", async (e) => {
      e.stopPropagation();
      try {
        const inFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
        if (inFS) {
          await exitFS();
        } else {
          await enterFS(img);            
        }
      } catch (err) {
        console.warn("Fullscreen failed:", err);
      }
    });
  });

  document.addEventListener("fullscreenchange", () => {
    const on = !!(document.fullscreenElement || document.webkitFullscreenElement);
    document.querySelectorAll("img.js-fullscreen").forEach(img => {
      img.style.cursor = on ? "zoom-out" : "zoom-in";
    });
  });
};

  // =========================
  // 3) Optional Lightbox
  //    - Only for .js-lightbox images
  //    - Skips if image also has .js-fullscreen (to avoid conflicts)
  // =========================
  const setupLightbox = () => {
    const lb = document.createElement("div");
    lb.className = "lightbox";
    lb.tabIndex = -1;
    const lbImg = document.createElement("img");
    lb.appendChild(lbImg);
    document.body.appendChild(lb);

    const open = src => {
      lbImg.src = src;
      lb.classList.add("show");
      lb.focus();
    };
    const close = () => lb.classList.remove("show");

    // Close on overlay click or ESC
    lb.addEventListener("click", close);
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") close();
    });

    // Bind only to .js-lightbox that do NOT have .js-fullscreen
    document.querySelectorAll("img.js-lightbox").forEach(img => {
      if (img.classList.contains("js-fullscreen")) return; // fullscreen wins
      img.style.cursor = "zoom-in";
      img.addEventListener("click", () => open(img.src));
    });
  };

  // =========================
  // 4) Back-to-top button
  // =========================
  const setupBackToTop = () => {
    const btn = document.getElementById("toTopBtn");
    if (!btn) return;
    const onScroll = () => {
      btn.style.display = window.scrollY > 300 ? "block" : "none";
    };
    window.addEventListener("scroll", onScroll);
    btn.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );
    onScroll();
  };

  // =========================
  // 5) Toggle "open all details" (if a button exists)
  //    <button id="toggleDetails">Åpne alle</button>
  // =========================
  const setupToggleDetails = () => {
    const btn = document.getElementById("toggleDetails");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const openAll = btn.textContent.includes("Åpne");
      document
        .querySelectorAll(".cards.gallery details, .info-panels details")
        .forEach(d => (d.open = openAll));
      btn.textContent = openAll ? "Lukk alle" : "Åpne alle";
    });
  };

  // Run all
  setupReveal();
  setupFullscreen();
  setupLightbox();
  setupBackToTop();
  setupToggleDetails();
});
