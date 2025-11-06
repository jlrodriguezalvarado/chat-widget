import { InitOptions } from "./types";
import template from "./template.html";

function shade(hex: string, amt: number) {
  const h = hex.replace('#','');
  const i = parseInt(h.length===3 ? h.split('').map(c=>c+c).join('') : h, 16);
  let r=(i>>16)&255,g=(i>>8)&255,b=i&255;
  const d = Math.round(255*amt/100);
  r=Math.max(0,Math.min(255,r+d)); g=Math.max(0,Math.min(255,g+d)); b=Math.max(0,Math.min(255,b+d));
  return `#${[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('')}`;
}

export class VinumChatElement extends HTMLElement {
  private _open = false;
  private _sending = false;
  private _cfg: Required<InitOptions>;
  private $wrap!: HTMLElement;
  private $win!: HTMLElement;
  private $fab!: HTMLButtonElement;
  private $close!: HTMLButtonElement;
  private $msgs!: HTMLElement;
  private $ta!: HTMLTextAreaElement;
  private $send!: HTMLButtonElement;

  constructor(cfg: InitOptions) {
    super();

    this._cfg = {
      apiUrl: cfg.apiUrl ?? "",
      apiKey: cfg.apiKey ?? "",
      title: cfg.title ?? "Chat",
      imageUrl: cfg.imageUrl ?? "",
      position: cfg.position ?? "right",
      theme: { brand: cfg.theme?.brand ?? "#6E56CF" }
    };

    const root = this.attachShadow({ mode: "closed" }) as unknown as ShadowRoot & { innerHTML?: string };
    const wrap = document.createElement("div");
    wrap.innerHTML = template;

    // Posición
    const wrapEl = wrap.querySelector(".vc-wrap") as HTMLElement;
    if (this._cfg.position === "left") {
      wrapEl.style.left = "20px";
      wrapEl.style.right = "auto";
    } else {
      wrapEl.style.right = "20px";
      wrapEl.style.left = "auto";
    }

    // Variables CSS de color
    const brandColor = this._cfg.theme.brand ?? "#6E56CF";
    wrapEl.style.setProperty("--vc-brand", brandColor);
    wrapEl.style.setProperty("--vc-brand-dark", shade(brandColor, -10));

    // Logo + título
    const $title = wrap.querySelector('[data-ref="title"]') as HTMLElement;
    if ($title) $title.textContent = this._cfg.title;
    const $logo = wrap.querySelector(".vc-logo") as HTMLImageElement;
    if ($logo && this._cfg.imageUrl) {
      $logo.src = this._cfg.imageUrl;
      $logo.style.display = "inline-block";
    }

    (root as any).appendChild(wrap);

    // refs
    this.$wrap  = (wrap.querySelector(".vc-wrap") as HTMLElement);
    this.$win   = (wrap.querySelector(".vc-window") as HTMLElement);
    this.$fab   = (wrap.querySelector(".vc-fab") as HTMLButtonElement);
    this.$close = (wrap.querySelector(".vc-close") as HTMLButtonElement);
    this.$msgs  = (wrap.querySelector(".vc-messages") as HTMLElement);
    this.$ta    = (wrap.querySelector(".vc-textarea") as HTMLTextAreaElement);
    this.$send  = (wrap.querySelector(".vc-send") as HTMLButtonElement);

    // events
    this.$fab.addEventListener("click", () => this.toggle(true));
    this.$close.addEventListener("click", () => this.toggle(false));
    this.$send.addEventListener("click", () => this.onSend());
    this.$ta.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.onSend();
      }
    });
  }

  connectedCallback() {
    try { if (localStorage.getItem("vinum_chat_open") === "1") this.toggle(true); } catch {}
  }

  toggle(open: boolean) {
    this._open = open;
    if (open) {
      this.$win.classList.remove("vc-hide");
      this.$fab.classList.add("vc-hide");
      queueMicrotask(() => this.$ta?.focus());
    } else {
      this.$win.classList.add("vc-hide");
      this.$fab.classList.remove("vc-hide");
    }
    try { localStorage.setItem("vinum_chat_open", open ? "1" : "0"); } catch {}
  }

  private appendMessage(role: "user" | "assistant", text: string) {
    const el = document.createElement("div");
    el.className = `vc-msg ${role === "user" ? "vc-user" : "vc-bot"}`;
    el.textContent = text;
    this.$msgs.appendChild(el);
    this.$msgs.scrollTop = this.$msgs.scrollHeight;
  }

  private async onSend() {
    if (this._sending) return;
    const text = (this.$ta.value || "").trim();
    if (!text) return;

    this.appendMessage("user", text);
    this.$ta.value = "";
    this._sending = true;
    this.$send.setAttribute("disabled", "");

    try {
      const reply = await this.sendToApi(text);
      if (typeof reply === "string" && reply) this.appendMessage("assistant", reply);
      else if (reply && (reply as any).reply) this.appendMessage("assistant", String((reply as any).reply));
      // reply vacío es aceptable
    } catch (err: any) {
      if (!(err && err.status === 401)) {
        this.appendMessage("assistant", "No se pudo enviar el mensaje. Inténtalo de nuevo.");
      }
    } finally {
      this._sending = false;
      this.$send.removeAttribute("disabled");
    }
  }

  private async sendToApi(message: string) {
    const apiUrl = (this._cfg.apiUrl || "").replace(/\/$/, "");
    const url = `${apiUrl}/chat`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this._cfg.apiKey || ""}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ q: message }),
        signal: ctrl.signal,
        credentials: "omit",
        cache: "no-store"
      });

      if (res.status === 401) {
        const e: any = new Error("Unauthorized");
        e.status = 401;
        throw e; // silencioso en UI
      }
      if (!res.ok) {
        let text = "";
        try { text = await res.text(); } catch {}
        throw new Error(text || `HTTP ${res.status}`);
      }
      return await res.json().catch(() => ({}));
    } finally {
      clearTimeout(timer);
    }
  }
}
