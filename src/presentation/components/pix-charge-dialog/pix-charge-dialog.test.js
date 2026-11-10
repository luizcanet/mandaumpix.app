import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../vector-icon/vector-icon.component.js";
import "../pix-charge-result/pix-charge-result.component.js";
import {
  CHARGE_DIALOG_EVENT_NAMES,
  CHARGE_DIALOG_ICONS,
  CHARGE_DIALOG_SELECTORS,
  DEFAULT_CHARGE_DIALOG_ARIA_LABEL,
  DEFAULT_CHARGE_DIALOG_CLOSE_TITLE,
  DEFAULT_CHARGE_DIALOG_DISMISS_BTN_LABEL,
  DEFAULT_CHARGE_DIALOG_TITLE,
  DEFAULT_CHARGE_DIALOG_TITLE_ID,
} from "./pix-charge-dialog.constants.js";
import PixChargeDialogComponent from "./pix-charge-dialog.component.js";

describe("PixChargeDialogComponent (TASK-07.4.2: TDD / Testes Unitários de Comportamento e Acessibilidade do Diálogo)", () => {
  let dialogElement;
  let mockCharge;

  beforeEach(() => {
    mockCharge = {
      brcode:
        "00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5913FULANO DE TAL6008BRASILIA62070503***63041D3D",
      imagemQrcode:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      chave: "123e4567-e89b-12d3-a456-426614174000",
      tipoChave: "aleatoria",
      nomeRecebedor: "FULANO DE TAL",
      cidadeRecebedor: "BRASILIA",
      valor: 10,
      identificador: "***",
    };

    dialogElement = document.createElement("pix-charge-dialog");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (dialogElement && dialogElement.isConnected) {
      dialogElement.remove();
    }
    document.body.innerHTML = "";
  });

  describe("1. Registro e Semântica W3C / BEM (WAI-ARIA Dialog)", () => {
    it("deve registrar o elemento customizado <pix-charge-dialog> no customElements registry", () => {
      expect(customElements.get("pix-charge-dialog")).toBe(
        PixChargeDialogComponent,
      );
    });

    it("deve renderizar o elemento semântico <dialog> com classe .charge-dialog e atributos WAI-ARIA", () => {
      document.body.appendChild(dialogElement);

      const dialog = dialogElement.querySelector(
        CHARGE_DIALOG_SELECTORS.DIALOG_ELEMENT,
      );
      expect(dialog).not.toBeNull();
      expect(dialog.getAttribute("role")).toBe("dialog");
      expect(dialog.getAttribute("aria-modal")).toBe("true");
      expect(dialog.getAttribute("aria-labelledby")).toBe(
        DEFAULT_CHARGE_DIALOG_TITLE_ID,
      );
      expect(dialog.getAttribute("aria-label")).toBe(
        DEFAULT_CHARGE_DIALOG_ARIA_LABEL,
      );
    });

    it("deve renderizar a barra de topo (.charge-dialog__top-bar) com título e botão de fechamento com ícone xmark", () => {
      document.body.appendChild(dialogElement);

      const topBar = dialogElement.querySelector(
        CHARGE_DIALOG_SELECTORS.TOP_BAR,
      );
      expect(topBar).not.toBeNull();

      const title = topBar.querySelector(CHARGE_DIALOG_SELECTORS.TITLE);
      expect(title).not.toBeNull();
      expect(title.id).toBe(DEFAULT_CHARGE_DIALOG_TITLE_ID);
      expect(title.textContent).toContain(DEFAULT_CHARGE_DIALOG_TITLE);
      expect(
        title.querySelector(
          `vector-icon[name="${CHARGE_DIALOG_ICONS.CHECK}"]`,
        ),
      ).not.toBeNull();

      const closeBtn = topBar.querySelector(
        `button${CHARGE_DIALOG_SELECTORS.CLOSE_BTN}`,
      );
      expect(closeBtn).not.toBeNull();
      expect(closeBtn.getAttribute("title")).toBe(
        DEFAULT_CHARGE_DIALOG_CLOSE_TITLE,
      );
      expect(closeBtn.getAttribute("aria-label")).toBe(
        DEFAULT_CHARGE_DIALOG_CLOSE_TITLE,
      );
      expect(
        closeBtn.querySelector(
          `vector-icon[name="${CHARGE_DIALOG_ICONS.XMARK}"]`,
        ),
      ).not.toBeNull();
    });

    it("deve conter o corpo do diálogo (.charge-dialog__body) encapsulando o componente <pix-charge-result>", () => {
      document.body.appendChild(dialogElement);

      const body = dialogElement.querySelector(CHARGE_DIALOG_SELECTORS.BODY);
      expect(body).not.toBeNull();

      const chargeResult = body.querySelector(
        CHARGE_DIALOG_SELECTORS.CHARGE_RESULT,
      );
      expect(chargeResult).not.toBeNull();
    });

    it("deve renderizar o botão de conclusão/fechamento inferior (.charge-dialog__dismiss-btn)", () => {
      document.body.appendChild(dialogElement);

      const dismissBtn = dialogElement.querySelector(
        `button${CHARGE_DIALOG_SELECTORS.DISMISS_BTN}`,
      );
      expect(dismissBtn).not.toBeNull();
      expect(dismissBtn.textContent.trim()).toBe(
        DEFAULT_CHARGE_DIALOG_DISMISS_BTN_LABEL,
      );
      expect(
        dismissBtn.querySelector(
          `vector-icon[name="${CHARGE_DIALOG_ICONS.CHECK}"]`,
        ),
      ).not.toBeNull();
    });

    it("deve refletir alterações de atributos observados como title-text, close-title e dismiss-btn-label", () => {
      document.body.appendChild(dialogElement);

      dialogElement.setAttribute("title-text", "Cobrança Pronta");
      dialogElement.setAttribute("close-title", "Fechar Janela");
      dialogElement.setAttribute("dismiss-btn-label", "Retornar ao Início");

      const title = dialogElement.querySelector(CHARGE_DIALOG_SELECTORS.TITLE);
      expect(title.textContent).toContain("Cobrança Pronta");

      const closeBtn = dialogElement.querySelector(
        CHARGE_DIALOG_SELECTORS.CLOSE_BTN,
      );
      expect(closeBtn.getAttribute("title")).toBe("Fechar Janela");
      expect(closeBtn.getAttribute("aria-label")).toBe("Fechar Janela");

      const dismissBtn = dialogElement.querySelector(
        CHARGE_DIALOG_SELECTORS.DISMISS_BTN,
      );
      expect(dismissBtn.textContent).toContain("Retornar ao Início");
    });
  });

  describe("2. Ciclo de Vida do Diálogo e Métodos (openModal / closeModal)", () => {
    it("deve iniciar fechado por padrão (open === false)", () => {
      document.body.appendChild(dialogElement);

      expect(dialogElement.open).toBe(false);
      const dialog = dialogElement.querySelector("dialog");
      expect(dialog.hasAttribute("open")).toBe(false);
    });

    it("deve abrir o modal ao chamar openModal(charge), atualizar a propriedade open e repassar a cobrança para o resultado", () => {
      document.body.appendChild(dialogElement);

      const openedListener = vi.fn();
      dialogElement.addEventListener(
        CHARGE_DIALOG_EVENT_NAMES.CHARGE_DIALOG_OPENED,
        openedListener,
      );

      dialogElement.openModal(mockCharge);

      expect(dialogElement.open).toBe(true);
      expect(dialogElement.charge).toEqual(mockCharge);

      const dialog = dialogElement.querySelector("dialog");
      expect(dialog.hasAttribute("open")).toBe(true);

      const chargeResult = dialogElement.querySelector(
        CHARGE_DIALOG_SELECTORS.CHARGE_RESULT,
      );
      expect(chargeResult.charge).toEqual(mockCharge);

      expect(openedListener).toHaveBeenCalledTimes(1);
      expect(openedListener.mock.calls[0][0].detail).toEqual({
        cobrancaPix: mockCharge,
      });
    });

    it("deve fechar o modal ao chamar closeModal() e despachar o evento charge-dialog-closed", () => {
      document.body.appendChild(dialogElement);
      dialogElement.openModal(mockCharge);
      expect(dialogElement.open).toBe(true);

      const closedListener = vi.fn();
      dialogElement.addEventListener(
        CHARGE_DIALOG_EVENT_NAMES.CHARGE_DIALOG_CLOSED,
        closedListener,
      );

      dialogElement.closeModal();

      expect(dialogElement.open).toBe(false);
      const dialog = dialogElement.querySelector("dialog");
      expect(dialog.hasAttribute("open")).toBe(false);

      expect(closedListener).toHaveBeenCalledTimes(1);
    });

    it("deve alternar o estado modal através do getter e setter da propriedade open", () => {
      document.body.appendChild(dialogElement);

      dialogElement.open = true;
      expect(dialogElement.open).toBe(true);

      dialogElement.open = false;
      expect(dialogElement.open).toBe(false);
    });
  });

  describe("3. Interceptação de Eventos Globais e Integração com Formulário", () => {
    it("deve abrir o modal ao interceptar o evento global charge-generated emitido pelo formulário", () => {
      document.body.appendChild(dialogElement);
      expect(dialogElement.open).toBe(false);

      window.dispatchEvent(
        new CustomEvent(CHARGE_DIALOG_EVENT_NAMES.CHARGE_GENERATED, {
          bubbles: true,
          composed: true,
          detail: { cobrancaPix: mockCharge },
        }),
      );

      expect(dialogElement.open).toBe(true);
      expect(dialogElement.charge).toEqual(mockCharge);
    });

    it("deve abrir o modal ao interceptar o evento global open-charge-dialog", () => {
      document.body.appendChild(dialogElement);
      expect(dialogElement.open).toBe(false);

      window.dispatchEvent(
        new CustomEvent(CHARGE_DIALOG_EVENT_NAMES.OPEN_CHARGE_DIALOG, {
          bubbles: true,
          composed: true,
          detail: { cobrancaPix: mockCharge },
        }),
      );

      expect(dialogElement.open).toBe(true);
      expect(dialogElement.charge).toEqual(mockCharge);
    });

    it("deve fechar o modal ao interceptar o evento global close-charge-dialog", () => {
      document.body.appendChild(dialogElement);
      dialogElement.openModal(mockCharge);
      expect(dialogElement.open).toBe(true);

      window.dispatchEvent(
        new CustomEvent(CHARGE_DIALOG_EVENT_NAMES.CLOSE_CHARGE_DIALOG, {
          bubbles: true,
          composed: true,
        }),
      );

      expect(dialogElement.open).toBe(false);
    });

    it("deve remover os listeners globais ao desconectar do DOM", () => {
      document.body.appendChild(dialogElement);
      dialogElement.remove();

      window.dispatchEvent(
        new CustomEvent(CHARGE_DIALOG_EVENT_NAMES.CHARGE_GENERATED, {
          bubbles: true,
          composed: true,
          detail: { cobrancaPix: mockCharge },
        }),
      );

      expect(dialogElement.open).toBe(false);
    });
  });

  describe("4. Ações de Fechamento do Usuário (Botões, Esc e Backdrop)", () => {
    it("deve fechar o modal e emitir charge-dialog-closed ao clicar no botão X (.charge-dialog__close-btn)", () => {
      document.body.appendChild(dialogElement);
      dialogElement.openModal(mockCharge);

      const closeListener = vi.fn();
      dialogElement.addEventListener(
        CHARGE_DIALOG_EVENT_NAMES.CHARGE_DIALOG_CLOSED,
        closeListener,
      );

      const closeBtn = dialogElement.querySelector(
        CHARGE_DIALOG_SELECTORS.CLOSE_BTN,
      );
      closeBtn.click();

      expect(dialogElement.open).toBe(false);
      expect(closeListener).toHaveBeenCalledTimes(1);
    });

    it("deve fechar o modal e emitir charge-dialog-closed ao clicar no botão Concluir (.charge-dialog__dismiss-btn)", () => {
      document.body.appendChild(dialogElement);
      dialogElement.openModal(mockCharge);

      const closeListener = vi.fn();
      dialogElement.addEventListener(
        CHARGE_DIALOG_EVENT_NAMES.CHARGE_DIALOG_CLOSED,
        closeListener,
      );

      const dismissBtn = dialogElement.querySelector(
        CHARGE_DIALOG_SELECTORS.DISMISS_BTN,
      );
      dismissBtn.click();

      expect(dialogElement.open).toBe(false);
      expect(closeListener).toHaveBeenCalledTimes(1);
    });

    it("deve fechar o modal e emitir charge-dialog-closed ao receber o evento cancel nativo (tecla Esc)", () => {
      document.body.appendChild(dialogElement);
      dialogElement.openModal(mockCharge);

      const closeListener = vi.fn();
      dialogElement.addEventListener(
        CHARGE_DIALOG_EVENT_NAMES.CHARGE_DIALOG_CLOSED,
        closeListener,
      );

      const dialog = dialogElement.querySelector("dialog");
      const cancelEvent = new Event("cancel", { cancelable: true });
      dialog.dispatchEvent(cancelEvent);

      expect(dialogElement.open).toBe(false);
      expect(closeListener).toHaveBeenCalledTimes(1);
    });

    it("deve fechar o modal ao clicar na área externa do backdrop (fora do retângulo do diálogo)", () => {
      document.body.appendChild(dialogElement);
      dialogElement.openModal(mockCharge);

      const closeListener = vi.fn();
      dialogElement.addEventListener(
        CHARGE_DIALOG_EVENT_NAMES.CHARGE_DIALOG_CLOSED,
        closeListener,
      );

      const dialog = dialogElement.querySelector("dialog");
      vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue({
        top: 100,
        bottom: 500,
        left: 100,
        right: 500,
        width: 400,
        height: 400,
      });

      // Simula clique no backdrop fora das coordenadas da caixa (ex: x=20, y=20)
      dialog.dispatchEvent(
        new MouseEvent("click", {
          clientX: 20,
          clientY: 20,
          bubbles: true,
        }),
      );

      expect(dialogElement.open).toBe(false);
      expect(closeListener).toHaveBeenCalledTimes(1);
    });

    it("NÃO deve fechar o modal quando o clique ocorrer dentro dos limites da caixa do diálogo", () => {
      document.body.appendChild(dialogElement);
      dialogElement.openModal(mockCharge);

      const closeListener = vi.fn();
      dialogElement.addEventListener(
        CHARGE_DIALOG_EVENT_NAMES.CHARGE_DIALOG_CLOSED,
        closeListener,
      );

      const dialog = dialogElement.querySelector("dialog");
      vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue({
        top: 100,
        bottom: 500,
        left: 100,
        right: 500,
        width: 400,
        height: 400,
      });

      // Simula clique dentro da caixa (ex: x=250, y=250)
      dialog.dispatchEvent(
        new MouseEvent("click", {
          clientX: 250,
          clientY: 250,
          bubbles: true,
        }),
      );

      expect(dialogElement.open).toBe(true);
      expect(closeListener).not.toHaveBeenCalled();
    });
  });

  describe("5. Acessibilidade, Restauração de Foco e Focus Trap (WCAG 2.2 AA)", () => {
    it("deve salvar o elemento ativo anterior e restaurar o foco nele após o fechamento", () => {
      const triggerBtn = document.createElement("button");
      triggerBtn.id = "trigger-cta";
      document.body.appendChild(triggerBtn);
      triggerBtn.focus();
      expect(document.activeElement).toBe(triggerBtn);

      document.body.appendChild(dialogElement);
      dialogElement.openModal(mockCharge);

      // Foco inicial dentro do diálogo
      const closeBtn = dialogElement.querySelector(
        CHARGE_DIALOG_SELECTORS.CLOSE_BTN,
      );
      expect(document.activeElement).toBe(closeBtn);

      // Fecha o diálogo
      dialogElement.closeModal();

      // Foco restaurado no botão disparador
      expect(document.activeElement).toBe(triggerBtn);
    });

    it("deve reter o foco ciclicamente dentro do diálogo (Focus Trap com Tab e Shift+Tab)", () => {
      document.body.appendChild(dialogElement);
      dialogElement.openModal(mockCharge);

      const dialog = dialogElement.querySelector("dialog");
      const focusableElements = dialogElement.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      expect(focusableElements.length).toBeGreaterThan(1);

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Quando o foco está no último elemento e usuário aperta Tab -> volta para o primeiro
      lastElement.focus();
      expect(document.activeElement).toBe(lastElement);

      const tabEvent = new KeyboardEvent("keydown", {
        key: "Tab",
        code: "Tab",
        shiftKey: false,
        bubbles: true,
        cancelable: true,
      });
      dialog.dispatchEvent(tabEvent);

      expect(tabEvent.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(firstElement);

      // Quando o foco está no primeiro elemento e usuário aperta Shift+Tab -> vai para o último
      firstElement.focus();
      expect(document.activeElement).toBe(firstElement);

      const shiftTabEvent = new KeyboardEvent("keydown", {
        key: "Tab",
        code: "Tab",
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });
      dialog.dispatchEvent(shiftTabEvent);

      expect(shiftTabEvent.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(lastElement);
    });
  });

  describe("6. Injeção de Dependências e Repasse de Caso de Uso", () => {
    it("deve registrar e repassar distributePixChargeUseCase para o componente interno <pix-charge-result>", () => {
      const mockDistributeUseCase = { execute: vi.fn() };

      document.body.appendChild(dialogElement);
      dialogElement.distributePixChargeUseCase = mockDistributeUseCase;

      expect(dialogElement.distributePixChargeUseCase).toBe(
        mockDistributeUseCase,
      );

      const chargeResult = dialogElement.querySelector(
        CHARGE_DIALOG_SELECTORS.CHARGE_RESULT,
      );
      expect(chargeResult.distributePixChargeUseCase).toBe(
        mockDistributeUseCase,
      );
    });
  });
});
