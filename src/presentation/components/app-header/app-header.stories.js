import "./app-header.component.js";
import "../../styles/app-shell.css";

/** @type { import('@storybook/html-vite').Meta } */
export default {
  title: "Components/AppHeader",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          'Componente global `<app-header>` construído sobre `@modnes/custom-element`. Exibe a identidade da marca, atalho institucional para `/sobre` (`RN07`) e o botão destacado **"Instalar"** (`RN06`) exclusivamente quando o PWA for elegível para instalação.',
      },
    },
  },
  argTypes: {
    titleText: {
      control: { type: "text" },
      description: "Título principal da aplicação.",
      table: { defaultValue: { summary: "Manda um PIX" } },
    },
    subtitleText: {
      control: { type: "text" },
      description: "Subtítulo / slogan explicativo.",
      table: { defaultValue: { summary: "Cobrança rápida via PIX" } },
    },
    logoSrc: {
      control: { type: "text" },
      description: "Caminho do arquivo de imagem do logotipo.",
      table: { defaultValue: { summary: "./src/assets/icons/icon.svg" } },
    },
    aboutHref: {
      control: { type: "text" },
      description: "Destino da navegação do link institucional 'Sobre'.",
      table: { defaultValue: { summary: "/sobre" } },
    },
    showInstallButton: {
      control: { type: "boolean" },
      description:
        "Define se o botão destacado 'Instalar' deve ser exibido (`RN06`).",
      table: { defaultValue: { summary: "false" } },
    },
  },
  args: {
    titleText: "Manda um PIX",
    subtitleText: "Cobrança rápida via PIX",
    logoSrc: "./src/assets/icons/icon.svg",
    aboutHref: "/sobre",
    showInstallButton: false,
  },
  render: ({
    titleText,
    subtitleText,
    logoSrc,
    aboutHref,
    showInstallButton,
  }) => {
    const header = document.createElement("app-header");
    header.setAttribute("title-text", titleText);
    header.setAttribute("subtitle-text", subtitleText);
    header.setAttribute("logo-src", logoSrc);
    header.setAttribute("about-href", aboutHref);

    if (showInstallButton) {
      header.setAttribute("show-install-button", "true");
    } else {
      header.removeAttribute("show-install-button");
    }

    return header;
  },
};

/**
 * Estado padrão quando o aplicativo ainda não foi instalado e o navegador
 * disponibilizou o prompt nativo (`beforeinstallprompt`).
 * Exibe o botão destacado em verde (`#00d37f`) com o ícone de download.
 */
export const AvailableForInstall = {
  name: "Disponível para Instalação (RN06)",
  args: {
    showInstallButton: true,
  },
};

/**
 * Estado quando o aplicativo já está em execução no modo instalado (`standalone`)
 * ou após o usuário ter concluído a instalação com sucesso.
 * O botão "Instalar" é completamente ocultado da interface.
 */
export const AlreadyInstalled = {
  name: "Já Instalado / Standalone",
  args: {
    showInstallButton: false,
  },
};

/**
 * Estado em navegadores ou contextos onde o prompt PWA não está disponível
 * (ex.: Safari no iOS sem Web App Manifest nativo ou prompt dispensado pelo usuário).
 */
export const UnsupportedOrDismissed = {
  name: "Sem Suporte PWA / Prompt Oculto",
  args: {
    showInstallButton: false,
  },
};

/**
 * Demonstração interativa simulando o ciclo de vida real com um mock de Use Case.
 * Ao clicar em "Instalar", o mock simula o diálogo nativo e oculta o botão automaticamente.
 */
export const InteractiveLifecycle = {
  name: "Simulação Interativa de Instalação",
  render: () => {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "1rem";

    const header = document.createElement("app-header");

    const feedback = document.createElement("p");
    feedback.style.padding = "0.75rem 1rem";
    feedback.style.margin = "0 1rem";
    feedback.style.fontSize = "0.875rem";
    feedback.style.borderRadius = "var(--radius-md, 8px)";
    feedback.style.backgroundColor = "var(--color-surface, #ffffff)";
    feedback.style.border = "1px solid var(--color-border, #e2e8f0)";
    feedback.textContent =
      "Clique no botão 'Instalar' no cabeçalho acima para testar o acionamento do caso de uso.";

    const mockUseCase = {
      async getInstallState() {
        return {
          isInstalled: false,
          canInstall: true,
          shouldShowInstallButton: true,
        };
      },
      async triggerInstall() {
        feedback.textContent =
          "⏳ Prompt nativo disparado! Simulando confirmação pelo usuário...";
        await new Promise((resolve) => setTimeout(resolve, 600));

        feedback.textContent =
          "✅ Aplicativo instalado com sucesso! O botão 'Instalar' foi ocultado.";
        feedback.style.color = "var(--color-brand-accent, #00d37f)";
        feedback.style.borderColor = "var(--color-brand-accent, #00d37f)";

        return {
          outcome: "accepted",
          accepted: true,
          isInstalled: true,
          canInstall: false,
          shouldShowInstallButton: false,
        };
      },
      subscribe(listener) {
        listener({
          isInstalled: false,
          canInstall: true,
          shouldShowInstallButton: true,
        });
        return () => {};
      },
    };

    header.installPwaUseCase = mockUseCase;

    container.appendChild(header);
    container.appendChild(feedback);

    return container;
  },
};
