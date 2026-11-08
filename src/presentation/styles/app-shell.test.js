import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { describe, expect, it } from "vitest";

describe("app-shell.css (TASK-04.1.2: Estilos BEM da Casca Global)", () => {
  const cssPath = resolve(
    process.cwd(),
    "src/presentation/styles/app-shell.css",
  );
  const cssContent = readFileSync(cssPath, "utf-8");

  it("defines the .app-root block with full viewport layout and flex column", () => {
    expect(cssContent).toMatch(/\.app-root\s*\{[^}]*display:\s*flex/);
    expect(cssContent).toMatch(/\.app-root\s*\{[^}]*flex-direction:\s*column/);
    expect(cssContent).toMatch(/\.app-root\s*\{[^}]*min-height:\s*100vh/);
  });

  it("defines the .app-header block with brand gradient and high contrast", () => {
    expect(cssContent).toMatch(/\.app-header\s*\{[^}]*display:\s*flex/);
    expect(cssContent).toMatch(/\.app-header\s*\{[^}]*background:/);
    expect(cssContent).toMatch(/\.app-header__brand\s*\{/);
    expect(cssContent).toMatch(/\.app-header__logo\s*\{/);
    expect(cssContent).toMatch(/\.app-header__title\s*\{/);
    expect(cssContent).toMatch(/\.app-header__subtitle\s*\{/);
    expect(cssContent).toMatch(/\.app-header__actions\s*\{/);
  });

  it("defines .app-header action buttons with BEM modifier/element classes", () => {
    expect(cssContent).toMatch(/\.app-header__install-btn\s*\{/);
    expect(cssContent).toMatch(/\.app-header__about-link\s*\{/);
  });

  it("defines the .app-main region expanding flex space", () => {
    expect(cssContent).toMatch(/\.app-main\s*\{[^}]*flex:\s*1/);
    expect(cssContent).toMatch(/\.app-main\s*\{[^}]*display:\s*flex/);
  });

  it("defines the .app-footer block with status dot and link", () => {
    expect(cssContent).toMatch(/\.app-footer\s*\{[^}]*display:\s*flex/);
    expect(cssContent).toMatch(
      /\.app-footer__status\s*\{[^}]*display:\s*inline-flex/,
    );
    expect(cssContent).toMatch(/\.app-footer__dot\s*\{[^}]*background-color:/);
    expect(cssContent).toMatch(
      /\.app-footer__link\s*\{[^}]*text-decoration:\s*underline/,
    );
  });

  it("strictly consumes design tokens with valid fallbacks", () => {
    expect(cssContent).toContain("var(--color-brand-primary");
    expect(cssContent).toContain("var(--color-brand-accent");
    expect(cssContent).toContain("var(--space-");
    expect(cssContent).toContain("var(--radius-");
  });
});
