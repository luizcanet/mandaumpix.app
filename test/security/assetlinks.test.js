import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Digital Asset Links & Firebase Hosting Configuration (TASK-08.4.1)", () => {
  const rootDir = process.cwd();
  const assetlinksPath = path.join(rootDir, ".well-known/assetlinks.json");
  const firebaseJsonPath = path.join(rootDir, "firebase.json");

  describe("Canonical .well-known/assetlinks.json content (INV-01)", () => {
    it("should exist at .well-known/assetlinks.json", () => {
      expect(fs.existsSync(assetlinksPath)).toBe(true);
    });

    it("should be valid JSON conforming to Google Digital Asset Links specification for TWA", () => {
      const content = fs.readFileSync(assetlinksPath, "utf-8");
      let statements;
      expect(() => {
        statements = JSON.parse(content);
      }).not.toThrow();

      expect(Array.isArray(statements)).toBe(true);
      expect(statements.length).toBeGreaterThan(0);

      const twaStatement = statements.find(
        (stmt) =>
          stmt.target?.namespace === "android_app" &&
          stmt.target?.package_name === "app.mandaumpix.twa",
      );

      expect(twaStatement).toBeDefined();

      // Relation: delegate_permission/common.handle_all_urls
      expect(twaStatement.relation).toContain(
        "delegate_permission/common.handle_all_urls",
      );

      // Target verification
      expect(twaStatement.target.namespace).toBe("android_app");
      expect(twaStatement.target.package_name).toBe("app.mandaumpix.twa");

      // SHA-256 cert fingerprints
      expect(Array.isArray(twaStatement.target.sha256_cert_fingerprints)).toBe(
        true,
      );
      expect(
        twaStatement.target.sha256_cert_fingerprints.length,
      ).toBeGreaterThan(0);

      for (const fingerprint of twaStatement.target.sha256_cert_fingerprints) {
        expect(fingerprint).toMatch(/^[0-9A-F]{2}(:[0-9A-F]{2}){31}$/);
      }
    });
  });

  describe("Firebase Hosting configuration for .well-known/assetlinks.json", () => {
    it("should configure headers and fallback redirect in firebase.json", () => {
      expect(fs.existsSync(firebaseJsonPath)).toBe(true);
      const firebaseConfig = JSON.parse(
        fs.readFileSync(firebaseJsonPath, "utf-8"),
      );
      const hosting = firebaseConfig.hosting;
      expect(hosting).toBeDefined();

      // Ensure .well-known is not ignored
      expect(hosting.ignore).toContain("!**/.well-known/**");

      // Verify Content-Type and Cache-Control headers for /.well-known/assetlinks.json
      const assetlinksHeader = hosting.headers?.find(
        (entry) => entry.source === "/.well-known/assetlinks.json",
      );
      expect(assetlinksHeader).toBeDefined();

      const contentTypeHeader = assetlinksHeader.headers?.find(
        (h) => h.key === "Content-Type",
      );
      expect(contentTypeHeader?.value).toBe("application/json");

      const cacheControlHeader = assetlinksHeader.headers?.find(
        (h) => h.key === "Cache-Control",
      );
      expect(cacheControlHeader?.value).toBeDefined();

      // Verify fallback redirect (/assetlinks.json -> /.well-known/assetlinks.json)
      const redirect = hosting.redirects?.find(
        (r) => r.source === "/assetlinks.json",
      );
      expect(redirect).toBeDefined();
      expect(redirect?.destination).toBe("/.well-known/assetlinks.json");
      expect(redirect?.type).toBe(301);
    });
  });
});
