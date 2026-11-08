import "./pix-key-empty.component.js";
import "./pix-key-empty.css";
import {
  DEFAULT_EMPTY_STATE_CTA,
  DEFAULT_EMPTY_STATE_DESCRIPTION,
  DEFAULT_EMPTY_STATE_TITLE,
  KEY_EMPTY_EVENT_NAMES,
} from "./pix-key-empty.constants.js";

/** @type { import('@storybook/html-vite').Meta } */
export default {
  title: "Components/PixKeyEmpty",
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Web Component `<pix-key-empty>` construído sobre `@modnes/custom-element`. Exibe o estado vazio amigável quando o usuário não possui nenhuma chave PIX cadastrada no dispositivo (`RN01`, `RN02`). Reforça a privacidade com armazenamento **100% local** e provê o botão de ação primária (CTA) **'Adicionar Minha Primeira Chave'** que dispara o evento customizado `open-key-dialog`.",
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
    titleText: {
      control: { type: "text" },
      description: "Título principal exibido no estado vazio.",
      table: { defaultValue: { summary: DEFAULT_EMPTY_STATE_TITLE } },
    },
    descriptionText: {
      control: { type: "text" },
      description:
        "Texto descritivo enfatizando privacidade e armazenamento local.",
      table: { defaultValue: { summary: DEFAULT_EMPTY_STATE_DESCRIPTION } },
    },
    ctaText: {
      control: { type: "text" },
      description: "Rótulo do botão primário de ação (Call to Action).",
      table: { defaultValue: { summary: DEFAULT_EMPTY_STATE_CTA } },
    },
  },
  args: {
    titleText: DEFAULT_EMPTY_STATE_TITLE,
    descriptionText: DEFAULT_EMPTY_STATE_DESCRIPTION,
    ctaText: DEFAULT_EMPTY_STATE_CTA,
  },
  render: ({ titleText, descriptionText, ctaText }) => {
    const emptyElement = document.createElement("pix-key-empty");
    emptyElement.setAttribute("title-text", titleText);
    emptyElement.setAttribute("description-text", descriptionText);
    emptyElement.setAttribute("cta-text", ctaText);

    return emptyElement;
  },
};

/**
 * Visualização padrão exibida no primeiro acesso do usuário ao aplicativo
 * ou após todas as chaves terem sido excluídas.
 */
export const Default = {
  name: "Padrão (Primeiro Acesso — RN01, RN02)",
};

/**
 * Exemplo de customização de textos para cenários específicos ou contextualizados.
 */
export const CustomTexts = {
  name: "Textos Customizados",
  args: {
    titleText: "Nenhuma chave cadastrada ainda",
    descriptionText:
      "Cadastre sua chave PIX com segurança. Todas as informações permanecem criptografadas e salvas somente neste navegador.",
    ctaText: "Cadastrar Nova Chave",
  },
};

/**
 * Demonstração interativa do acionamento do CTA e captura do evento `open-key-dialog`.
 */
export const Interactive = {
  name: "Interação & Disparo de Evento",
  render: (args) => {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.alignItems = "center";
    container.style.gap = "1rem";
    container.style.width = "100%";
    container.style.maxWidth = "400px";

    const feedback = document.createElement("div");
    feedback.setAttribute("role", "status");
    feedback.style.fontSize = "0.8125rem";
    feedback.style.color = "var(--color-success, #059669)";
    feedback.style.fontWeight = "600";
    feedback.style.minHeight = "1.5rem";

    const emptyElement = document.createElement("pix-key-empty");
    emptyElement.setAttribute("title-text", args.titleText);
    emptyElement.setAttribute("description-text", args.descriptionText);
    emptyElement.setAttribute("cta-text", args.ctaText);

    container.addEventListener(KEY_EMPTY_EVENT_NAMES.OPEN_KEY_DIALOG, (e) => {
      feedback.textContent = `⚡ Evento "${e.type}" capturado com sucesso! (origem: ${e.detail?.source})`;
    });

    container.appendChild(emptyElement);
    container.appendChild(feedback);

    return container;
  },
};

