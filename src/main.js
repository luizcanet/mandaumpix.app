export const APP_METADATA = Object.freeze({
  name: "Manda um PIX",
  packageName: "mandaumpix.app",
  version: "1.0.0",
});

export function bootstrapApp(rootElement = document.querySelector("#app")) {
  if (!rootElement) {
    return null;
  }

  rootElement.dataset.initialized = "true";
  return rootElement;
}

if (typeof document !== "undefined") {
  bootstrapApp();
}

