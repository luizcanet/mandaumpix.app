import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { describe, expect, it } from "vitest";

describe("layout.css (TASK-04.1.1: Grid Responsivo e Split-View)", () => {
  const cssPath = resolve(process.cwd(), "src/presentation/styles/layout.css");
  const cssContent = readFileSync(cssPath, "utf-8");

  it("defines the .charge-page grid with single column mobile-first", () => {
    expect(cssContent).toMatch(/\.charge-page\s*\{[^}]*display:\s*grid/);
    expect(cssContent).toMatch(
      /\.charge-page\s*\{[^}]*grid-template-columns:\s*1fr/,
    );
  });

  it("defines .charge-page--split for desktop 2-column split-view at min-width 768px", () => {
    expect(cssContent).toContain("@media (min-width: 768px)");
    expect(cssContent).toMatch(
      /\.charge-page--split\s*\{[^}]*grid-template-columns:\s*(repeat\(2,\s*minmax\(0,\s*1fr\)\)|repeat\(auto-fit,\s*minmax\(340px,\s*1fr\)\))/,
    );
  });

  it("defines responsive container rules with 960px max-width on desktop", () => {
    expect(cssContent).toMatch(
      /(\.app-container|\.container|\.charge-page--split|\.app-main)\s*\{[^}]*max-width:\s*960px/,
    );
  });

  it("defines layout classes for .charge-form, .charge-result and .card", () => {
    expect(cssContent).toMatch(/\.charge-form\s*\{[^}]*display:\s*flex/);
    expect(cssContent).toMatch(/\.charge-result\s*\{[^}]*display:\s*flex/);
    expect(cssContent).toMatch(/\.card\s*\{[^}]*background-color:/);
  });

  it("defines the .hidden utility class", () => {
    expect(cssContent).toMatch(/\.hidden\s*\{[^}]*display:\s*none/);
  });

  it("strictly consumes design tokens for spacing and surfaces", () => {
    expect(cssContent).toContain("var(--space-");
    expect(cssContent).toContain("var(--color-");
  });
});
