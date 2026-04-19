import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { canRegisterServiceWorker, getManifestHref, getServiceWorkerHref, joinBaseUrl } from '../src/pwa';

describe('pwa', () => {
  it('joins base urls without double slashes', () => {
    expect(joinBaseUrl('/asteroids-rpg/', 'sw.js')).toBe('/asteroids-rpg/sw.js');
    expect(joinBaseUrl('/asteroids-rpg', '/manifest.webmanifest')).toBe('/asteroids-rpg/manifest.webmanifest');
  });

  it('builds manifest and service worker hrefs from the base url', () => {
    expect(getManifestHref('/asteroids-rpg/')).toBe('/asteroids-rpg/manifest.webmanifest');
    expect(getServiceWorkerHref('/asteroids-rpg/')).toBe('/asteroids-rpg/sw.js');
  });

  it('returns false when service workers are not available', () => {
    expect(canRegisterServiceWorker()).toBe(false);
  });

  it('ships a web manifest with installable app metadata', () => {
    const manifestPath = resolve(process.cwd(), 'public/manifest.webmanifest');
    expect(existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      name: string;
      short_name: string;
      display: string;
      start_url: string;
      scope: string;
      icons: Array<{ src: string; purpose: string }>;
    };

    expect(manifest.name).toBe('Asteroids RPG');
    expect(manifest.short_name).toBe('Asteroids');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('.');
    expect(manifest.scope).toBe('.');
    expect(manifest.icons[0]?.src).toBe('icon.svg');
    expect(manifest.icons[0]?.purpose).toContain('maskable');
  });
});
