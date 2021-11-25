import React from "react";
import { Story, Meta } from "@storybook/react";
import { WalletConnector } from "./WalletConnector";
import { ChakraProvider } from "@chakra-ui/react";

export default {
  component: WalletConnector,
  title: "WalletConnector",
} as Meta;

const Template: Story<{}> = (args, { argTypes }) => (
  <ChakraProvider>
    <div className="App">
      <WalletConnector>
        <div>Test</div>
      </WalletConnector>
    </div>
  </ChakraProvider>
);

export const Main = Template.bind({});
Main.args = {
  networkType: "testnet",
};
