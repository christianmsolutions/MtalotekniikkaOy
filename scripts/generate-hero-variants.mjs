#!/usr/bin/env node
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const source = 'images/optimized/etusivu/hero/etusivu-hero-desktop-1800.jpg';
const outDir = dirname(source);

const targets = [
  { width: 480, label: 'mobile-480' },
  { width: 720, label: 'mobile-720' },
  { width: 900, label: 'mobile-900' },
  { width: 1200, label: 'desktop-1200' },
  { width: 1600, label: 'desktop-1600' },
  { width: 1800, label: 'desktop-1800' },
];

const run = async () => {
  mkdirSync(outDir, { recursive: true });
  for (const { width, label } of targets) {
    const baseName = `etusivu-hero-${label}`;
    await sharp(source)
      .resize({ width, withoutEnlargement: true })
      .avif({ quality: 50 })
      .toFile(join(outDir, `${baseName}.avif`));
    await sharp(source)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 70 })
      .toFile(join(outDir, `${baseName}.webp`));
  }
  console.log('Hero variants generated.');
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
