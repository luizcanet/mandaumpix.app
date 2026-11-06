import { AVAILABLE_ICONS } from "./vector-icon.component.js";

/** @type { import('@storybook/html-vite').Meta } */
export default {
  title: "Shared Components/VectorIcon",
  tags: ["autodocs"],
  argTypes: {
    name: {
      control: { type: "select" },
      options: AVAILABLE_ICONS,
      description:
        "Identificador do símbolo SVG no sprite centralizado (`icon.svg`).",
    },
    size: {
      control: { type: "text" },
      description:
        "Tamanho tipográfico (`font-size`) herdado pelo `<vector-icon>` via `1em`.",
    },
    color: {
      control: { type: "color" },
      description:
        "Cor de texto (`color`) herdada automaticamente pelo SVG via `fill: currentColor`.",
    },
    ariaLabel: {
      control: { type: "text" },
      description:
        'Rótulo acessível (`aria-label`). Se vazio, o ícone é tratado como decorativo (`aria-hidden="true"`).',
    },
  },
  args: {
    name: "qrcode",
    size: "2rem",
    color: "#0b1834",
    ariaLabel: "",
  },
  render: ({ name, size, color, ariaLabel }) => {
    const wrapper = document.createElement("div");
    wrapper.style.fontSize = size;
    wrapper.style.color = color;
    wrapper.style.display = "inline-flex";
    wrapper.style.alignItems = "center";

    const icon = document.createElement("vector-icon");
    icon.setAttribute("name", name);

    if (ariaLabel && ariaLabel.trim().length > 0) {
      icon.setAttribute("role", "img");
      icon.setAttribute("aria-label", ariaLabel.trim());
    } else {
      icon.setAttribute("aria-hidden", "true");
    }

    wrapper.appendChild(icon);
    return wrapper;
  },
};

export const Default = {
  args: {
    name: "qrcode",
    size: "2.5rem",
    color: "#0b1834",
  },
};

export const PixAccent = {
  args: {
    name: "check",
    size: "2.5rem",
    color: "#00d37f",
    ariaLabel: "Cobrança PIX confirmada",
  },
};

export const IconCatalog = {
  render: () => {
    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(120px, 1fr))";
    grid.style.gap = "1rem";

    for (const iconName of AVAILABLE_ICONS) {
      const card = document.createElement("div");
      card.style.display = "flex";
      card.style.flexDirection = "column";
      card.style.alignItems = "center";
      card.style.justifyContent = "center";
      card.style.gap = "0.5rem";
      card.style.padding = "1rem";
      card.style.backgroundColor = "var(--color-surface, #ffffff)";
      card.style.border = "1px solid var(--color-border, #e2e8f0)";
      card.style.borderRadius = "var(--radius-md, 10px)";
      card.style.color = "var(--color-brand-primary, #0b1834)";
      card.style.fontSize = "1.75rem";

      const icon = document.createElement("vector-icon");
      icon.setAttribute("name", iconName);
      icon.setAttribute("aria-hidden", "true");

      const label = document.createElement("code");
      label.textContent = iconName;
      label.style.fontSize = "0.75rem";
      label.style.color = "var(--color-text-secondary, #475569)";

      card.append(icon, label);
      grid.appendChild(card);
    }

    return grid;
  },
};
