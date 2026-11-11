import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("RFC 9116 security.txt & Firebase Hosting Configuration (TASK-08.3.1)", () => {
  const rootDir = process.cwd();
  const securityTxtPath = path.join(rootDir, ".well-known/security.txt");
  const firebaseJsonPath = path.join(rootDir, "firebase.json");

  describe("Canonical .well-known/security.txt content", () => {
    it("should exist at .well-known/security.txt", () => {
      expect(fs.existsSync(securityTxtPath)).toBe(true);
    });

    it("should adhere to RFC 9116 structure and mandatory directives", () => {
      const content = fs.readFileSync(securityTxtPath, "utf-8");
      const lines = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("#"));

      const directives = new Map();
      for (const line of lines) {
        const colonIndex = line.indexOf(":");
        expect(colonIndex).toBeGreaterThan(0);
        const key = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trim();
        directives.set(key, value);
      }

      // Mandatory fields according to RFC 9116 & INV-01
      expect(directives.has("Contact")).toBe(true);
      expect(directives.get("Contact")).toMatch(/^mailto:.+@.+$/);
      expect(directives.get("Contact")).toBe("mailto:me@luizca.net");

      expect(directives.has("Expires")).toBe(true);
      const expiresDate = new Date(directives.get("Expires"));
      expect(isNaN(expiresDate.getTime())).toBe(false);
      // Expiration must be in the future
      expect(expiresDate.getTime()).toBeGreaterThan(Date.now());

      expect(directives.has("Preferred-Languages")).toBe(true);
      expect(directives.get("Preferred-Languages")).toContain("pt-BR");

      expect(directives.has("Canonical")).toBe(true);
      expect(directives.get("Canonical")).toBe(
        "https://mandaumpix.app/.well-known/security.txt",
      );

      expect(directives.has("Policy")).toBe(true);
      expect(directives.get("Policy")).toBe(
        "https://mandaumpix.app/docs/security/takedown_and_monitoring.md",
      );
    });
  });

  describe("Firebase Hosting configuration for .well-known/security.txt", () => {
    it("should configure unignore, headers, and redirects in firebase.json", () => {
      expect(fs.existsSync(firebaseJsonPath)).toBe(true);
      const firebaseConfig = JSON.parse(
        fs.readFileSync(firebaseJsonPath, "utf-8"),
      );
      const hosting = firebaseConfig.hosting;
      expect(hosting).toBeDefined();

      // Ensure .well-known is not ignored
      expect(hosting.ignore).toContain("!**/.well-known/**");

      // Verify Content-Type and Cache-Control headers for /.well-known/security.txt
      const securityHeader = hosting.headers?.find(
        (entry) => entry.source === "/.well-known/security.txt",
      );
      expect(securityHeader).toBeDefined();

      const contentTypeHeader = securityHeader.headers?.find(
        (h) => h.key === "Content-Type",
      );
      expect(contentTypeHeader?.value).toBe("text/plain; charset=utf-8");

      const cacheControlHeader = securityHeader.headers?.find(
        (h) => h.key === "Cache-Control",
      );
      expect(cacheControlHeader?.value).toBeDefined();

      // Verify redirect for backwards-compatibility (/security.txt -> /.well-known/security.txt)
      const redirect = hosting.redirects?.find(
        (r) => r.source === "/security.txt",
      );
      expect(redirect).toBeDefined();
      expect(redirect?.destination).toBe("/.well-known/security.txt");
      expect(redirect?.type).toBe(301);
    });
  });
});

