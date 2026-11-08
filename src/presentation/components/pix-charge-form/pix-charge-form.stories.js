import "./pix-charge-form.component.js";
import "./pix-charge-form.css";
import "../vector-icon/vector-icon.component.js";
import {
  CHARGE_FORM_EVENT_NAMES,
  DEFAULT_CHARGE_FORM_CTA_LABEL,
  DEFAULT_CHARGE_FORM_STEP,
  DEFAULT_CHARGE_FORM_TITLE,
} from "./pix-charge-form.constants.js";

const SAMPLE_ACTIVE_KEY = {
  id: "key-cpf-1",
  rotulo: "Nubank Pessoal",
  tipo_chave: "CPF",
  valor_chave: "123.456.789-00",
  nome_recebedor: "LUIZ HENRIQUE CANET FILHO",
  cidade_recebedor: "BRASILIA",
};

const mockGeneratePixChargeUseCase = {
  execute: async ({ chave_conta, valor_opcional }) => {
    return {
      chave_cobranca:
        "00020126350014br.gov.bcb.pix011412345678900520400005303986540525.005802BR5925LUIZ HENRIQUE CANET FILHO6008BRASILIA62070503***6304A1B2",
      imagem_qrcode:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#000"/></svg>',
      valor_opcional,
      valor_dinamico: valor_opcional === null,
      chave_conta,
      gerado_em: new Date().toISOString(),
    };
  },
};

/** @type { import('@storybook/html-vite').Meta } */
export default {
  title: "Components/PixChargeForm",
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          'Web Component `<pix-charge-form>` construído sobre `@modnes/custom-element`. Encapsula o campo de valor monetário opcional (Passo 2) e o botão primário de ação "Manda um PIX" (Passo 3). Suporta modalidade de valor aberto ou fixo com pílula de status reativa (`aria-live="polite"`), atalhos rápidos (`Aberto`, `R$ 25`, `R$ 50`), botão de limpeza rápida e bloqueio inteligente do CTA na ausência de chave ativa. Atende às regras de negócio `RN02`, `RN03` e `RN04`.',
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
        ],
      },
    },
  },
  argTypes: {
    stepText: {
      control: { type: "text" },
      description: "Número ou identificador da etapa do fluxo.",
      table: { defaultValue: { summary: DEFAULT_CHARGE_FORM_STEP } },
    },
    titleText: {
      control: { type: "text" },
      description: "Título da seção exibido no cabeçalho.",
      table: { defaultValue: { summary: DEFAULT_CHARGE_FORM_TITLE } },
    },
    ctaText: {
      control: { type: "text" },
      description: "Rótulo do botão principal CTA de geração de cobrança.",
      table: { defaultValue: { summary: DEFAULT_CHARGE_FORM_CTA_LABEL } },
    },
    amount: {
      control: { type: "text" },
      description: "Valor monetário inicial informado no input.",
      table: { defaultValue: { summary: "" } },
    },
  },
  args: {
    stepText: DEFAULT_CHARGE_FORM_STEP,
    titleText: DEFAULT_CHARGE_FORM_TITLE,
    ctaText: DEFAULT_CHARGE_FORM_CTA_LABEL,
    amount: "",
  },
};

/**
 * Auxiliar para criar o contêiner responsivo e instanciar o formulário.
 */
function createFormContainer(
  args,
  { hasKey = true, key = SAMPLE_ACTIVE_KEY, errorMessage = null } = {},
) {
  const container = document.createElement("div");
  container.style.width = "100%";
  container.style.maxWidth = "440px";
  container.style.padding = "1rem";
  container.style.boxSizing = "border-box";

  const form = document.createElement("pix-charge-form");
  form.setAttribute("step-text", args.stepText);
  form.setAttribute("title-text", args.titleText);
  form.setAttribute("cta-text", args.ctaText);

  if (args.amount) {
    form.setAttribute("amount", args.amount);
  }

  form.generatePixChargeUseCase = mockGeneratePixChargeUseCase;

  if (hasKey) {
    form.selectedKey = key;
  }

  if (errorMessage) {
    form.errorMessage = errorMessage;
  }

  form.addEventListener(CHARGE_FORM_EVENT_NAMES.CHARGE_GENERATED, (e) => {
    window.__lastGeneratedCharge = e.detail;
  });

  container.appendChild(form);
  return container;
}

/**
 * Cenário 1: Formulário com Valor Aberto (pagador define) e Chave Ativa (Happy Path).
 */
export const OpenAmountDefault = {
  name: "1. Formulário com Valor Aberto (Padrão)",
  render: (args) => createFormContainer(args, { hasKey: true }),
};

/**
 * Cenário 2: Formulário com Valor Fixo Preenchido (R$ 45,90) e Pílula em Verde.
 */
export const FixedAmountFilled = {
  name: "2. Valor Fixo Preenchido (R$ 45,90)",
  args: {
    amount: "45,90",
  },
  render: (args) => createFormContainer(args, { hasKey: true }),
};

/**
 * Cenário 3: Botão CTA Desabilitado por ausência de chave selecionada (RN02).
 */
export const DisabledNoKey = {
  name: "3. Botão CTA Desabilitado (Sem Chave - RN02)",
  render: (args) => createFormContainer(args, { hasKey: false }),
};

/**
 * Cenário 4: Exibição de Alerta Acessível de Validação de Erro de Domínio.
 */
export const ValidationErrorAlert = {
  name: "4. Alerta de Erro de Validação (role='alert')",
  args: {
    amount: "999.999.999.999,00",
  },
  render: (args) =>
    createFormContainer(args, {
      hasKey: true,
      errorMessage:
        "Valor da cobrança PIX inválido (informe um valor positivo até 999.999.999,99 ou deixe em aberto).",
    }),
};

/**
 * Cenário 5: Interativo com Presets Rápidos e Botão de Limpeza.
 */
export const InteractivePresets = {
  name: "5. Interativo com Atalhos Rápidos (Presets)",
  args: {
    amount: "25,00",
  },
  render: (args) => {
    const container = createFormContainer(args, { hasKey: true });
    const logBox = document.createElement("div");
    logBox.style.marginTop = "0.75rem";
    logBox.style.padding = "0.5rem 0.75rem";
    logBox.style.borderRadius = "6px";
    logBox.style.backgroundColor = "#f1f5f9";
    logBox.style.fontSize = "0.75rem";
    logBox.style.fontFamily = "monospace";
    logBox.textContent =
      "Log de eventos: selecione atalhos ou clique em 'Manda um PIX'";

    const form = container.querySelector("pix-charge-form");
    form.addEventListener(CHARGE_FORM_EVENT_NAMES.AMOUNT_CHANGED, (e) => {
      logBox.textContent = `[amount-changed] raw: "${e.detail.rawAmount}", num: ${e.detail.amount}, fixo: ${e.detail.isFixed}`;
    });
    form.addEventListener(CHARGE_FORM_EVENT_NAMES.CHARGE_GENERATED, (e) => {
      logBox.textContent = `[charge-generated] valor: R$ ${e.detail.amount ?? "Aberto"}, chave: ${e.detail.chaveConta.valor_chave}`;
    });

    container.appendChild(logBox);
    return container;
  },
};
