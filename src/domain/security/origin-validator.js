/**
 * Módulo de Domínio para Validação de Origem Canônica e UX Defensiva (US-08.2 / RN08).
 *
 * Responsável por verificar a integridade da origem em tempo de execução no PWA,
 * prevenindo ataques de phishing, clones não-oficiais e typosquatting,
 * reforçando a arquitetura Zero-Credential do Manda um PIX.
 */

/**
 * Origem canônica oficial de produção.
 * @type {string}
 */
export const CANONICAL_PRODUCTION_ORIGIN = "https://mandaumpix.app";

/**
 * Domínio canônico principal do aplicativo.
 * @type {string}
 */
export const OFFICIAL_DOMAIN = "mandaumpix.app";

/**
 * Lista imutável de origens canônicas reconhecidas (produção, staging, dev e portas locais padrão).
 * @type {ReadonlyArray<string>}
 */
export const CANONICAL_ORIGINS = Object.freeze([
  "https://mandaumpix.app",
  "https://stg.mandaumpix.app",
  "https://dev.mandaumpix.app",
  "http://localhost:5776",
  "http://localhost:6006",
]);

/**
 * Mensagem de alerta ostensivo para exibição quando a aplicação for detectada fora da origem legítima (INV-02).
 * @type {string}
 */
export const SECURITY_ALERT_MESSAGE =
  "Atenção: Este não é o endereço oficial do Manda um PIX. Acesse com segurança em mandaumpix.app";

/**
 * Mensagem educativa permanente sobre a arquitetura Zero-Credential do aplicativo (RN08 / INV-03).
 * @type {string}
 */
export const ZERO_CREDENTIAL_MESSAGE =
  "O Manda um PIX nunca solicita senhas bancárias, dados de cartão ou códigos de verificação.";

/**
 * Rótulo do badge de selo verificado exibido no rodapé e na página Sobre (INV-03).
 * @type {string}
 */
export const OFFICIAL_ORIGIN_BADGE_LABEL = "Origem Oficial: mandaumpix.app";

/**
 * Expressão regular para validação de origens locais de teste e desenvolvimento.
 * @type {RegExp}
 */
const LOCAL_ORIGIN_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/**
 * Retorna uma cópia defensiva das origens canônicas reconhecidas.
 * @returns {string[]}
 */
export function getCanonicalOrigins() {
  return [...CANONICAL_ORIGINS];
}

/**
 * Resolve a origem atual disponível no ambiente de execução.
 * @returns {string}
 */
function resolveCurrentOrigin() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  if (typeof globalThis !== "undefined" && globalThis.location?.origin) {
    return globalThis.location.origin;
  }
  return "";
}

/**
 * Normaliza uma string de URL ou origem para o formato canônico sem barra final e em caixa baixa.
 * @param {unknown} rawOrigin
 * @returns {string}
 */
export function normalizeOrigin(rawOrigin) {
  if (typeof rawOrigin !== "string") {
    return "";
  }
  const trimmed = rawOrigin.trim();
  if (!trimmed) {
    return "";
  }
  try {
    const url = new URL(trimmed);
    return url.origin.toLowerCase();
  } catch {
    return trimmed.replace(/\/+$/, "").toLowerCase();
  }
}

/**
 * Determina se uma dada origem pertence ao ambiente local de desenvolvimento ou testes.
 * @param {string} origin
 * @returns {boolean}
 */
export function isLocalOrigin(origin) {
  const normalized = normalizeOrigin(origin);
  if (!normalized) {
    return false;
  }
  return LOCAL_ORIGIN_REGEX.test(normalized);
}

/**
 * Determina se a origem fornecida (ou atual do navegador) é uma origem canônica autorizada (INV-01).
 *
 * @param {string} [origin] - Origem a validar. Se omitida (chamada sem argumentos), inspeciona o ambiente atual.
 * @param {object} [options]
 * @param {boolean} [options.allowLocal=true] - Se deve admitir origens locais de desenvolvimento/teste.
 * @returns {boolean}
 */
export function isCanonicalOrigin(origin, options = {}) {
  const targetOrigin = arguments.length === 0 ? resolveCurrentOrigin() : origin;
  const allowLocal = options?.allowLocal ?? true;

  const normalized = normalizeOrigin(targetOrigin);
  if (!normalized) {
    return false;
  }

  const isLocal = isLocalOrigin(normalized);

  if (isLocal) {
    return allowLocal;
  }

  return CANONICAL_ORIGINS.includes(normalized);
}

/**
 * Alias semântico para isCanonicalOrigin, em conformidade com o Guia de Takedown e Monitoramento.
 *
 * @param {string} [origin]
 * @param {object} [options]
 * @returns {boolean}
 */
export function isOfficialOrigin(...args) {
  return isCanonicalOrigin(...args);
}

/**
 * Verifica se a origem corresponde estritamente à origem oficial de produção (https://mandaumpix.app).
 *
 * @param {string} [origin]
 * @returns {boolean}
 */
export function isProductionOrigin(origin) {
  const targetOrigin = arguments.length === 0 ? resolveCurrentOrigin() : origin;
  const normalized = normalizeOrigin(targetOrigin);
  if (!normalized) {
    return false;
  }
  return normalized === CANONICAL_PRODUCTION_ORIGIN;
}

/**
 * Executa a análise completa da origem fornecida (ou atual) e produz um relatório estruturado
 * para orientar os componentes de interface e regras de segurança (INV-01, INV-02, INV-03).
 *
 * @param {string} [origin]
 * @returns {Readonly<{
 *   isValid: boolean,
 *   origin: string,
 *   isCanonical: boolean,
 *   isOfficial: boolean,
 *   isProduction: boolean,
 *   isLocal: boolean,
 *   officialOrigin: string,
 *   warningMessage: string | null
 * }>}
 */
export function validateOrigin(origin) {
  const targetOrigin = arguments.length === 0 ? resolveCurrentOrigin() : origin;
  const normalized = normalizeOrigin(targetOrigin);
  const isCanonical = isCanonicalOrigin(targetOrigin);
  const isProduction = isProductionOrigin(targetOrigin);
  const isLocal = isLocalOrigin(normalized);

  return Object.freeze({
    isValid: isCanonical,
    origin: normalized,
    isCanonical,
    isOfficial: isCanonical,
    isProduction,
    isLocal,
    officialOrigin: CANONICAL_PRODUCTION_ORIGIN,
    warningMessage: isCanonical ? null : SECURITY_ALERT_MESSAGE,
  });
}
