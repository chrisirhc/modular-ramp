import React from "react";
import { Story, Meta } from "@storybook/react";
import { WalletConnector } from "../WalletConnector";
import { StepProps } from "../types";
import { Eth1inchStep } from "./Eth1inchStep";
import { ChakraProvider } from "@chakra-ui/react";

export default {
  component: Eth1inchStep,
  title: "Step/Eth1inchStep",
} as Meta;

const Template: Story<StepProps> = (args, { argTypes }) => (
  <ChakraProvider>
    <div className="App">
      <WalletConnector>
        <Eth1inchStep {...args} />
      </WalletConnector>
    </div>
  </ChakraProvider>
);

export const Main = Template.bind({});
Main.args = {};
