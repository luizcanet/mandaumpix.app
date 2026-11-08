import { AVAILABLE_ICONS } from "./vector-icon.component.js";

/** @type { import('@storybook/html-vite').Meta } */
export default {
  title: "Shared Components/VectorIcon",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          'Web Component nativo `<vector-icon>` construído sobre `@modnes/custom-element`. Renderiza ícones vetoriais escaláveis consumindo o sprite SVG externo (`icon.svg`) com herança dinâmica de cor via `fill: currentColor` e dimensionamento fluido via `1em`. Suporta semântica acessível declarativa (`role="img"` com `aria-label` para ícones informativos ou `aria-hidden="true"` para ícones decorativos).',
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: "color-contrast",
            enabled: true,
          },
        ],
      },
    },
  },
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

/**
 * Ícone decorativo padrão (aria-hidden="true") com cor primária da marca.
 */
export const Default = {
  name: "Decorativo Padrão (aria-hidden)",
  args: {
    name: "qrcode",
    size: "2.5rem",
    color: "#0b1834",
    ariaLabel: "",
  },
};

/**
 * Ícone semântico informativo com role="img" e aria-label explícito para leitores de tela.
 */
export const SemanticWithAriaLabel = {
  name: "Semântico Informativo (role='img')",
  args: {
    name: "check",
    size: "2.5rem",
    color: "#059669",
    ariaLabel: "Cobrança PIX confirmada com sucesso",
  },
};

/**
 * Demonstração do ícone embutido em botão interativo com alvo de toque acessível (>= 44x44px).
 */
export const IconButtonAccessibility = {
  name: "Botão com Ícone (Touch Target >= 44x44px)",
  render: () => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", "Copiar código PIX");
    button.style.display = "inline-flex";
    button.style.alignItems = "center";
    button.style.justifyContent = "center";
    button.style.gap = "0.5rem";
    button.style.minWidth = "48px";
    button.style.minHeight = "48px";
    button.style.padding = "0.75rem 1.25rem";
    button.style.borderRadius = "9999px";
    button.style.backgroundColor = "var(--color-brand-primary, #0b1834)";
    button.style.color = "var(--color-brand-accent, #00d37f)";
    button.style.border = "none";
    button.style.cursor = "pointer";
    button.style.fontSize = "1rem";
    button.style.fontWeight = "700";

    const icon = document.createElement("vector-icon");
    icon.setAttribute("name", "copy");
    icon.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.textContent = "Copiar Código";

    button.append(icon, label);
    return button;
  },
};

/**
 * Catálogo visual exaustivo exibindo todos os símbolos SVG registrados na aplicação.
 */
export const IconCatalog = {
  name: "Catálogo de Todos os Ícones",
  render: () => {
    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(130px, 1fr))";
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
