import React from "react";
import { Story, Meta } from "@storybook/react";
import { WalletConnectWalletProvider } from "./WalletConnectWalletProvider";
import { ChakraProvider } from "@chakra-ui/react";
import { EthProviderProps } from "./EtherumWalletBase";

export default {
  component: WalletConnectWalletProvider,
  title: "Wallet/WalletConnectWalletProvider",
} as Meta;

const Template: Story<EthProviderProps> = (args, { argTypes }) => (
  <ChakraProvider>
    <div className="App">
      <WalletConnectWalletProvider
        networkType={args.networkType}
        onChange={args.onChange}
      />
    </div>
  </ChakraProvider>
);

export const Main = Template.bind({});
Main.args = {};
