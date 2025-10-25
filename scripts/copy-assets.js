import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');

// distフォルダの確認
const distDir = join(root, 'dist');
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// manifest.jsonをコピー
console.log('📄 Copying manifest.json...');
copyFileSync(
  join(root, 'manifest.json'),
  join(distDir, 'manifest.json')
);

// アイコンフォルダをコピー
console.log('🎨 Copying icons...');
const iconsDistDir = join(distDir, 'icons');
if (!existsSync(iconsDistDir)) {
  mkdirSync(iconsDistDir, { recursive: true });
}

const icons = ['icon16.png', 'icon48.png', 'icon128.png'];
icons.forEach((icon) => {
  const src = join(root, 'icons', icon);
  const dest = join(iconsDistDir, icon);
  if (existsSync(src)) {
    copyFileSync(src, dest);
    console.log(`  ✓ ${icon}`);
  } else {
    console.warn(`  ⚠ ${icon} not found`);
  }
});

// popup.htmlのパスを修正
console.log('🔧 Fixing popup.html path...');
const popupHtmlSrc = join(distDir, 'src', 'popup', 'index.html');
const popupHtmlDest = join(distDir, 'popup.html');
if (existsSync(popupHtmlSrc)) {
  copyFileSync(popupHtmlSrc, popupHtmlDest);
  console.log('  ✓ popup.html');
}

console.log('✅ Assets copied successfully!');
