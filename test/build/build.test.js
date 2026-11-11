import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  computeSha384,
  copyDirectoryFiltered,
  validateDistIntegrity,
  build,
} from "../../scripts/build.js";

describe("Build Script (scripts/build.js)", () => {
  it("should correctly calculate SHA-384 integrity hash in sha384- base64 format", () => {
    const buffer = Buffer.from("console.log('hello');", "utf-8");
    const hash = computeSha384(buffer);
    expect(hash).toMatch(/^sha384-[A-Za-z0-9+/=]+$/);
  });

  it("should filter out test and story files when copying directory", () => {
    const tempSrc = path.resolve(process.cwd(), ".temp-test-src");
    const tempDest = path.resolve(process.cwd(), ".temp-test-dest");

    fs.mkdirSync(tempSrc, { recursive: true });
    fs.writeFileSync(path.join(tempSrc, "file.js"), "export const a = 1;");
    fs.writeFileSync(path.join(tempSrc, "file.test.js"), "test");
    fs.writeFileSync(path.join(tempSrc, "file.stories.js"), "story");

    try {
      copyDirectoryFiltered(tempSrc, tempDest);

      expect(fs.existsSync(path.join(tempDest, "file.js"))).toBe(true);
      expect(fs.existsSync(path.join(tempDest, "file.test.js"))).toBe(false);
      expect(fs.existsSync(path.join(tempDest, "file.stories.js"))).toBe(false);
    } finally {
      fs.rmSync(tempSrc, { recursive: true, force: true });
      fs.rmSync(tempDest, { recursive: true, force: true });
    }
  });

  it("should execute build and successfully validate dist integrity", () => {
    build();

    const distPath = path.resolve(process.cwd(), "dist");
    const distIndex = path.join(distPath, "index.html");
    const distMain = path.join(distPath, "src/main.js");
    const distSecurityTxt = path.join(distPath, ".well-known/security.txt");
    const distAssetlinks = path.join(distPath, ".well-known/assetlinks.json");

    expect(fs.existsSync(distIndex)).toBe(true);
    expect(fs.existsSync(distMain)).toBe(true);
    expect(fs.existsSync(distSecurityTxt)).toBe(true);
    expect(fs.existsSync(distAssetlinks)).toBe(true);

    const stats = validateDistIntegrity(distIndex);
    expect(stats.preloadCount).toBeGreaterThan(0);
    expect(stats.verifiedIntegrities).toBeGreaterThan(0);
  });
});
