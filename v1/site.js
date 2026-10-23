(function () {
  "use strict";

  const storageKey = "cicek-site-draft-v1";
  const themeStorageKey = "cicek-site-theme-version-v1";
  const content = JSON.parse(JSON.stringify(window.CICEK_SITE_CONTENT || {}));
  let slideIndex = 0;
  let activeContent = content;

  function getValue(path, root = content) {
    return path.split(".").reduce((value, key) => value == null ? undefined : value[key], root);
  }

  function migrateLegacyDraft(saved) {
    if (saved?._schemaVersion === content._schemaVersion) return saved;
    const merge = (target, source) => {
      Object.keys(source || {}).forEach((key) => {
        if (Array.isArray(source[key]) && Array.isArray(target[key])) {
          source[key].forEach((value, index) => {
            if (value && typeof value === "object" && !Array.isArray(value) && target[key][index] && typeof target[key][index] === "object") merge(target[key][index], value);
            else target[key][index] = value;
          });
        } else if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
          if (!target[key] || typeof target[key] !== "object") target[key] = {};
          merge(target[key], source[key]);
        } else target[key] = source[key];
      });
      return target;
    };
    const migrated = merge(JSON.parse(JSON.stringify(content)), saved || {});
    if (Array.isArray(saved?.projects?.items)) {
      const items = JSON.parse(JSON.stringify(content.projects.items));
      saved.projects.items.forEach((project, index) => {
        const normalizedTitle = String(project.title || "").toLocaleLowerCase("tr-TR");
        let targetIndex = items.findIndex((item) => String(item.title || "").toLocaleLowerCase("tr-TR") === normalizedTitle);
        if (targetIndex < 0 && normalizedTitle) targetIndex = items.findIndex((item) => String(item.title || "").toLocaleLowerCase("tr-TR").split(" ")[0] === normalizedTitle.split(" ")[0]);
        if (targetIndex < 0) targetIndex = index;
        if (items[targetIndex]) items[targetIndex] = { ...items[targetIndex], ...project };
        else items.push(project);
      });
      migrated.projects.items = items;
    }
    const defaultImage = content.hero.slides[0].image;
    if (!saved?.brand?.logo) migrated.brand.logo = content.brand.logo;
    if (/^assets\/(?:3\.jpg|projects\/)/i.test(migrated.hero.image || "")) migrated.hero.image = defaultImage;
    (migrated.hero.slides || []).forEach((slide) => { if (/^assets\/(?:3\.jpg|projects\/)/i.test(slide.image || "")) slide.image = defaultImage; });
    (migrated.projects.items || []).forEach((project) => { if (/^assets\/projects\//i.test(project.image || "")) project.image = defaultImage; });
    migrated._schemaVersion = content._schemaVersion;
    return migrated;
  }

  function isSafeImage(value) {
    return typeof value === "string" && (/^(https?:\/\/|data:image\/(?:png|jpe?g|webp|gif);base64,|assets\/|\.\/)/i).test(value.trim());
  }

  function isSafeLink(value) {
    return typeof value === "string" && (/^(https?:\/\/|tel:|mailto:|#|\.\/)/i).test(value.trim());
  }

  function updateCompanyLinkTargets() {
    const target = window.matchMedia("(max-width: 650px)").matches ? "_self" : "_blank";
    document.querySelectorAll("[data-company-link]").forEach((link) => { link.target = target; });
  }
  function applyContent(data, ignoreSavedTheme = false) {
    if (data?.partner?.url === "https://www.ortadirek.com.tr") data.partner.url = "http://www.ortadirek.com.tr";    if (data?.footer) {
      if (data.footer.link1Url === "#hakkimizda") data.footer.link1Url = "index.html#hakkimizda";
      if (data.footer.link2Url === "#hizmetler") data.footer.link2Url = "index.html#hizmetler";
      if (data.footer.link3Url === "#iletisim") data.footer.link3Url = "contact.html";
    }
    activeContent = data;
    document.querySelectorAll("[data-content]").forEach((element) => {
      const value = getValue(element.dataset.content, data);
      if (typeof value === "string" || typeof value === "number") element.textContent = String(value);
    });

    document.querySelectorAll("[data-image]").forEach((element) => {
      let value = getValue(element.dataset.image, data);
      if (element.dataset.image === "brand.logo" && !value) {
        element.removeAttribute("src");
        element.closest(".brand")?.classList.remove("has-logo");
        return;
      }
      if (element.dataset.image === "footer.semtaLogo" && !value) {
        element.removeAttribute("src");
        element.closest(".semtasoft-credit")?.classList.remove("has-logo");
        return;
      }
      if (!isSafeImage(value)) return;
      value = value.trim();
      if (element instanceof HTMLImageElement) element.src = value;
      else element.style.backgroundImage = `url("${value.replace(/["\\\n\r]/g, "")}")`;
      if (element.dataset.image === "brand.logo") element.closest(".brand")?.classList.add("has-logo");
      if (element.dataset.image === "footer.semtaLogo") element.closest(".semtasoft-credit")?.classList.add("has-logo");
    });

    document.querySelectorAll("[data-href]").forEach((element) => {
      const key = element.dataset.href;
      let value = getValue(key, data);
      if (key === "contact.phoneLink") {
        const digits = String(getValue("contact.phone", data) || "").replace(/\D/g, "");
        value = digits ? `tel:+${digits}` : "";
      }
      if (isSafeLink(value)) element.href = value.trim();
    });
    updateCompanyLinkTargets();
    const settings = data.settings || {};
    populateThemeVersions(settings.versions || []);
    let chosenVersion = "";
    if (!ignoreSavedTheme) {
      try { chosenVersion = localStorage.getItem(themeStorageKey) || ""; } catch (error) { /* Browser storage may be disabled. */ }
    }
    const version = (settings.versions || []).find((item) => item.id === chosenVersion);
    applySettings(version?.settings || settings);
    renderProjects(data);
    renderSlide(slideIndex, false);
  }

  function renderProjects(data) {
    const grid = document.querySelector(".project-grid");
    if (!grid) return;
    const projects = getValue("projects.items", data);
    if (!Array.isArray(projects)) return;
    grid.replaceChildren();
    projects.forEach((project, index) => {
      const card = document.createElement("a");
      card.className = `project-card${index === 0 ? " project-large" : ""}`;
      card.href = "#projeler";
      card.setAttribute("role", "button");
      card.setAttribute("aria-haspopup", "dialog");
      const image = document.createElement("img");
      image.src = isSafeImage(project.image) ? project.image.trim() : "https://i.ibb.co/XrzmF4nz/a61cb4d9a42c.png";
      image.alt = project.title || "Çiçek Elektrik proje referansı";
      image.loading = index < 2 ? "eager" : "lazy";
      image.decoding = "async";
      const overlay = document.createElement("span");
      overlay.className = "project-overlay";
      const info = document.createElement("span");
      info.className = "project-info";
      const category = document.createElement("small");
      category.textContent = project.category || "REFERANS PROJESİ";
      const title = document.createElement("strong");
      title.textContent = project.title || "Proje";
      const detailLine = document.createElement("span");
      const detail = document.createElement("span");
      detail.textContent = project.detail || "";
      const arrow = document.createElement("b");
      arrow.textContent = "↗";
      detailLine.append(detail, arrow);
      info.append(category, title, detailLine);
      card.append(image, overlay, info);
      grid.append(card);
    });
    const count = document.querySelector(".project-count");
    if (count) count.textContent = `01 — ${String(projects.length).padStart(2, "0")}`;
  }

  function bindProjectPopup() {
    const grid = document.querySelector(".project-grid");
    if (!grid) return;
    let activeCard = null;
    const popup = document.createElement("div");
    popup.className = "project-modal";
    popup.hidden = true;
    popup.innerHTML = '<div class="project-modal-backdrop"></div><section class="project-modal-panel" role="dialog" aria-modal="true" aria-labelledby="project-modal-title"><button class="project-modal-close" type="button" aria-label="Kapat">×</button><small class="project-modal-category"></small><h3 id="project-modal-title"></h3><p class="project-modal-detail"></p><img class="project-modal-image" alt=""></section>';
    document.body.append(popup);
    const close = () => { popup.hidden = true; activeCard = null; };
    popup.querySelector(".project-modal-close").addEventListener("click", close);
    popup.querySelector(".project-modal-panel").addEventListener("click", close);
    popup.querySelector(".project-modal-backdrop").addEventListener("click", close);
    grid.addEventListener("click", (event) => {
      const card = event.target.closest(".project-card");
      if (!card) return;
      event.preventDefault();
      if (!popup.hidden && activeCard === card) { close(); return; }
      activeCard = card;
      popup.querySelector(".project-modal-category").textContent = card.querySelector(".project-info small")?.textContent || "REFERANS PROJESİ";
      popup.querySelector(".project-modal-panel h3").textContent = card.querySelector(".project-info strong")?.textContent || "Proje";
      popup.querySelector(".project-modal-detail").textContent = card.querySelector(".project-info>span>span")?.textContent || "";
      const preview = popup.querySelector(".project-modal-image");
      const sourceImage = card.querySelector("img");
      preview.src = sourceImage?.currentSrc || sourceImage?.src || "";
      preview.alt = sourceImage?.alt || popup.querySelector(".project-modal-panel h3").textContent;
      popup.hidden = false;
    });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !popup.hidden) close(); });
  }
  function applySettings(settings) {
    const root = document.documentElement;
    const safeFonts = ["Segoe UI", "Arial", "Georgia", "Verdana", "Tahoma", "Trebuchet MS", "system-ui"];
    const font = (value) => safeFonts.includes(value) ? `"${value}",system-ui,sans-serif` : '"Segoe UI",system-ui,sans-serif';
    root.style.setProperty("--display", font(settings.displayFont));
    root.style.setProperty("--body", font(settings.bodyFont));
    root.style.setProperty("--hero-title-font", font(settings.heroTitleFont));
    root.style.setProperty("--hero-text-font", font(settings.heroTextFont));
    const bounded = (value, min, max, fallback) => `${Math.max(min, Math.min(max, Number(value) || fallback))}px`;
    root.style.setProperty("--hero-title-size", bounded(settings.heroTitleSize, 44, 120, 86));
    root.style.setProperty("--hero-text-size", bounded(settings.heroTextSize, 10, 28, 14));
    document.body.classList.toggle("references-white-header", settings.headerStyle === "white");
    root.style.setProperty("--brand-logo-width", bounded(settings.brandLogoWidth, 50, 320, 150));
    root.style.setProperty("--footer-logo-width", bounded(settings.footerLogoWidth, 50, 240, 120));
    root.style.setProperty("--semta-logo-width", bounded(settings.semtaLogoWidth, 40, 240, 90));
    ["ink", "forest", "orange", "paper"].forEach((key) => {
      if (/^#[0-9a-f]{6}$/i.test(settings[key] || "")) root.style.setProperty(`--${key}`, settings[key]);
    });
  }

  function populateThemeVersions(versions) {
    const select = document.querySelector(".theme-version-select");
    if (!select) return;
    const previous = select.value;
    select.replaceChildren();
    [{ id: "current", name: "Güncel tema" }, ...versions].forEach((version) => {
      const option = document.createElement("option");
      option.value = version.id;
      option.textContent = version.name;
      select.append(option);
    });
    let stored = "";
    try { stored = localStorage.getItem(themeStorageKey) || ""; } catch (error) { /* Browser storage may be disabled. */ }
    const available = Array.from(select.options).some((option) => option.value === stored);
    select.value = available ? stored : (Array.from(select.options).some((option) => option.value === previous) ? previous : "current");
    select.onchange = () => {
      const version = versions.find((item) => item.id === select.value);
      const settings = activeContent.settings || {};
      applySettings(version?.settings || settings);
      try { localStorage.setItem(themeStorageKey, select.value); } catch (error) { /* Browser storage may be disabled. */ }
    };
  }

  function getSlides(data = activeContent) {
    const slides = getValue("hero.slides", data);
    return Array.isArray(slides) && slides.length ? slides : [data.hero || {}];
  }

  function renderSlide(index, animate = true) {
    const slides = getSlides();
    slideIndex = (index + slides.length) % slides.length;
    const slide = slides[slideIndex] || {};
    const image = document.querySelector(".hero-image");
    if (!image) return;
    const imageUrl = isSafeImage(slide.image) ? slide.image.trim() : "assets/3.jpg";
    image.style.backgroundImage = `url("${imageUrl.replace(/["\\\n\r]/g, "")}")`;
    if (animate) {
      image.classList.remove("zoom-cycle");
      void image.offsetWidth;
      image.classList.add("zoom-cycle");
    }
    const setText = (selector, value, fallback = "") => {
      const element = document.querySelector(selector);
      if (element) element.textContent = String(value ?? fallback);
    };
    setText(".hero-eyebrow-text", slide.eyebrow);
    setText(".hero-title-before", slide.titleBefore);
    setText(".hero-title-accent", slide.titleAccent);
    setText(".hero-title-after", slide.titleAfter);
    setText(".hero-copy", slide.copy);
    setText(".hero-caption-title", slide.captionTitle);
    setText(".hero-caption-detail", slide.captionDetail);
    const current = document.querySelector(".hero-current");
    const total = document.querySelector(".hero-total");
    if (current) current.textContent = String(slideIndex + 1).padStart(2, "0");
    if (total) total.textContent = String(slides.length).padStart(2, "0");
  }

  document.querySelector("#contact-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const message = ["Çiçek Elektrik web sitesi iletişim formu", "Ad: " + fields.get("name"), "Telefon veya e-posta: " + fields.get("reply"), "Konu: " + fields.get("subject"), "Mesaj: " + fields.get("message")].join("\n");
    const status = document.querySelector(".form-status");
    if (status) status.textContent = "WhatsApp açılıyor. Mesajı göndermeden önce kontrol edebilirsiniz.";
    window.open("https://wa.me/902126764000?text=" + encodeURIComponent(message), "_blank", "noopener");
  });

  bindProjectPopup();
  window.addEventListener("resize", updateCompanyLinkTargets, { passive: true });

  document.querySelector(".hero-prev")?.addEventListener("click", () => renderSlide(slideIndex - 1));
  document.querySelector(".hero-next")?.addEventListener("click", () => renderSlide(slideIndex + 1));
  document.querySelector(".hero")?.addEventListener("click", (event) => {
    if (event.target.closest("a, button, .hero-index")) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    renderSlide(event.clientX - bounds.left >= bounds.width / 2 ? slideIndex + 1 : slideIndex - 1);
  });
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.setInterval(() => renderSlide(slideIndex + 1), 7000);
  }

  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) applyContent(migrateLegacyDraft(JSON.parse(saved)));
    else applyContent(content);
  } catch (error) {
    applyContent(content);
  }

  if (new URLSearchParams(window.location.search).has("editorPreview") && window.opener) {
    window.opener.postMessage({ type: "cicek-preview-ready" }, "*");
    window.addEventListener("message", (event) => {
      if (event.source === window.opener && event.data?.type === "cicek-editor-preview") applyContent(event.data.content, true);
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.shiftKey && event.altKey && event.key.toLowerCase() === "e") {
      event.preventDefault();
      window.location.href = "edit.html";
    }
  });
})();








