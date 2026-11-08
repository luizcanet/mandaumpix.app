import { describe, expect, it, vi } from "vitest";
import Router from "@modnes/router";
import {
  APP_ROUTES,
  ROUTE_TITLES,
  initAppRouter,
  resolveRouteTitle,
  setupNavigationInterception,
  setupRouteAccessibility,
} from "./app-router.js";

describe("app-router.js", () => {
  describe("APP_ROUTES", () => {
    it("should be frozen and define canonical routes", () => {
      expect(Object.isFrozen(APP_ROUTES)).toBe(true);
      expect(APP_ROUTES).toHaveLength(3);
      expect(APP_ROUTES[0]).toEqual({
        path: "/",
        tagName: "div",
        classes: ["charge-page", "charge-page--split"],
      });
      expect(APP_ROUTES[1]).toEqual({
        path: "/sobre",
        tagName: "about-page",
        classes: ["about-page"],
      });
      expect(APP_ROUTES[2]).toEqual({
        path: "/*",
        tagName: "div",
        classes: ["charge-page", "charge-page--split"],
      });
    });
  });

  describe("ROUTE_TITLES & resolveRouteTitle", () => {
    it("should be frozen and define route titles", () => {
      expect(Object.isFrozen(ROUTE_TITLES)).toBe(true);
      expect(ROUTE_TITLES["/"]).toBe("Manda um PIX — Cobrança rápida");
      expect(ROUTE_TITLES["/sobre"]).toBe("Sobre o aplicativo — Manda um PIX");
    });

    it("should resolve correct titles for different paths", () => {
      expect(resolveRouteTitle("/")).toBe("Manda um PIX — Cobrança rápida");
      expect(resolveRouteTitle("/sobre")).toBe(
        "Sobre o aplicativo — Manda um PIX",
      );
      expect(resolveRouteTitle("/desconhecido")).toBe(
        "Manda um PIX — Cobrança rápida",
      );
      expect(resolveRouteTitle()).toBe("Manda um PIX — Cobrança rápida");
    });
  });

  describe("initAppRouter", () => {
    it("should return null if outlet element is not provided", () => {
      expect(initAppRouter(null)).toBeNull();
    });

    it("should initialize router and set tabindex=-1 on outlet", () => {
      const outlet = document.createElement("div");
      outlet.id = "router-outlet";
      const placeholder = document.createElement("span");
      outlet.appendChild(placeholder);

      const router = initAppRouter(outlet, APP_ROUTES);

      expect(router).toBeInstanceOf(Router);
      expect(outlet.getAttribute("tabindex")).toBe("-1");
      expect(outlet.contains(placeholder)).toBe(false);
    });
  });

  describe("setupNavigationInterception", () => {
    it("should return null if rootElement is not provided", () => {
      expect(setupNavigationInterception(null)).toBeNull();
    });

    it("should intercept clicks on internal links and call Router.goTo", () => {
      const root = document.createElement("div");
      const anchor = document.createElement("a");
      anchor.href = "/sobre";
      root.appendChild(anchor);
      document.body.appendChild(root);

      const goToSpy = vi.spyOn(Router, "goTo").mockImplementation(() => {});
      const cleanup = setupNavigationInterception(root);

      const event = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
      });
      anchor.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
      expect(goToSpy).toHaveBeenCalledWith("/sobre");

      goToSpy.mockRestore();
      cleanup();
      root.remove();
    });

    it("should intercept click on brand element and navigate to /", () => {
      const root = document.createElement("div");
      const brand = document.createElement("div");
      brand.className = "app-header__brand";
      root.appendChild(brand);
      document.body.appendChild(root);

      const goToSpy = vi.spyOn(Router, "goTo").mockImplementation(() => {});
      const cleanup = setupNavigationInterception(root);

      const event = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
      });
      brand.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
      expect(goToSpy).toHaveBeenCalledWith("/");

      goToSpy.mockRestore();
      cleanup();
      root.remove();
    });

    it("should intercept Enter or Space keydown on brand element", () => {
      const root = document.createElement("div");
      const brand = document.createElement("div");
      brand.className = "app-header__brand";
      root.appendChild(brand);
      document.body.appendChild(root);

      const goToSpy = vi.spyOn(Router, "goTo").mockImplementation(() => {});
      const cleanup = setupNavigationInterception(root);

      const event = new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      });
      brand.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
      expect(goToSpy).toHaveBeenCalledWith("/");

      goToSpy.mockRestore();
      cleanup();
      root.remove();
    });
  });

  describe("setupRouteAccessibility", () => {
    it("should update document title and focus outlet element", () => {
      const root = document.createElement("div");
      const outlet = document.createElement("div");
      outlet.focus = vi.fn();
      root.appendChild(outlet);

      const customDoc = { title: "" };
      const customWindow = {
        location: { pathname: "/sobre" },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };

      setupRouteAccessibility({
        rootElement: root,
        outletElement: outlet,
        ownerDoc: customDoc,
        windowTarget: customWindow,
      });

      expect(customDoc.title).toBe("Sobre o aplicativo — Manda um PIX");
      expect(outlet.focus).toHaveBeenCalled();
      expect(customWindow.addEventListener).toHaveBeenCalledWith(
        "pathChanged",
        expect.any(Function),
      );
      expect(customWindow.addEventListener).toHaveBeenCalledWith(
        "popstate",
        expect.any(Function),
      );
    });
  });
});
