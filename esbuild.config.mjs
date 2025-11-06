import { build } from "esbuild";
import { rmSync, mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const outdir = resolve("dist");
rmSync(outdir, { recursive: true, force: true });
mkdirSync(outdir, { recursive: true });

function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ') // Replace multiple spaces/tabs/newlines with single space
    .replace(/\s*([{}:;,])\s*/g, '$1') // Remove spaces around CSS syntax
    .replace(/;\s*}/g, '}') // Remove semicolon before closing brace
    .replace(/\s*{\s*/g, '{') // Remove spaces around opening brace
    .replace(/\s*}\s*/g, '}') // Remove spaces around closing brace
    .replace(/\s*:\s*/g, ':') // Remove spaces around colon
    .replace(/\s*;\s*/g, ';') // Remove spaces around semicolon
    .replace(/,\s+/g, ',') // Remove spaces after comma
    .replace(/\s+/g, ' ') // Final cleanup
    .trim();
}

const cssMinifyPlugin = {
  name: "css-minify",
  setup(build) {
    build.onLoad({ filter: /\.html$/ }, async (args) => {
      const contents = readFileSync(args.path, "utf8");
      const minified = contents.replace(/<style>([\s\S]*?)<\/style>/gi, (match, css) => {
        return `<style>${minifyCSS(css)}</style>`;
      });
      return { contents: minified, loader: "text" };
    });
  },
};

await build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/vinum-chat-widget.min.js",
  format: "iife",
  globalName: "VinumChat",
  bundle: true,
  minify: true,
  target: ["es2020"],
  loader: { ".html": "text" }, // import template.html as string
  legalComments: "none",
  plugins: [cssMinifyPlugin]
});
console.log("✔ Bundled to dist/vinum-chat-widget.min.js");
