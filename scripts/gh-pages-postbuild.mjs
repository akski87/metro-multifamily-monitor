import { copyFileSync, existsSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const out = "dist-gh";
const spaHtml = join(out, "index.spa.html");
const indexHtml = join(out, "index.html");

if (existsSync(spaHtml)) {
  renameSync(spaHtml, indexHtml);
}

if (!existsSync(indexHtml)) {
  console.error("[gh-pages-postbuild] missing index.html in dist-gh");
  process.exit(1);
}

// SPA fallback for client-side routes on GitHub Pages
copyFileSync(indexHtml, join(out, "404.html"));

// .nojekyll so asset paths with underscores aren't ignored
writeFileSync(join(out, ".nojekyll"), "");

const files = readdirSync(out);
console.log("[gh-pages-postbuild] ready:", files.join(", "));
