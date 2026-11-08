/**
 * Constantes canônicas, seletores BEM, configurações visuais e textos padrão
 * do componente <pix-charge-result>.
 * Alinhado às regras de negócio RN03, RN04, à especificação de acessibilidade W3C ARIA,
 * à Clean Architecture e ao protótipo da interface em docs/design/ui_prototype.html.
 */

/**
 * Rótulo de acessibilidade (aria-label) padrão da seção de resultado da cobrança.
 */
export const DEFAULT_CHARGE_RESULT_ARIA_LABEL = "Cobrança PIX gerada";

/**
 * Título exibido no estado inicial / aguardando emissão da cobrança.
 */
export const DEFAULT_CHARGE_RESULT_WAITING_TITLE = "Aguardando geração";

/**
 * Mensagem instrutiva exibida no estado inicial de espera.
 */
export const DEFAULT_CHARGE_RESULT_WAITING_DESCRIPTION =
  "Preencha os dados da cobrança e clique em 'Manda um PIX' para gerar seu QR Code e código Copia e Cola.";

/**
 * Rótulo da badge de confirmação de cobrança gerada e pronta.
 */
export const DEFAULT_CHARGE_RESULT_READY_BADGE = "Cobrança pronta";

/**
 * Texto da pílula de valor quando a cobrança é de valor dinâmico / em aberto.
 */
export const DEFAULT_CHARGE_RESULT_AMOUNT_OPEN = "Valor Aberto";

/**
 * Prefixo monetário fixo para valores monetários em Real brasileiro.
 */
export const DEFAULT_CHARGE_RESULT_AMOUNT_PREFIX = "R$ ";

/**
 * Título descritivo exibido acima da caixa de código EMV BR Code.
 */
export const DEFAULT_CHARGE_RESULT_BRCODE_TITLE = "PIX Copia e Cola";

/**
 * Rótulo informativo de modalidade de valor fixo exibido junto ao código Copia e Cola.
 */
export const DEFAULT_CHARGE_RESULT_MODE_FIXED = "Valor Fixo";

/**
 * Rótulo informativo de modalidade de valor dinâmico exibido junto ao código Copia e Cola.
 */
export const DEFAULT_CHARGE_RESULT_MODE_OPEN = "Valor Dinâmico";

/**
 * Fallback amigável para identificação da conta/recebedor quando o rótulo estiver ausente.
 */
export const DEFAULT_CHARGE_RESULT_ACCOUNT_FALLBACK = "Chave PIX Selecionada";

/**
 * Texto alternativo e acessível padrão para a imagem do QR Code.
 */
export const DEFAULT_CHARGE_RESULT_QR_ALT = "QR Code para pagamento via PIX";

/**
 * Rótulo acessível da caixa de código Copia e Cola para leitores de tela.
 */
export const DEFAULT_CHARGE_RESULT_BRCODE_ARIA_LABEL =
  "Código PIX Copia e Cola";

/**
 * Mapeamento das classes BEM utilizadas na estrutura do palco de resultado da cobrança.
 */
export const CHARGE_RESULT_CLASSES = Object.freeze({
  ROOT: "charge-result",
  CARD: "card",
  EMPTY: "charge-result--empty",
  WAITING: "charge-result__waiting",
  WAITING_ICON: "charge-result__waiting-icon",
  WAITING_TITLE: "charge-result__waiting-title",
  WAITING_DESC: "charge-result__waiting-desc",
  HEADER: "charge-result__header",
  HEADER_INFO: "charge-result__header-info",
  BADGE_READY: "charge-result__badge-ready",
  ACCOUNT: "charge-result__account",
  AMOUNT_PILL: "charge-result__amount-pill",
  AMOUNT_PILL_OPEN: "charge-result__amount-pill--open",
  QR_STAGE: "charge-result__qr-stage",
  QR_FRAME: "charge-result__qr-frame",
  QR_SVG: "charge-result__qr-svg",
  META: "charge-result__meta",
  BRCODE_WRAPPER: "charge-result__brcode-wrapper",
  BRCODE_LABEL: "charge-result__brcode-label",
  BRCODE_TITLE: "charge-result__brcode-title",
  BRCODE_MODE: "charge-result__brcode-mode",
  BRCODE: "charge-result__brcode",
  ACTIONS: "charge-result__actions",
  LIVE_REGION: "charge-result__live-region",
});

/**
 * Identificadores dos ícones vetoriais consumidos pelo componente via <vector-icon>.
 */
export const CHARGE_RESULT_ICONS = Object.freeze({
  QRCODE: "qrcode",
  CHECK: "check",
  COPY: "copy",
  SHARE: "share",
  DOWNLOAD: "download",
});

/**
 * Nomes canônicos dos eventos customizados emitidos pelo componente.
 */
