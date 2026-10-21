(function () {
  "use strict";

  const storageKey = "cicek-site-draft-v1";
  const content = { ...(window.CICEK_SITE_CONTENT || {}) };

  function getValue(path, root = content) {
    return path.split(".").reduce((value, key) => value == null ? undefined : value[key], root);
  }

  function isSafeImage(value) {
    return typeof value === "string" && (/^(https?:\/\/|data:image\/(?:png|jpe?g|webp|gif);base64,|assets\/|\.\/)/i).test(value.trim());
  }

  function isSafeLink(value) {
    return typeof value === "string" && (/^(https?:\/\/|tel:|mailto:|#|\.\/)/i).test(value.trim());
  }

  function applyContent(data) {
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
      if (!isSafeImage(value)) return;
      value = value.trim();
      if (element instanceof HTMLImageElement) element.src = value;
      else element.style.backgroundImage = `url("${value.replace(/["\\\n\r]/g, "")}")`;
      if (element.dataset.image === "brand.logo") element.closest(".brand")?.classList.add("has-logo");
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
  }

  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) applyContent(JSON.parse(saved));
    else applyContent(content);
  } catch (error) {
    applyContent(content);
  }

  if (new URLSearchParams(window.location.search).has("editorPreview") && window.opener) {
    window.opener.postMessage({ type: "cicek-preview-ready" }, "*");
    window.addEventListener("message", (event) => {
      if (event.source === window.opener && event.data?.type === "cicek-editor-preview") applyContent(event.data.content);
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.shiftKey && event.altKey && event.key.toLowerCase() === "e") {
      event.preventDefault();
      window.location.href = "edit.html";
    }
  });
})();
