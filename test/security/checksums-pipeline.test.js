import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Release Checksums Pipeline & Firebase Hosting Configuration (TASK-08.5.2)", () => {
  const rootDir = process.cwd();
  const firebaseJsonPath = path.join(rootDir, "firebase.json");
  const deployDevPath = path.join(rootDir, ".github/workflows/deploy-dev.yml");
  const deployStgPath = path.join(rootDir, ".github/workflows/deploy-stg.yml");
  const deployPrdPath = path.join(rootDir, ".github/workflows/deploy-prd.yml");
  const ciWorkflowPath = path.join(rootDir, ".github/workflows/ci.yml");

  describe("Firebase Hosting headers for /SHA256SUMS", () => {
    it("should configure Content-Type and Cache-Control headers for /SHA256SUMS in firebase.json", () => {
      const firebaseConfig = JSON.parse(
        fs.readFileSync(firebaseJsonPath, "utf-8"),
      );
      const hosting = firebaseConfig.hosting;
      expect(hosting).toBeDefined();

      const checksumsHeader = hosting.headers?.find(
        (entry) => entry.source === "/SHA256SUMS",
      );
      expect(checksumsHeader).toBeDefined();

      const contentTypeHeader = checksumsHeader.headers?.find(
        (h) => h.key === "Content-Type",
      );
      expect(contentTypeHeader?.value).toBe("text/plain; charset=utf-8");

      const cacheControlHeader = checksumsHeader.headers?.find(
        (h) => h.key === "Cache-Control",
      );
      expect(cacheControlHeader?.value).toBeDefined();
    });
  });

  describe("CD Development Workflow (.github/workflows/deploy-dev.yml)", () => {
    it("should verify build integrity and upload SHA256SUMS artifact", () => {
      const content = fs.readFileSync(deployDevPath, "utf-8");

      expect(content).toContain("sha256sum -c SHA256SUMS");
      expect(content).toContain("actions/upload-artifact@v4");
      expect(content).toContain("dist/SHA256SUMS");
    });
  });

  describe("CD Staging Workflow (.github/workflows/deploy-stg.yml)", () => {
    it("should verify build integrity and upload SHA256SUMS artifact", () => {
      const content = fs.readFileSync(deployStgPath, "utf-8");

      expect(content).toContain("sha256sum -c SHA256SUMS");
      expect(content).toContain("actions/upload-artifact@v4");
      expect(content).toContain("dist/SHA256SUMS");
    });
  });

  describe("CD Production Workflow (.github/workflows/deploy-prd.yml)", () => {
    it("should verify build integrity, upload pipeline artifact, and attach SHA256SUMS to GitHub release", () => {
      const content = fs.readFileSync(deployPrdPath, "utf-8");

      expect(content).toContain("contents: write");
      expect(content).toContain("sha256sum -c SHA256SUMS");
      expect(content).toContain("actions/upload-artifact@v4");
      expect(content).toContain("dist/SHA256SUMS");
      expect(content).toContain("gh release upload");
    });
  });

  describe("CI Quality Workflow (.github/workflows/ci.yml)", () => {
    it("should verify SHA256SUMS integrity after production build", () => {
      const content = fs.readFileSync(ciWorkflowPath, "utf-8");

      expect(content).toContain("sha256sum -c SHA256SUMS");
    });
  });
});
