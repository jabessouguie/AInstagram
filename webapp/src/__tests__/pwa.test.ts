/**
 * Unit tests for PWA configuration.
 * Tests that manifest.json has the required fields and the service worker
 * file exists and defines the expected event handlers.
 */

import fs from "fs";
import path from "path";

// ─── Paths ────────────────────────────────────────────────────────────────────

const PUBLIC_DIR = path.join(__dirname, "../../public");
const MANIFEST_PATH = path.join(PUBLIC_DIR, "manifest.json");
const SW_PATH = path.join(PUBLIC_DIR, "sw.js");
const ICON_PATH = path.join(PUBLIC_DIR, "icon.svg");

// ─── Types ────────────────────────────────────────────────────────────────────

interface WebAppManifest {
  name: string;
  short_name: string;
  start_url: string;
  display: string;
  background_color: string;
  theme_color: string;
  icons: Array<{ src: string; sizes?: string; type?: string }>;
  description?: string;
  shortcuts?: Array<{ name: string; url: string }>;
}

// ─── Tests: manifest.json ─────────────────────────────────────────────────────

describe("manifest.json", () => {
  let manifest: WebAppManifest;

  beforeAll(() => {
    const raw = fs.readFileSync(MANIFEST_PATH, "utf-8");
    manifest = JSON.parse(raw);
  });

  it("exists at public/manifest.json", () => {
    expect(fs.existsSync(MANIFEST_PATH)).toBe(true);
  });

  it("has a name field", () => {
    expect(typeof manifest.name).toBe("string");
    expect(manifest.name.length).toBeGreaterThan(0);
  });

  it("has a short_name field", () => {
    expect(typeof manifest.short_name).toBe("string");
    expect(manifest.short_name.length).toBeGreaterThan(0);
  });

  it("has start_url set to '/'", () => {
    expect(manifest.start_url).toBe("/");
  });

  it("has display set to 'standalone' for installability", () => {
    expect(manifest.display).toBe("standalone");
  });

  it("has background_color as a hex string", () => {
    expect(manifest.background_color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it("has theme_color as a hex string", () => {
    expect(manifest.theme_color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it("has at least one icon", () => {
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  it("each icon has src field", () => {
    for (const icon of manifest.icons) {
      expect(typeof icon.src).toBe("string");
      expect(icon.src.length).toBeGreaterThan(0);
    }
  });

  it("icons reference an existing file in public/", () => {
    for (const icon of manifest.icons) {
      const iconFile = path.join(PUBLIC_DIR, icon.src);
      expect(fs.existsSync(iconFile)).toBe(true);
    }
  });

  it("has shortcuts defined", () => {
    expect(Array.isArray(manifest.shortcuts)).toBe(true);
    expect(manifest.shortcuts!.length).toBeGreaterThan(0);
  });

  it("shortcuts have name and url", () => {
    for (const shortcut of manifest.shortcuts!) {
      expect(typeof shortcut.name).toBe("string");
      expect(typeof shortcut.url).toBe("string");
    }
  });
});

// ─── Tests: service worker ────────────────────────────────────────────────────

describe("service worker (sw.js)", () => {
  let swContent: string;

  beforeAll(() => {
    swContent = fs.readFileSync(SW_PATH, "utf-8");
  });

  it("exists at public/sw.js", () => {
    expect(fs.existsSync(SW_PATH)).toBe(true);
  });

  it("registers an install event listener", () => {
    expect(swContent).toMatch(/addEventListener\(["']install["']/);
  });

  it("registers an activate event listener", () => {
    expect(swContent).toMatch(/addEventListener\(["']activate["']/);
  });

  it("registers a fetch event listener", () => {
    expect(swContent).toMatch(/addEventListener\(["']fetch["']/);
  });

  it("uses cache API", () => {
    expect(swContent).toContain("caches.open(");
  });

  it("calls skipWaiting for immediate activation", () => {
    expect(swContent).toContain("skipWaiting()");
  });

  it("handles API routes differently (network-first)", () => {
    expect(swContent).toContain("/api/");
  });

  it("defines a cache name constant", () => {
    expect(swContent).toContain("CACHE_NAME");
  });
});

// ─── Tests: icon ──────────────────────────────────────────────────────────────

describe("app icon (icon.svg)", () => {
  let svgContent: string;

  beforeAll(() => {
    svgContent = fs.readFileSync(ICON_PATH, "utf-8");
  });

  it("exists at public/icon.svg", () => {
    expect(fs.existsSync(ICON_PATH)).toBe(true);
  });

  it("is a valid SVG file", () => {
    expect(svgContent).toContain("<svg");
    expect(svgContent).toContain("</svg>");
  });

  it("has viewBox attribute", () => {
    expect(svgContent).toContain("viewBox=");
  });
});
