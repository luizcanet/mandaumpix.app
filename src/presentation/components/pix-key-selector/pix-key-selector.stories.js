import "./pix-key-selector.component.js";
import "./pix-key-selector.css";
import "../vector-icon/vector-icon.component.js";
import {
  DEFAULT_KEY_SELECTOR_ADD_BTN_LABEL,
  DEFAULT_KEY_SELECTOR_LIST_LABEL,
  DEFAULT_KEY_SELECTOR_STEP,
  DEFAULT_KEY_SELECTOR_TITLE,
  KEY_SELECTOR_EVENT_NAMES,
} from "./pix-key-selector.constants.js";

const SAMPLE_KEYS = [
  {
    id: "key-cpf-1",
    rotulo: "Nubank Pessoal",
    tipo_chave: "CPF",
    valor_chave: "123.456.789-00",
    nome_recebedor: "LUIZ HENRIQUE CANET FILHO",
    cidade_recebedor: "BRASILIA",
  },
  {
    id: "key-cnpj-2",
    rotulo: "Inter PJ",
    tipo_chave: "CNPJ",
    valor_chave: "11.222.333/0001-81",
    nome_recebedor: "LUIZ CANET SERVICOS LTDA",
    cidade_recebedor: "BRASILIA",
  },
  {
    id: "key-email-3",
    rotulo: "Chave E-mail",
    tipo_chave: "EMAIL",
    valor_chave: "eu@luizca.net",
    nome_recebedor: "LUIZ CANET",
    cidade_recebedor: "BRASILIA",
  },
];

/** @type { import('@storybook/html-vite').Meta } */
export default {
  title: "Components/PixKeySelector",
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          'Web Component `<pix-key-selector>` construído sobre `@modnes/custom-element`. Renderiza o seletor de contas para recebimento via PIX seguindo o padrão W3C ARIA Radiogroup (`role="radiogroup"` / `role="radio"`). Permite seleção da conta ativa em 1 toque ou via teclado (roving tabindex com setas direcionais), remoção com botão dedicado de exclusão (`stopPropagation` e área `>= 44x44px`), e ação secundária "+ Nova chave" (`open-key-dialog`). Atende rigorosamente às regras `RN01` e `RN02`.',
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
    stepText: {
      control: { type: "text" },
      description: "Número ou identificador da etapa do fluxo.",
      table: { defaultValue: { summary: DEFAULT_KEY_SELECTOR_STEP } },
    },
    titleText: {
      control: { type: "text" },
      description: "Título da seção exibido no cabeçalho.",
      table: { defaultValue: { summary: DEFAULT_KEY_SELECTOR_TITLE } },
    },
    addBtnLabel: {
      control: { type: "text" },
      description: "Rótulo do botão secundário para adicionar nova chave.",
      table: { defaultValue: { summary: DEFAULT_KEY_SELECTOR_ADD_BTN_LABEL } },
    },
    listLabel: {
      control: { type: "text" },
      description:
        "Rótulo acessível da lista de cartões (aria-label no radiogroup).",
      table: { defaultValue: { summary: DEFAULT_KEY_SELECTOR_LIST_LABEL } },
    },
  },
  args: {
    stepText: DEFAULT_KEY_SELECTOR_STEP,
    titleText: DEFAULT_KEY_SELECTOR_TITLE,
    addBtnLabel: DEFAULT_KEY_SELECTOR_ADD_BTN_LABEL,
    listLabel: DEFAULT_KEY_SELECTOR_LIST_LABEL,
  },
};

/**
 * Cenário com uma única chave cadastrada e selecionada como ativa (RN01, RN02).
 */
export const SingleKeySelected = {
  name: "Chave Única Selecionada (RN02)",
  render: (args) => {
    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.maxWidth = "460px";

    const selector = document.createElement("pix-key-selector");
    selector.setAttribute("step-text", args.stepText);
    selector.setAttribute("title-text", args.titleText);
    selector.setAttribute("add-btn-label", args.addBtnLabel);
    selector.setAttribute("list-label", args.listLabel);

    selector.keys = [SAMPLE_KEYS[0]];
    selector.selectedKeyId = SAMPLE_KEYS[0].id;

    container.appendChild(selector);
    return container;
  },
};

