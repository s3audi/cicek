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
    { title: "AÇILIŞ EKRANI", fields: [
      { key: "hero.image", label: "Ana görsel", type: "image", hint: "URL ya da bilgisayarınızdan görsel seçin." },
      { key: "hero.eyebrow", label: "Üst küçük başlık", type: "textarea", full: true },
      { key: "hero.titleBefore", label: "Başlık — ilk bölüm" }, { key: "hero.titleAccent", label: "Vurgulu bölüm" },
      { key: "hero.titleAfter", label: "Başlık — devamı", type: "textarea" },
      { key: "hero.copy", label: "Açıklama", type: "textarea", full: true },
      { key: "hero.captionTitle", label: "Görsel etiketi" }, { key: "hero.captionDetail", label: "Görsel alt yazısı" }
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
    { title: "SEÇİLİ PROJELER", fields: [
      { key: "projects.eyebrow", label: "Bölüm üst başlığı" }, { key: "projects.action", label: "Bağlantı yazısı" },
      { key: "projects.titleBefore", label: "Bölüm başlığı — ilk bölüm" }, { key: "projects.titleAccent", label: "Vurgulu bölüm" },
      ...[0, 1, 2].flatMap((index) => [
        { key: `projects.items.${index}.image`, label: `Proje ${index + 1} — görsel`, type: "image", full: true },
        { key: `projects.items.${index}.category`, label: `Proje ${index + 1} — tür / konum` },
        { key: `projects.items.${index}.title`, label: `Proje ${index + 1} — adı` },
        { key: `projects.items.${index}.detail`, label: `Proje ${index + 1} — kısa bilgi`, type: "textarea", full: true }
      ])
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
      { key: "footer.copyright", label: "Telif satırı", full: true }
    ]}
  ];

  function get(path, object = state) {
    return path.split(".").reduce((value, key) => value == null ? undefined : value[key], object);
  }

  function set(path, value) {
    const keys = path.split(".");
    const last = keys.pop();
    const target = keys.reduce((object, key) => object[key], state);
    target[last] = value;
  }

  function merge(target, source) {
    Object.keys(source || {}).forEach((key) => {
      if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
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

    const input = document.createElement(field.type === "textarea" ? "textarea" : "input");
    if (input instanceof HTMLInputElement) input.type = "text";
    input.id = fieldId;
    input.dataset.field = field.key;
    input.value = get(field.key) || "";
    input.addEventListener("input", () => set(field.key, input.value));
    wrapper.append(input);
    return wrapper;
  }

  function renderForm() {
    form.replaceChildren();
    groups.forEach((group) => {
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
    if (saved) state = merge(JSON.parse(JSON.stringify(defaults)), JSON.parse(saved));
  } catch (error) {
    showStatus("Tarayıcı kaydı okunamadı; varsayılan içerik gösteriliyor.", true);
  }
  renderForm();
})();
