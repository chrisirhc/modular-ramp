import React from "react";
import { Story, Meta } from "@storybook/react";
import { WalletConnector } from "../WalletConnector";
import { StepProps } from "../types";
import { Anchor } from "./Anchor";
import { ChakraProvider } from "@chakra-ui/react";

export default {
  component: Anchor,
  title: "Anchor",
} as Meta;

const Template: Story<{}> = (args, { argTypes }) => (
  <ChakraProvider>
    <div className="App">
      <WalletConnector>
        <Anchor {...args} />
      </WalletConnector>
    </div>
  </ChakraProvider>
);

export const Main = Template.bind({});
Main.args = {};
