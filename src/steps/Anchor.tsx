import React, {
  useContext,
  useEffect,
  useState,
  useRef,
  ChangeEventHandler,
  useCallback,
  useMemo,
  FC,
} from "react";
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Spinner,
  Select,
  VStack,
  HStack,
  Text,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  TabPanels,
} from "@chakra-ui/react";
import { utils } from "ethers";
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { ContractReceipt } from "@ethersproject/contracts";
import {
  Connection,
  clusterApiUrl,
  PublicKey,
  Transaction,
} from "@solana/web3.js";

import { StepProps } from "../types";
import {
  EthereumContext,
  EthereumContextProps,
} from "../wallet/MetamaskWalletConnector";
import { TerraContext, TerraContextProps } from "../TerraWalletConnector";
import {
  AnchorEarn,
  CHAINS,
  NETWORKS,
  DENOMS,
  Wallet,
  MnemonicKey,
} from "@anchor-protocol/anchor-earn";
import { Msg } from "@terra-money/terra.js";
import { postWithFees } from "../operations/terra";
import { NetworkType } from "../constants";

export const Anchor: FC = () => {
  return (
    <Tabs>
      <TabList>
        <Tab>Deposit</Tab>
        <Tab>Withdraw</Tab>
      </TabList>

      <TabPanels>
        <TabPanel>
          <Deposit />
        </TabPanel>
        <TabPanel>
          <Withdraw />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

interface DepositArgs {
  amount: string;
  networkType: NetworkType;
  terraContext: TerraContextProps;
}
async function deposit({ amount, networkType, terraContext }: DepositArgs) {
  if (!terraContext.address) {
    throw new Error("No address");
  }

  const anchorEarn = new AnchorEarn({
    chain: CHAINS.TERRA,
    network: NETWORKS.BOMBAY_12,
    address: terraContext.address,
  });
  await anchorEarn.deposit({
    currency: DENOMS.UST,
    amount,
    customBroadcaster,
  });

  async function customBroadcaster(tx: Msg[]) {
    const txResult = await postWithFees(
      networkType,
      terraContext,
      tx,
      "Deposit into Anchor"
    );
    return txResult.result.txhash;
  }
}

const Deposit: FC = () => {
  const terraContext = useContext(TerraContext);
  const { networkType } = useContext(EthereumContext);
  const [amount, setAmount] = useState<string>("0");
  const onAmountChanged = useCallback<
    React.ChangeEventHandler<HTMLInputElement>
  >((event) => {
    setAmount(event.target.value);
  }, []);
  const handleDeposit = useCallback(() => {
    if (!networkType) {
      return;
    }
    deposit({ amount, terraContext, networkType });
  }, [amount, networkType, terraContext]);
  return (
    <VStack>
      <FormControl>
        <FormLabel>Amount to deposit</FormLabel>
        <InputGroup>
          <Input
            placeholder="Enter amount"
            type="number"
            pr="4.5rem"
            min="0"
            value={amount || ""}
            // disabled={isToExecute}
            onChange={onAmountChanged}
          />
          <InputRightElement
            pointerEvents="none"
            color="gray.300"
            fontSize="1.2em"
            width="4.5rem"
            children={"UST"}
          />
        </InputGroup>
      </FormControl>
      <Button onClick={handleDeposit}>Deposit</Button>
    </VStack>
  );
};

const Withdraw: FC = () => {
  const [amount, setAmount] = useState();

  return (
    <VStack>
      <FormControl>
        <FormLabel>Amount to withdraw</FormLabel>
        <InputGroup>
          <Input
            placeholder="Enter amount"
            type="number"
            pr="4.5rem"
            min="0"
            value={amount || ""}
            // disabled={isToExecute}
            // onChange={onAmountChanged}
          />
          <InputRightElement
            pointerEvents="none"
            color="gray.300"
            fontSize="1.2em"
            width="4.5rem"
            children={"UST"}
          />
        </InputGroup>
      </FormControl>
      <Button>Withdraw</Button>
    </VStack>
  );
};
