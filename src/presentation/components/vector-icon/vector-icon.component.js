import CustomElement from "@modnes/custom-element";
import { vectorIconTemplate } from "./vector-icon.template.js";

export const DEFAULT_SPRITE_PATH =
  "/src/presentation/components/vector-icon/icon.svg";

export const AVAILABLE_ICONS = Object.freeze([
  "qrcode",
  "copy",
  "share",
  "download",
  "check",
  "xmark",
  "plus",
  "trash",
  "key",
  "home",
  "gear",
  "eye",
  "circle-info",
  "circle-exclamation",
  "triangle-exclamation",
  "spinner",
]);

class VectorIcon extends CustomElement {
  name = "";
  spritePath = DEFAULT_SPRITE_PATH;

  static observedAttributes = ["name", "sprite-path"];

  constructor() {
    super();
    this.template = () => vectorIconTemplate(this);
  }

  connectedCallback() {
    this.name = this.getAttribute("name") || "";
    this.spritePath = this.getAttribute("sprite-path") || DEFAULT_SPRITE_PATH;

    this.render();
  }

  attributeChangedCallback(attributeName, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }

    if (attributeName === "name") {
      this.name = newValue || "";
      this.render();
    } else if (attributeName === "sprite-path") {
      this.spritePath = newValue || DEFAULT_SPRITE_PATH;
      this.render();
    }
  }
}

if (!customElements.get("vector-icon")) {
  customElements.define("vector-icon", VectorIcon);
}

export default VectorIcon;
