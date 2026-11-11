import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { generateChecksums } from "./generate-checksums.js";

const ROOT_DIR = process.cwd();
const DIST_DIR = path.resolve(ROOT_DIR, "dist");

/**
 * Computes base64-encoded SHA-384 hash prefixed with "sha384-".
 *
 * @param {Buffer} buffer - File buffer
 * @returns {string} - Integrity hash
 */
export function computeSha384(buffer) {
  return (
    "sha384-" + crypto.createHash("sha384").update(buffer).digest("base64")
  );
}

/**
 * Recursively copies a directory, filtering out tests and stories.
 *
 * @param {string} sourceDir - Source directory
 * @param {string} targetDir - Target directory
 */
export function copyDirectoryFiltered(sourceDir, targetDir) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(sourceDir, entry.name);
    const destPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectoryFiltered(srcPath, destPath);
    } else if (entry.isFile()) {
      if (
        entry.name.endsWith(".test.js") ||
        entry.name.endsWith(".stories.js")
      ) {
        continue;
      }
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Validates integrity and existence of all assets referenced in dist/index.html.
 *
 * @param {string} distIndexHtmlPath - Path to dist/index.html
 */
export function validateDistIntegrity(distIndexHtmlPath) {
  const html = fs.readFileSync(distIndexHtmlPath, "utf-8");

  // Verify only one import map exists
  const importMapMatches = html.match(/<script type="importmap">/g);
  if (!importMapMatches || importMapMatches.length !== 1) {
    throw new Error(
      `Expected exactly 1 <script type="importmap">, found ${importMapMatches ? importMapMatches.length : 0}`,
    );
  }

  // Verify no importmap.js script is referenced
  if (html.includes("importmap.js")) {
    throw new Error(
      'index.html must not reference importmap.js when an inline <script type="importmap"> is present.',
    );
  }

  // Parse import map JSON
  const mapContentMatch = html.match(
    /<script type="importmap">([\s\S]*?)<\/script>/,
  );
  if (!mapContentMatch) {
    throw new Error('Unable to extract <script type="importmap"> content.');
  }

  const importMap = JSON.parse(mapContentMatch[1]);
  const integrityEntries = importMap.integrity || {};

  // Check each local integrity hash
  for (const [specifier, expectedHash] of Object.entries(integrityEntries)) {
    if (specifier.startsWith("./src/")) {
      const relativePath = specifier.replace(/^\.\//, "");
      const fullPath = path.join(DIST_DIR, relativePath);

      if (!fs.existsSync(fullPath)) {
        throw new Error(
          `Integrity check failed: file missing in dist: "${relativePath}"`,
        );
      }

      const fileBuffer = fs.readFileSync(fullPath);
      const actualHash = computeSha384(fileBuffer);

      if (actualHash !== expectedHash) {
        throw new Error(
          `Integrity mismatch for "${relativePath}": expected ${expectedHash}, got ${actualHash}`,
        );
      }
    }
  }

  // Check modulepreload tags
  const preloadRegex =
    /<link rel="modulepreload" href="(\.\/src\/[^"]+)" integrity="(sha384-[^"]+)"/g;
  let match;
  let preloadCount = 0;

  while ((match = preloadRegex.exec(html)) !== null) {
    preloadCount += 1;
    const relativePath = match[1].replace(/^\.\//, "");
    const expectedHash = match[2];
    const fullPath = path.join(DIST_DIR, relativePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Preloaded file missing in dist: "${relativePath}"`);
    }

    const fileBuffer = fs.readFileSync(fullPath);
    const actualHash = computeSha384(fileBuffer);

    if (actualHash !== expectedHash) {
      throw new Error(
        `Preload integrity mismatch for "${relativePath}": expected ${expectedHash}, got ${actualHash}`,
      );
    }
  }

  return {
    verifiedIntegrities: Object.keys(integrityEntries).length,
    preloadCount,
  };
}

/**
 * Builds the distribution package for Firebase Hosting.
 */
export function build() {
  const storybookBackup = path.join(DIST_DIR, "storybook");
  const hasStorybook = fs.existsSync(storybookBackup);

  // Preserve storybook if already built in dist/storybook
  let tempStorybookDir = null;
  if (hasStorybook) {
    tempStorybookDir = path.join(ROOT_DIR, ".storybook-temp-backup");
    fs.cpSync(storybookBackup, tempStorybookDir, { recursive: true });
  }

  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });

  // Copy root web assets
  const rootFilesToCopy = ["index.html", "manifest.json", "sw.js"];
  for (const fileName of rootFilesToCopy) {
    const src = path.join(ROOT_DIR, fileName);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(DIST_DIR, fileName));
    }
  }

  // Copy src folder (excluding tests and stories)
  copyDirectoryFiltered(path.join(ROOT_DIR, "src"), path.join(DIST_DIR, "src"));

  // Copy .well-known directory if present
  const wellKnownDir = path.join(ROOT_DIR, ".well-known");
  if (fs.existsSync(wellKnownDir)) {
    copyDirectoryFiltered(wellKnownDir, path.join(DIST_DIR, ".well-known"));
  }

  // Restore storybook if it existed
  if (tempStorybookDir && fs.existsSync(tempStorybookDir)) {
    fs.cpSync(tempStorybookDir, path.join(DIST_DIR, "storybook"), {
      recursive: true,
    });
    fs.rmSync(tempStorybookDir, { recursive: true, force: true });
  }

  // Validate integrity of the dist output
  const stats = validateDistIntegrity(path.join(DIST_DIR, "index.html"));

  // Generate SHA-256 checksums file for release integrity verification (US-08.5 / INV-01)
  const checksumsStats = generateChecksums(DIST_DIR);

  console.log(
    `✅ Build production package created successfully in "dist/":\n` +
      `   - Verified ${stats.preloadCount} modulepreload links with SRI\n` +
      `   - Verified ${stats.verifiedIntegrities} importmap integrity entries\n` +
      `   - Generated SHA256SUMS with ${checksumsStats.fileCount} static assets\n` +
      `   - Excluded test and story files from distribution`,
  );
}

if (process.argv[1] && process.argv[1].endsWith("build.js")) {
  build();
}
