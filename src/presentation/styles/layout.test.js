import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { describe, expect, it } from "vitest";

describe("layout.css (TASK-07.4.5: Refatoração da Tela Principal, Coluna Única Centralizada e Remoção do Split-View)", () => {
  const cssPath = resolve(process.cwd(), "src/presentation/styles/layout.css");
  const cssContent = readFileSync(cssPath, "utf-8");

  it("defines the .charge-page grid with single column mobile-first and centered layout", () => {
    expect(cssContent).toMatch(/\.charge-page\s*\{[^}]*display:\s*grid/);
    expect(cssContent).toMatch(
      /\.charge-page\s*\{[^}]*grid-template-columns:\s*1fr/,
    );
    expect(cssContent).toMatch(/\.charge-page\s*\{[^}]*max-width:\s*460px/);
    expect(cssContent).toMatch(/\.charge-page\s*\{[^}]*margin-inline:\s*auto/);
  });

  it("defines .charge-page--split as a contained centered container without 2-column split-view", () => {
    expect(cssContent).toMatch(
      /\.charge-page--split\s*\{[^}]*max-width:\s*520px/,
    );
    expect(cssContent).toMatch(
      /\.charge-page--split\s*\{[^}]*margin-inline:\s*auto/,
    );
    // Não deve conter grid de 2 colunas
    expect(cssContent).not.toMatch(
      /\.charge-page--split\s*\{[^}]*grid-template-columns:\s*repeat\(2/,
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
