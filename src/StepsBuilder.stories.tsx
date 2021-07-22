import React from "react";
import { Story, Meta } from "@storybook/react";
import { WalletConnector } from "./WalletConnector";
import { StepsBuilder } from "./StepsBuilder";
import { ChakraProvider } from "@chakra-ui/react";

export default {
  component: StepsBuilder,
  title: "StepsBuilder",
} as Meta;

const Template: Story<{}> = (args, { argTypes }) => (
  <ChakraProvider>
    <div className="App">
      <WalletConnector>
        <StepsBuilder {...args} />
      </WalletConnector>
    </div>
  </ChakraProvider>
);

export const Main = Template.bind({});
Main.args = {};