export const CHARGE_RESULT_EVENT_NAMES = Object.freeze({
  CHARGE_CHANGED: "charge-changed",
  CHARGE_CLEARED: "charge-cleared",
});

/**
 * Formata um valor numérico ou string monetária para o padrão monetário BRL (ex.: "R$ 45,90").
 *
 * @param {number|string|null|undefined} rawAmount Valor bruto informado
 * @returns {string} Valor formatado em BRL
 */
export function formatCurrencyBRL(rawAmount) {
  if (rawAmount === null || rawAmount === undefined || rawAmount === "") {
    return "";
  }

  if (typeof rawAmount === "number") {
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      return "";
    }
    const fixedString = rawAmount.toFixed(2);
    const [integerPart, decimalPart] = fixedString.split(".");
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${DEFAULT_CHARGE_RESULT_AMOUNT_PREFIX}${formattedInteger},${decimalPart}`;
  }

  const cleanString = String(rawAmount)
    .replace(/^\s*R\$\s*/i, "")
    .trim();

  if (!cleanString) {
    return "";
  }

  const normalized = cleanString.includes(",")
    ? cleanString.replace(/\./g, "").replace(",", ".")
    : cleanString;

  const numeric = Number(normalized);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "";
  }

  return formatCurrencyBRL(numeric);
}

/**
 * Formata as informações para renderização da pílula de valor da cobrança.
 *
 * @param {number|string|null|undefined} amount Valor da cobrança
 * @param {boolean} [isDynamic=false] Indica se a cobrança é de valor dinâmico / aberto
 * @returns {{ text: string, isOpen: boolean, className: string }}
 */
export function formatChargeAmountBadge(amount, isDynamic = false) {
  if (isDynamic || amount === null || amount === undefined || amount === "") {
    return {
      text: DEFAULT_CHARGE_RESULT_AMOUNT_OPEN,
      isOpen: true,
      className: `${CHARGE_RESULT_CLASSES.AMOUNT_PILL} ${CHARGE_RESULT_CLASSES.AMOUNT_PILL_OPEN}`,
    };
  }

  const formatted = formatCurrencyBRL(amount);
  if (!formatted) {
    return {
      text: DEFAULT_CHARGE_RESULT_AMOUNT_OPEN,
      isOpen: true,
      className: `${CHARGE_RESULT_CLASSES.AMOUNT_PILL} ${CHARGE_RESULT_CLASSES.AMOUNT_PILL_OPEN}`,
    };
  }

  return {
    text: formatted,
    isOpen: false,
    className: CHARGE_RESULT_CLASSES.AMOUNT_PILL,
  };
}

/**
 * Formata o resumo descritivo da conta/recebedor para o cabeçalho do resultado.
 *
 * @param {object|null|undefined} chaveConta Objeto ou entidade de chave PIX
 * @returns {string} Texto formatado (ex.: "Nubank • JOAO DA SILVA")
 */
export function formatAccountSummary(chaveConta) {
  if (!chaveConta || typeof chaveConta !== "object") {
    return DEFAULT_CHARGE_RESULT_ACCOUNT_FALLBACK;
  }

  const rotulo =
    typeof chaveConta.rotulo === "string" ? chaveConta.rotulo.trim() : "";
  const nome =
    typeof chaveConta.nome_recebedor === "string"
      ? chaveConta.nome_recebedor.trim()
      : "";

  if (rotulo && nome) {
    return `${rotulo} • ${nome}`;
  }

  if (rotulo) {
    return rotulo;
  }

  if (nome) {
    return nome;
  }

  return DEFAULT_CHARGE_RESULT_ACCOUNT_FALLBACK;
}

/**
 * Formata a legenda de metadados da chave exibida abaixo do QR Code.
 *
 * @param {object|null|undefined} chaveConta Objeto ou entidade de chave PIX
 * @returns {string} Texto descritivo formatado
 */
export function formatKeyMetadata(chaveConta) {
  if (!chaveConta || typeof chaveConta !== "object") {
    return "";
  }

  const tipo =
    typeof chaveConta.tipo_chave === "string"
      ? chaveConta.tipo_chave.trim()
      : "";
  const valor =
    typeof chaveConta.valor_chave === "string"
      ? chaveConta.valor_chave.trim()
      : "";
  const cidade =
    typeof chaveConta.cidade_recebedor === "string"
      ? chaveConta.cidade_recebedor.trim()
      : "";

  const parts = [];

  if (tipo && valor) {
    parts.push(`Chave ${tipo}: ${valor}`);
  } else if (valor) {
    parts.push(`Chave: ${valor}`);
  }

  if (cidade) {
    parts.push(`(${cidade})`);
  }

  return parts.join(" ");
}
