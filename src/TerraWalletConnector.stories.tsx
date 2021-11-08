import React from "react";
import { Story, Meta } from "@storybook/react";
import { TerraWalletConnector, Props } from "./TerraWalletConnector";
import { ChakraProvider } from "@chakra-ui/react";

export default {
  component: TerraWalletConnector,
  title: "TerraWalletConnector",
} as Meta;

const Template: Story<Props> = (args, { argTypes }) => (
  <ChakraProvider>
    <div className="App">
      <TerraWalletConnector
        networkType={args.networkType}
        onChange={args.onChange}
      />
    </div>
  </ChakraProvider>
);

export const Main = Template.bind({});
Main.args = {};
