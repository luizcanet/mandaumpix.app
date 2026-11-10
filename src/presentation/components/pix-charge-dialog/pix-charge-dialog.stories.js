import "./pix-charge-dialog.component.js";
import "./pix-charge-dialog.css";
import "../pix-charge-result/pix-charge-result.component.js";
import "../pix-charge-result/pix-charge-result.css";
import "../vector-icon/vector-icon.component.js";
import {
  DEFAULT_CHARGE_DIALOG_CLOSE_TITLE,
  DEFAULT_CHARGE_DIALOG_DISMISS_BTN_LABEL,
  DEFAULT_CHARGE_DIALOG_TITLE,
} from "./pix-charge-dialog.constants.js";

const SAMPLE_KEY = {
  id: "key-nubank-1",
  rotulo: "Nubank Pessoal",
  tipo_chave: "CPF",
  valor_chave: "123.456.789-00",
  nome_recebedor: "LUIZ HENRIQUE CANET FILHO",
  cidade_recebedor: "BRASILIA",
};

const SAMPLE_QR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 168" width="168" height="168" role="img" aria-label="QR Code PIX">
  <rect width="168" height="168" fill="#ffffff"/>
  <path d="M12 12h42v42H12zm6 6v30h30V18zm6 6h18v18H24zm72-12h42v42H96zm6 6v30h30V18zm6 6h18v18h-18zM12 96h42v42H12zm6 6v30h30v-30zm6 6h18v18H24zm54-84h6v12h-6zm12 0h6v6h-6zm-12 18h12v6H84zm18-6h6v12h-6zm-24 6h6v18h-6zm18 12h18v6h-18zm-12 6h6v12h-6zm12 6h6v6h-6zm-18 6h6v6h-6zm24-6h12v6h-12zm-6 12h6v6h-6zm12 0h12v6h-12zm18-18h6v18h-6zm-6 24h6v6h-6zm12-18h6v6h-6zm6 6h6v18h-6zm-6 12h6v6h-6zm-24 0h6v6h-6zm6 6h18v6h-18zm-18-6h12v6H96zm-18 6h6v6h-6zm6-12h6v6h-6zm6 6h6v6h-6zm-18-18h6v12h-6zm12 0h6v6h-6zm6 6h6v6h-6zm-12 6h6v6h-6zm-18-12h6v6h-6zm6-6h6v6h-6z" fill="#0b1834"/>
