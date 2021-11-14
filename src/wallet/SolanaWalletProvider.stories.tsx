import React from "react";
import { Story, Meta } from "@storybook/react";
import { SolanaWalletProvider, SolanaWalletKey } from "./SolanaWalletProvider";
import { ChakraProvider } from "@chakra-ui/react";

export default {
  component: SolanaWalletProvider,
  title: "SolanaWalletProvider",
} as Meta;

const Template: Story<{}> = (args, { argTypes }) => (
  <ChakraProvider>
    <div className="App">
      <SolanaWalletProvider>
        <SolanaWalletKey />
      </SolanaWalletProvider>
    </div>
  </ChakraProvider>
);

export const Main = Template.bind({});
Main.args = {};
