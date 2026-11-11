import encodeQR from "qr";
import {
  ABOUT_AUTHOR,
  ABOUT_NAVIGATION,
  ABOUT_PROJECT,
  ABOUT_SECURITY,
  ABOUT_SHARE,
  ABOUT_SUPPORT_PIX,
} from "./about-page.constants.js";

/**
 * Gera o SVG vetorial de alto contraste para o QR Code de apoio voluntário.
 *
 * @returns {string} - Marcação SVG acessível
 */
export function generateSupportQrSvg() {
  try {
    const rawSvg = encodeQR(ABOUT_SUPPORT_PIX.brCode, "svg");
    return rawSvg.replace(
      "<svg ",
      `<svg class="charge-result__qr-svg about-page__qr-svg" role="img" aria-label="${ABOUT_SUPPORT_PIX.qrAriaLabel}" `,
    );
  } catch {
    return `<svg class="charge-result__qr-svg about-page__qr-svg" role="img" aria-label="${ABOUT_SUPPORT_PIX.qrAriaLabel}" viewBox="0 0 100 100"><rect width="100" height="100" fill="#ffffff"/></svg>`;
  }
}

/**
 * Template especializado para o componente de página <about-page>.
 * Renderiza a visualização institucional completa: cabeçalho, autor, licença, apoio PIX e compartilhamento.
 *
 * @param {object} [context={}]
 * @param {string} [context.logoSrc]
 * @param {string} [context.titleText]
 * @param {string} [context.homeHref]
 * @param {string} [context.versionText]
 * @param {boolean} [context.isCopied]
 * @returns {string} HTML markup
 */
