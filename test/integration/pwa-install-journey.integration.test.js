import { afterEach, describe, expect, it, vi } from "vitest";
import { flushMicrotasks, mountTestApp } from "./helpers/setup-app.js";

/**
 * Cria evento mock do tipo beforeinstallprompt para teste de integração PWA.
 *
 * @param {Object} [options={}]
 * @param {"accepted"|"dismissed"} [options.outcome="accepted"]
 * @returns {Event}
 */
function createMockBeforeInstallPrompt({ outcome = "accepted" } = {}) {
  const event = new Event("beforeinstallprompt", {
    bubbles: true,
    cancelable: true,
  });

  let defaultPrevented = false;
  event.preventDefault = vi.fn(() => {
    defaultPrevented = true;
  });

  Object.defineProperty(event, "defaultPrevented", {
    get: () => defaultPrevented,
  });

  event.prompt = vi.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({
    outcome,
    platform: "web",
  });

  return event;
}

describe("Jornada de Instalação PWA (TASK-07.2.5 — RN06)", () => {
  let context = null;

  afterEach(() => {
    if (context) {
      context.cleanup();
      context = null;
    }
  });

  it("deve conduzir a jornada completa de instalação: oculto -> beforeinstallprompt -> botão visível -> clique instala e executa prompt() -> botão ocultado", async () => {
    context = await mountTestApp({
      initialPath: "/",
    });

    const { headerElement } = context;
    const installBtn = headerElement.querySelector(".app-header__install-btn");
    expect(installBtn).not.toBeNull();

    // 1. Inicialmente em navegador comum sem evento de instalação: Botão Oculto
    expect(installBtn.classList.contains("hidden")).toBe(true);

    // 2. Sistema operacional / Navegador emite beforeinstallprompt
    const promptEvent = createMockBeforeInstallPrompt({ outcome: "accepted" });
    window.dispatchEvent(promptEvent);
    await flushMicrotasks(50);

    // preventDefault deve ter sido chamado para captura do prompt
    expect(promptEvent.preventDefault).toHaveBeenCalled();

    // Botão de instalação torna-se visível
    expect(installBtn.classList.contains("hidden")).toBe(false);

    // 3. Usuário clica no botão "Instalar"
    installBtn.click();
    await flushMicrotasks(50);

    // O método prompt() do evento deve ter sido invocado
    expect(promptEvent.prompt).toHaveBeenCalledTimes(1);

    // Como o prompt foi aceito, o botão é ocultado imediatamente
    expect(installBtn.classList.contains("hidden")).toBe(true);
  });

  it("deve tratar dispensa do prompt nativo (dismissed) e reexibir botão se novo beforeinstallprompt for emitido", async () => {
    context = await mountTestApp({
      initialPath: "/",
    });

    const { headerElement } = context;
    const installBtn = headerElement.querySelector(".app-header__install-btn");

    const promptEvent = createMockBeforeInstallPrompt({ outcome: "dismissed" });
    window.dispatchEvent(promptEvent);
    await flushMicrotasks(50);

    expect(installBtn.classList.contains("hidden")).toBe(false);

    // Usuário clica no botão, mas recusa no modal nativo
    installBtn.click();
    await flushMicrotasks(50);

    expect(promptEvent.prompt).toHaveBeenCalledTimes(1);

    // O prompt consumido oculta o botão temporariamente
    expect(installBtn.classList.contains("hidden")).toBe(true);

    // Quando o navegador/sistema emite novo evento beforeinstallprompt futuramente
    const secondPromptEvent = createMockBeforeInstallPrompt({
      outcome: "accepted",
    });
    window.dispatchEvent(secondPromptEvent);
    await flushMicrotasks(50);

    // O botão torna-se visível novamente
    expect(installBtn.classList.contains("hidden")).toBe(false);
  });

  it("deve ocultar o botão de instalação se o evento appinstalled for emitido externamente", async () => {
    context = await mountTestApp({
      initialPath: "/",
    });

    const { headerElement } = context;
    const installBtn = headerElement.querySelector(".app-header__install-btn");

    const promptEvent = createMockBeforeInstallPrompt({ outcome: "accepted" });
    window.dispatchEvent(promptEvent);
    await flushMicrotasks(50);

    expect(installBtn.classList.contains("hidden")).toBe(false);

    // Simula emissão do evento appinstalled pelo navegador
    window.dispatchEvent(new Event("appinstalled"));
    await flushMicrotasks(50);

    // Botão deve ser ocultado
    expect(installBtn.classList.contains("hidden")).toBe(true);
  });

  it("não deve exibir o botão de instalação quando carregado diretamente em modo standalone", async () => {
    context = await mountTestApp({
      initialPath: "/",
      isStandalone: true,
    });

    const { headerElement } = context;
    const installBtn = headerElement.querySelector(".app-header__install-btn");

    expect(installBtn.classList.contains("hidden")).toBe(true);

    // Mesmo se beforeinstallprompt disparar, o modo standalone prevalece
    const promptEvent = createMockBeforeInstallPrompt({ outcome: "accepted" });
    window.dispatchEvent(promptEvent);
    await flushMicrotasks(50);

    expect(installBtn.classList.contains("hidden")).toBe(true);
  });
});
