import "./pix-key-dialog.component.js";
import "./pix-key-dialog.css";
import "../vector-icon/vector-icon.component.js";
import {
  DEFAULT_KEY_DIALOG_CANCEL_BTN_LABEL,
  DEFAULT_KEY_DIALOG_CLOSE_TITLE,
  DEFAULT_KEY_DIALOG_SAVE_BTN_LABEL,
  DEFAULT_KEY_DIALOG_TITLE,
  KEY_DIALOG_EVENT_NAMES,
} from "./pix-key-dialog.constants.js";
import { PIX_KEY_TYPES } from "../../../domain/entities/pix-key.entity.js";

/** @type { import('@storybook/html-vite').Meta } */
export default {
  title: "Components/PixKeyDialog",
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          'Web Component `<pix-key-dialog>` construído sobre `@modnes/custom-element`. Renderiza o modal nativo `<dialog class="key-dialog">` para cadastro rápido de novas chaves PIX de recebimento sem mudança de contexto. Disponibiliza pílulas seletoras dos 5 tipos de chave canônicos (`CPF`, `CNPJ`, `EMAIL`, `TELEFONE`, `EVP`), validação síncrona/assíncrona com feedback acessível (`role="alert"`), fechamento seguro por botão, backdrop ou tecla `Escape`, e persistência local 100% no dispositivo via `SavePixKeyUseCase`. Atende às regras de negócio `RN01` e `RN02`.',
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: "color-contrast",
            enabled: true,
          },
          {
            id: "button-name",
            enabled: true,
          },
          {
            id: "target-size",
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
        ],
      },
    },
  },
  argTypes: {
    titleText: {
      control: { type: "text" },
      description: "Título exibido no cabeçalho do diálogo modal.",
      table: { defaultValue: { summary: DEFAULT_KEY_DIALOG_TITLE } },
    },
    saveBtnLabel: {
      control: { type: "text" },
      description: "Rótulo do botão primário para salvar a chave.",
      table: { defaultValue: { summary: DEFAULT_KEY_DIALOG_SAVE_BTN_LABEL } },
    },
    cancelBtnLabel: {
      control: { type: "text" },
      description: "Rótulo do botão secundário para cancelar e fechar.",
      table: { defaultValue: { summary: DEFAULT_KEY_DIALOG_CANCEL_BTN_LABEL } },
    },
    closeTitle: {
      control: { type: "text" },
      description: "Tooltip e aria-label do botão X de fechar.",
      table: { defaultValue: { summary: DEFAULT_KEY_DIALOG_CLOSE_TITLE } },
    },
  },
  args: {
    titleText: DEFAULT_KEY_DIALOG_TITLE,
    saveBtnLabel: DEFAULT_KEY_DIALOG_SAVE_BTN_LABEL,
    cancelBtnLabel: DEFAULT_KEY_DIALOG_CANCEL_BTN_LABEL,
    closeTitle: DEFAULT_KEY_DIALOG_CLOSE_TITLE,
  },
};

/**
 * Cria uma instância do componente <pix-key-dialog> configurada com os argumentos do Storybook.
 */
function createDialog(args) {
  const dialog = document.createElement("pix-key-dialog");
  dialog.setAttribute("title-text", args.titleText);
  dialog.setAttribute("save-btn-label", args.saveBtnLabel);
  dialog.setAttribute("cancel-btn-label", args.cancelBtnLabel);
  dialog.setAttribute("close-title", args.closeTitle);
  return dialog;
}

/**
 * Cenário 1: Modal aberto no estado padrão inicial com a pílula de CPF selecionada.
 */
export const DefaultOpenCPF = {
  name: "Modal Aberto Padrão (CPF)",
  render: (args) => {
    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.minHeight = "480px";
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";

    const dialog = createDialog(args);
    container.appendChild(dialog);

    setTimeout(() => {
      dialog.openModal();
    }, 50);

    return container;
  },
};

/**
 * Cenário 2: Modal aberto com a pílula de E-mail selecionada e placeholder correspondente.
 */
export const EmailTypeSelected = {
  name: "Seleção de E-mail (Placeholder Adaptativo)",
  render: (args) => {
    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.minHeight = "480px";
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";

    const dialog = createDialog(args);
    container.appendChild(dialog);

    setTimeout(() => {
      dialog.selectedKeyType = PIX_KEY_TYPES.EMAIL;
      dialog.openModal();
    }, 50);

    return container;
  },
};

/**
 * Cenário 3: Modal aberto com a pílula de Celular selecionada e inputmode="tel".
 */
export const PhoneTypeSelected = {
  name: "Seleção de Celular (inputmode='tel')",
  render: (args) => {
    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.minHeight = "480px";
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";

    const dialog = createDialog(args);
    container.appendChild(dialog);

    setTimeout(() => {
      dialog.selectedKeyType = PIX_KEY_TYPES.TELEFONE;
      dialog.openModal();
    }, 50);

    return container;
  },
};

