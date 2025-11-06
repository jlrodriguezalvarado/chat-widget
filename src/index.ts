import { VinumChatElement } from "./widget";
import type { InitOptions } from "./types";

declare global {
  interface Window { VinumChat: { init: (opts?: InitOptions) => void } }
}

function normalizeFromScript(): InitOptions {
  const current = document.currentScript || Array.from(document.scripts).slice(-1)[0];
  const ds = (current as any)?.dataset || {};
  // Permite 'brand' y 'brandColor'
  const brand = ds.brand || ds.brandColor;
  return {
    apiUrl: ds.apiUrl,
    apiKey: ds.apiKey,
    title: ds.title,
    imageUrl: ds.imageUrl,
    position: (ds.position as any) || undefined,
    theme: brand ? { brand } : undefined
  };
}

function init(opts: InitOptions = {}) {
  const tag = "vinum-chat-widget";
  if (!customElements.get(tag)) {
    customElements.define(tag, class extends VinumChatElement {
      constructor() { super(opts); }
    });
  }
  if (!document.querySelector(tag)) {
    const el = document.createElement(tag);
    document.body.appendChild(el);
  }
}

function autoInit() {
  const conf = normalizeFromScript();
  const hasAuto = !!conf.apiUrl; // si hay apiUrl, autoinit
  if (hasAuto) init(conf);
}

// Crear el objeto VinumChat
const VinumChatAPI = { init };

// CRÍTICO: Asignar a window.VinumChat de forma síncrona e inmediata
// Esto debe ejecutarse ANTES de cualquier otra cosa
(window as any).VinumChat = VinumChatAPI;

// Inicialización automática si hay configuración en el script
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoInit);
} else {
  autoInit();
}

// Exportar el objeto para que esbuild lo asigne a la variable global VinumChat
// cuando se compila con format: "iife" y globalName: "VinumChat"
// Nota: esbuild puede crear un módulo ES6, pero window.VinumChat ya está asignado arriba
export default VinumChatAPI;
