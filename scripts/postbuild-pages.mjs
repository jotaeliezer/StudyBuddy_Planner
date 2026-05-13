import { copyFileSync, existsSync } from 'fs';
import { join } from 'path';

/** GitHub Pages: deep-link refresh serves 404.html — mirror SPA entry so /any/path resolves client-side. */
const dist = join(process.cwd(), 'dist');
const index = join(dist, 'index.html');
const fallback = join(dist, '404.html');
if (existsSync(index)) {
  copyFileSync(index, fallback);
}
