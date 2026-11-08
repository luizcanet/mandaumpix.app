import { describe, expect, it } from "vitest";

import * as aboutPageStories from "./pages/about-page/about-page.stories.js";
import * as appHeaderStories from "./components/app-header/app-header.stories.js";
import * as pixChargeFormStories from "./components/pix-charge-form/pix-charge-form.stories.js";
import * as pixChargeResultStories from "./components/pix-charge-result/pix-charge-result.stories.js";
import * as pixKeyDialogStories from "./components/pix-key-dialog/pix-key-dialog.stories.js";
import * as pixKeyEmptyStories from "./components/pix-key-empty/pix-key-empty.stories.js";
import * as pixKeySelectorStories from "./components/pix-key-selector/pix-key-selector.stories.js";
import * as vectorIconStories from "./components/vector-icon/vector-icon.stories.js";

const STORY_MODULES = [
  {
    name: "VectorIcon",
    category: "Shared Components/VectorIcon",
    module: vectorIconStories,
  },
  {
    name: "AppHeader",
    category: "Components/AppHeader",
    module: appHeaderStories,
  },
  {
    name: "PixKeyEmpty",
    category: "Components/PixKeyEmpty",
    module: pixKeyEmptyStories,
  },
  {
    name: "PixKeySelector",
    category: "Components/PixKeySelector",
    module: pixKeySelectorStories,
  },
  {
    name: "PixKeyDialog",
    category: "Components/PixKeyDialog",
    module: pixKeyDialogStories,
  },
  {
    name: "PixChargeForm",
    category: "Components/PixChargeForm",
    module: pixChargeFormStories,
  },
  {
    name: "PixChargeResult",
    category: "Components/PixChargeResult",
    module: pixChargeResultStories,
  },
  {
    name: "AboutPage",
    category: "Pages/AboutPage",
    module: aboutPageStories,
  },
];

describe("Storybook Catalog & A11y Suite Integrity (US-07.1)", () => {
  it("deve cobrir exaustivamente todos os 8 blocos de apresentação da aplicação", () => {
    expect(STORY_MODULES).toHaveLength(8);
  });

  describe.each(STORY_MODULES)(
    "Catálogo Storybook: $name ($category)",
    ({ name, category, module }) => {
      const meta = module.default;

      it(`[${name}] deve possuir exportação padrão (meta) com title padronizado`, () => {
        expect(meta).toBeDefined();
        expect(meta.title).toBe(category);
      });

      it(`[${name}] deve habilitar a geração automática da aba Docs via tag 'autodocs'`, () => {
        expect(meta.tags).toBeDefined();
        expect(meta.tags).toContain("autodocs");
      });

      it(`[${name}] deve conter descrição detalhada do componente em parameters.docs`, () => {
        expect(meta.parameters?.docs?.description?.component).toBeDefined();
        expect(
          meta.parameters.docs.description.component.trim().length,
        ).toBeGreaterThan(20);
      });

      it(`[${name}] deve configurar parâmetros explícitos de acessibilidade (@storybook/addon-a11y)`, () => {
        expect(meta.parameters?.a11y).toBeDefined();
        expect(meta.parameters.a11y.config?.rules).toBeDefined();
        expect(Array.isArray(meta.parameters.a11y.config.rules)).toBe(true);

        const colorContrastRule = meta.parameters.a11y.config.rules.find(
          (rule) => rule.id === "color-contrast",
        );
        expect(colorContrastRule).toBeDefined();
        expect(colorContrastRule?.enabled).toBe(true);
      });

      it(`[${name}] deve declarar argTypes para controle interativo de propriedades`, () => {
        expect(meta.argTypes).toBeDefined();
        expect(Object.keys(meta.argTypes).length).toBeGreaterThan(0);
      });

      it(`[${name}] deve exportar pelo menos uma story válida além do meta padrão`, () => {
        const exportedStories = Object.keys(module).filter(
          (key) => key !== "default",
        );
        expect(exportedStories.length).toBeGreaterThanOrEqual(1);
      });

      it(`[${name}] deve renderizar elementos HTML válidos ao instanciar a story padrão`, () => {
        const storyKeys = Object.keys(module).filter(
          (key) => key !== "default",
        );
        const firstStory = module[storyKeys[0]];
        const renderFn = firstStory?.render || meta.render;

        if (typeof renderFn === "function") {
          const rendered = renderFn(meta.args || firstStory?.args || {});
          expect(rendered).toBeInstanceOf(HTMLElement);
        }
      });
    },
  );
});
