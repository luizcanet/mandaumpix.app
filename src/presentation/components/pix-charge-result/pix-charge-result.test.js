import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../vector-icon/vector-icon.component.js";
import {
  CHARGE_RESULT_CLASSES,
  CHARGE_RESULT_EVENT_NAMES,
  CHARGE_RESULT_ICONS,
  DEFAULT_CHARGE_RESULT_ACCOUNT_FALLBACK,
  DEFAULT_CHARGE_RESULT_AMOUNT_OPEN,
  DEFAULT_CHARGE_RESULT_ARIA_LABEL,
  DEFAULT_CHARGE_RESULT_BRCODE_ARIA_LABEL,
  DEFAULT_CHARGE_RESULT_BRCODE_TITLE,
  DEFAULT_CHARGE_RESULT_MODE_FIXED,
  DEFAULT_CHARGE_RESULT_MODE_OPEN,
  DEFAULT_CHARGE_RESULT_READY_BADGE,
  DEFAULT_CHARGE_RESULT_WAITING_DESCRIPTION,
  DEFAULT_CHARGE_RESULT_WAITING_TITLE,
} from "./pix-charge-result.constants.js";
import PixChargeResultComponent from "./pix-charge-result.component.js";

describe("PixChargeResultComponent (TASK-06.2.3: Testes Unitários de Renderização e Ciclo de Vida)", () => {
  let resultElement;

  const mockKey = {
    id: "key-123",
    rotulo: "Nubank Pessoal",
    tipo_chave: "CPF",
    valor_chave: "123.456.789-00",
    nome_recebedor: "LUIZ HENRIQUE CANET FILHO",
    cidade_recebedor: "BRASILIA",
  };

  const mockFixedCharge = {
    id_chave_conta: "key-123",
    chave_conta: mockKey,
    valor_opcional: 45.9,
    valor_dinamico: false,
    chave_cobranca:
      "00020126350014br.gov.bcb.pix011412345678900520400005303986540545.905802BR5925LUIZ HENRIQUE CANET FILHO6008BRASILIA62070503***6304E2A1",
    imagem_qrcode: {
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" id="qr-svg-test"><rect width="100" height="100" fill="#000"/></svg>',
      dataUrl: "data:image/png;base64,iVBORw0KGgo...",
    },
    txid: "***",
    info_adicional: null,
    gerado_em: "2026-11-08T12:00:00.000Z",
  };

  const mockDynamicCharge = {
    id_chave_conta: "key-123",
    chave_conta: mockKey,
    valor_opcional: null,
    valor_dinamico: true,
    chave_cobranca:
      "00020126350014br.gov.bcb.pix0114123456789005204000053039865802BR5925LUIZ HENRIQUE CANET FILHO6008BRASILIA62070503***63043C63",
    imagem_qrcode: {
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" id="qr-svg-dynamic"><rect width="100" height="100" fill="#000"/></svg>',
    },
    txid: "***",
    info_adicional: null,
    gerado_em: "2026-11-08T12:00:00.000Z",
  };

  beforeEach(() => {
    resultElement = document.createElement("pix-charge-result");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (resultElement && resultElement.isConnected) {
      resultElement.remove();
    }
  });

  describe("Registro e Semântica W3C / BEM", () => {
    it("deve registrar o elemento customizado <pix-charge-result> no CustomElementRegistry", () => {
      expect(customElements.get("pix-charge-result")).toBe(
        PixChargeResultComponent,
      );
    });

    it("deve aplicar as classes .charge-result, .card e atributo aria-label ao ser anexado ao DOM", () => {
      document.body.appendChild(resultElement);

      expect(resultElement.classList.contains(CHARGE_RESULT_CLASSES.ROOT)).toBe(
        true,
      );
      expect(resultElement.classList.contains(CHARGE_RESULT_CLASSES.CARD)).toBe(
        true,
      );
      expect(resultElement.getAttribute("aria-label")).toBe(
        DEFAULT_CHARGE_RESULT_ARIA_LABEL,
      );
    });

    it("deve conter a região acessível aria-live='polite' para leitores de tela", () => {
      document.body.appendChild(resultElement);

      const liveRegion = resultElement.querySelector(
        `.${CHARGE_RESULT_CLASSES.LIVE_REGION}`,
      );
      expect(liveRegion).not.toBeNull();
      expect(liveRegion.getAttribute("aria-live")).toBe("polite");
    });
  });

  describe("Estado Inicial / Aguardando Emissão (Empty State)", () => {
    it("deve renderizar o estado de espera quando nenhuma cobrança estiver atribuída", () => {
      document.body.appendChild(resultElement);

      expect(
        resultElement.classList.contains(CHARGE_RESULT_CLASSES.EMPTY),
      ).toBe(true);

      const waitingContainer = resultElement.querySelector(
        `.${CHARGE_RESULT_CLASSES.WAITING}`,
      );
      expect(waitingContainer).not.toBeNull();

      const waitingIcon = waitingContainer.querySelector("vector-icon");
      expect(waitingIcon).not.toBeNull();
      expect(waitingIcon.getAttribute("name")).toBe(CHARGE_RESULT_ICONS.QRCODE);

      const waitingTitle = waitingContainer.querySelector(
        `.${CHARGE_RESULT_CLASSES.WAITING_TITLE}`,
      );
      expect(waitingTitle).not.toBeNull();
      expect(waitingTitle.textContent.trim()).toBe(
        DEFAULT_CHARGE_RESULT_WAITING_TITLE,
      );

      const waitingDesc = waitingContainer.querySelector(
        `.${CHARGE_RESULT_CLASSES.WAITING_DESC}`,
      );
      expect(waitingDesc).not.toBeNull();
      expect(waitingDesc.textContent.trim()).toBe(
        DEFAULT_CHARGE_RESULT_WAITING_DESCRIPTION,
      );
    });

    it("não deve renderizar cabeçalho de cobrança pronta, palco nem bloco copia e cola no estado vazio", () => {
      document.body.appendChild(resultElement);

      expect(
        resultElement.querySelector(`.${CHARGE_RESULT_CLASSES.HEADER}`),
      ).toBeNull();
      expect(
        resultElement.querySelector(`.${CHARGE_RESULT_CLASSES.QR_STAGE}`),
      ).toBeNull();
      expect(
        resultElement.querySelector(`.${CHARGE_RESULT_CLASSES.BRCODE}`),
      ).toBeNull();
    });
  });

  describe("Renderização de Cobrança com Valor Fixo (Happy Path - RN04)", () => {
    beforeEach(() => {
      resultElement.charge = mockFixedCharge;
      document.body.appendChild(resultElement);
    });

    it("deve remover o modificador .charge-result--empty e ocultar o container de espera", () => {
      expect(
        resultElement.classList.contains(CHARGE_RESULT_CLASSES.EMPTY),
      ).toBe(false);
      expect(
        resultElement.querySelector(`.${CHARGE_RESULT_CLASSES.WAITING}`),
      ).toBeNull();
    });

    it("deve renderizar o cabeçalho com badge de sucesso, conta e valor fixo formatado", () => {
      const header = resultElement.querySelector(
        `.${CHARGE_RESULT_CLASSES.HEADER}`,
      );
      expect(header).not.toBeNull();

      const readyBadge = header.querySelector(
        `.${CHARGE_RESULT_CLASSES.BADGE_READY}`,
      );
      expect(readyBadge).not.toBeNull();
      expect(readyBadge.textContent).toContain(
        DEFAULT_CHARGE_RESULT_READY_BADGE,
      );
      const readyIcon = readyBadge.querySelector("vector-icon");
      expect(readyIcon).not.toBeNull();
      expect(readyIcon.getAttribute("name")).toBe(CHARGE_RESULT_ICONS.CHECK);

      const accountElement = header.querySelector(
        `.${CHARGE_RESULT_CLASSES.ACCOUNT}`,
      );
      expect(accountElement).not.toBeNull();
      expect(accountElement.textContent.trim()).toBe(
        "Nubank Pessoal • LUIZ HENRIQUE CANET FILHO",
      );

      const amountPill = header.querySelector(
        `.${CHARGE_RESULT_CLASSES.AMOUNT_PILL}`,
      );
      expect(amountPill).not.toBeNull();
      expect(amountPill.textContent.trim()).toBe("R$ 45,90");
      expect(
        amountPill.classList.contains(CHARGE_RESULT_CLASSES.AMOUNT_PILL_OPEN),
      ).toBe(false);
    });

    it("deve renderizar o palco do QR Code com a moldura de alto contraste e SVG injetado", () => {
      const qrStage = resultElement.querySelector(
        `.${CHARGE_RESULT_CLASSES.QR_STAGE}`,
      );
      expect(qrStage).not.toBeNull();

      const qrFrame = qrStage.querySelector(
        `.${CHARGE_RESULT_CLASSES.QR_FRAME}`,
      );
      expect(qrFrame).not.toBeNull();

      const qrSvgContainer = qrFrame.querySelector(
        `.${CHARGE_RESULT_CLASSES.QR_SVG}`,
      );
      expect(qrSvgContainer).not.toBeNull();
      expect(qrSvgContainer.innerHTML).toContain('id="qr-svg-test"');

      const meta = qrStage.querySelector(`.${CHARGE_RESULT_CLASSES.META}`);
      expect(meta).not.toBeNull();
      expect(meta.textContent).toContain("CPF: 123.456.789-00");
      expect(meta.textContent).toContain("(BRASILIA)");
    });

    it("deve renderizar o bloco PIX Copia e Cola selecionável", () => {
      const brCodeWrapper = resultElement.querySelector(
        `.${CHARGE_RESULT_CLASSES.BRCODE_WRAPPER}`,
      );
      expect(brCodeWrapper).not.toBeNull();

      const brCodeTitle = brCodeWrapper.querySelector(
        `.${CHARGE_RESULT_CLASSES.BRCODE_TITLE}`,
      );
      expect(brCodeTitle).not.toBeNull();
      expect(brCodeTitle.textContent.trim()).toBe(
        DEFAULT_CHARGE_RESULT_BRCODE_TITLE,
      );

      const brCodeMode = brCodeWrapper.querySelector(
        `.${CHARGE_RESULT_CLASSES.BRCODE_MODE}`,
      );
      expect(brCodeMode).not.toBeNull();
      expect(brCodeMode.textContent.trim()).toBe(
        DEFAULT_CHARGE_RESULT_MODE_FIXED,
      );

      const brCodeBox = brCodeWrapper.querySelector(
        `.${CHARGE_RESULT_CLASSES.BRCODE}`,
      );
      expect(brCodeBox).not.toBeNull();
      expect(brCodeBox.textContent.trim()).toBe(mockFixedCharge.chave_cobranca);
      expect(brCodeBox.getAttribute("tabindex")).toBe("0");
      expect(brCodeBox.getAttribute("role")).toBe("region");
      expect(brCodeBox.getAttribute("aria-label")).toBe(
        DEFAULT_CHARGE_RESULT_BRCODE_ARIA_LABEL,
      );
    });

    it("deve renderizar o contêiner de ações pronto para os botões de saída (US-06.3)", () => {
      const actionsContainer = resultElement.querySelector(
        `.${CHARGE_RESULT_CLASSES.ACTIONS}`,
      );
      expect(actionsContainer).not.toBeNull();
    });
  });

  describe("Renderização de Cobrança com Valor Aberto / Dinâmico (RN03)", () => {
    beforeEach(() => {
      resultElement.charge = mockDynamicCharge;
      document.body.appendChild(resultElement);
    });

    it("deve renderizar a pílula de valor com o modificador --open e texto 'Valor Aberto'", () => {
      const amountPill = resultElement.querySelector(
        `.${CHARGE_RESULT_CLASSES.AMOUNT_PILL}`,
      );
      expect(amountPill).not.toBeNull();
      expect(
        amountPill.classList.contains(CHARGE_RESULT_CLASSES.AMOUNT_PILL_OPEN),
      ).toBe(true);
      expect(amountPill.textContent.trim()).toBe(
        DEFAULT_CHARGE_RESULT_AMOUNT_OPEN,
      );
    });

    it("deve indicar 'Valor Dinâmico' no cabeçalho do bloco Copia e Cola", () => {
      const brCodeMode = resultElement.querySelector(
        `.${CHARGE_RESULT_CLASSES.BRCODE_MODE}`,
      );
      expect(brCodeMode).not.toBeNull();
      expect(brCodeMode.textContent.trim()).toBe(
        DEFAULT_CHARGE_RESULT_MODE_OPEN,
      );
    });
  });

  describe("Suporte a diferentes representações do QR Code", () => {
    it("deve renderizar corretamente quando imagem_qrcode for uma string SVG direta", () => {
      const chargeWithStringSvg = {
        ...mockFixedCharge,
        imagem_qrcode:
          '<svg xmlns="http://www.w3.org/2000/svg" id="direct-string-svg"><circle cx="10" cy="10" r="10"/></svg>',
      };
      resultElement.charge = chargeWithStringSvg;
      document.body.appendChild(resultElement);

      const qrSvgContainer = resultElement.querySelector(
        `.${CHARGE_RESULT_CLASSES.QR_SVG}`,
      );
      expect(qrSvgContainer.innerHTML).toContain('id="direct-string-svg"');
    });

    it("deve renderizar elemento img com dataUrl quando SVG estiver ausente mas dataUrl estiver presente", () => {
      const chargeWithDataUrl = {
        ...mockFixedCharge,
        imagem_qrcode: {
          svg: null,
          dataUrl:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        },
      };
      resultElement.charge = chargeWithDataUrl;
      document.body.appendChild(resultElement);

      const img = resultElement.querySelector(
        `.${CHARGE_RESULT_CLASSES.QR_SVG} img`,
      );
      expect(img).not.toBeNull();
      expect(img.src).toContain("data:image/png;base64");
    });
  });

  describe("Métodos Públicos e Ciclo de Vida", () => {
    beforeEach(() => {
      document.body.appendChild(resultElement);
    });

    it("deve atualizar a cobrança através do método setCharge() e emitir o evento charge-changed", () => {
      const changeListener = vi.fn();
      resultElement.addEventListener(
        CHARGE_RESULT_EVENT_NAMES.CHARGE_CHANGED,
        changeListener,
      );

      resultElement.setCharge(mockFixedCharge);

      expect(resultElement.charge).toEqual(mockFixedCharge);
      expect(changeListener).toHaveBeenCalledTimes(1);
      expect(changeListener.mock.calls[0][0].detail).toEqual({
        charge: mockFixedCharge,
      });

      const amountPill = resultElement.querySelector(
        `.${CHARGE_RESULT_CLASSES.AMOUNT_PILL}`,
      );
      expect(amountPill.textContent.trim()).toBe("R$ 45,90");
    });

    it("deve limpar a cobrança através do método clearCharge() e emitir o evento charge-cleared", () => {
      resultElement.setCharge(mockFixedCharge);
      expect(
        resultElement.classList.contains(CHARGE_RESULT_CLASSES.EMPTY),
      ).toBe(false);

      const clearListener = vi.fn();
      resultElement.addEventListener(
        CHARGE_RESULT_EVENT_NAMES.CHARGE_CLEARED,
        clearListener,
      );

      resultElement.clearCharge();

      expect(resultElement.charge).toBeNull();
      expect(clearListener).toHaveBeenCalledTimes(1);
      expect(
        resultElement.classList.contains(CHARGE_RESULT_CLASSES.EMPTY),
      ).toBe(true);
      expect(
        resultElement.querySelector(`.${CHARGE_RESULT_CLASSES.WAITING}`),
      ).not.toBeNull();
    });

    it("deve retornar ao estado de espera quando setCharge() receber null ou undefined", () => {
      resultElement.setCharge(mockFixedCharge);
      expect(
        resultElement.classList.contains(CHARGE_RESULT_CLASSES.EMPTY),
      ).toBe(false);

      resultElement.setCharge(null);
      expect(
        resultElement.classList.contains(CHARGE_RESULT_CLASSES.EMPTY),
      ).toBe(true);

      resultElement.setCharge(mockFixedCharge);
      resultElement.setCharge(undefined);
      expect(
        resultElement.classList.contains(CHARGE_RESULT_CLASSES.EMPTY),
      ).toBe(true);
    });

    it("deve atualizar o texto da região live aria-live='polite' ao receber uma cobrança", () => {
      const liveRegion = resultElement.querySelector(
        `.${CHARGE_RESULT_CLASSES.LIVE_REGION}`,
      );
      expect(liveRegion.textContent).toBe("");

      resultElement.setCharge(mockFixedCharge);

      expect(liveRegion.textContent).toContain(
        "Cobrança PIX pronta para pagamento",
      );
      expect(liveRegion.textContent).toContain("R$ 45,90");
    });

    it("deve responder automaticamente ao evento customizado 'charge-generated' disparado em window", () => {
      const customEvent = new CustomEvent("charge-generated", {
        detail: {
          cobrancaPix: mockFixedCharge,
        },
        bubbles: true,
        composed: true,
      });

      window.dispatchEvent(customEvent);

      expect(resultElement.charge).toEqual(mockFixedCharge);
      expect(
        resultElement.classList.contains(CHARGE_RESULT_CLASSES.EMPTY),
      ).toBe(false);
    });
  });

  describe("Resiliência com dados parciais ou ausentes", () => {
    it("deve utilizar fallback de conta quando chave_conta for nula", () => {
      const chargeWithoutKey = {
        ...mockFixedCharge,
        chave_conta: null,
      };
      resultElement.charge = chargeWithoutKey;
      document.body.appendChild(resultElement);

      const accountElement = resultElement.querySelector(
        `.${CHARGE_RESULT_CLASSES.ACCOUNT}`,
      );
      expect(accountElement.textContent.trim()).toBe(
        DEFAULT_CHARGE_RESULT_ACCOUNT_FALLBACK,
      );
    });

    it("deve lidar graciosamente com código de cobrança vazio", () => {
      const chargeWithoutCode = {
        ...mockFixedCharge,
        chave_cobranca: "",
      };
      resultElement.charge = chargeWithoutCode;
      document.body.appendChild(resultElement);

      const brCodeBox = resultElement.querySelector(
        `.${CHARGE_RESULT_CLASSES.BRCODE}`,
      );
      expect(brCodeBox.textContent.trim()).toBe("");
    });
  });
});
