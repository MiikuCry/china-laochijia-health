(function () {
  // Copyright (c) 2026 MiikuCry. Personal project signature retained.
  const body = document.body;
  const isGuidePage = body.classList.contains("page-guide");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const densityKey = "nutrition_density_mode";
  const disclaimerKey = "nutrition_disclaimer_seen";

  const safeGet = (storage, key, fallback = null) => {
    try {
      return storage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  };
  const safeSet = (storage, key, value) => {
    try {
      storage.setItem(key, value);
    } catch {
      // ignore storage failures in restricted environments
    }
  };

  const savedDensity = safeGet(localStorage, densityKey, "comfortable");
  if (savedDensity === "compact") {
    body.classList.add("density-compact");
  }

  window.addEventListener("load", () => {
    body.classList.add("page-ready");
  });
  requestAnimationFrame(() => body.classList.add("page-ready"));

  window.addEventListener(
    "scroll",
    () => {
      body.classList.toggle("page-scrolled", window.scrollY > 12);
    },
    { passive: true }
  );

  if (!prefersReducedMotion) {
    document.querySelectorAll('a[href]').forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || link.target === "_blank") {
        return;
      }
      if (/^(mailto:|tel:|javascript:)/i.test(href)) {
        return;
      }
      link.addEventListener("click", (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          return;
        }
        const isSameOrigin = !href.startsWith("http://") && !href.startsWith("https://");
        if (!isSameOrigin) {
          return;
        }
        event.preventDefault();
        body.classList.add("page-leaving");
        setTimeout(() => {
          window.location.href = href;
        }, 200);
      });
    });
  }

  if (window.matchMedia("(pointer: fine)").matches) {
    const glow = document.createElement("div");
    glow.className = "cursor-glow";
    document.body.appendChild(glow);

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;

    window.addEventListener("mousemove", (event) => {
      tx = event.clientX;
      ty = event.clientY;
      glow.style.opacity = "1";
    });

    window.addEventListener("mouseout", () => {
      glow.style.opacity = "0";
    });

    function animate() {
      x += (tx - x) * 0.14;
      y += (ty - y) * 0.14;
      glow.style.transform = `translate(${x - 110}px, ${y - 110}px)`;
      requestAnimationFrame(animate);
    }
    animate();
  }

  if (!isGuidePage) {
    const switcher = document.createElement("div");
    switcher.className = "density-switcher";
    switcher.innerHTML = `
      <span>卡片密度</span>
      <select id="densityMode">
        <option value="comfortable">舒适</option>
        <option value="compact">紧凑</option>
      </select>
    `;
    document.body.appendChild(switcher);
    const densitySelect = document.getElementById("densityMode");
    densitySelect.value = savedDensity;
    densitySelect.addEventListener("change", () => {
      const mode = densitySelect.value;
      body.classList.toggle("density-compact", mode === "compact");
      safeSet(localStorage, densityKey, mode);
    });
  }

  const disclaimerModal = document.getElementById("disclaimerModal");
  const closeDisclaimerBtn = document.getElementById("closeDisclaimerBtn");
  if (disclaimerModal && closeDisclaimerBtn) {
    const alreadySeen = safeGet(sessionStorage, disclaimerKey, "0") === "1";
    if (!alreadySeen) {
      disclaimerModal.classList.add("show");
      disclaimerModal.setAttribute("aria-hidden", "false");
    }
    const closeModal = () => {
      disclaimerModal.classList.remove("show");
      disclaimerModal.setAttribute("aria-hidden", "true");
      safeSet(sessionStorage, disclaimerKey, "1");
    };
    closeDisclaimerBtn.addEventListener("click", closeModal);
    disclaimerModal.addEventListener("click", (event) => {
      if (event.target === disclaimerModal) {
        closeModal();
      }
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && disclaimerModal.classList.contains("show")) {
        closeModal();
      }
    });
  }

  const antiTheftBadge = document.createElement("div");
  antiTheftBadge.className = "anti-theft-badge";
  antiTheftBadge.textContent = "Made by MiikuCry · github.com/MiikuCry";
  document.body.appendChild(antiTheftBadge);

  console.log(
    "%c中国胃老吃家饮食健康站 · 版权所有 MiikuCry",
    "color:#3a63d8;font-weight:700;font-size:14px;"
  );
  console.log(
    "%cAuthor: MiikuCry | GitHub: https://github.com/MiikuCry",
    "color:#4f6696;font-size:12px;"
  );

  const revealTargets = document.querySelectorAll(".panel, .index-card, .kpi, .site-footer");
  if (!prefersReducedMotion && "IntersectionObserver" in window && revealTargets.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealTargets.forEach((el) => {
      el.classList.add("reveal");
      observer.observe(el);
    });
  } else {
    revealTargets.forEach((el) => el.classList.add("in"));
  }
})();
