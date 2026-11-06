/** @type { import('@storybook/html-vite').StorybookConfig } */
const config = {
  stories: ["../src/**/*.stories.@(js|mjs)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/html-vite",
    options: {},
  },
  core: {
    disableTelemetry: true,
  },
  staticDirs: [
    {
      from: "../src/assets",
      to: "/src/assets",
    },
  ],
  docs: {
    autodocs: "tag",
  },
  async viteFinal(viteConfig) {
    viteConfig.server ??= {};
    viteConfig.server.allowedHosts = true;
    return viteConfig;
  },
};

export default config;
