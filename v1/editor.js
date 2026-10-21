(function () {
  "use strict";

  const storageKey = "cicek-site-draft-v1";
  const defaults = JSON.parse(JSON.stringify(window.CICEK_SITE_CONTENT || {}));
  const form = document.getElementById("editor-form");
  const status = document.getElementById("editor-status");
  let state = JSON.parse(JSON.stringify(defaults));
  let statusTimer;

  const groups = [
    { title: "MARKA VE LOGO", fields: [
      { key: "brand.logo", label: "Logo görseli", type: "image", hint: "İnternet adresi yazın veya bilgisayarınızdan PNG / JPG / WebP seçin." },
      { key: "brand.name", label: "Marka adı" }, { key: "brand.sub", label: "Alt satır" }
    ]},
    { title: "AÇILIŞ SLIDER’I", slides: true },
    { title: "TEMA VE GÖRÜNÜM", themeSettings: true, fields: [
      { key: "settings.displayFont", label: "Başlık font ailesi", type: "select", options: ["Segoe UI", "Arial", "Georgia", "Verdana", "Tahoma", "Trebuchet MS", "system-ui"] },
      { key: "settings.bodyFont", label: "Gövde font ailesi", type: "select", options: ["Segoe UI", "Arial", "Georgia", "Verdana", "Tahoma", "Trebuchet MS", "system-ui"] },
      { key: "settings.heroTitleFont", label: "Slider başlık fontu", type: "select", options: ["Segoe UI", "Arial", "Georgia", "Verdana", "Tahoma", "Trebuchet MS", "system-ui"] },
      { key: "settings.heroTextFont", label: "Slider metin fontu", type: "select", options: ["Segoe UI", "Arial", "Georgia", "Verdana", "Tahoma", "Trebuchet MS", "system-ui"] },
      { key: "settings.heroTitleSize", label: "Slider başlık boyutu (px)", type: "number" },
      { key: "settings.heroTextSize", label: "Slider açıklama boyutu (px)", type: "number" },
      { key: "settings.brandLogoWidth", label: "Üst logo genişliği (px)", type: "number" },
      { key: "settings.footerLogoWidth", label: "Footer logo genişliği (px)", type: "number" },
      { key: "settings.semtaLogoWidth", label: "Semtasoft logo genişliği (px)", type: "number" },
      { key: "settings.ink", label: "Ana metin rengi", type: "color" },
      { key: "settings.forest", label: "Kurumsal koyu renk", type: "color" },
      { key: "settings.orange", label: "Vurgu rengi", type: "color" },
      { key: "settings.paper", label: "Açık zemin rengi", type: "color" }
    ]},
    { title: "HAKKIMIZDA", fields: [
      { key: "about.since", label: "Kuruluş satırı" }, { key: "about.eyebrow", label: "Küçük başlık" },
      { key: "about.titleBefore", label: "Başlık — ilk bölüm" }, { key: "about.titleAccent", label: "Vurgulu bölüm" },
      { key: "about.titleAfter", label: "Başlık — devamı" }, { key: "about.years", label: "Deneyim yılı" },
      { key: "about.copy", label: "Tanıtım metni", type: "textarea", full: true },
      { key: "about.stat", label: "Deneyim alt yazısı", type: "textarea", full: true }
    ]},
    { title: "HİZMETLER", fields: [
      { key: "services.eyebrow", label: "Bölüm üst başlığı" }, { key: "services.note", label: "Kısa açıklama", type: "textarea" },
      { key: "services.titleBefore", label: "Bölüm başlığı — ilk bölüm" }, { key: "services.titleAccent", label: "Vurgulu bölüm" },
      { key: "services.items.0.title", label: "Hizmet 1 — başlık", type: "textarea" }, { key: "services.items.0.copy", label: "Hizmet 1 — açıklama", type: "textarea" },
      { key: "services.items.1.title", label: "Hizmet 2 — başlık", type: "textarea" }, { key: "services.items.1.copy", label: "Hizmet 2 — açıklama", type: "textarea" },
      { key: "services.items.2.title", label: "Hizmet 3 — başlık", type: "textarea" }, { key: "services.items.2.copy", label: "Hizmet 3 — açıklama", type: "textarea" },
      { key: "services.items.3.title", label: "Hizmet 4 — başlık", type: "textarea" }, { key: "services.items.3.copy", label: "Hizmet 4 — açıklama", type: "textarea" }
    ]},
    { title: "PROJE REFERANSLARI", projects: true, fields: [
      { key: "projects.eyebrow", label: "Bölüm üst başlığı" }, { key: "projects.action", label: "Bağlantı yazısı" },
      { key: "projects.titleBefore", label: "Bölüm başlığı — ilk bölüm" }, { key: "projects.titleAccent", label: "Vurgulu bölüm" }
    ]},
    { title: "GRUP ŞİRKETİ", fields: [
      { key: "partner.eyebrow", label: "Üst başlık" }, { key: "partner.title", label: "Şirket adı" },
      { key: "partner.copy", label: "Tanıtım metni", type: "textarea", full: true },
      { key: "partner.linkText", label: "Bağlantı yazısı" }, { key: "partner.url", label: "Web adresi", full: true }
    ]},
    { title: "İLETİŞİM VE ALT BİLGİ", fields: [
      { key: "contact.eyebrow", label: "Üst başlık" }, { key: "contact.copy", label: "Kısa açıklama", type: "textarea" },
      { key: "contact.titleBefore", label: "Başlık — ilk bölüm" }, { key: "contact.titleAccent", label: "Vurgulu bölüm" },
      { key: "contact.address", label: "Adres", type: "textarea", full: true },
      { key: "contact.phone", label: "Telefon" }, { key: "contact.fax", label: "Faks" },
      { key: "contact.mapUrl", label: "Harita bağlantısı", full: true },
      { key: "footer.address", label: "Footer adresi", type: "textarea", full: true },
      { key: "footer.link1Text", label: "Footer bağlantı 1 — yazı" }, { key: "footer.link1Url", label: "Footer bağlantı 1 — adres" },
      { key: "footer.link2Text", label: "Footer bağlantı 2 — yazı" }, { key: "footer.link2Url", label: "Footer bağlantı 2 — adres" },
      { key: "footer.link3Text", label: "Footer bağlantı 3 — yazı" }, { key: "footer.link3Url", label: "Footer bağlantı 3 — adres" },
      { key: "footer.copyright", label: "Telif satırı", full: true },
      { key: "footer.semtaText", label: "Semtasoft imza yazısı" }, { key: "footer.semtaUrl", label: "Semtasoft bağlantı adresi" },
      { key: "footer.semtaLogo", label: "Semtasoft logosu", type: "image", full: true, hint: "İsteğe bağlı logo bağlantısı veya yerel görsel seçin." }
    ]}
  ];

  function get(path, object = state) {
    return path.split(".").reduce((value, key) => value == null ? undefined : value[key], object);
  }

  function set(path, value) {
    const keys = path.split(".");
    const last = keys.pop();
    const target = keys.reduce((object, key, index) => {
      if (object[key] == null) object[key] = /^\d+$/.test(keys[index + 1] || "") ? [] : {};
      return object[key];
    }, state);
    target[last] = value;
  }

  function renderSlides(group) {
    const section = document.createElement("section");
    section.className = "editor-group";
    const heading = document.createElement("div");
    heading.className = "group-title";
    const line = document.createElement("i");
    const title = document.createElement("span");
    title.textContent = group.title;
    heading.append(line, title);
    const body = document.createElement("div");
    body.className = "group-body slide-editor-list";
    const slides = state.hero.slides || (state.hero.slides = []);
    slides.forEach((slide, index) => {
      const card = document.createElement("div");
      card.className = "slide-editor-card field full";
      const cardHead = document.createElement("div");
      cardHead.className = "slide-editor-heading";
      const label = document.createElement("strong");
      label.textContent = `SLAYT ${String(index + 1).padStart(2, "0")}`;
      cardHead.append(label);
      if (slides.length > 1) {
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "slide-remove";
        remove.textContent = "Slaytı sil";
        remove.addEventListener("click", () => { slides.splice(index, 1); renderForm(); });
        cardHead.append(remove);
      }
      card.append(cardHead);
      [
        { key: `hero.slides.${index}.image`, label: "Arka plan görseli", type: "image", full: true, hint: "URL girin veya bilgisayarınızdan görsel seçin." },
        { key: `hero.slides.${index}.eyebrow`, label: "Üst küçük başlık", type: "textarea", full: true },
        { key: `hero.slides.${index}.titleBefore`, label: "Başlık — ilk bölüm" },
        { key: `hero.slides.${index}.titleAccent`, label: "Vurgulu bölüm" },
        { key: `hero.slides.${index}.titleAfter`, label: "Başlık — devamı", type: "textarea", full: true },
        { key: `hero.slides.${index}.copy`, label: "Açıklama", type: "textarea", full: true },
        { key: `hero.slides.${index}.captionTitle`, label: "Görsel etiketi" },
        { key: `hero.slides.${index}.captionDetail`, label: "Görsel alt yazısı" }
      ].forEach((field) => card.append(makeField(field)));
      body.append(card);
    });
    const add = document.createElement("button");
    add.type = "button";
    add.className = "button primary slide-add";
    add.textContent = "+ Yeni slayt ekle";
    add.disabled = slides.length >= 8;
    add.addEventListener("click", () => {
      slides.push({ image: "https://i.ibb.co/XrzmF4nz/a61cb4d9a42c.png", eyebrow: "YENİ BAŞLIK", titleBefore: "Yeni", titleAccent: "başlık", titleAfter: "", copy: "Açıklama metninizi yazın.", captionTitle: "ÇİÇEK ELEKTRİK", captionDetail: "" });
      renderForm();
    });
    body.append(add);
    section.append(heading, body);
    return section;
  }

  function renderProjects(group) {
    const section = document.createElement("section");
    section.className = "editor-group";
    const heading = document.createElement("div");
    heading.className = "group-title";
    const line = document.createElement("i");
    const title = document.createElement("span");
    title.textContent = group.title;
    heading.append(line, title);
    const body = document.createElement("div");
    body.className = "group-body project-editor-list";
    group.fields.forEach((field) => body.append(makeField(field)));
    const projects = state.projects.items || (state.projects.items = []);
    projects.forEach((project, index) => {
      const card = document.createElement("details");
      card.className = "project-editor-card field full";
      if (index < 3) card.open = true;
      const summary = document.createElement("summary");
      summary.className = "project-editor-heading";
      const projectName = document.createElement("strong");
      projectName.textContent = `${String(index + 1).padStart(2, "0")} · ${project.title || "Yeni referans"}`;
      summary.append(projectName);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "slide-remove";
      remove.textContent = "Sil";
      remove.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); projects.splice(index, 1); renderForm(); });
      summary.append(remove);
      card.append(summary);
      [
        { key: `projects.items.${index}.image`, label: "Referans görseli", type: "image", full: true },
        { key: `projects.items.${index}.category`, label: "Kategori / konum" },
        { key: `projects.items.${index}.title`, label: "Proje adı" },
        { key: `projects.items.${index}.detail`, label: "Açıklama", type: "textarea", full: true }
      ].forEach((field) => card.append(makeField(field)));
      body.append(card);
    });
    const add = document.createElement("button");
    add.type = "button";
    add.className = "button primary slide-add";
    add.textContent = "+ Referans ekle";
    add.addEventListener("click", () => {
      projects.push({ category: "REFERANS PROJESİ", title: "Yeni proje", detail: "Proje açıklamasını yazın.", image: "https://i.ibb.co/XrzmF4nz/a61cb4d9a42c.png" });
      renderForm();
    });
    body.append(add);
    section.append(heading, body);
    return section;
  }

  function merge(target, source) {
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
  }

  function showStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle("error", isError);
    status.classList.add("show");
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => status.classList.remove("show"), 3500);
  }

  function renderImagePreview(image, value) {
    const preview = image.closest(".field").querySelector(".image-preview");
    const safeValue = typeof value === "string" && /^(https?:\/\/|data:image\/(?:png|jpe?g|webp|gif);base64,|assets\/|\.\/)/i.test(value.trim());
    if (safeValue) {
      preview.src = value.trim();
      preview.classList.add("visible");
      preview.onerror = () => preview.classList.remove("visible");
    } else {
      preview.removeAttribute("src");
      preview.classList.remove("visible");
    }
  }

  async function fileToWebp(file) {
    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) throw new Error("PNG, JPG, GIF veya WebP görsel seçin.");
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Görsel okunamadı."));
      reader.readAsDataURL(file);
    });
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Görsel açılamadı."));
      img.src = dataUrl;
    });
    const scale = Math.min(1, 1800 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/webp", 0.82);
  }

  function makeField(field) {
    const wrapper = document.createElement("div");
    wrapper.className = `field${field.full ? " full" : ""}`;
    const fieldId = `field-${field.key.replace(/[^a-z0-9]+/gi, "-")}`;
    const caption = document.createElement("label");
    caption.className = "field-label";
    caption.htmlFor = fieldId;
    caption.textContent = field.label;
    wrapper.append(caption);

    if (field.type === "image") {
      const line = document.createElement("span");
      line.className = "image-line";
      const input = document.createElement("input");
      input.type = "text";
      input.id = fieldId;
      input.dataset.field = field.key;
      input.placeholder = "https://… veya assets/gorsel.jpg";
      input.value = get(field.key) || "";
      input.setAttribute("aria-label", `${field.label} adresi`);
      const uploadLabel = document.createElement("label");
      uploadLabel.className = "upload-button";
      uploadLabel.textContent = "Dosya seç";
      const upload = document.createElement("input");
      upload.type = "file";
      upload.accept = "image/png,image/jpeg,image/webp,image/gif";
      upload.dataset.imageFile = field.key;
      uploadLabel.append(upload);
      line.append(input, uploadLabel);
      wrapper.append(line);
      const preview = document.createElement("img");
      preview.className = "image-preview";
      preview.alt = `${field.label} önizlemesi`;
      wrapper.append(preview);
      if (field.hint) {
        const hint = document.createElement("span");
        hint.className = "field-hint";
        hint.textContent = field.hint;
        wrapper.append(hint);
      }
      input.addEventListener("input", () => {
        set(field.key, input.value.trim());
        renderImagePreview(input, input.value);
      });
      upload.addEventListener("change", async () => {
        const [file] = upload.files || [];
        if (!file) return;
        try {
          const imageData = await fileToWebp(file);
          input.value = imageData;
          set(field.key, imageData);
          renderImagePreview(input, imageData);
          showStatus("Görsel eklendi. Kaydetmeyi unutmayın.");
        } catch (error) {
          showStatus(error.message || "Görsel eklenemedi.", true);
        } finally {
          upload.value = "";
        }
      });
      renderImagePreview(input, input.value);
      return wrapper;
    }

    const input = document.createElement(field.type === "textarea" ? "textarea" : field.type === "select" ? "select" : "input");
    if (input instanceof HTMLInputElement) input.type = ["number", "color"].includes(field.type) ? field.type : "text";
    if (input instanceof HTMLSelectElement) field.options.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      input.append(option);
    });
    input.id = fieldId;
    input.dataset.field = field.key;
    input.value = get(field.key) || "";
    input.addEventListener("input", () => set(field.key, input.value));
    wrapper.append(input);
    return wrapper;
  }

  function renderThemeSettings(group) {
    const section = document.createElement("section");
    section.className = "editor-group";
    const heading = document.createElement("div");
    heading.className = "group-title";
    const line = document.createElement("i");
    const title = document.createElement("span");
    title.textContent = group.title;
    heading.append(line, title);
    const body = document.createElement("div");
    body.className = "group-body";
    group.fields.forEach((field) => body.append(makeField(field)));
    const saveField = document.createElement("div");
    saveField.className = "field full version-save-row";
    const label = document.createElement("label");
    label.className = "field-label";
    label.textContent = "Bu ayarları adlandırıp sürüm olarak kaydedin";
    const controls = document.createElement("div");
    controls.className = "image-line";
    const name = document.createElement("input");
    name.type = "text";
    name.placeholder = "Örn. V2 — Açık tema";
    name.setAttribute("aria-label", "Tema sürüm adı");
    const save = document.createElement("button");
    save.type = "button";
    save.className = "button primary";
    save.textContent = "Sürüm kaydet";
    save.addEventListener("click", () => {
      const versionName = name.value.trim();
      if (!versionName) { showStatus("Önce sürüm adı yazın.", true); name.focus(); return; }
      const settings = JSON.parse(JSON.stringify(state.settings));
      delete settings.versions;
      state.settings.versions ||= [];
      if (state.settings.versions.length >= 12) { showStatus("En fazla 12 tema sürümü kaydedilebilir.", true); return; }
      state.settings.versions.push({ id: `theme-${Date.now()}`, name: versionName, settings });
      renderForm();
      showStatus(`“${versionName}” site altındaki görünüm menüsüne eklendi.`);
    });
    controls.append(name, save);
    saveField.append(label, controls);
    body.append(saveField);
    const versionList = document.createElement("div");
    versionList.className = "field full saved-version-list";
    const versionLabel = document.createElement("span");
    versionLabel.className = "field-label";
    versionLabel.textContent = "Kayıtlı görünüm sürümleri";
    versionList.append(versionLabel);
    (state.settings.versions || []).forEach((version, index) => {
      const row = document.createElement("div");
      row.className = "saved-version-row";
      const versionName = document.createElement("button");
      versionName.type = "button";
      versionName.className = "saved-version-preview";
      versionName.textContent = version.name;
      versionName.title = "Bu görünüm ayarlarını yükleyip önizleyin";
      versionName.addEventListener("click", () => {
        state.settings = { ...state.settings, ...JSON.parse(JSON.stringify(version.settings)), versions: state.settings.versions };
        form.querySelectorAll('[data-field^="settings."]').forEach((input) => {
          const path = input.dataset.field.slice("settings.".length);
          input.value = get(`settings.${path}`) ?? "";
        });
        saveDraft(true);
        showStatus(`“${version.name}” yüklendi; site önizlemesi açılıyor.`);
        document.getElementById("preview-button").click();
      });
      row.append(versionName);
      if (state.settings.versions.length > 1) {
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "slide-remove";
        remove.textContent = "Sil";
        remove.addEventListener("click", () => { state.settings.versions.splice(index, 1); renderForm(); });
        row.append(remove);
      }
      versionList.append(row);
    });
    body.append(versionList);
    section.append(heading, body);
    return section;
  }

  function renderForm() {
    form.replaceChildren();
    groups.forEach((group) => {
      if (group.slides) { form.append(renderSlides(group)); return; }
      if (group.themeSettings) { form.append(renderThemeSettings(group)); return; }
      if (group.projects) { form.append(renderProjects(group)); return; }
      const section = document.createElement("section");
      section.className = "editor-group";
      const heading = document.createElement("div");
      heading.className = "group-title";
      const line = document.createElement("i");
      const title = document.createElement("span");
      title.textContent = group.title;
      heading.append(line, title);
      const body = document.createElement("div");
      body.className = "group-body";
      group.fields.forEach((field) => body.append(makeField(field)));
      section.append(heading, body);
      form.append(section);
    });
  }

  function saveDraft(quiet = false) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
      if (!quiet) showStatus("Taslak bu tarayıcıya kaydedildi.");
      return true;
    } catch (error) {
      showStatus("Taslak kaydedilemedi. Görselleri küçültüp yeniden deneyin.", true);
      return false;
    }
  }

  document.getElementById("save-button").addEventListener("click", () => saveDraft());

  document.getElementById("preview-button").addEventListener("click", () => {
    saveDraft(true);
    let previewWindow;
    const onReady = (event) => {
      if (event.source !== previewWindow || event.data?.type !== "cicek-preview-ready") return;
      previewWindow.postMessage({ type: "cicek-editor-preview", content: state }, "*");
      window.removeEventListener("message", onReady);
    };
    window.addEventListener("message", onReady);
    previewWindow = window.open("index.html?editorPreview=1", "_blank");
    if (!previewWindow) {
      window.removeEventListener("message", onReady);
      showStatus("Önizleme açılamadı. Tarayıcı açılır pencereleri engelliyor olabilir.", true);
    }
  });

  document.getElementById("download-button").addEventListener("click", () => {
    const source = `window.CICEK_SITE_CONTENT = ${JSON.stringify(state, null, 2)};\n`;
    const blob = new Blob([source], { type: "text/javascript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "content.js";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    saveDraft(true);
    showStatus("content.js indirildi. Yayına almak için site klasöründekinin yerine koyun.");
  });

  document.getElementById("reset-button").addEventListener("click", () => {
    if (!window.confirm("Bu tarayıcıdaki taslak sıfırlansın mı?")) return;
    state = JSON.parse(JSON.stringify(defaults));
    localStorage.removeItem(storageKey);
    renderForm();
    showStatus("Taslak varsayılan içerikle sıfırlandı.");
  });

  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed._schemaVersion === defaults._schemaVersion) state = parsed;
      else {
        state = merge(JSON.parse(JSON.stringify(defaults)), parsed);
        if (Array.isArray(parsed.projects?.items)) {
          const items = JSON.parse(JSON.stringify(defaults.projects.items));
          parsed.projects.items.forEach((project, index) => {
            const normalizedTitle = String(project.title || "").toLocaleLowerCase("tr-TR");
            let targetIndex = items.findIndex((item) => String(item.title || "").toLocaleLowerCase("tr-TR") === normalizedTitle);
            if (targetIndex < 0 && normalizedTitle) targetIndex = items.findIndex((item) => String(item.title || "").toLocaleLowerCase("tr-TR").split(" ")[0] === normalizedTitle.split(" ")[0]);
            if (targetIndex < 0) targetIndex = index;
            if (items[targetIndex]) items[targetIndex] = { ...items[targetIndex], ...project };
            else items.push(project);
          });
          state.projects.items = items;
        }
        const defaultImage = defaults.hero.slides[0].image;
        if (!parsed.brand?.logo) state.brand.logo = defaults.brand.logo;
        if (/^assets\/(?:3\.jpg|projects\/)/i.test(state.hero.image || "")) state.hero.image = defaultImage;
        (state.hero.slides || []).forEach((slide) => { if (/^assets\/(?:3\.jpg|projects\/)/i.test(slide.image || "")) slide.image = defaultImage; });
        (state.projects.items || []).forEach((project) => { if (/^assets\/projects\//i.test(project.image || "")) project.image = defaultImage; });
        state._schemaVersion = defaults._schemaVersion;
      }
    }
  } catch (error) {
    showStatus("Tarayıcı kaydı okunamadı; varsayılan içerik gösteriliyor.", true);
  }
  state.settings ||= {};
  if (!Number.isFinite(Number(state.settings.fontScale))) state.settings.fontScale = defaults.settings.fontScale || 1;
  state.settings.versions ||= [];
  const v4Theme = defaults.settings.versions?.find((version) => version.id === "v4");
  if (v4Theme && !state.settings.versions.some((version) => version.id === "v4")) {
    state.settings.versions.push(JSON.parse(JSON.stringify(v4Theme)));
  }
  if (state.partner?.url === "https://www.ortadirek.com.tr") state.partner.url = "http://www.ortadirek.com.tr";
  renderForm();
})();

