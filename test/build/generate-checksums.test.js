import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import {
  computeSha256,
  collectFilesRecursively,
  generateChecksums,
  verifyChecksums,
} from "../../scripts/generate-checksums.js";

describe("Generate Checksums Script (scripts/generate-checksums.js)", () => {
  it("should calculate correct SHA-256 hash in 64-character lowercase hexadecimal format", () => {
    // Known SHA-256 vectors
    expect(computeSha256(Buffer.from("", "utf-8"))).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
    expect(computeSha256(Buffer.from("hello world", "utf-8"))).toBe(
      "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
    );
  });

  it("should collect all files recursively with relative POSIX paths, ignoring SHA256SUMS", () => {
    const tempDir = path.resolve(process.cwd(), ".temp-checksum-collect");
    fs.mkdirSync(path.join(tempDir, "sub/nested"), { recursive: true });

    fs.writeFileSync(path.join(tempDir, "root.txt"), "root");
    fs.writeFileSync(path.join(tempDir, "sub/child.js"), "child");
    fs.writeFileSync(path.join(tempDir, "sub/nested/deep.json"), "{}");
    fs.writeFileSync(path.join(tempDir, "SHA256SUMS"), "ignored");

    try {
      const files = collectFilesRecursively(tempDir);
      files.sort();

      expect(files).toEqual([
        "root.txt",
        "sub/child.js",
        "sub/nested/deep.json",
      ]);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("should throw an error when target directory does not exist", () => {
    const nonExistentDir = path.resolve(
      process.cwd(),
      ".non-existent-dir-12345",
    );
    expect(() => generateChecksums(nonExistentDir)).toThrow(
      /Target directory does not exist/,
    );
  });

  it("should generate SHA256SUMS file with valid formatting and deterministic order", () => {
    const tempDir = path.resolve(process.cwd(), ".temp-checksum-gen");
    fs.mkdirSync(path.join(tempDir, "b_dir"), { recursive: true });
    fs.mkdirSync(path.join(tempDir, "a_dir"), { recursive: true });

    fs.writeFileSync(path.join(tempDir, "b_dir/file2.txt"), "content2");
    fs.writeFileSync(path.join(tempDir, "a_dir/file1.txt"), "content1");
    fs.writeFileSync(path.join(tempDir, "index.html"), "content0");

    try {
      const result = generateChecksums(tempDir);
      const checksumsFile = path.join(tempDir, "SHA256SUMS");

      expect(fs.existsSync(checksumsFile)).toBe(true);
      expect(result.fileCount).toBe(3);

      const content = fs.readFileSync(checksumsFile, "utf-8");
      const lines = content.trim().split("\n");

      expect(lines).toHaveLength(3);
      // Deterministically sorted by relative path
      expect(lines[0]).toMatch(/^[a-f0-9]{64} {2}a_dir\/file1\.txt$/);
      expect(lines[1]).toMatch(/^[a-f0-9]{64} {2}b_dir\/file2\.txt$/);
      expect(lines[2]).toMatch(/^[a-f0-9]{64} {2}index\.html$/);

      // Verify programmatic validation
      const verification = verifyChecksums(checksumsFile, tempDir);
      expect(verification.valid).toBe(true);
      expect(verification.verifiedCount).toBe(3);

      // Verify native system sha256sum -c compatibility
      const cmdOutput = execSync("sha256sum -c SHA256SUMS", {
        cwd: tempDir,
        encoding: "utf-8",
      });
      expect(cmdOutput).toContain("a_dir/file1.txt: OK");
      expect(cmdOutput).toContain("b_dir/file2.txt: OK");
      expect(cmdOutput).toContain("index.html: OK");
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("verifyChecksums should detect corrupted files or missing files", () => {
    const tempDir = path.resolve(process.cwd(), ".temp-checksum-verify");
    fs.mkdirSync(tempDir, { recursive: true });

    fs.writeFileSync(path.join(tempDir, "valid.txt"), "valid content");
    generateChecksums(tempDir);
    const checksumsFile = path.join(tempDir, "SHA256SUMS");

    // Corrupt the file
    fs.writeFileSync(path.join(tempDir, "valid.txt"), "tampered content");
    expect(() => verifyChecksums(checksumsFile, tempDir)).toThrow(
      /Checksum mismatch/,
    );

    // Delete the file
    fs.unlinkSync(path.join(tempDir, "valid.txt"));
    expect(() => verifyChecksums(checksumsFile, tempDir)).toThrow(
      /missing on disk/,
    );

    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});
