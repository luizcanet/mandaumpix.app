import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Bubblewrap TWA Manifest Configuration (TASK-08.4.2)", () => {
  const rootDir = process.cwd();
  const twaManifestPath = path.join(rootDir, "twa-manifest.json");
  const packageJsonPath = path.join(rootDir, "package.json");
  const webManifestPath = path.join(rootDir, "manifest.json");

  it("should exist at the root directory", () => {
    expect(fs.existsSync(twaManifestPath)).toBe(true);
  });

  it("should be valid JSON conforming to Bubblewrap TWA specification", () => {
    const content = fs.readFileSync(twaManifestPath, "utf-8");
    let twaConfig;
    expect(() => {
      twaConfig = JSON.parse(content);
    }).not.toThrow();

    expect(twaConfig).toBeTypeOf("object");
    expect(twaConfig.packageId).toBe("app.mandaumpix.twa");
    expect(twaConfig.host).toBe("mandaumpix.app");
    expect(twaConfig.generatorApp).toBe("bubblewrap-cli");
    expect(twaConfig.fallbackType).toBe("customtabs");
  });

  it("should synchronize appVersionName with package.json and maintain valid version code", () => {
    const twaConfig = JSON.parse(fs.readFileSync(twaManifestPath, "utf-8"));
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    expect(twaConfig.appVersionName).toBe(packageJson.version);
    expect(Number.isInteger(twaConfig.appVersionCode)).toBe(true);
    expect(twaConfig.appVersionCode).toBeGreaterThanOrEqual(1);
  });

  it("should synchronize name, shortName, theme, and background colors with web manifest", () => {
    const twaConfig = JSON.parse(fs.readFileSync(twaManifestPath, "utf-8"));
    const webManifest = JSON.parse(fs.readFileSync(webManifestPath, "utf-8"));

    expect(twaConfig.name).toBe(webManifest.name);
    expect(twaConfig.shortName).toBe(webManifest.short_name);
    expect(twaConfig.themeColor).toBe(webManifest.theme_color);
    expect(twaConfig.backgroundColor).toBe(webManifest.background_color);

    // Launcher name on Android must not exceed 12 characters to prevent truncation
    expect(twaConfig.launcherName.length).toBeLessThanOrEqual(12);
  });

  it("should specify valid HTTPS URLs for standard and maskable 512px icons", () => {
    const twaConfig = JSON.parse(fs.readFileSync(twaManifestPath, "utf-8"));

    expect(twaConfig.iconUrl).toMatch(
      /^https:\/\/mandaumpix\.app\/.*icon-512\.png$/,
    );
    expect(twaConfig.maskableIconUrl).toMatch(
      /^https:\/\/mandaumpix\.app\/.*icon-maskable-512\.png$/,
    );
    expect(twaConfig.webManifestUrl).toBe(
      "https://mandaumpix.app/manifest.json",
    );
  });

  it("should configure signing key parameters for Android keystore", () => {
    const twaConfig = JSON.parse(fs.readFileSync(twaManifestPath, "utf-8"));

    expect(twaConfig.signingKey).toBeDefined();
    expect(twaConfig.signingKey.path).toBe("./android.keystore");
    expect(twaConfig.signingKey.alias).toBe("mandaumpix");
  });
});