export function aboutPageTemplate({
  logoSrc = ABOUT_NAVIGATION.logoSrc,
  titleText = ABOUT_NAVIGATION.title,
  versionText = ABOUT_PROJECT.versionLabel,
  isCopied = false,
} = {}) {
  return `
      <div class="section-header about-page__header">
        <div class="section-header__title-group about-page__title-group">
          <img
            class="about-page__logo"
            src="${logoSrc}"
            alt="Logotipo do Manda um PIX"
            width="32"
            height="32"
          />
          <div>
            <h2 class="section-header__title about-page__title">${titleText}</h2>
            <span class="about-page__version">${versionText}</span>
          </div>
        </div>
        <button
          type="button"
          class="amount-field__preset about-page__home-btn"
          data-action="navigate-home"
          aria-label="Voltar para a página inicial"
        >
          <vector-icon name="home"></vector-icon>
          <span>${ABOUT_NAVIGATION.homeButtonText}</span>
        </button>
      </div>

      <p class="about-page__summary">
        <strong>Manda um PIX</strong> é um aplicativo web progressivo (PWA)
        <strong>gratuito, livre e de código aberto</strong> que facilita a geração de
        cobranças via PIX sem a necessidade de ficar abrindo aplicativos de banco, com
        execução e armazenamento 100% locais no navegador.
      </p>

      <!-- CARD 1: SOBRE O AUTOR -->
      <div class="about-page__box about-page__box--author">
        <div class="about-page__box-label">${ABOUT_AUTHOR.label}</div>
        <div class="about-page__author-name">${ABOUT_AUTHOR.name}</div>
        <div class="about-page__author-links">
          <a
            href="${ABOUT_AUTHOR.emailUrl}"
            class="about-page__link"
            aria-label="E-mail do autor: ${ABOUT_AUTHOR.email}"
          >${ABOUT_AUTHOR.email}</a>
          <span class="about-page__separator" aria-hidden="true">•</span>
          <a
            href="${ABOUT_AUTHOR.githubUrl}"
            class="about-page__link"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub do autor: @${ABOUT_AUTHOR.githubUser}"
          >github.com/${ABOUT_AUTHOR.githubUser}</a>
          <span class="about-page__separator" aria-hidden="true">•</span>
          <a
            href="${ABOUT_AUTHOR.linkedinUrl}"
            class="about-page__link"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn do autor: @${ABOUT_AUTHOR.linkedinUser}"
          >linkedin.com/in/${ABOUT_AUTHOR.linkedinUser}</a>
        </div>
      </div>

      <!-- CARD 2: SOBRE O PROJETO & LICENÇA -->
      <div class="about-page__box about-page__box--project">
        <div class="about-page__box-label">${ABOUT_PROJECT.label}</div>
        <p class="about-page__license-text">
          Distribuído sob a licença <strong>${ABOUT_PROJECT.licenseFull}</strong>.
        </p>
        <div class="about-page__repo-link-wrapper">
          <a
            href="${ABOUT_PROJECT.repositoryUrl}"
            class="about-page__link about-page__link--repo"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Repositório do projeto no GitHub"
          >
            ${ABOUT_PROJECT.repositoryUrl}
          </a>
        </div>
        <div class="about-page__video-link-wrapper">
          <a
            href="${ABOUT_PROJECT.videoUrl}"
            class="about-page__link about-page__link--video"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="${ABOUT_PROJECT.videoAriaLabel}"
          >
            <span aria-hidden="true">🎬</span>
            <span>${ABOUT_PROJECT.videoLabel}</span>
          </a>
        </div>
      </div>

      <!-- CARD 3: AUTENTICIDADE, ZERO-CREDENTIAL E CANAL DE DENÚNCIA (RN08 / RFC 9116) -->
      <div
        class="about-page__box about-page__box--security"
        role="region"
        aria-label="${ABOUT_SECURITY.zeroCredentialTitle}"
      >
        <div class="about-page__box-label">
          <span aria-hidden="true">🛡️</span>
          <span>${ABOUT_SECURITY.zeroCredentialTitle}</span>
        </div>
        <div
          class="about-page__security-badge"
          role="status"
          aria-label="${ABOUT_SECURITY.badgeAriaLabel}"
        >
          <vector-icon name="${ABOUT_SECURITY.securityIcon}" class="about-page__security-badge-icon"></vector-icon>
          <span class="about-page__security-badge-text">${ABOUT_SECURITY.badgeLabel}</span>
        </div>
        <p class="about-page__security-text">
          <strong>Zero-Credential</strong>: ${ABOUT_SECURITY.zeroCredentialNotice}
        </p>
        <p class="about-page__security-notice">
          ${ABOUT_SECURITY.beneficiaryNotice}
        </p>

        <div class="about-page__report-section">
          <div class="about-page__report-header">
            <span class="about-page__report-title">${ABOUT_SECURITY.reportTitle}</span>
          </div>
          <p class="about-page__report-desc">
            ${ABOUT_SECURITY.reportDescription}
          </p>
          <div class="about-page__report-actions">
            <a
              href="${ABOUT_SECURITY.reportMailtoUrl}"
              class="about-page__report-btn"
              data-action="report-fraud"
              aria-label="${ABOUT_SECURITY.reportAriaLabel}"
            >
              <vector-icon name="triangle-exclamation" class="about-page__report-btn-icon"></vector-icon>
              <span>${ABOUT_SECURITY.reportButtonText}</span>
            </a>
            <a
              href="${ABOUT_SECURITY.securityTxtHref}"
              class="about-page__security-txt-link"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Consultar arquivo RFC 9116 security.txt"
            >
              <vector-icon name="circle-info" class="about-page__security-txt-icon"></vector-icon>
              <span>${ABOUT_SECURITY.securityTxtLabel}</span>
            </a>
          </div>
        </div>
      </div>

      <!-- CARD 4: APOIO VOLUNTÁRIO ("MANDA UM PIX") -->
      <div class="about-page__box about-page__box--support">
        <div class="about-page__support-title">${ABOUT_SUPPORT_PIX.title}</div>
        <p class="about-page__support-message">${ABOUT_SUPPORT_PIX.message}</p>

        <div class="charge-result__qr-stage about-page__qr-stage">
          <div class="charge-result__qr-frame">
            ${generateSupportQrSvg()}
          </div>
          <p class="charge-result__meta about-page__meta">
            Chave PIX (Valor Dinâmico): <strong>${ABOUT_SUPPORT_PIX.key}</strong>
            <br />
            Mensagem no PIX: <strong>${ABOUT_SUPPORT_PIX.infoAdicional}</strong>
          </p>
        </div>

        <div class="about-page__brcode-section">
          <div class="charge-result__brcode-label about-page__brcode-label">
            <span>Chave Copia e Cola (${ABOUT_SUPPORT_PIX.key})</span>
            <span class="about-page__dynamic-badge">Valor Dinâmico</span>
          </div>
          <div class="charge-result__brcode about-page__brcode" id="about-support-brcode">
            ${ABOUT_SUPPORT_PIX.brCode}
          </div>
        </div>

        <button
          type="button"
          class="charge-result__btn charge-result__btn--copy about-page__copy-btn"
          data-action="copy-support-brcode"
          aria-label="Copiar Chave Copia e Cola"
        >
          <vector-icon name="${isCopied ? "check" : "copy"}"></vector-icon>
          <span class="about-page__copy-btn-text">
            ${isCopied ? ABOUT_SUPPORT_PIX.copiedButtonText : ABOUT_SUPPORT_PIX.copyButtonText}
          </span>
        </button>
        <div class="about-page__live-region" aria-live="polite" id="about-copy-feedback">
          ${isCopied ? ABOUT_SUPPORT_PIX.copiedFeedbackMessage : ""}
        </div>
      </div>

      <!-- CARD 4: INCENTIVO À DIVULGAÇÃO -->
      <div class="about-page__box about-page__box--share">
        <div class="about-page__share-title">${ABOUT_SHARE.title}</div>
        <p class="about-page__share-message">${ABOUT_SHARE.message}</p>
        <button
          type="button"
          class="charge-result__btn charge-result__btn--share about-page__share-btn"
          data-action="share-app"
          aria-label="Compartilhar e Divulgar o Aplicativo"
        >
          <vector-icon name="share"></vector-icon>
          <span>${ABOUT_SHARE.buttonText}</span>
        </button>
      </div>
    `;
}

export default aboutPageTemplate;
