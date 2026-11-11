(map => {
  const mapUrl = document.currentScript.src;
  const resolve = imports => Object.fromEntries(Object.entries(imports ).map(([k, v]) => [k, new URL(v, mapUrl).href]));
  document.head.appendChild(Object.assign(document.createElement("script"), {
    type: "importmap",
    innerHTML: JSON.stringify({
      imports: resolve(map.imports),
      scopes: Object.fromEntries(Object.entries(map.scopes).map(([k, v]) => [new URL(k, mapUrl).href, resolve(v)]))
    })
  }));
})
({
  "imports": {
    "mandaumpix.app": "./src/main.js"
  },
  "scopes": {
    "./": {
      "@modnes/access-controller": "https://ga.jspm.io/npm:@modnes/access-controller@1.0.0/access-controller.js",
      "@modnes/custom-element": "https://ga.jspm.io/npm:@modnes/custom-element@1.1.0/custom-element.js",
      "@modnes/data-controller": "https://ga.jspm.io/npm:@modnes/data-controller@1.1.3/data-controller.js",
      "@modnes/router": "https://ga.jspm.io/npm:@modnes/router@1.1.1/router.js",
      "pix-utils": "https://ga.jspm.io/npm:pix-utils@2.8.2/dist/module/index.js",
      "qr": "https://ga.jspm.io/npm:qr@0.7.2/index.js",
      "qr/dom.js": "https://ga.jspm.io/npm:qr@0.7.2/dom.js"
    },
    "https://ga.jspm.io/npm:axios@1.21.0/": {
      "#lib/adapters/http.js": "https://ga.jspm.io/npm:axios@1.21.0/lib/helpers/null.js",
      "#lib/platform/node/classes/Buffer.js": "https://ga.jspm.io/npm:axios@1.21.0/lib/helpers/null.js",
      "#lib/platform/node/classes/FormData.js": "https://ga.jspm.io/npm:axios@1.21.0/lib/helpers/null.js",
      "#lib/platform/node/index.js": "https://ga.jspm.io/npm:axios@1.21.0/lib/platform/browser/index.js"
    },
    "https://ga.jspm.io/npm:fast-text-encoding@1.0.6/": {
      "buffer": "https://ga.jspm.io/npm:@jspm/core@2.1.0/nodelibs/browser/buffer.js"
    },
    "https://ga.jspm.io/npm:pix-utils@2.8.2/": {
      "axios": "https://ga.jspm.io/npm:axios@1.21.0/index.js",
      "buffer": "https://ga.jspm.io/npm:@jspm/core@2.1.0/nodelibs/browser/buffer.js",
      "fast-text-encoding": "https://ga.jspm.io/npm:fast-text-encoding@1.0.6/text.min.js",
      "qrcode": "https://ga.jspm.io/npm:qrcode@1.5.4/lib/browser.js"
    },
    "https://ga.jspm.io/npm:qrcode@1.5.4/": {
      "dijkstrajs": "https://ga.jspm.io/npm:dijkstrajs@1.0.3/dijkstra.js"
    }
  }
});
