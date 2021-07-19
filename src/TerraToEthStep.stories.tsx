import React from "react";
import { Story, Meta } from "@storybook/react";
import { WalletConnector } from "./WalletConnector";
import { TerraToEthStep, StepProps } from "./TerraToEthStep";
import { ChakraProvider } from "@chakra-ui/react";

export default {
  component: TerraToEthStep,
  title: "TerraToEthStep",
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

export const Primary = Template.bind({});
Primary.args = {};
