import React from "react";
import { Story, Meta } from "@storybook/react";
import { WalletConnector } from "../WalletConnector";
import { StepProps } from "../types";
import {
  TerraToEthStep,
  TerraToEthStepRender,
  TerraToEthStepRenderProps,
} from "./TerraToEthStep";
import { ChakraProvider } from "@chakra-ui/react";

export default {
  component: TerraToEthStep,
  title: "TerraToEthStep",
  argTypes: { onAmountChanged: { action: "clicked" } },
} as Meta;

const Template: Story<StepProps> = (args, { argTypes }) => (
  <ChakraProvider>
    <div className="App">
      <WalletConnector>
        <TerraToEthStep {...args} />
      </WalletConnector>
    </div>
  </ChakraProvider>
);

export const Main = Template.bind({});
Main.args = {};

const RenderTemplate: Story<TerraToEthStepRenderProps> = (
  args,
  { argTypes }
) => (
  <ChakraProvider>
    <div className="App">
      <TerraToEthStepRender {...args} />
    </div>
  </ChakraProvider>
);

export const WithStatus = RenderTemplate.bind({});
WithStatus.args = {
  amount: "100",
  status: "Success",
};
