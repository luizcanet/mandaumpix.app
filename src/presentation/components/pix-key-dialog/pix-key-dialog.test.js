import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../vector-icon/vector-icon.component.js";
import {
  DEFAULT_KEY_DIALOG_CLOSE_TITLE,
  DEFAULT_KEY_DIALOG_TITLE,
  DEFAULT_KEY_DIALOG_TITLE_ID,
  KEY_DIALOG_CLASSES,
  KEY_DIALOG_EVENT_NAMES,
  KEY_DIALOG_ICONS,
  KEY_DIALOG_MAX_LENGTHS,
} from "./pix-key-dialog.constants.js";
import PixKeyDialogComponent from "./pix-key-dialog.component.js";
import { PIX_KEY_TYPES } from "../../../domain/entities/pix-key.entity.js";

describe("PixKeyDialogComponent (TASK-05.3.2: Testes Unitários de Renderização, Validação e Interação)", () => {
  let dialogElement;

  beforeEach(() => {
    dialogElement = document.createElement("pix-key-dialog");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (dialogElement && dialogElement.isConnected) {
      dialogElement.remove();
    }
  });

  describe("Registro e Semântica W3C / BEM", () => {
    it("deve registrar o elemento customizado <pix-key-dialog> no registry do customElements", () => {
      expect(customElements.get("pix-key-dialog")).toBe(PixKeyDialogComponent);
    });

    it("deve renderizar o elemento semântico <dialog> com classe .key-dialog e atributos acessíveis", () => {
      document.body.appendChild(dialogElement);

      const dialog = dialogElement.querySelector(
        `dialog.${KEY_DIALOG_CLASSES.ROOT}`,
      );
      expect(dialog).not.toBeNull();
      expect(dialog.getAttribute("aria-labelledby")).toBe(
        DEFAULT_KEY_DIALOG_TITLE_ID,
      );
      expect(dialog.getAttribute("role")).toBe("dialog");
    });

    it("deve renderizar o cabeçalho com título canônico e botão de fechamento com ícone xmark", () => {
      document.body.appendChild(dialogElement);

      const header = dialogElement.querySelector(
        `.${KEY_DIALOG_CLASSES.HEADER}`,
      );
      expect(header).not.toBeNull();

      const title = header.querySelector(`.${KEY_DIALOG_CLASSES.TITLE}`);
      expect(title).not.toBeNull();
      expect(title.id).toBe(DEFAULT_KEY_DIALOG_TITLE_ID);
      expect(title.textContent.trim()).toBe(DEFAULT_KEY_DIALOG_TITLE);

      const closeBtn = header.querySelector(
        `button.${KEY_DIALOG_CLASSES.CLOSE_BTN}`,
      );
      expect(closeBtn).not.toBeNull();
      expect(closeBtn.getAttribute("title")).toBe(
        DEFAULT_KEY_DIALOG_CLOSE_TITLE,
      );
      expect(closeBtn.getAttribute("aria-label")).toBe(
        DEFAULT_KEY_DIALOG_CLOSE_TITLE,
      );
      expect(
        closeBtn.querySelector(`vector-icon[name="${KEY_DIALOG_ICONS.XMARK}"]`),
      ).not.toBeNull();
    });
  });

  describe("Ciclo de Vida de Abertura e Fechamento (openModal / closeModal)", () => {
    it("deve iniciar fechado por padrão", () => {
      document.body.appendChild(dialogElement);
      expect(dialogElement.open).toBe(false);
    });

    it("deve abrir o modal ao invocar .openModal() e atualizar a propriedade open", () => {
      document.body.appendChild(dialogElement);

      dialogElement.openModal();
      expect(dialogElement.open).toBe(true);

      const dialog = dialogElement.querySelector("dialog");
      expect(dialog.hasAttribute("open")).toBe(true);
    });

    it("deve fechar o modal ao invocar .closeModal() e despachar o evento close-key-dialog", () => {
      document.body.appendChild(dialogElement);
      dialogElement.openModal();

      const closeListener = vi.fn();
      dialogElement.addEventListener(
        KEY_DIALOG_EVENT_NAMES.CLOSE_KEY_DIALOG,
        closeListener,
      );

      dialogElement.closeModal();
      expect(dialogElement.open).toBe(false);
      expect(closeListener).toHaveBeenCalledTimes(1);
    });

    it("deve permitir alternar o estado via getter e setter da propriedade open", () => {
      document.body.appendChild(dialogElement);

      dialogElement.open = true;
      expect(dialogElement.open).toBe(true);

      dialogElement.open = false;
      expect(dialogElement.open).toBe(false);
    });

    it("deve fechar o modal e emitir evento ao clicar no botão X do cabeçalho", () => {
      document.body.appendChild(dialogElement);
      dialogElement.openModal();

      const closeListener = vi.fn();
      dialogElement.addEventListener(
        KEY_DIALOG_EVENT_NAMES.CLOSE_KEY_DIALOG,
        closeListener,
      );

      const closeBtn = dialogElement.querySelector(
        `.${KEY_DIALOG_CLASSES.CLOSE_BTN}`,
      );
      closeBtn.click();

      expect(dialogElement.open).toBe(false);
      expect(closeListener).toHaveBeenCalledTimes(1);
    });

    it("deve fechar o modal e emitir evento ao clicar no botão Cancelar", () => {
      document.body.appendChild(dialogElement);
      dialogElement.openModal();

      const closeListener = vi.fn();
      dialogElement.addEventListener(
        KEY_DIALOG_EVENT_NAMES.CLOSE_KEY_DIALOG,
        closeListener,
      );

      const cancelBtn = dialogElement.querySelector(
        `.${KEY_DIALOG_CLASSES.BTN_CANCEL}`,
      );
      cancelBtn.click();

      expect(dialogElement.open).toBe(false);
      expect(closeListener).toHaveBeenCalledTimes(1);
    });

    it("deve fechar o modal e emitir evento ao receber evento nativo cancel (tecla Escape)", () => {
      document.body.appendChild(dialogElement);
      dialogElement.openModal();

      const closeListener = vi.fn();
      dialogElement.addEventListener(
        KEY_DIALOG_EVENT_NAMES.CLOSE_KEY_DIALOG,
        closeListener,
      );

      const dialog = dialogElement.querySelector("dialog");
      dialog.dispatchEvent(new Event("cancel", { cancelable: true }));

      expect(dialogElement.open).toBe(false);
      expect(closeListener).toHaveBeenCalledTimes(1);
    });

    it("deve fechar o modal ao clicar no backdrop externo", () => {
      document.body.appendChild(dialogElement);
      dialogElement.openModal();

      const closeListener = vi.fn();
      dialogElement.addEventListener(
        KEY_DIALOG_EVENT_NAMES.CLOSE_KEY_DIALOG,
        closeListener,
      );

      const dialog = dialogElement.querySelector("dialog");
      vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue({
        top: 50,
        bottom: 450,
        left: 50,
        right: 450,
        width: 400,
        height: 400,
      });

      // Clique fora dos limites da caixa modal
      dialog.dispatchEvent(
        new MouseEvent("click", {
          clientX: 10,
          clientY: 10,
          bubbles: true,
        }),
      );

      expect(dialogElement.open).toBe(false);
      expect(closeListener).toHaveBeenCalledTimes(1);
    });

    it("deve fechar o modal ao clicar no backdrop externo", () => {
      document.body.appendChild(dialogElement);
      dialogElement.openModal();

      const closeListener = vi.fn();
      dialogElement.addEventListener(
        KEY_DIALOG_EVENT_NAMES.CLOSE_KEY_DIALOG,
        closeListener,
      );

      const dialog = dialogElement.querySelector("dialog");
      vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue({
        top: 50,
        bottom: 450,
        left: 50,
        right: 450,
        width: 400,
        height: 400,
      });

      // Clique fora dos limites da caixa modal
      dialog.dispatchEvent(
        new MouseEvent("click", {
          clientX: 10,
          clientY: 10,
          bubbles: true,
        }),
      );

      expect(dialogElement.open).toBe(false);
      expect(closeListener).toHaveBeenCalledTimes(1);
    });

    it("deve abrir o modal ao interceptar o evento global open-key-dialog", () => {
      document.body.appendChild(dialogElement);
      expect(dialogElement.open).toBe(false);

      document.dispatchEvent(
        new CustomEvent(KEY_DIALOG_EVENT_NAMES.OPEN_KEY_DIALOG, {
          bubbles: true,
          composed: true,
        }),
      );

      expect(dialogElement.open).toBe(true);
    });
  });

  describe("Pílulas Seletoras de Tipo de Chave", () => {
    it("deve renderizar as 5 pílulas canônicas com labels corretos", () => {
      document.body.appendChild(dialogElement);

      const typeButtons = dialogElement.querySelectorAll(
        `.${KEY_DIALOG_CLASSES.TYPE_BTN}`,
      );
      expect(typeButtons.length).toBe(5);

      const typesRendered = Array.from(typeButtons).map((btn) =>
        btn.getAttribute("data-type"),
      );
      expect(typesRendered).toEqual([
        PIX_KEY_TYPES.CPF,
        PIX_KEY_TYPES.CNPJ,
        PIX_KEY_TYPES.EMAIL,
        PIX_KEY_TYPES.TELEFONE,
        PIX_KEY_TYPES.EVP,
      ]);
    });

    it("deve iniciar com o tipo CPF selecionado (aria-pressed='true' e classe ativa)", () => {
      document.body.appendChild(dialogElement);

      const cpfBtn = dialogElement.querySelector(
        `button[data-type="${PIX_KEY_TYPES.CPF}"]`,
      );
      expect(
        cpfBtn.classList.contains(KEY_DIALOG_CLASSES.TYPE_BTN_ACTIVE),
      ).toBe(true);
      expect(cpfBtn.getAttribute("aria-pressed")).toBe("true");

      const keyInput = dialogElement.querySelector(`input[name="valor_chave"]`);
      expect(keyInput.placeholder).toBe("000.000.000-00");
      expect(keyInput.inputMode).toBe("numeric");
    });

    it("deve alterar dinamicamente o placeholder e inputmode ao selecionar a pílula E-mail", () => {
      document.body.appendChild(dialogElement);

      const emailBtn = dialogElement.querySelector(
        `button[data-type="${PIX_KEY_TYPES.EMAIL}"]`,
      );
      emailBtn.click();

      expect(dialogElement.selectedKeyType).toBe(PIX_KEY_TYPES.EMAIL);
      const activeBtn = dialogElement.querySelector(
        `button[data-type="${PIX_KEY_TYPES.EMAIL}"]`,
      );
      expect(
        activeBtn.classList.contains(KEY_DIALOG_CLASSES.TYPE_BTN_ACTIVE),
      ).toBe(true);
      expect(activeBtn.getAttribute("aria-pressed")).toBe("true");

      const keyInput = dialogElement.querySelector(`input[name="valor_chave"]`);
      expect(keyInput.placeholder).toBe("seu.email@exemplo.com");
      expect(keyInput.type).toBe("email");
      expect(keyInput.inputMode).toBe("email");
    });

    it("deve alterar dinamicamente o placeholder e inputmode ao selecionar a pílula Celular", () => {
      document.body.appendChild(dialogElement);

      const telBtn = dialogElement.querySelector(
        `button[data-type="${PIX_KEY_TYPES.TELEFONE}"]`,
      );
      telBtn.click();

      expect(dialogElement.selectedKeyType).toBe(PIX_KEY_TYPES.TELEFONE);
      const activeBtn = dialogElement.querySelector(
        `button[data-type="${PIX_KEY_TYPES.TELEFONE}"]`,
      );
      expect(
        activeBtn.classList.contains(KEY_DIALOG_CLASSES.TYPE_BTN_ACTIVE),
      ).toBe(true);

      const keyInput = dialogElement.querySelector(`input[name="valor_chave"]`);
      expect(keyInput.placeholder).toBe("+55 11 99999-9999");
      expect(keyInput.inputMode).toBe("tel");
    });

    it("deve alterar dinamicamente o placeholder ao selecionar CNPJ e Aleatória (EVP)", () => {
      document.body.appendChild(dialogElement);

      dialogElement.selectedKeyType = PIX_KEY_TYPES.CNPJ;
      const keyInputCnpj = dialogElement.querySelector(
        `input[name="valor_chave"]`,
      );
      expect(keyInputCnpj.placeholder).toBe("00.000.000/0000-00");
      expect(keyInputCnpj.inputMode).toBe("numeric");

      dialogElement.selectedKeyType = PIX_KEY_TYPES.EVP;
      const keyInputEvp = dialogElement.querySelector(
        `input[name="valor_chave"]`,
      );
      expect(keyInputEvp.placeholder).toBe(
        "123e4567-e89b-12d3-a456-426614174000",
      );
    });
  });

  describe("Campos do Formulário e Limites de Comprimento", () => {
    it("deve renderizar todos os campos necessários com rótulos e maxlength", () => {
      document.body.appendChild(dialogElement);

      const keyInput = dialogElement.querySelector(`input[name="valor_chave"]`);
      expect(keyInput).not.toBeNull();
      expect(keyInput.id).toBe("key-dialog-input-key");

      const labelInput = dialogElement.querySelector(`input[name="rotulo"]`);
      expect(labelInput).not.toBeNull();
      expect(labelInput.maxLength).toBe(KEY_DIALOG_MAX_LENGTHS.ACCOUNT_LABEL);

      const nameInput = dialogElement.querySelector(
        `input[name="nome_recebedor"]`,
      );
      expect(nameInput).not.toBeNull();
      expect(nameInput.maxLength).toBe(KEY_DIALOG_MAX_LENGTHS.MERCHANT_NAME);

      const cityInput = dialogElement.querySelector(
        `input[name="cidade_recebedor"]`,
      );
      expect(cityInput).not.toBeNull();
      expect(cityInput.maxLength).toBe(KEY_DIALOG_MAX_LENGTHS.MERCHANT_CITY);
    });
  });

  describe("Validação de Dados e Alerta Acessível (role='alert')", () => {
    it("não deve exibir bloco de alerta inicialmente", () => {
      document.body.appendChild(dialogElement);

      const alert = dialogElement.querySelector(`.${KEY_DIALOG_CLASSES.ALERT}`);
      expect(alert).toBeNull();
    });

    it("deve exibir alerta com role='alert' e ícone de exclamação ao tentar submeter CPF inválido", async () => {
      document.body.appendChild(dialogElement);
      dialogElement.openModal();

      const keyInput = dialogElement.querySelector(`input[name="valor_chave"]`);
      keyInput.value = "123.456.789-00";

      const nameInput = dialogElement.querySelector(
        `input[name="nome_recebedor"]`,
      );
      nameInput.value = "Luiz Canet";

      const cityInput = dialogElement.querySelector(
        `input[name="cidade_recebedor"]`,
      );
      cityInput.value = "Brasilia";

      const form = dialogElement.querySelector(`.${KEY_DIALOG_CLASSES.FORM}`);
      form.dispatchEvent(new Event("submit", { cancelable: true }));

      // Aguarda processamento assíncrono da submissão
      await new Promise((resolve) => setTimeout(resolve, 0));

      const alert = dialogElement.querySelector(`.${KEY_DIALOG_CLASSES.ALERT}`);
      expect(alert).not.toBeNull();
      expect(alert.getAttribute("role")).toBe("alert");
      expect(alert.getAttribute("aria-live")).toBe("assertive");
      expect(
        alert.querySelector(
          `vector-icon[name="${KEY_DIALOG_ICONS.CIRCLE_EXCLAMATION}"]`,
        ),
      ).not.toBeNull();

      expect(dialogElement.errorMessage).toContain("CPF");
      expect(dialogElement.open).toBe(true);

      const keyInputAfter = dialogElement.querySelector(
        `input[name="valor_chave"]`,
      );
      expect(
        keyInputAfter.classList.contains(KEY_DIALOG_CLASSES.INPUT_ERROR),
      ).toBe(true);
    });

    it("deve limpar o erro e o alerta ao alternar o tipo de chave", async () => {
      document.body.appendChild(dialogElement);
      dialogElement.openModal();

      const keyInput = dialogElement.querySelector(`input[name="valor_chave"]`);
      keyInput.value = "000.000.000-00";

      const form = dialogElement.querySelector(`.${KEY_DIALOG_CLASSES.FORM}`);
      form.dispatchEvent(new Event("submit", { cancelable: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(
        dialogElement.querySelector(`.${KEY_DIALOG_CLASSES.ALERT}`),
      ).not.toBeNull();

      // Alterna o tipo
      dialogElement.selectedKeyType = PIX_KEY_TYPES.EMAIL;
      expect(
        dialogElement.querySelector(`.${KEY_DIALOG_CLASSES.ALERT}`),
      ).toBeNull();
      expect(dialogElement.errorMessage).toBeNull();
    });

    it("deve limpar o alerta de erro reativamente ao digitar em qualquer campo do formulário", async () => {
      document.body.appendChild(dialogElement);
      dialogElement.openModal();

      const keyInput = dialogElement.querySelector(`input[name="valor_chave"]`);
      keyInput.value = "123.456.789-00";

      const form = dialogElement.querySelector(`.${KEY_DIALOG_CLASSES.FORM}`);
      form.dispatchEvent(new Event("submit", { cancelable: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(
        dialogElement.querySelector(`.${KEY_DIALOG_CLASSES.ALERT}`),
      ).not.toBeNull();

      // Dispara evento de digitação no formulário atualizado
      const currentForm = dialogElement.querySelector(
        `.${KEY_DIALOG_CLASSES.FORM}`,
      );
      currentForm.dispatchEvent(new Event("input", { bubbles: true }));

      expect(
        dialogElement.querySelector(`.${KEY_DIALOG_CLASSES.ALERT}`),
      ).toBeNull();
      expect(dialogElement.errorMessage).toBeNull();
    });

    it("deve limpar o alerta de erro reativamente ao digitar em qualquer campo do formulário", async () => {
      document.body.appendChild(dialogElement);
      dialogElement.openModal();

      const keyInput = dialogElement.querySelector(`input[name="valor_chave"]`);
      keyInput.value = "123.456.789-00";

      const form = dialogElement.querySelector(`.${KEY_DIALOG_CLASSES.FORM}`);
      form.dispatchEvent(new Event("submit", { cancelable: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(
        dialogElement.querySelector(`.${KEY_DIALOG_CLASSES.ALERT}`),
      ).not.toBeNull();

      // Dispara evento de digitação no formulário atualizado
      const currentForm = dialogElement.querySelector(
        `.${KEY_DIALOG_CLASSES.FORM}`,
      );
      currentForm.dispatchEvent(new Event("input", { bubbles: true }));

      expect(
        dialogElement.querySelector(`.${KEY_DIALOG_CLASSES.ALERT}`),
      ).toBeNull();
      expect(dialogElement.errorMessage).toBeNull();
    });
  });

  describe("Submissão com Sucesso e Integração com SavePixKeyUseCase", () => {
    it("deve salvar a chave, fechar o modal e emitir o evento key-saved via SavePixKeyUseCase injetado", async () => {
      const mockResult = {
        chaveConta: {
          id: "key-123",
          tipo_chave: PIX_KEY_TYPES.EMAIL,
          valor_chave: "pagamentos@exemplo.com",
          rotulo: "Minha Empresa",
          nome_recebedor: "LUIZ CANET",
          cidade_recebedor: "CURITIBA",
        },
        selectedKeyId: "key-123",
        isSelected: true,
      };

      const mockSavePixKeyUseCase = {
        execute: vi.fn().mockResolvedValue(mockResult),
      };

      dialogElement.savePixKeyUseCase = mockSavePixKeyUseCase;
      document.body.appendChild(dialogElement);
      dialogElement.openModal();

      dialogElement.selectedKeyType = PIX_KEY_TYPES.EMAIL;

      const keyInput = dialogElement.querySelector(`input[name="valor_chave"]`);
      keyInput.value = "pagamentos@exemplo.com";

      const labelInput = dialogElement.querySelector(`input[name="rotulo"]`);
      labelInput.value = "Minha Empresa";

      const nameInput = dialogElement.querySelector(
        `input[name="nome_recebedor"]`,
      );
      nameInput.value = "Luiz Canet";

      const cityInput = dialogElement.querySelector(
        `input[name="cidade_recebedor"]`,
      );
      cityInput.value = "Curitiba";

      const savedListener = vi.fn();
      dialogElement.addEventListener(
        KEY_DIALOG_EVENT_NAMES.KEY_SAVED,
        savedListener,
      );

      const form = dialogElement.querySelector(`.${KEY_DIALOG_CLASSES.FORM}`);
      form.dispatchEvent(new Event("submit", { cancelable: true }));

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockSavePixKeyUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockSavePixKeyUseCase.execute).toHaveBeenCalledWith({
        chave_conta: {
          tipo_chave: PIX_KEY_TYPES.EMAIL,
          valor_chave: "pagamentos@exemplo.com",
          rotulo: "Minha Empresa",
          nome_recebedor: "Luiz Canet",
          cidade_recebedor: "Curitiba",
        },
        selectAsActive: true,
      });

      expect(savedListener).toHaveBeenCalledTimes(1);
      expect(savedListener.mock.calls[0][0].detail).toEqual(mockResult);
      expect(dialogElement.open).toBe(false);
    });

    it("deve funcionar de forma autônoma sem injeção de caso de uso com validação local da ChaveConta", async () => {
      document.body.appendChild(dialogElement);
      dialogElement.openModal();
      dialogElement.selectedKeyType = PIX_KEY_TYPES.EMAIL;

      const keyInput = dialogElement.querySelector(`input[name="valor_chave"]`);
      keyInput.value = "contato@empresa.com.br";

      const nameInput = dialogElement.querySelector(
        `input[name="nome_recebedor"]`,
      );
      nameInput.value = "EMPRESA LTDA";

      const cityInput = dialogElement.querySelector(
        `input[name="cidade_recebedor"]`,
      );
      cityInput.value = "BRASILIA";

      const savedListener = vi.fn();
      dialogElement.addEventListener(
        KEY_DIALOG_EVENT_NAMES.KEY_SAVED,
        savedListener,
      );

      const form = dialogElement.querySelector(`.${KEY_DIALOG_CLASSES.FORM}`);
      form.dispatchEvent(new Event("submit", { cancelable: true }));

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(savedListener).toHaveBeenCalledTimes(1);
      const detail = savedListener.mock.calls[0][0].detail;
      expect(detail.chaveConta.valor_chave).toBe("contato@empresa.com.br");
      expect(detail.isSelected).toBe(true);
      expect(dialogElement.open).toBe(false);
    });

    it("deve tratar erro de chave duplicada (DUPLICATE_PIX_KEY) mantendo o modal aberto", async () => {
      const duplicateError = new Error(
        "Esta chave PIX já está cadastrada em outra conta.",
      );
      duplicateError.code = "DUPLICATE_PIX_KEY";
      duplicateError.field = "valor_chave";

      const mockSavePixKeyUseCase = {
        execute: vi.fn().mockRejectedValue(duplicateError),
      };

      dialogElement.savePixKeyUseCase = mockSavePixKeyUseCase;
      document.body.appendChild(dialogElement);
      dialogElement.openModal();

      dialogElement.selectedKeyType = PIX_KEY_TYPES.EMAIL;
      const keyInput = dialogElement.querySelector(`input[name="valor_chave"]`);
      keyInput.value = "chave@duplicada.com";

      const nameInput = dialogElement.querySelector(
        `input[name="nome_recebedor"]`,
      );
      nameInput.value = "Fulano";

      const cityInput = dialogElement.querySelector(
        `input[name="cidade_recebedor"]`,
      );
      cityInput.value = "Cidade";

      const form = dialogElement.querySelector(`.${KEY_DIALOG_CLASSES.FORM}`);
      form.dispatchEvent(new Event("submit", { cancelable: true }));

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(dialogElement.open).toBe(true);
      const alert = dialogElement.querySelector(`.${KEY_DIALOG_CLASSES.ALERT}`);
      expect(alert).not.toBeNull();
      expect(alert.textContent).toContain(
        "Esta chave PIX já está cadastrada em outra conta.",
      );
    });
  });

  describe("Atributos Observados e Customização de Textos", () => {
    it("deve sincronizar alterações nos atributos title-text, save-btn-label e cancel-btn-label", () => {
      document.body.appendChild(dialogElement);

      dialogElement.setAttribute("title-text", "Adicionar Conta Bancária");
      dialogElement.setAttribute("save-btn-label", "Confirmar Cadastro");
      dialogElement.setAttribute("cancel-btn-label", "Voltar");

      const title = dialogElement.querySelector(`.${KEY_DIALOG_CLASSES.TITLE}`);
      expect(title.textContent.trim()).toBe("Adicionar Conta Bancária");

      const saveBtn = dialogElement.querySelector(
        `.${KEY_DIALOG_CLASSES.BTN_SAVE}`,
      );
      expect(saveBtn.textContent).toContain("Confirmar Cadastro");

      const cancelBtn = dialogElement.querySelector(
        `.${KEY_DIALOG_CLASSES.BTN_CANCEL}`,
      );
      expect(cancelBtn.textContent.trim()).toBe("Voltar");
    });
  });
});
