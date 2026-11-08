import { afterEach, describe, expect, it } from "vitest";
import {
  SAMPLE_PIX_KEYS,
  createInMemoryIndexedDb,
  flushMicrotasks,
  mountTestApp,
} from "./setup-app.js";

describe("setup-app.js (TASK-07.2.1: Integration Test Harness)", () => {
  let context = null;

  afterEach(() => {
    if (context) {
      context.cleanup();
      context = null;
    }
  });

  it("deve exportar SAMPLE_PIX_KEYS congelado com dados válidos", () => {
    expect(Object.isFrozen(SAMPLE_PIX_KEYS)).toBe(true);
    expect(SAMPLE_PIX_KEYS.CPF.tipo_chave).toBe("CPF");
    expect(SAMPLE_PIX_KEYS.EMAIL.tipo_chave).toBe("EMAIL");
    expect(SAMPLE_PIX_KEYS.EVP.tipo_chave).toBe("EVP");
  });

  it("deve criar e inicializar inMemoryIndexedDb sem erros", async () => {
    const memoryIdb = createInMemoryIndexedDb();
    expect(memoryIdb).toBeDefined();
    expect(typeof memoryIdb.open).toBe("function");

    const req = memoryIdb.open("test-db", 1);
    await new Promise((resolve) => {
      req.onsuccess = () => resolve();
    });
    expect(req.result).toBeDefined();
    expect(req.result.name).toBe("test-db");
  });

  it("deve montar a aplicação no primeiro acesso (sem chaves) exibindo pix-key-empty", async () => {
    context = await mountTestApp({
      initialPath: "/",
      initialKeys: [],
    });

    expect(context.rootElement).toBeDefined();
    expect(context.headerElement).toBeDefined();
    expect(context.outletElement).toBeDefined();
    expect(context.dialogElement).toBeDefined();

    // No primeiro acesso sem chaves, pix-key-empty deve estar visível e pix-key-selector oculto
    expect(context.emptyElement).not.toBeNull();
    expect(context.emptyElement.classList.contains("hidden")).toBe(false);

    expect(context.selectorElement).not.toBeNull();
    expect(context.selectorElement.classList.contains("hidden")).toBe(true);

    // Formulário de cobrança e resultado montados
    expect(context.formElement).not.toBeNull();
    expect(context.resultElement).not.toBeNull();
  });

  it("deve montar a aplicação com chaves pré-existentes exibindo pix-key-selector", async () => {
    context = await mountTestApp({
      initialPath: "/",
      initialKeys: [SAMPLE_PIX_KEYS.CPF],
    });

    await flushMicrotasks(50);

    expect(context.emptyElement.classList.contains("hidden")).toBe(true);
    expect(context.selectorElement.classList.contains("hidden")).toBe(false);
  });

  it("deve configurar mocks de clipboard, share, URL e window.open verificáveis", async () => {
    context = await mountTestApp();

    await navigator.clipboard.writeText("PIX-CODE-TEST");
    expect(context.mocks.clipboard.writeText).toHaveBeenCalledWith(
      "PIX-CODE-TEST",
    );
    expect(context.mocks.clipboard.text).toBe("PIX-CODE-TEST");

    const read = await navigator.clipboard.readText();
    expect(read).toBe("PIX-CODE-TEST");

    await navigator.share({ title: "Test", text: "Pix" });
    expect(context.mocks.share).toHaveBeenCalledWith({
      title: "Test",
      text: "Pix",
    });

    const blobUrl = URL.createObjectURL(new Blob(["content"]));
    expect(blobUrl).toContain("blob:");
    expect(context.mocks.createObjectURL).toHaveBeenCalled();

    URL.revokeObjectURL(blobUrl);
    expect(context.mocks.revokeObjectURL).toHaveBeenCalledWith(blobUrl);

    window.open("https://wa.me/test", "_blank");
    expect(context.mocks.windowOpen).toHaveBeenCalledWith(
      "https://wa.me/test",
      "_blank",
    );
  });

  it("deve limpar o DOM e restaurar estado após cleanup()", async () => {
    context = await mountTestApp({
      initialPath: "/sobre",
    });

    expect(document.body.querySelector("#app")).not.toBeNull();
    context.cleanup();

    expect(document.body.querySelector("#app")).toBeNull();
    expect(window.location.pathname).toBe("/");
    context = null;
  });
});
