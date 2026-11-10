import { afterEach, describe, expect, it } from "vitest";
import {
  SAMPLE_PIX_KEYS,
  flushMicrotasks,
  mountTestApp,
} from "./helpers/setup-app.js";

describe("Jornada Principal de Cobrança PIX (TASK-07.2.2, TASK-07.2.3, TASK-07.2.4, US-07.4)", () => {
  let context = null;

  afterEach(() => {
    if (context) {
      context.cleanup();
      context = null;
    }
  });

  describe("TASK-07.2.2: Primeiro Acesso, Cadastro de Chave e Cobrança com Valor Fixo", () => {
    it("deve conduzir a jornada completa: estado vazio -> dialog -> cadastro -> seleção -> cobrança fixa", async () => {
      // 1. Primeiro Acesso: Usuário abre o app sem chaves cadastradas
      context = await mountTestApp({
        initialPath: "/",
        initialKeys: [],
      });

      const {
        emptyElement,
        selectorElement,
        formElement,
        resultElement,
        dialogElement,
        chargeDialogElement,
        rootElement,
      } = context;

      // Validações do Estado Vazio Inicial (Empty State)
      expect(emptyElement).not.toBeNull();
      expect(emptyElement.classList.contains("hidden")).toBe(false);
      expect(emptyElement.textContent).toContain(
        "Cadastre sua primeira chave PIX",
      );

      // Seletor de chaves deve estar oculto
      expect(selectorElement.classList.contains("hidden")).toBe(true);

      // Formulário deve estar desabilitado (sem chave selecionada)
      const ctaBtn = formElement.querySelector("button.charge-cta");
      expect(ctaBtn).not.toBeNull();
      expect(ctaBtn.classList.contains("charge-cta--disabled")).toBe(true);

      // Ausência de coluna estática de espera na página principal (US-07.4)
      expect(
        rootElement.querySelector(".charge-page__column--result"),
      ).toBeNull();

      // Diálogo modal de cobrança deve estar inicialmente fechado
      expect(chargeDialogElement).not.toBeNull();
      expect(chargeDialogElement.open).toBe(false);
      const chargeNativeDialog = chargeDialogElement.querySelector(
        "dialog.charge-dialog",
      );
      expect(chargeNativeDialog).not.toBeNull();
      expect(chargeNativeDialog.hasAttribute("open")).toBe(false);

      // 2. Acionamento do Diálogo de Cadastro de Chave
      const openDialogCta = emptyElement.querySelector(
        'button[data-action="open-key-dialog"]',
      );
      expect(openDialogCta).not.toBeNull();

      openDialogCta.click();
      await flushMicrotasks(20);

      const nativeDialog = dialogElement.querySelector("dialog.key-dialog");
      expect(nativeDialog).not.toBeNull();
      expect(nativeDialog.hasAttribute("open")).toBe(true);

      // 3. Preenchimento e Submissão do Formulário de Chave
      const typeBtnCpf = dialogElement.querySelector('button[data-type="CPF"]');
      typeBtnCpf.click();

      const keyValueInput = dialogElement.querySelector(
        'input[name="valor_chave"]',
      );
      const labelInput = dialogElement.querySelector('input[name="rotulo"]');
      const nameInput = dialogElement.querySelector(
        'input[name="nome_recebedor"]',
      );
      const cityInput = dialogElement.querySelector(
        'input[name="cidade_recebedor"]',
      );

      keyValueInput.value = "123.456.789-09";
      keyValueInput.dispatchEvent(new Event("input", { bubbles: true }));

      labelInput.value = "Banco do Brasil";
      labelInput.dispatchEvent(new Event("input", { bubbles: true }));

      nameInput.value = "Luiz Henrique Canet";
      nameInput.dispatchEvent(new Event("input", { bubbles: true }));

      cityInput.value = "Curitiba";
      cityInput.dispatchEvent(new Event("input", { bubbles: true }));

      const saveBtn = dialogElement.querySelector(
        "button.key-dialog__btn-save",
      );
      saveBtn.click();

      await flushMicrotasks(150);

      // Diálogo deve fechar após salvar
      expect(nativeDialog.hasAttribute("open")).toBe(false);

      // 4. Transição da Interface: Empty State oculto, Seletor visível e ativo
      expect(emptyElement.classList.contains("hidden")).toBe(true);
      expect(selectorElement.classList.contains("hidden")).toBe(false);

      const cards = selectorElement.querySelectorAll(".key-selector__card");
      expect(cards.length).toBe(1);
      expect(cards[0].classList.contains("key-selector__card--selected")).toBe(
        true,
      );
      expect(cards[0].textContent).toContain("Banco do Brasil");

      // Botão "Manda um PIX" habilitado
      expect(ctaBtn.classList.contains("charge-cta--disabled")).toBe(false);

      // 5. Preenchimento de Valor Fixo e Emissão da Cobrança
      const amountInput = formElement.querySelector("#charge-amount");
      expect(amountInput).not.toBeNull();

      amountInput.value = "50,00";
      amountInput.dispatchEvent(new Event("input", { bubbles: true }));
      await flushMicrotasks(20);

      const statusPill = formElement.querySelector(".amount-field__status");
      expect(statusPill.textContent).toContain("Valor fixo: R$ 50,00");

      ctaBtn.click();
      await flushMicrotasks(100);

      // 6. Verificação do Resultado da Cobrança em Caixa de Diálogo Modal (US-07.4)
      expect(chargeDialogElement.open).toBe(true);
      expect(chargeNativeDialog.hasAttribute("open")).toBe(true);

      const dialogTitle = chargeDialogElement.querySelector(
        ".charge-dialog__title",
      );
      expect(dialogTitle).not.toBeNull();
      expect(dialogTitle.textContent).toContain("Cobrança Pronta");

      const accountTitle = resultElement.querySelector(
        ".charge-result__account",
      );
      expect(accountTitle.textContent).toContain("Banco do Brasil");

      const amountBadge = resultElement.querySelector(
        ".charge-result__amount-pill",
      );
      expect(amountBadge.textContent).toContain("R$ 50,00");

      const qrSvg = resultElement.querySelector(".charge-result__qr-svg svg");
      expect(qrSvg).not.toBeNull();

      const brCode = resultElement.querySelector(".charge-result__brcode");
      expect(brCode).not.toBeNull();
      expect(brCode.textContent.length).toBeGreaterThan(20);

      // 7. Fechamento do diálogo via botão de fechar do cabeçalho
      const closeBtn = chargeDialogElement.querySelector(
        ".charge-dialog__close-btn",
      );
      expect(closeBtn).not.toBeNull();
      closeBtn.click();
      await flushMicrotasks(30);

      expect(chargeDialogElement.open).toBe(false);
      expect(chargeNativeDialog.hasAttribute("open")).toBe(false);
    });
  });

  describe("TASK-07.2.3: Cobrança com Valor Aberto e Ações de Distribuição", () => {
    it("deve gerar cobrança de valor aberto e executar cópia, compartilhamento e download", async () => {
      context = await mountTestApp({
        initialPath: "/",
        initialKeys: [SAMPLE_PIX_KEYS.CPF],
      });

      await flushMicrotasks(50);

      const { formElement, resultElement, chargeDialogElement, mocks } =
        context;

      // 1. Geração de cobrança sem valor informado (Valor Aberto)
      const ctaBtn = formElement.querySelector("button.charge-cta");
      ctaBtn.click();
      await flushMicrotasks(100);

      expect(chargeDialogElement.open).toBe(true);

      const amountBadge = resultElement.querySelector(
        ".charge-result__amount-pill",
      );
      expect(amountBadge.textContent).toContain("Valor Aberto");

      const brCodeElement = resultElement.querySelector(
        ".charge-result__brcode",
      );
      const generatedBrCode = brCodeElement.textContent.trim();
      expect(generatedBrCode).toBeTruthy();

      // 2. Ação Copiar BR Code (sem fechar o diálogo)
      const copyBtn = resultElement.querySelector(".charge-result__btn--copy");
      expect(copyBtn).not.toBeNull();

      copyBtn.click();
      await flushMicrotasks(50);

      expect(mocks.clipboard.writeText).toHaveBeenCalledWith(generatedBrCode);
      expect(mocks.clipboard.text).toBe(generatedBrCode);
      expect(copyBtn.textContent).toContain("Copiado!");
      expect(chargeDialogElement.open).toBe(true);

      // 3. Ação Compartilhar (sem fechar o diálogo)
      const shareBtn = resultElement.querySelector(
        ".charge-result__btn--share",
      );
      expect(shareBtn).not.toBeNull();

      shareBtn.click();
      await flushMicrotasks(50);

      const shareCalled =
        mocks.share.mock.calls.length > 0 ||
        mocks.windowOpen.mock.calls.length > 0;
      expect(shareCalled).toBe(true);
      expect(chargeDialogElement.open).toBe(true);

      // 4. Ação Salvar Imagem PNG (sem fechar o diálogo)
      const downloadBtn = resultElement.querySelector(
        ".charge-result__btn--download",
      );
      expect(downloadBtn).not.toBeNull();

      downloadBtn.click();
      await flushMicrotasks(50);

      expect(mocks.createObjectURL).toHaveBeenCalled();
      expect(chargeDialogElement.open).toBe(true);

      // 5. Fechamento pelo botão inferior de conclusão (US-07.4)
      const dismissBtn = chargeDialogElement.querySelector(
        ".charge-dialog__dismiss-btn",
      );
      expect(dismissBtn).not.toBeNull();
      dismissBtn.click();
      await flushMicrotasks(30);

      expect(chargeDialogElement.open).toBe(false);
    });
  });

  describe("TASK-07.2.4: Gestão e Chaveamento de Múltiplas Contas PIX", () => {
    it("deve alternar entre chaves cadastradas e retornar ao empty state na exclusão da última", async () => {
      // Começa com 1 chave existente (CPF)
      context = await mountTestApp({
        initialPath: "/",
        initialKeys: [SAMPLE_PIX_KEYS.CPF],
      });

      await flushMicrotasks(50);

      const { emptyElement, selectorElement, formElement, dialogElement } =
        context;

      expect(selectorElement.classList.contains("hidden")).toBe(false);
      let cards = selectorElement.querySelectorAll(".key-selector__card");
      expect(cards.length).toBe(1);

      // 1. Cadastra uma segunda chave (E-mail) através do botão "+ Nova chave"
      const addKeyBtn = selectorElement.querySelector(
        'button[data-action="open-key-dialog"]',
      );
      expect(addKeyBtn).not.toBeNull();
      addKeyBtn.click();
      await flushMicrotasks(20);

      const nativeDialog = dialogElement.querySelector("dialog.key-dialog");
      expect(nativeDialog.hasAttribute("open")).toBe(true);

      const typeBtnEmail = dialogElement.querySelector(
        'button[data-type="EMAIL"]',
      );
      typeBtnEmail.click();

      const keyValueInput = dialogElement.querySelector(
        'input[name="valor_chave"]',
      );
      const labelInput = dialogElement.querySelector('input[name="rotulo"]');
      const nameInput = dialogElement.querySelector(
        'input[name="nome_recebedor"]',
      );
      const cityInput = dialogElement.querySelector(
        'input[name="cidade_recebedor"]',
      );

      keyValueInput.value = "pix@luizca.net";
      keyValueInput.dispatchEvent(new Event("input", { bubbles: true }));

      labelInput.value = "Nubank Pessoal";
      labelInput.dispatchEvent(new Event("input", { bubbles: true }));

      nameInput.value = "Luiz Henrique Canet";
      nameInput.dispatchEvent(new Event("input", { bubbles: true }));

      cityInput.value = "Curitiba";
      cityInput.dispatchEvent(new Event("input", { bubbles: true }));

      const saveBtn = dialogElement.querySelector(
        "button.key-dialog__btn-save",
      );
      saveBtn.click();
      await flushMicrotasks(100);

      // Agora o seletor exibe 2 cartões de chave
      cards = selectorElement.querySelectorAll(".key-selector__card");
      expect(cards.length).toBe(2);

      // 2. Chaveamento: Seleciona a segunda chave (Nubank Pessoal)
      const secondCard = cards[1];
      secondCard.click();
      await flushMicrotasks(50);

      expect(
        secondCard.classList.contains("key-selector__card--selected"),
      ).toBe(true);
      expect(secondCard.getAttribute("aria-checked")).toBe("true");

      // 3. Exclusão da primeira chave
      const firstCardDeleteBtn = cards[0].querySelector(
        'button[data-action="delete"]',
      );
      expect(firstCardDeleteBtn).not.toBeNull();
      firstCardDeleteBtn.click();
      await flushMicrotasks(100);

      cards = selectorElement.querySelectorAll(".key-selector__card");
      expect(cards.length).toBe(1);
      expect(cards[0].textContent).toContain("Nubank Pessoal");
      expect(cards[0].classList.contains("key-selector__card--selected")).toBe(
        true,
      );

      // 4. Exclusão da última chave: retorno ao empty state
      const lastCardDeleteBtn = cards[0].querySelector(
        'button[data-action="delete"]',
      );
      lastCardDeleteBtn.click();
      await flushMicrotasks(100);

      // Deve reverter para Empty State
      expect(emptyElement.classList.contains("hidden")).toBe(false);
      expect(selectorElement.classList.contains("hidden")).toBe(true);

      // CTA do formulário deve ser desabilitado
      const ctaBtn = formElement.querySelector("button.charge-cta");
      expect(ctaBtn.classList.contains("charge-cta--disabled")).toBe(true);
    });
  });
});
