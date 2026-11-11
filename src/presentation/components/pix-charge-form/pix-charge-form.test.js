import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../vector-icon/vector-icon.component.js";
import {
  CHARGE_FORM_CLASSES,
  CHARGE_FORM_EVENT_NAMES,
  CHARGE_FORM_ICONS,
  CHARGE_FORM_PRESETS,
  DEFAULT_CHARGE_FORM_CLEAR_LABEL,
  DEFAULT_CHARGE_FORM_CTA_DISABLED_TITLE,
  DEFAULT_CHARGE_FORM_CTA_LABEL,
  DEFAULT_CHARGE_FORM_CURRENCY,
  DEFAULT_CHARGE_FORM_INPUT_ID,
  DEFAULT_CHARGE_FORM_OPTIONAL_BADGE,
  DEFAULT_CHARGE_FORM_PLACEHOLDER,
  DEFAULT_CHARGE_FORM_STATUS_OPEN,
  DEFAULT_CHARGE_FORM_STEP,
  DEFAULT_CHARGE_FORM_TITLE,
  DEFAULT_CHARGE_FORM_TITLE_ID,
} from "./pix-charge-form.constants.js";
import PixChargeFormComponent from "./pix-charge-form.component.js";

describe("PixChargeFormComponent (TASK-06.1.3: Testes Unitários de Renderização e Interação)", () => {
  let formElement;

  const mockKey = {
    id: "key-123",
    rotulo: "Nubank Pessoal",
    tipo_chave: "CPF",
    valor_chave: "123.456.789-00",
    nome_recebedor: "LUIZ HENRIQUE CANET FILHO",
    cidade_recebedor: "BRASILIA",
  };

  const mockCobrancaPix = {
    chave_cobranca:
      "00020126350014br.gov.bcb.pix011412345678900520400005303986540525.005802BR5925LUIZ HENRIQUE CANET FILHO6008BRASILIA62070503***6304A1B2",
    imagem_qrcode:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#000"/></svg>',
    valor_opcional: 25.0,
    valor_dinamico: false,
    chave_conta: mockKey,
  };

  beforeEach(() => {
    formElement = document.createElement("pix-charge-form");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (formElement && formElement.isConnected) {
      formElement.remove();
    }
  });

  describe("Registro e Semântica W3C / BEM", () => {
    it("deve registrar o elemento customizado <pix-charge-form> no registry do customElements", () => {
      expect(customElements.get("pix-charge-form")).toBe(
        PixChargeFormComponent,
      );
    });

    it("deve aplicar as classes .charge-form e atributos semânticos ao ser anexado ao DOM", () => {
      document.body.appendChild(formElement);

      expect(formElement.classList.contains(CHARGE_FORM_CLASSES.ROOT)).toBe(
        true,
      );
      expect(formElement.getAttribute("aria-label")).toBe(
        "Gerador de cobrança PIX",
      );
    });
  });

  describe("Passo 2: Campo de Valor Monetário e Cabeçalho (.amount-field)", () => {
    it("deve renderizar o cabeçalho de seção com identificador de passo '2', título semântico e badge de opcional", () => {
      document.body.appendChild(formElement);

      const stepBadge = formElement.querySelector(
        `.${CHARGE_FORM_CLASSES.STEP_BADGE}`,
      );
      expect(stepBadge).not.toBeNull();
      expect(stepBadge.textContent.trim()).toBe(DEFAULT_CHARGE_FORM_STEP);

      const titleLabel = formElement.querySelector(
        `label.${CHARGE_FORM_CLASSES.TITLE}`,
      );
      expect(titleLabel).not.toBeNull();
      expect(titleLabel.id).toBe(DEFAULT_CHARGE_FORM_TITLE_ID);
      expect(titleLabel.getAttribute("for")).toBe(DEFAULT_CHARGE_FORM_INPUT_ID);
      expect(titleLabel.textContent.trim()).toBe(DEFAULT_CHARGE_FORM_TITLE);

      const optionalBadge = formElement.querySelector(
        `.${CHARGE_FORM_CLASSES.OPTIONAL_BADGE}`,
      );
      expect(optionalBadge).not.toBeNull();
      expect(optionalBadge.textContent.trim()).toBe(
        DEFAULT_CHARGE_FORM_OPTIONAL_BADGE,
      );
    });

    it("deve renderizar a caixa de entrada monetária com prefixo R$ e inputmode decimal", () => {
      document.body.appendChild(formElement);

      const box = formElement.querySelector(`.${CHARGE_FORM_CLASSES.BOX}`);
      expect(box).not.toBeNull();

      const currency = box.querySelector(`.${CHARGE_FORM_CLASSES.CURRENCY}`);
      expect(currency).not.toBeNull();
      expect(currency.textContent.trim()).toBe(DEFAULT_CHARGE_FORM_CURRENCY);

      const input = box.querySelector(`input.${CHARGE_FORM_CLASSES.INPUT}`);
      expect(input).not.toBeNull();
      expect(input.id).toBe(DEFAULT_CHARGE_FORM_INPUT_ID);
      expect(input.getAttribute("type")).toBe("text");
      expect(input.getAttribute("inputmode")).toBe("decimal");
      expect(input.getAttribute("placeholder")).toBe(
        DEFAULT_CHARGE_FORM_PLACEHOLDER,
      );
      expect(input.value).toBe("");
    });

    it("deve renderizar o botão de limpeza rápida com vector-icon xmark", () => {
      document.body.appendChild(formElement);

      const clearBtn = formElement.querySelector(
        `button.${CHARGE_FORM_CLASSES.CLEAR_BTN}`,
      );
      expect(clearBtn).not.toBeNull();
      expect(clearBtn.getAttribute("type")).toBe("button");
      expect(clearBtn.getAttribute("aria-label")).toBe(
        DEFAULT_CHARGE_FORM_CLEAR_LABEL,
      );
      expect(clearBtn.getAttribute("title")).toBe(
        DEFAULT_CHARGE_FORM_CLEAR_LABEL,
      );
      expect(
        clearBtn.querySelector(
          `vector-icon[name="${CHARGE_FORM_ICONS.XMARK}"]`,
        ),
      ).not.toBeNull();
    });
  });

  describe("Pílula de Status Reativa de Modalidade (RN03)", () => {
    it("deve iniciar exibindo 'Valor aberto (pagador define)' com classe .amount-field__status--open e aria-live polite", () => {
      document.body.appendChild(formElement);

      const statusEl = formElement.querySelector(
        `.${CHARGE_FORM_CLASSES.STATUS}`,
      );
      expect(statusEl).not.toBeNull();
      expect(statusEl.textContent.trim()).toBe(DEFAULT_CHARGE_FORM_STATUS_OPEN);
      expect(statusEl.classList.contains(CHARGE_FORM_CLASSES.STATUS_OPEN)).toBe(
        true,
      );
      expect(
        statusEl.classList.contains(CHARGE_FORM_CLASSES.STATUS_FIXED),
      ).toBe(false);
      expect(statusEl.getAttribute("aria-live")).toBe("polite");
    });

    it("deve atualizar a pílula para 'Valor fixo: R$ 45,90' ao digitar um valor monetário válido no input", () => {
      document.body.appendChild(formElement);

      const input = formElement.querySelector(
        `input.${CHARGE_FORM_CLASSES.INPUT}`,
      );
      input.value = "45,90";
      input.dispatchEvent(new Event("input", { bubbles: true }));

      const statusEl = formElement.querySelector(
        `.${CHARGE_FORM_CLASSES.STATUS}`,
      );
      expect(statusEl.textContent.trim()).toBe("Valor fixo: R$ 45,90");
      expect(
        statusEl.classList.contains(CHARGE_FORM_CLASSES.STATUS_FIXED),
      ).toBe(true);
      expect(statusEl.classList.contains(CHARGE_FORM_CLASSES.STATUS_OPEN)).toBe(
        false,
      );
    });

    it("deve retornar para valor aberto caso o input seja limpo ou receba 0", () => {
      document.body.appendChild(formElement);

      const input = formElement.querySelector(
        `input.${CHARGE_FORM_CLASSES.INPUT}`,
      );
      input.value = "100,00";
      input.dispatchEvent(new Event("input", { bubbles: true }));

      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));

      const statusEl = formElement.querySelector(
        `.${CHARGE_FORM_CLASSES.STATUS}`,
      );
      expect(statusEl.textContent.trim()).toBe(DEFAULT_CHARGE_FORM_STATUS_OPEN);
      expect(statusEl.classList.contains(CHARGE_FORM_CLASSES.STATUS_OPEN)).toBe(
        true,
      );
    });
  });

  describe("Atalhos Rápidos de Presets (.amount-field__shortcuts)", () => {
    it("deve renderizar os 3 botões de presets com classes .amount-field__preset", () => {
      document.body.appendChild(formElement);

      const presets = formElement.querySelectorAll(
        `button.${CHARGE_FORM_CLASSES.PRESET}`,
      );
      expect(presets.length).toBe(CHARGE_FORM_PRESETS.length);

      const labels = Array.from(presets).map((p) => p.textContent.trim());
      expect(labels).toEqual(["Aberto", "R$ 25", "R$ 50"]);
    });

    it("deve preencher o input com '25,00' e atualizar o status ao clicar no preset R$ 25", () => {
      document.body.appendChild(formElement);

      const preset25 = formElement.querySelector(
        `button.${CHARGE_FORM_CLASSES.PRESET}[data-preset="25"]`,
      );
      preset25.click();

      const input = formElement.querySelector(
        `input.${CHARGE_FORM_CLASSES.INPUT}`,
      );
      expect(input.value).toBe("25,00");

      const statusEl = formElement.querySelector(
        `.${CHARGE_FORM_CLASSES.STATUS}`,
      );
      expect(statusEl.textContent.trim()).toBe("Valor fixo: R$ 25,00");
    });

    it("deve preencher o input com '50,00' e atualizar o status ao clicar no preset R$ 50", () => {
      document.body.appendChild(formElement);

      const preset50 = formElement.querySelector(
        `button.${CHARGE_FORM_CLASSES.PRESET}[data-preset="50"]`,
      );
      preset50.click();

      const input = formElement.querySelector(
        `input.${CHARGE_FORM_CLASSES.INPUT}`,
      );
      expect(input.value).toBe("50,00");

      const statusEl = formElement.querySelector(
        `.${CHARGE_FORM_CLASSES.STATUS}`,
      );
      expect(statusEl.textContent.trim()).toBe("Valor fixo: R$ 50,00");
    });

    it("deve esvaziar o input e reverter para valor aberto ao clicar no preset 'Aberto'", () => {
      document.body.appendChild(formElement);

      const preset50 = formElement.querySelector(
        `button.${CHARGE_FORM_CLASSES.PRESET}[data-preset="50"]`,
      );
      preset50.click();

      const openPreset = formElement.querySelector(
        `button.${CHARGE_FORM_CLASSES.PRESET}[data-preset="open"]`,
      );
      openPreset.click();

      const input = formElement.querySelector(
        `input.${CHARGE_FORM_CLASSES.INPUT}`,
      );
      expect(input.value).toBe("");

      const statusEl = formElement.querySelector(
        `.${CHARGE_FORM_CLASSES.STATUS}`,
      );
      expect(statusEl.textContent.trim()).toBe(DEFAULT_CHARGE_FORM_STATUS_OPEN);
    });
  });

  describe("Botão de Limpeza Rápida (.amount-field__clear-btn)", () => {
    it("deve limpar o valor do input, focar o campo e despachar evento ao ser clicado", () => {
      document.body.appendChild(formElement);

      const input = formElement.querySelector(
        `input.${CHARGE_FORM_CLASSES.INPUT}`,
      );
      input.value = "120,00";
      input.dispatchEvent(new Event("input", { bubbles: true }));

      const focusSpy = vi.spyOn(input, "focus");

      const clearBtn = formElement.querySelector(
        `button.${CHARGE_FORM_CLASSES.CLEAR_BTN}`,
      );
      clearBtn.click();

      expect(input.value).toBe("");
      expect(focusSpy).toHaveBeenCalled();

      const statusEl = formElement.querySelector(
        `.${CHARGE_FORM_CLASSES.STATUS}`,
      );
      expect(statusEl.textContent.trim()).toBe(DEFAULT_CHARGE_FORM_STATUS_OPEN);
    });
  });

  describe("Passo 3: Botão de Ação CTA 'Manda um PIX' (RN02, RN04)", () => {
    it("deve renderizar o botão CTA com ícone qrcode e rótulo 'Manda um PIX'", () => {
      document.body.appendChild(formElement);

      const ctaBtn = formElement.querySelector(
        `button.${CHARGE_FORM_CLASSES.CTA}`,
      );
      expect(ctaBtn).not.toBeNull();
      expect(
        ctaBtn.querySelector(`vector-icon[name="${CHARGE_FORM_ICONS.QRCODE}"]`),
      ).not.toBeNull();
      expect(ctaBtn.textContent).toContain(DEFAULT_CHARGE_FORM_CTA_LABEL);
    });

    it("deve permanecer desabilitado com classe .charge-cta--disabled quando não houver chave selecionada", () => {
      document.body.appendChild(formElement);

      formElement.selectedKey = null;

      const ctaBtn = formElement.querySelector(
        `button.${CHARGE_FORM_CLASSES.CTA}`,
      );
      expect(ctaBtn.hasAttribute("disabled")).toBe(true);
      expect(ctaBtn.getAttribute("aria-disabled")).toBe("true");
      expect(ctaBtn.classList.contains(CHARGE_FORM_CLASSES.CTA_DISABLED)).toBe(
        true,
      );
      expect(ctaBtn.getAttribute("title")).toBe(
        DEFAULT_CHARGE_FORM_CTA_DISABLED_TITLE,
      );
    });

    it("deve habilitar o botão CTA quando houver chave selecionada ativa", () => {
      document.body.appendChild(formElement);

      formElement.selectedKey = mockKey;

      const ctaBtn = formElement.querySelector(
        `button.${CHARGE_FORM_CLASSES.CTA}`,
      );
      expect(ctaBtn.hasAttribute("disabled")).toBe(false);
      expect(ctaBtn.getAttribute("aria-disabled")).toBe("false");
      expect(ctaBtn.classList.contains(CHARGE_FORM_CLASSES.CTA_DISABLED)).toBe(
        false,
      );
      expect(ctaBtn.getAttribute("title")).toBe(DEFAULT_CHARGE_FORM_CTA_LABEL);
    });
  });

  describe("Submissão e Geração da Cobrança PIX (RN04)", () => {
    it("não deve submeter nem gerar cobrança se o botão CTA estiver desabilitado (sem chave)", async () => {
      const mockUseCase = {
        execute: vi.fn(),
      };
      formElement.generatePixChargeUseCase = mockUseCase;
      document.body.appendChild(formElement);

      const generatedListener = vi.fn();
      formElement.addEventListener(
        CHARGE_FORM_EVENT_NAMES.CHARGE_GENERATED,
        generatedListener,
      );

      const ctaBtn = formElement.querySelector(
        `button.${CHARGE_FORM_CLASSES.CTA}`,
      );
      expect(ctaBtn).not.toBeNull();
      await formElement.submitCharge();

      expect(mockUseCase.execute).not.toHaveBeenCalled();
      expect(generatedListener).not.toHaveBeenCalled();
    });

    it("deve invocar o caso de uso injetado e disparar o evento 'charge-generated' com sucesso ao acionar o CTA com chave ativa", async () => {
      const mockUseCase = {
        execute: vi.fn().mockResolvedValue(mockCobrancaPix),
      };
      formElement.generatePixChargeUseCase = mockUseCase;
      formElement.selectedKey = mockKey;
      document.body.appendChild(formElement);

      const input = formElement.querySelector(
        `input.${CHARGE_FORM_CLASSES.INPUT}`,
      );
      input.value = "25,00";
      input.dispatchEvent(new Event("input", { bubbles: true }));

      const generatedListener = vi.fn();
      formElement.addEventListener(
        CHARGE_FORM_EVENT_NAMES.CHARGE_GENERATED,
        generatedListener,
      );

      const ctaBtn = formElement.querySelector(
        `button.${CHARGE_FORM_CLASSES.CTA}`,
      );
      expect(ctaBtn).not.toBeNull();
      await formElement.submitCharge();

      expect(mockUseCase.execute).toHaveBeenCalledWith({
        chave_conta: mockKey,
        valor_opcional: 25.0,
      });

      expect(generatedListener).toHaveBeenCalledTimes(1);
      const eventDetail = generatedListener.mock.calls[0][0].detail;
      expect(eventDetail.cobrancaPix).toBe(mockCobrancaPix);
      expect(eventDetail.chaveConta).toBe(mockKey);
      expect(eventDetail.amount).toBe(25.0);
      expect(eventDetail.rawAmount).toBe("25,00");
    });

    it("deve gerar cobrança com valor aberto (valor_opcional null) quando o campo estiver vazio", async () => {
      const openCharge = {
        ...mockCobrancaPix,
        valor_opcional: null,
        valor_dinamico: true,
      };
      const mockUseCase = {
        execute: vi.fn().mockResolvedValue(openCharge),
      };
      formElement.generatePixChargeUseCase = mockUseCase;
      formElement.selectedKey = mockKey;
      document.body.appendChild(formElement);

      const generatedListener = vi.fn();
      formElement.addEventListener(
        CHARGE_FORM_EVENT_NAMES.CHARGE_GENERATED,
        generatedListener,
      );

      await formElement.submitCharge();

      expect(mockUseCase.execute).toHaveBeenCalledWith({
        chave_conta: mockKey,
        valor_opcional: null,
      });

      expect(generatedListener).toHaveBeenCalledTimes(1);
      expect(generatedListener.mock.calls[0][0].detail.amount).toBeNull();
    });

    it("deve submeter ao pressionar Enter dentro do formulário/input", async () => {
      const mockUseCase = {
        execute: vi.fn().mockResolvedValue(mockCobrancaPix),
      };
      formElement.generatePixChargeUseCase = mockUseCase;
      formElement.selectedKey = mockKey;
      document.body.appendChild(formElement);

      const submitSpy = vi.spyOn(formElement, "submitCharge");

      const input = formElement.querySelector(
        `input.${CHARGE_FORM_CLASSES.INPUT}`,
      );
      input.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          bubbles: true,
          cancelable: true,
        }),
      );

      expect(submitSpy).toHaveBeenCalled();
    });

    it("deve exibir bloco de alerta com role='alert' caso o caso de uso rejeite a geração", async () => {
      const mockUseCase = {
        execute: vi
          .fn()
          .mockRejectedValue(new Error("Valor monetário inválido")),
      };
      formElement.generatePixChargeUseCase = mockUseCase;
      formElement.selectedKey = mockKey;
      document.body.appendChild(formElement);

      const generatedListener = vi.fn();
      formElement.addEventListener(
        CHARGE_FORM_EVENT_NAMES.CHARGE_GENERATED,
        generatedListener,
      );

      await formElement.submitCharge();

      expect(generatedListener).not.toHaveBeenCalled();

      const alertEl = formElement.querySelector(
        `.${CHARGE_FORM_CLASSES.ALERT}`,
      );
      expect(alertEl).not.toBeNull();
      expect(alertEl.getAttribute("role")).toBe("alert");
      expect(alertEl.textContent).toContain("Valor monetário inválido");
    });
  });

  describe("Reatividade, Atributos Observados e Setters", () => {
    it("deve sincronizar a propriedade amount com o input e com o status", () => {
      document.body.appendChild(formElement);

      formElement.amount = "80,00";

      const input = formElement.querySelector(
        `input.${CHARGE_FORM_CLASSES.INPUT}`,
      );
      expect(input.value).toBe("80,00");

      const statusEl = formElement.querySelector(
        `.${CHARGE_FORM_CLASSES.STATUS}`,
      );
      expect(statusEl.textContent.trim()).toBe("Valor fixo: R$ 80,00");
    });

    it("deve atualizar os textos quando os atributos observados forem alterados", () => {
      document.body.appendChild(formElement);

      formElement.setAttribute("step-text", "3");
      formElement.setAttribute("title-text", "Quantia a transferir");
      formElement.setAttribute("cta-text", "Gerar QR Code");

      const stepBadge = formElement.querySelector(
        `.${CHARGE_FORM_CLASSES.STEP_BADGE}`,
      );
      expect(stepBadge.textContent.trim()).toBe("3");

      const titleLabel = formElement.querySelector(
        `label.${CHARGE_FORM_CLASSES.TITLE}`,
      );
      expect(titleLabel.textContent.trim()).toBe("Quantia a transferir");

      const ctaBtn = formElement.querySelector(
        `button.${CHARGE_FORM_CLASSES.CTA}`,
      );
      expect(ctaBtn.textContent).toContain("Gerar QR Code");
    });

    it("deve resolver chave selecionada a partir de pixKeyRepository se selectedKeyId for definido", async () => {
      const mockRepo = {
        findById: vi.fn().mockResolvedValue(mockKey),
        getSelectedKey: vi.fn().mockResolvedValue(mockKey),
      };
      formElement.pixKeyRepository = mockRepo;
      document.body.appendChild(formElement);

      await formElement.syncSelectedKey("key-123");

      expect(formElement.selectedKey).toEqual(mockKey);
      expect(formElement.disabled).toBe(false);
    });
  });
});