/**
 * Cenário exibindo múltiplas contas cadastradas com a conta PJ selecionada.
 */
export const MultipleKeys = {
  name: "Múltiplas Chaves Cadastradas",
  render: (args) => {
    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.maxWidth = "460px";

    const selector = document.createElement("pix-key-selector");
    selector.setAttribute("step-text", args.stepText);
    selector.setAttribute("title-text", args.titleText);
    selector.setAttribute("add-btn-label", args.addBtnLabel);
    selector.setAttribute("list-label", args.listLabel);

    selector.keys = SAMPLE_KEYS;
    selector.selectedKeyId = SAMPLE_KEYS[1].id;

    container.appendChild(selector);
    return container;
  },
};

/**
 * Demonstração interativa completa permitindo testar seleção, exclusão de chaves
 * e captura dos eventos em tempo real (`select-key`, `delete-key`, `open-key-dialog`).
 */
export const Interactive = {
  name: "Alternância Interativa de Seleção & Eventos",
  render: (args) => {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "1rem";
    container.style.width = "100%";
    container.style.maxWidth = "460px";

    const feedbackPanel = document.createElement("div");
    feedbackPanel.setAttribute("role", "status");
    feedbackPanel.setAttribute("aria-live", "polite");
    feedbackPanel.style.padding = "0.75rem 1rem";
    feedbackPanel.style.borderRadius = "8px";
    feedbackPanel.style.backgroundColor = "var(--color-surface-muted, #f8fafc)";
    feedbackPanel.style.border = "1px solid var(--color-border, #e2e8f0)";
    feedbackPanel.style.fontSize = "0.8125rem";
    feedbackPanel.style.color = "var(--color-text-secondary, #475569)";
    feedbackPanel.style.fontFamily = "var(--font-mono, monospace)";
    feedbackPanel.style.minHeight = "2.5rem";
    feedbackPanel.textContent =
      "⚡ Clique em um cartão, use as setas do teclado ou acione as ações para testar.";

    const selector = document.createElement("pix-key-selector");
    selector.setAttribute("step-text", args.stepText);
    selector.setAttribute("title-text", args.titleText);
    selector.setAttribute("add-btn-label", args.addBtnLabel);
    selector.setAttribute("list-label", args.listLabel);

    // Clona as chaves para que a exclusão local não afete outras stories
    selector.keys = JSON.parse(JSON.stringify(SAMPLE_KEYS));
    selector.selectedKeyId = SAMPLE_KEYS[0].id;

    container.addEventListener(KEY_SELECTOR_EVENT_NAMES.SELECT_KEY, (e) => {
      feedbackPanel.textContent = `✅ [select-key] Chave ativa: "${e.detail?.key?.rotulo}" (ID: ${e.detail?.id})`;
      feedbackPanel.style.color = "var(--color-success, #059669)";
    });

    container.addEventListener(KEY_SELECTOR_EVENT_NAMES.DELETE_KEY, (e) => {
      feedbackPanel.textContent = `🗑️ [delete-key] Chave removida: "${e.detail?.key?.rotulo}" (ID: ${e.detail?.id})`;
      feedbackPanel.style.color = "var(--color-danger, #e11d48)";
    });

    container.addEventListener(
      KEY_SELECTOR_EVENT_NAMES.OPEN_KEY_DIALOG,
      (e) => {
        feedbackPanel.textContent = `➕ [open-key-dialog] Solicitada abertura do modal de cadastro (origem: ${e.detail?.source})`;
        feedbackPanel.style.color = "var(--color-brand-primary, #0b1834)";
      },
    );

    container.appendChild(selector);
    container.appendChild(feedbackPanel);

    return container;
  },
};

