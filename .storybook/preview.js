import "../src/presentation/styles/tokens.css";
import "../src/presentation/styles/reset.css";
import "../src/presentation/styles/layout.css";
import "../src/presentation/styles/app-shell.css";
import "../src/presentation/pages/about-page/about-page.css";
import "../src/presentation/components/vector-icon/vector-icon.css";
import "../src/presentation/components/pix-key-empty/pix-key-empty.css";
import "../src/presentation/components/pix-key-selector/pix-key-selector.css";
import "../src/presentation/components/pix-key-dialog/pix-key-dialog.css";
import "../src/presentation/components/pix-charge-form/pix-charge-form.css";
import "../src/presentation/components/pix-charge-result/pix-charge-result.css";
import "../src/presentation/components/pix-charge-dialog/pix-charge-dialog.css";
import "../src/presentation/components/vector-icon/vector-icon.component.js";

/** @type { import('@storybook/html-vite').Preview } */
const preview = {
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: "color-contrast",
            enabled: true,
          },
          {
            id: "target-size",
            enabled: true,
          },
          {
            id: "button-name",
            enabled: true,
          },
          {
            id: "aria-required-children",
            enabled: true,
          },
          {
            id: "aria-allowed-attr",
            enabled: true,
          },
          {
            id: "duplicate-id",
            enabled: true,
          },
        ],
      },
      options: {
        runOnly: {
          type: "tag",
          values: [
            "wcag2a",
            "wcag2aa",
            "wcag21a",
            "wcag21aa",
            "wcag22aa",
            "best-practice",
          ],
        },
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      options: {
        light: {
          name: "Superfície Clara (#f8fafc)",
          value: "#f8fafc",
        },
        white: {
          name: "Branco Puro (#ffffff)",
          value: "#ffffff",
        },
        brand: {
          name: "Azul Manda um PIX (#0b1834)",
          value: "#0b1834",
        },
        dark: {
          name: "Azul Noturno (#060d1e)",
          value: "#060d1e",
        },
      },
    },
  },
  initialGlobals: {
    backgrounds: {
      value: "light",
    },
    a11y: {
      manual: false,
    },
  },
};

export default preview;
