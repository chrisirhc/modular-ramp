import React, {
  useContext,
  useState,
  useCallback,
  FC,
  useEffect,
  useMemo,
} from "react";
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  VStack,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  TabPanels,
  Stat,
  StatLabel,
  StatGroup,
  StatHelpText,
  StatNumber,
} from "@chakra-ui/react";

import { EthereumContext } from "../wallet/MetamaskWalletConnector";
import { TerraContext, TerraContextProps } from "../TerraWalletConnector";
import {
  AnchorEarn,
  CHAINS,
  NETWORKS,
  DENOMS,
  BalanceOutput,
} from "@anchor-protocol/anchor-earn";
import { Msg } from "@terra-money/terra.js";
import { postWithFees } from "../operations/terra";
import { NetworkType } from "../constants";

export const Anchor: FC = () => {
  const terraContext = useContext(TerraContext);
  const [balanceOutput, setBalanceOutput] = useState<BalanceOutput>();
  const anchorEarn = useMemo(() => {
    if (!terraContext.address) {
      return;
    }
    return getAnchorEarn(terraContext.address);
  }, [terraContext.address]);
  const refreshBalances = useCallback(async () => {
    if (!anchorEarn) {
      return;
    }
    const balanceInfo = await anchorEarn.balance({
      currencies: [DENOMS.UST],
    });
    setBalanceOutput(balanceInfo);
  }, [anchorEarn]);
  useEffect(() => {
    refreshBalances();
  }, [refreshBalances]);
  return (
    <VStack>
      <StatGroup>
        <Stat>
          <StatLabel>Total UST</StatLabel>
          <StatNumber>{balanceOutput?.total_account_balance_in_ust}</StatNumber>
          <StatHelpText>
            Last updated: {balanceOutput?.timestamp.toString()}
          </StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Deposited UST</StatLabel>
          <StatNumber>{balanceOutput?.total_deposit_balance_in_ust}</StatNumber>
        </Stat>
      </StatGroup>
      <Tabs>
        <TabList>
          <Tab>Deposit</Tab>
          <Tab>Withdraw</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <Deposit onRefreshBalances={refreshBalances} />
          </TabPanel>
          <TabPanel>
            <Withdraw onRefreshBalances={refreshBalances} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
};

function getAnchorEarn(address: string) {
  return new AnchorEarn({
    chain: CHAINS.TERRA,
    network: NETWORKS.BOMBAY_12,
    address,
  });
}

function getCustomBroadcaster({
  networkType,
  terraContext,
  memo,
}: {
  networkType: NetworkType;
  terraContext: TerraContextProps;
  memo: string;
}) {
  return async function customBroadcaster(tx: Msg[]) {
    const txResult = await postWithFees(networkType, terraContext, tx, memo);
    return txResult.result.txhash;
  };
}

interface OperationArgs {
  amount: string;
  networkType: NetworkType;
  terraContext: TerraContextProps;
}
async function deposit({ amount, networkType, terraContext }: OperationArgs) {
  if (!terraContext.address) {
    throw new Error("No address");
  }

  const anchorEarn = getAnchorEarn(terraContext.address);
  return await anchorEarn.deposit({
    currency: DENOMS.UST,
    amount,
    customBroadcaster: getCustomBroadcaster({
      networkType,
      terraContext,
      memo: "Deposit on Anchor",
    }),
  });
}

interface HasRefreshBalances {
  onRefreshBalances: () => void;
}
const Deposit: FC<HasRefreshBalances> = ({ onRefreshBalances }) => {
  const terraContext = useContext(TerraContext);
  const { networkType } = useContext(EthereumContext);
  const [amount, setAmount] = useState<string>("0");
  const onAmountChanged = useCallback<
    React.ChangeEventHandler<HTMLInputElement>
  >((event) => {
    setAmount(event.target.value);
  }, []);
  const handleDeposit = useCallback(async () => {
    if (!networkType) {
      return;
    }
    await deposit({ amount, terraContext, networkType });
    onRefreshBalances();
  }, [amount, networkType, onRefreshBalances, terraContext]);
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

async function withdraw({ amount, networkType, terraContext }: OperationArgs) {
  if (!terraContext.address) {
    throw new Error("No address");
  }

  const anchorEarn = getAnchorEarn(terraContext.address);
  return await anchorEarn.withdraw({
    currency: DENOMS.UST,
    amount,
    customBroadcaster: getCustomBroadcaster({
      networkType,
      terraContext,
      memo: "Deposit on Anchor",
    }),
  });
}

const Withdraw: FC<HasRefreshBalances> = ({ onRefreshBalances }) => {
  const terraContext = useContext(TerraContext);
  const { networkType } = useContext(EthereumContext);
  const [amount, setAmount] = useState<string>("0");
  const onAmountChanged = useCallback<
    React.ChangeEventHandler<HTMLInputElement>
  >((event) => {
    setAmount(event.target.value);
  }, []);
  const handleWithdraw = useCallback(async () => {
    if (!networkType) {
      return;
    }
    await withdraw({ amount, terraContext, networkType });
    onRefreshBalances();
  }, [amount, networkType, onRefreshBalances, terraContext]);

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
      <Button onClick={handleWithdraw}>Withdraw</Button>
    </VStack>
  );
};
