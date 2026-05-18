const accordions = document.querySelectorAll(".accordion");
accordions.forEach((acc) => {
  acc.addEventListener("click", function () {
    const isExpanded = this.getAttribute("aria-expanded") === "true";
    this.setAttribute("aria-expanded", !isExpanded);
    this.classList.toggle("active");
    const panel = this.nextElementSibling;
    if (panel.style.maxHeight) {
      panel.style.maxHeight = null;
    } else {
      expandPanelWithImages(panel);
    }
  });
  acc.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.click();
    }
  });
});

function expandPanelWithImages(panel) {
  const imgs = panel.querySelectorAll("img");
  if (!imgs.length) {
    panel.style.maxHeight = panel.scrollHeight + "px";
    return;
  }
  const unloaded = Array.from(imgs).filter((img) => !img.complete);
  if (!unloaded.length) {
    panel.style.maxHeight = panel.scrollHeight + "px";
    return;
  }
  const loadPromises = unloaded.map(
    (img) =>
      new Promise((resolve) => {
        const handler = () => {
          img.removeEventListener("load", handler);
          img.removeEventListener("error", handler);
          resolve();
        };
        img.addEventListener("load", handler);
        img.addEventListener("error", handler);
      }),
  );
  panel.style.maxHeight = "100px";
  Promise.all(loadPromises)
    .then(() => {
      setTimeout(() => (panel.style.maxHeight = panel.scrollHeight + "px"), 50);
    })
    .catch(() => {
      setTimeout(
        () => (panel.style.maxHeight = panel.scrollHeight + "px"),
        3000,
      );
    });
}

const header = document.querySelector("main header");
const navLinks = document.querySelectorAll("main header ul li a");
const sections = document.querySelectorAll("main section");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((link) => link.classList.remove("active"));
        const id = entry.target.getAttribute("id");
        const activeLink = document.querySelector(
          `main header ul li a[href="#${id}"]`,
        );
        if (activeLink) activeLink.classList.add("active");
        header.classList.toggle("scrolled", id !== "Home");
      }
    });
  },
  { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
);
sections.forEach((section) => observer.observe(section));

window.addEventListener("load", () => {
  const currentSection = document.querySelector("main section");
  if (currentSection) {
    const id = currentSection.getAttribute("id");
    const link = document.querySelector(`main header ul li a[href="#${id}"]`);
    if (link) link.classList.add("active");
    if (id !== "Home") header.classList.add("scrolled");
  }
});

function randomizeShowcaseSubset() {
  const showcase = document.querySelector(".work-showcase");
  if (!showcase) return;
  showcase.style.opacity = "0";
  showcase.style.pointerEvents = "none";
  const allImages = Array.from(showcase.querySelectorAll("img"));
  if (allImages.length < 1) {
    requestAnimationFrame(() => {
      showcase.style.opacity = "1";
      showcase.style.pointerEvents = "auto";
    });
    return;
  }
  const width = window.innerWidth;
  const count = width <= 577 ? 1 : width <= 1025 ? 2 : 4;
  allImages.forEach((img) => {
    img.classList.remove("visible");
    img.style.transition = "none";
    img.style.transform = "none";
  });
  if (allImages.length <= count) {
    allImages.forEach((img) => img.classList.add("visible"));
    requestAnimationFrame(() => {
      showcase.style.opacity = "1";
      showcase.style.pointerEvents = "auto";
    });
    return;
  }
  const indices = [];
  while (indices.length < count) {
    const r = Math.floor(Math.random() * allImages.length);
    if (!indices.includes(r)) indices.push(r);
  }
  const selected = indices.map((i) => allImages[i]);
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }
  selected.forEach((img) => {
    showcase.appendChild(img);
    img.classList.add("visible");
    if (width > 1025) {
      const rotation = Math.random() * 70 - 35;
      const scale = 0.94 + Math.random() * 0.12;
      img.style.transform = `rotate(${rotation}deg) scale(${scale})`;
    }
  });
  requestAnimationFrame(() => {
    showcase.style.opacity = "1";
    showcase.style.pointerEvents = "auto";
  });
}

let swapInterval;
let currentVisibleCount = 0;
function startShowcaseSwapper() {
  const width = window.innerWidth;
  currentVisibleCount = width <= 577 ? 1 : width <= 1025 ? 2 : 4;
  randomizeShowcaseSubset();
  if (swapInterval) clearInterval(swapInterval);
  swapInterval = setInterval(randomizeShowcaseSubset, 2000);
}
document.addEventListener("DOMContentLoaded", startShowcaseSwapper);

let showcaseResizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(showcaseResizeTimer);
  showcaseResizeTimer = setTimeout(() => {
    const width = window.innerWidth;
    const newCount = width <= 577 ? 1 : width <= 1025 ? 2 : 4;
    if (newCount !== currentVisibleCount) {
      clearInterval(swapInterval);
      startShowcaseSwapper();
    }
  }, 200);
});

document.querySelectorAll("main header ul li a").forEach((link) => {
  link.addEventListener("click", (e) => {
    if (link.getAttribute("href").startsWith("#")) {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute("href"));
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

(function () {
  const btn = document.createElement("button");
  btn.className = "project-back-to-top";
  btn.innerHTML = "↑ PROJECT TOP";
  btn.setAttribute("aria-label", "Scroll back to project header");
  document.body.appendChild(btn);
  btn.onclick = (e) => {
    e.preventDefault();
    const currentActive = document.querySelector(".accordion.active");
    if (currentActive)
      currentActive.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const headers = document.querySelectorAll(".accordion");
  let ticking = false;
  function updateButton() {
    let activePanel = null;
    for (const h of headers) {
      if (h.classList.contains("active")) {
        activePanel = h.nextElementSibling;
        break;
      }
    }
    if (!activePanel) {
      btn.classList.remove("visible");
      ticking = false;
      return;
    }
    const rect = activePanel.getBoundingClientRect();
    if (rect.top < -100 && rect.bottom > window.innerHeight + 200) {
      btn.classList.add("visible");
    } else {
      btn.classList.remove("visible");
    }
    ticking = false;
  }
  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(updateButton);
      ticking = true;
    }
  });
  updateButton();
  window.addEventListener("resize", updateButton);
})();

function recalcPanelHeight(panel) {
  if (!panel) return;
  panel.style.transition = "none";
  panel.style.maxHeight = panel.scrollHeight + "px";
  requestAnimationFrame(() => {
    panel.style.transition = "max-height 0.8s cubic-bezier(0.4, 0, 0.2, 1)";
  });
}

if ("ResizeObserver" in window) {
  const panelObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const panel = entry.target;
      if (panel.style.maxHeight && panel.style.maxHeight !== "0px") {
        recalcPanelHeight(panel);
      }
    }
  });
  document
    .querySelectorAll(".panel")
    .forEach((panel) => panelObserver.observe(panel));
}

let accordionResizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(accordionResizeTimeout);
  accordionResizeTimeout = setTimeout(() => {
    document.querySelectorAll(".accordion.active").forEach((acc) => {
      const panel = acc.nextElementSibling;
      if (panel && panel.style.maxHeight && panel.style.maxHeight !== "0px") {
        recalcPanelHeight(panel);
      }
    });
  }, 150);
});

document.addEventListener("transitionend", (e) => {
  if (e.propertyName === "max-height" && e.target.classList.contains("panel")) {
    const panel = e.target;
    if (panel.scrollHeight > parseInt(panel.style.maxHeight)) {
      recalcPanelHeight(panel);
    }
  }
});