</svg>`;

const SAMPLE_FIXED_CHARGE = {
  id_chave_conta: "key-nubank-1",
  chave_conta: SAMPLE_KEY,
  valor_opcional: 45.9,
  valor_dinamico: false,
  chave_cobranca:
    "00020126350014br.gov.bcb.pix011412345678900520400005303986540545.905802BR5925LUIZ HENRIQUE CANET FILHO6008BRASILIA62070503***6304E2A1",
  imagem_qrcode: {
    svg: SAMPLE_QR_SVG,
  },
  txid: "***",
  info_adicional: null,
  gerado_em: new Date().toISOString(),
};

const SAMPLE_OPEN_CHARGE = {
  id_chave_conta: "key-nubank-1",
  chave_conta: SAMPLE_KEY,
  valor_opcional: null,
  valor_dinamico: true,
  chave_cobranca:
    "00020126350014br.gov.bcb.pix0114123456789005204000053039865802BR5925LUIZ HENRIQUE CANET FILHO6008BRASILIA62070503***63043C63",
  imagem_qrcode: {
    svg: SAMPLE_QR_SVG,
  },
  txid: "***",
  info_adicional: null,
  gerado_em: new Date().toISOString(),
};

/**
 * Mock do caso de uso de distribuição de cobrança PIX para o Storybook.
 */
const mockDistributePixChargeUseCase = {
  copyChargeCode: async () => ({
    action: "COPY",
    copied: true,
  }),
  shareCharge: async () => ({
    action: "SHARE",
    shared: true,
    channel: "WEB_SHARE",
  }),
  downloadQrImage: async () => ({
    action: "DOWNLOAD_QR",
    downloaded: true,
    fileName: "mandaumpix-qrcode.png",
  }),
};

/** @type { import('@storybook/html-vite').Meta } */
export default {
  title: "Components/PixChargeDialog",
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          'Web Component `<pix-charge-dialog>` construído sobre `@modnes/custom-element`. Encapsula a caixa de diálogo modal acessível `<dialog class="charge-dialog">` para apresentação do resultado da cobrança PIX gerada (`US-07.4`), eliminando o estado estático de espera "Aguardando geração" da tela principal. Suporta cobranças com valor fixo (`RN04`) e valor aberto (`RN03`), integrando o palco de QR Code de alto contraste, código Copia e Cola, ações de distribuição (Copiar, Compartilhar e Salvar Imagem) e conformidade estrita com as diretrizes W3C WAI-ARIA Dialog Modal (WCAG 2.2 AA).',
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
      description: "Título exibido na barra superior do diálogo modal.",
      table: { defaultValue: { summary: DEFAULT_CHARGE_DIALOG_TITLE } },
    },
    closeTitle: {
      control: { type: "text" },
      description: "Tooltip e aria-label do botão X de fechar.",
      table: { defaultValue: { summary: DEFAULT_CHARGE_DIALOG_CLOSE_TITLE } },
    },
    dismissBtnLabel: {
      control: { type: "text" },
      description: "Rótulo do botão inferior de conclusão e retorno.",
      table: {
        defaultValue: { summary: DEFAULT_CHARGE_DIALOG_DISMISS_BTN_LABEL },
      },
    },
  },
  args: {
    titleText: DEFAULT_CHARGE_DIALOG_TITLE,
    closeTitle: DEFAULT_CHARGE_DIALOG_CLOSE_TITLE,
    dismissBtnLabel: DEFAULT_CHARGE_DIALOG_DISMISS_BTN_LABEL,
  },
};

/**
 * Cria uma instância do componente <pix-charge-dialog> configurada.
 */
function createDialog(args, chargeData = null, autoOpen = true) {
  const dialog = document.createElement("pix-charge-dialog");
  dialog.setAttribute("title-text", args.titleText);
  dialog.setAttribute("close-title", args.closeTitle);
  dialog.setAttribute("dismiss-btn-label", args.dismissBtnLabel);

  dialog.distributePixChargeUseCase = mockDistributePixChargeUseCase;

  if (chargeData) {
    dialog.charge = chargeData;
  }

  if (autoOpen) {
    // Garante abertura da caixa de diálogo no Storybook
    setTimeout(() => {
      dialog.openModal(chargeData);
    }, 50);
  }

  return dialog;
}

/**
 * Story 1: Modal aberto com cobrança de valor fixo formatado em BRL (R$ 45,90).
 */
export const FixedAmountOpen = {
  name: "Modal Aberto (Valor Fixo R$ 45,90)",
  render: (args) => {
    const container = document.createElement("div");
    container.style.minHeight = "600px";
    container.style.width = "460px";
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";

    const dialog = createDialog(args, SAMPLE_FIXED_CHARGE, true);
    container.appendChild(dialog);
    return container;
  },
};

/**
 * Story 2: Modal aberto com cobrança de valor aberto/dinâmico ("Valor a definir").
 */
export const OpenAmountOpen = {
  name: "Modal Aberto (Valor Aberto)",
  render: (args) => {
    const container = document.createElement("div");
    container.style.minHeight = "600px";
    container.style.width = "460px";
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";

    const dialog = createDialog(args, SAMPLE_OPEN_CHARGE, true);
    container.appendChild(dialog);
    return container;
  },
};

/**
 * Story 3: Disparador interativo que permite abrir e fechar a caixa de diálogo modal.
 */
export const InteractiveTrigger = {
  name: "Gatilho Interativo (Abrir Diálogo)",
  render: (args) => {
    const container = document.createElement("div");
    container.style.minHeight = "400px";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";
    container.style.gap = "1rem";

    const triggerBtn = document.createElement("button");
    triggerBtn.type = "button";
    triggerBtn.className = "charge-cta";
    triggerBtn.innerHTML = `
      <vector-icon name="qrcode"></vector-icon>
      <span>Manda um PIX (Abrir Modal)</span>
    `;
    triggerBtn.style.padding = "0.75rem 1.5rem";
    triggerBtn.style.fontWeight = "bold";
    triggerBtn.style.cursor = "pointer";

    const dialog = createDialog(args, SAMPLE_FIXED_CHARGE, false);

    triggerBtn.onclick = () => {
      dialog.openModal(SAMPLE_FIXED_CHARGE);
    };

    container.appendChild(triggerBtn);
    container.appendChild(dialog);
    return container;
  },
};
