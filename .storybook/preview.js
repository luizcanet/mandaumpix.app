import "../src/presentation/styles/tokens.css";
import "../src/presentation/styles/reset.css";
import "../src/presentation/styles/layout.css";
import "../src/presentation/styles/app-shell.css";
import "../src/presentation/components/vector-icon/vector-icon.css";
import "../src/presentation/components/vector-icon/vector-icon.component.js";

/** @type { import('@storybook/html-vite').Preview } */
const preview = {
  parameters: {
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
  },
};

export default preview;
