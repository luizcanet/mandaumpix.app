import "./pix-charge-result.component.js";
import "./pix-charge-result.css";
import "../vector-icon/vector-icon.component.js";
import {
  CHARGE_RESULT_EVENT_NAMES,
  DEFAULT_CHARGE_RESULT_WAITING_DESCRIPTION,
  DEFAULT_CHARGE_RESULT_WAITING_TITLE,
  DISTRIBUTE_PIX_CHARGE_INJECTABLE_TOKEN,
} from "./pix-charge-result.constants.js";

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
 * Mock do caso de uso de distribuição de cobrança PIX para Storybook.
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
  title: "Components/PixChargeResult",
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          'Web Component `<pix-charge-result>` construído sobre `@modnes/custom-element`. Palco de exibição de alto contraste do QR Code e código PIX Copia e Cola. Suporta o estado inicial de espera (aguardando geração), cobrança com valor fixo formatado em BRL (`RN04`) e cobrança com valor aberto/dinâmico (`RN03`). Apresenta moldura centralizada estritamente branca (`#ffffff`) com borda de alto contraste `#0b1834` para perfeita leitura óptica por câmeras de aplicativos bancários. Inclui ações integradas de distribuição (Copiar código com feedback visual e acessível de 2,5s, Compartilhar via WhatsApp / Web Share e Salvar imagem PNG do QR Code) em conformidade com a história `US-06.3` e `RN05`, botões com alvo de toque de 48px e região acessível `aria-live="polite"`.',
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
        ],
      },
    },
  },
  argTypes: {
    waitingTitle: {
      control: { type: "text" },
      description: "Título exibido no estado inicial aguardando emissão.",
      table: { defaultValue: { summary: DEFAULT_CHARGE_RESULT_WAITING_TITLE } },
    },
    waitingDesc: {
      control: { type: "text" },
      description: "Mensagem descritiva exibida no estado de espera.",
      table: {
        defaultValue: { summary: DEFAULT_CHARGE_RESULT_WAITING_DESCRIPTION },
      },
    },
  },
  args: {
    waitingTitle: DEFAULT_CHARGE_RESULT_WAITING_TITLE,
    waitingDesc: DEFAULT_CHARGE_RESULT_WAITING_DESCRIPTION,
  },
};

/**
 * Cria o contêiner responsivo com largura e espaçamento padronizados.
 */
function createContainer(
  charge = null,
  { mockUseCase = mockDistributePixChargeUseCase } = {},
) {
  const container = document.createElement("div");
  container.style.width = "100%";
  container.style.maxWidth = "440px";
  container.style.padding = "1rem";
  container.style.boxSizing = "border-box";

  container.addEventListener("request-provider", (event) => {
    if (
      event.detail?.token === DISTRIBUTE_PIX_CHARGE_INJECTABLE_TOKEN &&
      mockUseCase
    ) {
      event.detail.callback(mockUseCase);
    }
  });

  const result = document.createElement("pix-charge-result");
  if (mockUseCase) {
    result.distributePixChargeUseCase = mockUseCase;
  }
  if (charge) {
    result.charge = charge;
  }

  container.appendChild(result);
  return { container, result };
}

/**
 * Cenário 1: Estado Inicial / Aguardando Geração da Cobrança (Empty State).
 */
export const WaitingState = {
  name: "1. Aguardando Geração (Estado Inicial)",
  render: () => {
    const { container } = createContainer(null);
    return container;
  },
};

/**
 * Cenário 2: Cobrança Gerada com Valor Fixo (R$ 45,90 - Happy Path com Ações Integradas).
 */
export const FixedAmount = {
  name: "2. Cobrança com Valor Fixo (R$ 45,90)",
  render: () => {
    const { container } = createContainer(SAMPLE_FIXED_CHARGE);
    return container;
  },
};

/**
 * Cenário 3: Cobrança Gerada com Valor Aberto / Dinâmico (RN03).
 */
export const OpenAmount = {
  name: "3. Cobrança com Valor Aberto (Dinâmico)",
  render: () => {
    const { container } = createContainer(SAMPLE_OPEN_CHARGE);
    return container;
  },
};

/**
 * Cenário 4: Estado Copiado Ativo ("Copiado!" com temporizador de 2,5s e botão para re-disparar).
 */
export const CopiedState = {
  name: "4. Estado Copiado Ativo ('Copiado!')",
  render: () => {
    const { container, result } = createContainer(SAMPLE_FIXED_CHARGE);

    const controls = document.createElement("div");
    controls.style.display = "flex";
    controls.style.justifyContent = "center";
    controls.style.marginBottom = "0.75rem";

    const triggerBtn = document.createElement("button");
    triggerBtn.type = "button";
    triggerBtn.textContent = "Disparar Ação Copiar";
    triggerBtn.style.padding = "0.45rem 0.85rem";
    triggerBtn.style.borderRadius = "6px";
    triggerBtn.style.fontSize = "0.75rem";
    triggerBtn.style.fontWeight = "700";
    triggerBtn.style.cursor = "pointer";
    triggerBtn.style.border = "1px solid #cbd5e1";
    triggerBtn.style.backgroundColor = "#f8fafc";
    triggerBtn.onclick = () => result.copyChargeCode();

    controls.appendChild(triggerBtn);
    container.insertBefore(controls, result);

    // Dispara automaticamente para exibir o estado copiado inicial na montagem
    setTimeout(() => {
      result.copyChargeCode();
    }, 100);

    return container;
  },
};

