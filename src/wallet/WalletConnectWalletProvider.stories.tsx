import React from "react";
import { Story, Meta } from "@storybook/react";
import { WalletConnectWalletProvider } from "./WalletConnectWalletProvider";
import { ChakraProvider } from "@chakra-ui/react";

export default {
  component: WalletConnectWalletProvider,
  title: "WalletConnectWalletProvider",
} as Meta;

const Template: Story<{}> = (args, { argTypes }) => (
  <ChakraProvider>
    <div className="App">
      <WalletConnectWalletProvider />
    </div>
  </ChakraProvider>
);

export const Main = Template.bind({});
Main.args = {};
