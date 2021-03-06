const path = require("path");
const toPath = (_path) => path.join(process.cwd(), _path);
const cracoConfig = require('../craco.config');

module.exports = {
  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/preset-create-react-app",
  ],
  reactOptions: {
    // strictMode: true,
  },
  // From https://github.com/storybookjs/storybook/issues/7540
  webpackFinal: async (config) => {

    // Wasm support
    config = cracoConfig.webpack.configure(config);

    return {
      ...config,

      // Workaround for fs not found module errors on @certusone/wormhole-sdk
      node: {
        fs: 'empty',
      },

      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve.alias,
          "@emotion/styled": toPath("node_modules/@emotion/styled"),
        },
      },
    };
  },
};