/**
 * Cenário 5: Ações de Distribuição com Log de Eventos (Copiar, Compartilhar e Salvar PNG).
 */
export const InteractiveActions = {
  name: "5. Ações de Distribuição (Interativo com Eventos)",
  render: () => {
    const { container, result } = createContainer(SAMPLE_FIXED_CHARGE);

    const logBox = document.createElement("div");
    logBox.style.marginTop = "0.75rem";
    logBox.style.padding = "0.6rem 0.85rem";
    logBox.style.borderRadius = "6px";
    logBox.style.backgroundColor = "#f1f5f9";
    logBox.style.border = "1px solid #e2e8f0";
    logBox.style.fontSize = "0.75rem";
    logBox.style.fontFamily = "monospace";
    logBox.textContent =
      "Log de eventos: clique em Copiar, WhatsApp ou Salvar PNG...";

    result.addEventListener(CHARGE_RESULT_EVENT_NAMES.CHARGE_COPIED, () => {
      logBox.textContent = `[${new Date().toLocaleTimeString()}] Evento: 'charge-copied' disparado com sucesso!`;
    });

    result.addEventListener(
      CHARGE_RESULT_EVENT_NAMES.CHARGE_SHARED,
      (event) => {
        logBox.textContent = `[${new Date().toLocaleTimeString()}] Evento: 'charge-shared' (canal: ${event.detail?.result?.channel || "WEB_SHARE"})`;
      },
    );

    result.addEventListener(
      CHARGE_RESULT_EVENT_NAMES.CHARGE_DOWNLOADED,
      (event) => {
        logBox.textContent = `[${new Date().toLocaleTimeString()}] Evento: 'charge-downloaded' (arquivo: ${event.detail?.result?.fileName || "mandaumpix-qrcode.png"})`;
      },
    );

    container.appendChild(logBox);
    return container;
  },
};

/**
 * Cenário 6: Interativo para teste de alternância dinâmica e limpeza de estado.
 */
export const InteractiveToggle = {
  name: "6. Interativo (Alternar Valor Fixo, Aberto e Limpar)",
  render: () => {
    const { container, result } = createContainer(null);

    const controls = document.createElement("div");
    controls.style.display = "flex";
    controls.style.gap = "0.5rem";
    controls.style.marginBottom = "0.75rem";
    controls.style.flexWrap = "wrap";

    const btnFixed = document.createElement("button");
    btnFixed.type = "button";
    btnFixed.textContent = "Gerar Fixo (R$ 45,90)";
    btnFixed.style.padding = "0.4rem 0.75rem";
    btnFixed.style.borderRadius = "6px";
    btnFixed.style.fontSize = "0.75rem";
    btnFixed.style.cursor = "pointer";
    btnFixed.onclick = () => result.setCharge(SAMPLE_FIXED_CHARGE);

    const btnOpen = document.createElement("button");
    btnOpen.type = "button";
    btnOpen.textContent = "Gerar Aberto";
    btnOpen.style.padding = "0.4rem 0.75rem";
    btnOpen.style.borderRadius = "6px";
    btnOpen.style.fontSize = "0.75rem";
    btnOpen.style.cursor = "pointer";
    btnOpen.onclick = () => result.setCharge(SAMPLE_OPEN_CHARGE);

    const btnClear = document.createElement("button");
    btnClear.type = "button";
    btnClear.textContent = "Limpar Cobrança";
    btnClear.style.padding = "0.4rem 0.75rem";
    btnClear.style.borderRadius = "6px";
    btnClear.style.fontSize = "0.75rem";
    btnClear.style.cursor = "pointer";
    btnClear.onclick = () => result.clearCharge();

    controls.appendChild(btnFixed);
    controls.appendChild(btnOpen);
    controls.appendChild(btnClear);

    const logBox = document.createElement("div");
    logBox.style.marginTop = "0.75rem";
    logBox.style.padding = "0.5rem 0.75rem";
    logBox.style.borderRadius = "6px";
    logBox.style.backgroundColor = "#f1f5f9";
    logBox.style.fontSize = "0.75rem";
    logBox.style.fontFamily = "monospace";
    logBox.textContent = "Log de eventos: aguardando ação...";

    result.addEventListener(CHARGE_RESULT_EVENT_NAMES.CHARGE_CHANGED, (e) => {
      const ch = e.detail.charge;
      logBox.textContent = `[charge-changed] valor: ${ch.valor_opcional ?? "Aberto"}, titular: ${ch.chave_conta?.nome_recebedor}`;
    });

    result.addEventListener(CHARGE_RESULT_EVENT_NAMES.CHARGE_CLEARED, () => {
      logBox.textContent =
        "[charge-cleared] Cobrança limpa, retornado ao estado de espera.";
    });

    container.insertBefore(controls, result);
    container.appendChild(logBox);
    return container;
  },
};
