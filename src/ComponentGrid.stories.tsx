import React from "react";
import { Story, Meta } from "@storybook/react";
import { WalletConnector } from "./WalletConnector";
import { ComponentGrid } from "./ComponentGrid";
import { ChakraProvider } from "@chakra-ui/react";

export default {
  component: ComponentGrid,
  title: "ComponentGrid",
} as Meta;

const Template: Story<{}> = (args, { argTypes }) => (
  <ChakraProvider>
    <div className="App">
      <WalletConnector>
        <ComponentGrid {...args} />
      </WalletConnector>
    </div>
  </ChakraProvider>
);

export const Main = Template.bind({});
Main.args = {};
