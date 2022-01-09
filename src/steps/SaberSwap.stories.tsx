import React, { useState } from "react";
import { Story, Meta } from "@storybook/react";
import { WalletConnector } from "../WalletConnector";
import { StepProps } from "../types";
import { SaberSwap, SaberSwapRender, SaberSwapRenderProps } from "./SaberSwap";
import { TOKEN_LIST } from "../operations/saber";
import { ChakraProvider } from "@chakra-ui/react";

export default {
  component: SaberSwap,
  title: "Step/SaberSwap",
} as Meta;

const Template: Story<StepProps> = (args, { argTypes }) => {
  const [toExecute, setToExecute] = useState<boolean>(false);
  return (
    <ChakraProvider>
      <div className="App">
        <WalletConnector>
          <SaberSwap {...args} isToExecute={toExecute} />
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

const RenderTemplate: Story<SaberSwapRenderProps> = (args, { argTypes }) => {
  return (
    <ChakraProvider>
      <div className="App">
        <SaberSwapRender {...args} />
      </div>
    </ChakraProvider>
  );
};

const tokenList = TOKEN_LIST.testnet;
export const Render = RenderTemplate.bind({});
Render.args = {
  fromTokenState: {
    selectedTokenInfo: tokenList[1],
    tokenInfoOptions: tokenList,
    onChangeSelect: () => {},
  },
  toTokenState: {
    selectedTokenInfo: tokenList[2],
    tokenInfoOptions: tokenList,
    onChangeSelect: () => {},
  },
  amount: "10",
};
