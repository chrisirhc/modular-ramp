import React, { useState } from "react";
import { Story, Meta } from "@storybook/react";
import { WalletConnector } from "../WalletConnector";
import { StepProps } from "../types";
import { WormholeBridge } from "./Wormhole";
import { ChakraProvider } from "@chakra-ui/react";

export default {
  component: WormholeBridge,
  title: "WormholeBridge",
} as Meta;

const Template: Story<StepProps> = (args, { argTypes }) => {
  const [toExecute, setToExecute] = useState<boolean>(false);
  return (
    <ChakraProvider>
      <div className="App">
        <WalletConnector>
          <WormholeBridge {...args} />
        </WalletConnector>
        <input
          type="checkbox"
          checked={toExecute}
          onChange={(event) => setToExecute(event.target.checked)}
        />
      </div>
    </ChakraProvider>
  );
};

export const Main = Template.bind({});
Main.args = {};