/**
 * Cenário 4: Estado de erro de validação com banner acessível role="alert".
 */
export const ValidationErrorState = {
  name: "Estado com Alerta de Validação (role='alert')",
  render: (args) => {
    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.minHeight = "520px";
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";

    const dialog = createDialog(args);
    container.appendChild(dialog);

    setTimeout(() => {
      dialog.openModal();
      const keyInput = dialog.querySelector('input[name="valor_chave"]');
      if (keyInput) {
        keyInput.value = "123.456.789-00";
      }
      const form = dialog.querySelector("form");
      if (form) {
        form.dispatchEvent(new Event("submit", { cancelable: true }));
      }
    }, 50);

    return container;
  },
};

/**
 * Cenário 5: Formulário totalmente preenchido com dados válidos pronto para submissão.
 */
export const FilledFormState = {
  name: "Formulário Preenchido Válido",
  render: (args) => {
    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.minHeight = "480px";
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";

    const dialog = createDialog(args);
    container.appendChild(dialog);

    setTimeout(() => {
      dialog.selectedKeyType = PIX_KEY_TYPES.EMAIL;
      dialog.openModal();

      const keyInput = dialog.querySelector('input[name="valor_chave"]');
      if (keyInput) keyInput.value = "pagamentos@mandaumpix.app";

      const labelInput = dialog.querySelector('input[name="rotulo"]');
      if (labelInput) labelInput.value = "Conta Principal PJ";

      const nameInput = dialog.querySelector('input[name="nome_recebedor"]');
      if (nameInput) nameInput.value = "LUIZ CANET";

      const cityInput = dialog.querySelector('input[name="cidade_recebedor"]');
      if (cityInput) cityInput.value = "BRASILIA";
    }, 50);

    return container;
  },
};

/**
 * Cenário 6: Demonstração interativa completa com botão de abertura e painel de eventos.
 */
export const Interactive = {
  name: "Fluxo Interativo Completo & Captura de Eventos",
  render: (args) => {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.alignItems = "center";
    container.style.gap = "1.25rem";
    container.style.width = "100%";
    container.style.maxWidth = "460px";

    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.textContent = "➕ Abrir Modal de Cadastro";
    openBtn.style.padding = "0.75rem 1.5rem";
    openBtn.style.borderRadius = "9999px";
    openBtn.style.border = "none";
    openBtn.style.backgroundColor = "var(--color-brand-primary, #0b1834)";
    openBtn.style.color = "var(--color-brand-accent, #00d37f)";
    openBtn.style.fontFamily = "inherit";
    openBtn.style.fontSize = "0.875rem";
    openBtn.style.fontWeight = "800";
    openBtn.style.cursor = "pointer";
    openBtn.style.minHeight = "44px";

    const feedbackPanel = document.createElement("div");
    feedbackPanel.setAttribute("role", "status");
    feedbackPanel.setAttribute("aria-live", "polite");
    feedbackPanel.style.width = "100%";
    feedbackPanel.style.padding = "0.75rem 1rem";
    feedbackPanel.style.borderRadius = "8px";
    feedbackPanel.style.backgroundColor = "var(--color-surface-muted, #f8fafc)";
    feedbackPanel.style.border = "1px solid var(--color-border, #e2e8f0)";
    feedbackPanel.style.fontSize = "0.8125rem";
    feedbackPanel.style.color = "var(--color-text-secondary, #475569)";
    feedbackPanel.style.fontFamily = "var(--font-mono, monospace)";
    feedbackPanel.style.minHeight = "2.75rem";
    feedbackPanel.textContent =
      "⚡ Clique no botão acima para abrir o modal de cadastro e testar eventos.";

    const dialog = createDialog(args);

    openBtn.addEventListener("click", () => {
      dialog.openModal();
    });

    dialog.addEventListener(KEY_DIALOG_EVENT_NAMES.KEY_SAVED, (e) => {
      const chave = e.detail?.chaveConta || e.detail?.chave_conta;
      feedbackPanel.textContent = `✅ [key-saved] Nova chave: "${chave?.valor_chave}" (${chave?.tipo_chave}) | Titular: "${chave?.nome_recebedor}"`;
      feedbackPanel.style.color = "var(--color-success, #059669)";
    });

    dialog.addEventListener(KEY_DIALOG_EVENT_NAMES.CLOSE_KEY_DIALOG, () => {
      feedbackPanel.textContent =
        "ℹ️ [close-key-dialog] Diálogo fechado pelo usuário.";
      feedbackPanel.style.color = "var(--color-text-secondary, #475569)";
    });

    container.appendChild(openBtn);
    container.appendChild(feedbackPanel);
    container.appendChild(dialog);

    return container;
  },
};
