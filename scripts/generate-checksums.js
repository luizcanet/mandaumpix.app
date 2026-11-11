import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT_DIR = process.cwd();
const DEFAULT_DIST_DIR = path.resolve(ROOT_DIR, "dist");
const DEFAULT_OUTPUT_FILE = "SHA256SUMS";

/**
 * Computes lowercase hexadecimal SHA-256 hash.
 *
 * @param {Buffer | string} data - Content to hash
 * @returns {string} - 64-character lowercase hex string
 */
export function computeSha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Recursively collects all files in a directory, returning paths relative to baseDir.
 *
 * @param {string} currentDir - Current directory path to scan
 * @param {string} [baseDir=currentDir] - Base directory to calculate relative paths against
 * @param {string[]} [ignoredNames=["SHA256SUMS"]] - File names to ignore
 * @returns {string[]} - Array of relative file paths with forward slashes
 */
export function collectFilesRecursively(
  currentDir,
  baseDir = currentDir,
  ignoredNames = [DEFAULT_OUTPUT_FILE],
) {
  if (!fs.existsSync(currentDir)) {
    return [];
  }

  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (ignoredNames.includes(entry.name)) {
      continue;
    }

    const fullPath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectFilesRecursively(fullPath, baseDir, ignoredNames));
    } else if (entry.isFile()) {
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, "/");
      files.push(relPath);
    }
  }

  return files;
}

/**
 * Generates a SHA256SUMS file for all static assets in the target directory.
 * Output format conforms to GNU coreutils `sha256sum` utility:
 * `<hash>  <relative_path>`
 *
 * @param {string} [targetDir=DEFAULT_DIST_DIR] - Directory containing files to hash
 * @param {string} [outputFileName=DEFAULT_OUTPUT_FILE] - Name of output file inside targetDir
 * @returns {{ outputFile: string, fileCount: number, entries: Array<{ file: string, hash: string }> }}
 */
export function generateChecksums(
  targetDir = DEFAULT_DIST_DIR,
  outputFileName = DEFAULT_OUTPUT_FILE,
) {
  if (!fs.existsSync(targetDir)) {
    throw new Error(`Target directory does not exist: "${targetDir}"`);
  }

  const files = collectFilesRecursively(targetDir, targetDir, [outputFileName]);
  files.sort();

  const entries = [];
  const lines = [];

  for (const file of files) {
    const fullPath = path.join(targetDir, file);
    const content = fs.readFileSync(fullPath);
    const hash = computeSha256(content);
    entries.push({ file, hash });
    lines.push(`${hash}  ${file}`);
  }

  const outputPath = path.join(targetDir, outputFileName);
  const outputContent = lines.length > 0 ? lines.join("\n") + "\n" : "";

  fs.writeFileSync(outputPath, outputContent, "utf-8");

  return {
    outputFile: outputPath,
    fileCount: entries.length,
    entries,
  };
}

/**
 * Verifies a SHA256SUMS file against actual files on disk.
 *
 * @param {string} checksumsFilePath - Path to SHA256SUMS file
 * @param {string} [baseDir] - Directory where relative paths resolve (defaults to dirname of checksumsFilePath)
 * @returns {{ valid: boolean, verifiedCount: number }}
 */
export function verifyChecksums(
  checksumsFilePath,
  baseDir = path.dirname(checksumsFilePath),
) {
  if (!fs.existsSync(checksumsFilePath)) {
    throw new Error(`Checksums file does not exist: "${checksumsFilePath}"`);
  }

  const content = fs.readFileSync(checksumsFilePath, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim().length > 0);

  let verifiedCount = 0;

  for (const line of lines) {
    const match = line.match(/^([a-f0-9]{64})\s+[* ]?(.+)$/i);
    if (!match) {
      throw new Error(`Invalid line format in checksums file: "${line}"`);
    }

    const [, expectedHash, relPath] = match;
    const fullPath = path.join(baseDir, relPath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File listed in checksums missing on disk: "${relPath}"`);
    }

    const actualHash = computeSha256(fs.readFileSync(fullPath));
    if (actualHash.toLowerCase() !== expectedHash.toLowerCase()) {
      throw new Error(
        `Checksum mismatch for "${relPath}": expected ${expectedHash}, got ${actualHash}`,
      );
    }

    verifiedCount += 1;
  }

  return {
    valid: true,
    verifiedCount,
  };
}

if (process.argv[1] && process.argv[1].endsWith("generate-checksums.js")) {
  try {
    const result = generateChecksums();
    console.log(
      `✅ Generated SHA256SUMS successfully for ${result.fileCount} files in "${result.outputFile}"`,
    );
  } catch (error) {
    console.error(`❌ Error generating checksums: ${error.message}`);
    process.exit(1);
  }
}

