import "./about-page.component.js";
import "./about-page.css";
import { ABOUT_NAVIGATION, ABOUT_PROJECT } from "./about-page.constants.js";

/** @type { import('@storybook/html-vite').Meta } */
export default {
  title: "Pages/AboutPage",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Página institucional `<about-page>` (`/sobre`) construída sobre `@modnes/custom-element`. Exibe informações sobre o aplicativo (software gratuito, livre e de código aberto), autor (**Luiz Henrique Canet Filho**), projeto (**GNU AGPLv3**), selo de autenticidade canônica e advertência Zero-Credential (`INV-03`, `RN08`), canal de apoio voluntário com QR Code dinâmico e chave copia e cola para `eu@luizca.net`, e ação de incentivo à divulgação.",
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: "color-contrast",
            enabled: true,
          },
          {
            id: "button-name",
            enabled: true,
          },
          {
            id: "target-size",
            enabled: true,
          },
        ],
      },
    },
  },
  argTypes: {
    titleText: {
      control: { type: "text" },
      description: "Título exibido no cabeçalho da página.",
      table: { defaultValue: { summary: ABOUT_NAVIGATION.title } },
    },
    versionText: {
      control: { type: "text" },
      description: "Versão e identificador do pacote.",
      table: { defaultValue: { summary: ABOUT_PROJECT.versionLabel } },
    },
    logoSrc: {
      control: { type: "text" },
      description: "Caminho do arquivo de logotipo exibido na página.",
      table: { defaultValue: { summary: ABOUT_NAVIGATION.logoSrc } },
    },
    homeHref: {
      control: { type: "text" },
      description: "Destino da navegação do botão Início.",
      table: { defaultValue: { summary: ABOUT_NAVIGATION.homeHref } },
    },
  },
  args: {
    titleText: ABOUT_NAVIGATION.title,
    versionText: ABOUT_PROJECT.versionLabel,
    logoSrc: ABOUT_NAVIGATION.logoSrc,
    homeHref: ABOUT_NAVIGATION.homeHref,
  },
  render: ({ titleText, versionText, logoSrc, homeHref }) => {
    const page = document.createElement("about-page");
    page.setAttribute("title-text", titleText);
    page.setAttribute("version-text", versionText);
    page.setAttribute("logo-src", logoSrc);
    page.setAttribute("home-href", homeHref);

    return page;
  },
};

/**
 * Visualização padrão completa da página institucional na rota `/sobre`.
 * Apresenta o cabeçalho, resumo de software livre, autor, licença AGPLv3, apoio voluntário e divulgação.
 */
export const Default = {
  name: "Padrão (/sobre)",
};

/**
 * Visualização focada no card de apoio voluntário ("Manda um PIX") para eu@luizca.net.
 */
export const SupportSectionHighlight = {
  name: "Seção de Apoio Voluntário (eu@luizca.net)",
  play: async ({ canvasElement }) => {
    const copyBtn = canvasElement.querySelector(
      '[data-action="copy-support-brcode"]',
    );
    if (copyBtn) {
      copyBtn.focus();
    }
  },
};

/**
 * Visualização demonstrando customização de versão e título através de atributos observados.
 */
export const CustomVersionAndBrand = {
  name: "Versão e Título Customizados",
  args: {
    titleText: "Sobre o Manda um PIX — Preview",
    versionText: "mandaumpix.app • v1.1.0-beta",
  },
};

/**
 * Visualização focada no Card de Segurança e Selo de Origem Oficial (INV-03, RN08, TASK-08.2.3, TASK-08.2.4).
 * Destaca o badge de autenticidade verificado e a advertência da arquitetura Zero-Credential.
 */
export const AuthenticityBadgeAndSecurity = {
  name: "Selo de Origem Oficial & Aviso Zero-Credential (INV-03, RN08)",
  play: async ({ canvasElement }) => {
    const securityBox = canvasElement.querySelector(
      ".about-page__box--security",
    );
    if (securityBox) {
      securityBox.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  },
};
