import {
  CANONICAL_PRODUCTION_ORIGIN,
  OFFICIAL_DOMAIN,
  SECURITY_ALERT_MESSAGE,
} from "../../../domain/security/origin-validator.js";

/**
 * Constantes e metadados do Web Component <security-banner> (US-08.2 / INV-02 / TASK-08.2.2).
 */

/**
 * Mensagem de alerta padrão para exibição em origens não autorizadas.
 */
export const DEFAULT_SECURITY_BANNER_MESSAGE = SECURITY_ALERT_MESSAGE;

/**
 * URL do endereço oficial de produção para redirecionamento seguro.
 */
export const DEFAULT_SECURITY_BANNER_OFFICIAL_URL = CANONICAL_PRODUCTION_ORIGIN;

/**
 * Domínio oficial canônico.
 */
export const DEFAULT_SECURITY_BANNER_OFFICIAL_DOMAIN = OFFICIAL_DOMAIN;

/**
 * Rótulo padrão da ação de redirecionamento para o site oficial.
 */
export const DEFAULT_SECURITY_BANNER_LINK_LABEL =
  "Acesse com segurança em mandaumpix.app";

/**
 * Rótulo acessível padrão para o botão de fechar/dispensar o alerta.
 */
export const DEFAULT_SECURITY_BANNER_DISMISS_LABEL =
  "Fechar alerta de segurança";

/**
 * Rótulo acessível da região de alerta de segurança.
 */
export const DEFAULT_SECURITY_BANNER_ARIA_LABEL =
  "Alerta de autenticidade de origem";

/**
 * Título em destaque do banner de perigo.
 */
export const DEFAULT_SECURITY_BANNER_TITLE = "Atenção: Endereço Não Oficial";

/**
 * Nomes de classes CSS e seletores seguindo a metodologia BEM (INV-02).
 */
export const SECURITY_BANNER_CLASSES = Object.freeze({
  BLOCK: "security-warning-banner",
  HOST_TAG: "security-banner",
  WRAPPER: "security-warning-banner__wrapper",
  ICON: "security-warning-banner__icon",
  CONTENT: "security-warning-banner__content",
  TITLE: "security-warning-banner__title",
  MESSAGE: "security-warning-banner__message",
  LINK: "security-warning-banner__link",
  ACTIONS: "security-warning-banner__actions",
  DISMISS_BTN: "security-warning-banner__dismiss",
  MODIFIER_HIDDEN: "security-warning-banner--hidden",
  MODIFIER_VISIBLE: "security-warning-banner--visible",
});

/**
 * Ícones vetoriais consumidos pelo componente de banner de segurança.
 */
export const SECURITY_BANNER_ICONS = Object.freeze({
  WARNING: "triangle-exclamation",
  DISMISS: "xmark",
});

/**
 * Eventos customizados emitidos pelo componente <security-banner>.
 */
export const SECURITY_BANNER_EVENTS = Object.freeze({
  DISMISS: "security-banner-dismiss",
  ORIGIN_CHECKED: "security-banner-origin-checked",
});
