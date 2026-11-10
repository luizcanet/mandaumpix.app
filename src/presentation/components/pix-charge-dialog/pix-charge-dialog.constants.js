/**
 * Constantes canônicas, seletores BEM, configurações e identificadores acessíveis
 * do componente <pix-charge-dialog> (Caixa de Diálogo Modal de Resultado da Cobrança).
 * Alinhado às regras de negócio RN02, RN03, RN04, RN05, à história US-07.4, à especificação
 * de acessibilidade W3C WAI-ARIA Dialog Modal (WCAG 2.2 AA) e ao protótipo da interface.
 */

/**
 * Título padrão exibido no cabeçalho do diálogo modal de cobrança.
 */
export const DEFAULT_CHARGE_DIALOG_TITLE = "Cobrança PIX Gerada";

/**
 * Identificador semântico do título para associação acessível (aria-labelledby).
 */
export const DEFAULT_CHARGE_DIALOG_TITLE_ID = "charge-dialog-title";

/**
 * Rótulo e tooltip acessível do botão de fechar no topo do modal.
 */
export const DEFAULT_CHARGE_DIALOG_CLOSE_TITLE = "Fechar diálogo de cobrança";

/**
 * Rótulo acessível padrão (aria-label) da caixa de diálogo modal.
 */
export const DEFAULT_CHARGE_DIALOG_ARIA_LABEL = "Resultado da cobrança PIX";

/**
 * Rótulo do botão inferior de conclusão e retorno à tela principal.
 */
export const DEFAULT_CHARGE_DIALOG_DISMISS_BTN_LABEL =
  "Concluir e fechar diálogo";

/**
 * Nomes canônicos dos eventos customizados e integrados consumidos/emitidos pelo diálogo.
 */
export const CHARGE_DIALOG_EVENT_NAMES = Object.freeze({
  OPEN_CHARGE_DIALOG: "open-charge-dialog",
  CLOSE_CHARGE_DIALOG: "close-charge-dialog",
  CHARGE_DIALOG_OPENED: "charge-dialog-opened",
  CHARGE_DIALOG_CLOSED: "charge-dialog-closed",
  CHARGE_GENERATED: "charge-generated",
});

/**
 * Identificadores dos ícones vetoriais consumidos pelo componente via <vector-icon>.
 */
export const CHARGE_DIALOG_ICONS = Object.freeze({
  CHECK: "check",
  XMARK: "xmark",
  QRCODE: "qrcode",
});

/**
 * Mapeamento das classes BEM utilizadas na estrutura do diálogo modal.
 */
export const CHARGE_DIALOG_CLASSES = Object.freeze({
  ROOT: "charge-dialog",
  BACKDROP: "charge-dialog-backdrop",
  TOP_BAR: "charge-dialog__top-bar",
  TITLE: "charge-dialog__title",
  CLOSE_BTN: "charge-dialog__close-btn",
  BODY: "charge-dialog__body",
  DISMISS_BTN: "charge-dialog__dismiss-btn",
  HIDDEN: "hidden",
  VISIBLE: "charge-dialog--visible",
});

/**
 * Mapeamento dos seletores CSS canônicos associados às classes BEM e elementos do diálogo.
 */
export const CHARGE_DIALOG_SELECTORS = Object.freeze({
  ROOT: ".charge-dialog",
  BACKDROP: ".charge-dialog-backdrop",
  TOP_BAR: ".charge-dialog__top-bar",
  TITLE: ".charge-dialog__title",
  CLOSE_BTN: ".charge-dialog__close-btn",
  BODY: ".charge-dialog__body",
  DISMISS_BTN: ".charge-dialog__dismiss-btn",
  DIALOG_ELEMENT: "dialog.charge-dialog",
  CHARGE_RESULT: "pix-charge-result",
});

/**
 * Nomes dos serviços injetáveis registrados no contêiner DI via SetInjectable.
 */
export const CHARGE_DIALOG_INJECTABLES = Object.freeze({
  GENERATE_PIX_CHARGE_USE_CASE: "generate-pix-charge-use-case",
  DISTRIBUTE_PIX_CHARGE_USE_CASE: "distribute-pix-charge-use-case",
});
