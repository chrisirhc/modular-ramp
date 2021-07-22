import React from "react";
import { Story, Meta } from "@storybook/react";
import { WalletConnector } from "../WalletConnector";
import { StepProps } from "../types";
import { EthToTerraStep } from "./EthToTerraStep";
import { ChakraProvider } from "@chakra-ui/react";

export default {
  component: EthToTerraStep,
  title: "EthToTerraStep",
} as Meta;

const Template: Story<StepProps> = (args, { argTypes }) => (
  <ChakraProvider>
    <div className="App">
      <WalletConnector>
        <EthToTerraStep {...args} />
      </WalletConnector>
    </div>
  </ChakraProvider>
);

export const Main = Template.bind({});
Main.args = {};
