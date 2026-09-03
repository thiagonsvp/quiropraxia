import { test, expect } from '@playwright/test';
import { statSync } from 'node:fs';

const MAX_BYTES = { webp: 300_000, jpg: 400_000 };

const files = [
  'img/hero-giselle.webp',
  'img/hero-giselle.jpg',
  'img/metodo-giselle.webp',
  'img/metodo-giselle.jpg',
  'img/sobre-giselle.webp',
  'img/sobre-giselle.jpg',
];

for (const file of files) {
  test(`${file} exists and stays under the size budget`, () => {
    const stats = statSync(file);
    const ext = file.endsWith('.webp') ? 'webp' : 'jpg';
    expect(stats.size).toBeGreaterThan(0);
    expect(stats.size).toBeLessThanOrEqual(MAX_BYTES[ext]);
  });
}
