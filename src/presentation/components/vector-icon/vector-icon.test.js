import { describe, expect, it } from "vitest";
import VectorIcon, {
  DEFAULT_SPRITE_PATH,
} from "./vector-icon.component.js";

describe("VectorIcon Web Component", () => {
  it("registers the <vector-icon> custom element", () => {
    expect(customElements.get("vector-icon")).toBe(VectorIcon);
  });

  it("renders an SVG <use> referencing the sprite symbol when connected", () => {
    const element = document.createElement("vector-icon");
    element.setAttribute("name", "check");
    document.body.appendChild(element);

    const svg = element.querySelector("svg.icon");
    const use = element.querySelector("use");

    expect(svg).not.toBeNull();
    expect(use).not.toBeNull();
    expect(use.getAttribute("href")).toBe(`${DEFAULT_SPRITE_PATH}#check`);
    expect(use.getAttribute("xlink:href")).toBe(`${DEFAULT_SPRITE_PATH}#check`);

    element.remove();
  });

  it("updates the rendered symbol reactively when the name attribute changes", () => {
    const element = document.createElement("vector-icon");
    element.setAttribute("name", "copy");
    document.body.appendChild(element);

    expect(element.querySelector("use").getAttribute("href")).toBe(
      `${DEFAULT_SPRITE_PATH}#copy`,
    );

    element.setAttribute("name", "download");

    expect(element.name).toBe("download");
    expect(element.querySelector("use").getAttribute("href")).toBe(
      `${DEFAULT_SPRITE_PATH}#download`,
    );

    element.remove();
  });

  it("supports a custom sprite-path attribute when provided", () => {
    const element = document.createElement("vector-icon");
    element.setAttribute("sprite-path", "/custom/icons.svg");
    element.setAttribute("name", "home");
    document.body.appendChild(element);

    const use = element.querySelector("use");
    expect(use.getAttribute("href")).toBe("/custom/icons.svg#home");

    element.remove();
  });
});

