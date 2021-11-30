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

const Deposit: FC = () => {
  const [amount, setAmount] = useState();
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
      <Button>Deposit</Button>
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
