/**
 * Constantes canônicas e textos padrão do componente <pix-key-empty>.
 * Alinhado às regras de negócio RN01, RN02 e ao protótipo da interface.
 */

/**
 * Título padrão exibido no estado vazio de chaves PIX.
 */
export const DEFAULT_EMPTY_STATE_TITLE = "Cadastre sua primeira chave PIX";

/**
 * Mensagem explicativa padrão destacando privacidade e armazenamento 100% local.
 */
export const DEFAULT_EMPTY_STATE_DESCRIPTION =
  "Para gerar cobranças instantâneas sem abrir o aplicativo do banco, cadastre uma chave de recebimento. Seus dados ficam salvos 100% localmente neste aparelho.";

/**
 * Rótulo padrão da ação primária (Call-to-Action) para cadastrar a primeira chave.
 */
export const DEFAULT_EMPTY_STATE_CTA = "Adicionar Minha Primeira Chave";

/**
 * Rótulo acessível padrão para a região semântica do estado vazio.
 */
export const DEFAULT_EMPTY_STATE_ARIA_LABEL = "Primeiro acesso sem chaves";

/**
 * Nomes canônicos dos eventos customizados emitidos pelo componente.
 */
export const KEY_EMPTY_EVENT_NAMES = Object.freeze({
  OPEN_KEY_DIALOG: "open-key-dialog",
});

/**
 * Identificadores dos ícones vetoriais consumidos pelo componente.
 */
export const KEY_EMPTY_ICONS = Object.freeze({
  KEY: "key",
  PLUS: "plus",
});

