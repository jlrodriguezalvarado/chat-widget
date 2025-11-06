# Vinum Chat Widget

Widget de chat embebible, compilado a un único archivo JS.
- Node + TypeScript + esbuild
- HTML/CSS en archivo separado (`src/template.html`)
- Minificado + **ofuscado**
- Sin dependencias de runtime

## Build (Node 18+)
```bash
npm i
npm run build
```
Obtendrás:
- `dist/vinum-chat-widget.min.js` (minificado)
- `dist/vinum-chat-widget.obf.js` (ofuscado) ← usar en producción

## Integración rápida

**Autoinit por atributos**:
```html
<script
  src="/dist/vinum-chat-widget.obf.js"
  data-api-url="https://tu.api/v1/chat"
  data-api-key="TU_API_KEY"
  data-title="Asistente"
  data-image-url="https://tu.host/logo.png"
  data-brand="#6E56CF"
  data-position="right"  <!-- o 'left' -->
  defer
></script>
```

**Init por código**:
```html
<script src="/dist/vinum-chat-widget.obf.js" defer></script>
<script>
  window.addEventListener('DOMContentLoaded', () => {
    window.VinumChat.init({
      apiUrl: 'https://tu.api/v1/chat',
      apiKey: 'TU_API_KEY',
      title: 'Asistente',
      imageUrl: 'https://tu.host/logo.png',
      position: 'right',
      theme: { brand: '#6E56CF' }
    });
  });
</script>
```

### Notas
- Si la API responde **401**, la UI no muestra el error (silencioso).
- El color del chat es configurable via `data-brand` o `theme.brand`.
- La imagen del chat (URL) aparece a la izquierda del título del header.
