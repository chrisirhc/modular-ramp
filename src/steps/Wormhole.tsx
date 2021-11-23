import React, {
  useContext,
  useEffect,
  useState,
  useRef,
  ChangeEventHandler,
  useCallback,
  useMemo,
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
} from "@chakra-ui/react";
import { utils } from "ethers";
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { ContractReceipt } from "@ethersproject/contracts";
import { Connection, clusterApiUrl } from "@solana/web3.js";

import { StepProps } from "../types";
import { EthereumContext, EthereumContextProps } from "../EthWalletConnector";
import { TerraContext, TerraContextProps } from "../TerraWalletConnector";

import {
  transferFromEth,
  CHAIN_ID_SOLANA,
  hexToUint8Array,
  nativeToHexString,
  approveEth,
  postVaaSolana,
  redeemAndUnwrapOnSolana,
  redeemOnSolana,
  parseSequenceFromLogEth,
  getEmitterAddressEth,
  CHAIN_ID_ETH,
  uint8ArrayToHex,
  getForeignAssetSolana,
} from "@certusone/wormhole-sdk";
import {
  POLYGON_TOKEN_BRIDGE_ADDRESS,
  ETH_TOKEN_BRIDGE_ADDRESS,
  SOL_BRIDGE_ADDRESS,
  ETH_BRIDGE_ADDRESS,
  getSignedVAAWithRetry,
  SOL_TOKEN_BRIDGE_ADDRESS,
} from "../operations/wormhole";
import { useSolanaWallet } from "../wallet/SolanaWalletProvider";
import { signSendAndConfirm } from "../operations/solana";

WormholeBridge.stepTitle = "Terra to Ethereum Bridge";

interface EstTx {
  tokenAddress: string;
  recipientAddress: Uint8Array;
  amount: BigNumberish;
  amountStr: string;
}

function useEstimateTx(amount: string) {
  const terraContext = useContext(TerraContext);
  const ethereumContext = useContext(EthereumContext);
  const [estTx, setEstTx] = useState<EstTx>();

  // https://goerli.etherscan.io/address/0xBA62BCfcAaFc6622853cca2BE6Ac7d845BC0f2Dc
  const TOKEN_ADDRESS = "0xBA62BCfcAaFc6622853cca2BE6Ac7d845BC0f2Dc";
  const RECIPIENT_ADDRESS = "FSAUrk51D1yfxkgeNhMUo3t9bedMuWt2MJLCAsVHMKHz";

  // Run estimates on the amount
  useEffect(() => {
    // To Shuttle
    if (!amount) {
      return;
    }
    // Don't run this if amount didn't change from the past estimate
    // TODO: Is this really necessary? Seems like an effect of not using the right abstractions.
    if (amount === estTx?.amountStr) {
      return;
    }

    const recipientHexString = nativeToHexString(
      RECIPIENT_ADDRESS,
      CHAIN_ID_SOLANA
    );
    if (!recipientHexString) {
      return;
    }
    const recipientAddress = hexToUint8Array(recipientHexString);

    setEstTx({
      amount: utils.parseEther(amount),
      amountStr: amount,
      tokenAddress: TOKEN_ADDRESS,
      recipientAddress,
    });
  }, [amount, estTx, ethereumContext, terraContext]);

  return estTx;
}

// TODO: This could be part of Est Tx step.
function useForeignAsset() {
  const originAsset = "0xBA62BCfcAaFc6622853cca2BE6Ac7d845BC0f2Dc";
  const originChain = CHAIN_ID_ETH;
  const ethereumContext = useContext(EthereumContext);
  const { networkType } = ethereumContext;

  if (!networkType) {
    return () => {};
  }

  return () => {
    const SOLANA_HOST = clusterApiUrl(
      networkType === "testnet" ? "testnet" : "mainnet-beta"
    );
    const connection = new Connection(SOLANA_HOST, "confirmed");
    const originAssetHex = nativeToHexString(originAsset, originChain);

    if (!originAssetHex) {
      return;
    }

    const tx = getForeignAssetSolana(
      connection,
      SOL_TOKEN_BRIDGE_ADDRESS[networkType],
      originChain,
      hexToUint8Array(originAssetHex)
    );

    tx.then((r) => {
      console.log(r);
    });

    return tx;
  };
}

function useExecuteTx(isToExecute: boolean, estTx: EstTx | undefined) {
  const terraContext = useContext(TerraContext);
  const ethereumContext = useContext(EthereumContext);
  const [status, setStatus] = useState<string>("");
  const [progress, setProgress] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");
  const [signedVAAHex, setSignedVAAHex] = useState<string>("");
  const txRef = useRef<EstTx>();

  useEffect(() => {
    if (!isToExecute) {
      return;
    }
    // No transaction estimate yet
    if (!estTx) {
      return;
    }
    // Has a status so status hasn't been reset.
    if (status) {
      return;
    }
    // Transaction already in progress
    if (txRef.current) {
      console.warn(
        `${
          txRef.current === estTx ? "Same" : "Different"
        } transaction already in progress.`
      );
      return;
    }
    const { networkType, signer } = ethereumContext;
    if (!networkType || !signer) {
      return;
    }

    txRef.current = estTx;
    console.debug("Executing tx", estTx);
    setProgress("Sending Transaction");

    const tx = transferFromEth(
      ETH_TOKEN_BRIDGE_ADDRESS[networkType],
      signer,
      estTx.tokenAddress,
      // TODO: Should use the token's decimals
      estTx.amount,
      CHAIN_ID_SOLANA,
      estTx.recipientAddress
    );

    tx.then(
      async (receipt: ContractReceipt) => {
        setStatus(`Successfully transacted: ${receipt.transactionHash}`);
        setProgress("");
        setTxHash(receipt.transactionHash);

        const sequence = parseSequenceFromLogEth(
          receipt,
          ETH_BRIDGE_ADDRESS[networkType]
        );
        const emitterAddress = getEmitterAddressEth(
          ETH_TOKEN_BRIDGE_ADDRESS[networkType]
        );
        // enqueueSnackbar(null, {
        //   content: <Alert severity="info">Fetching VAA</Alert>,
        // });
        const { vaaBytes } = await getSignedVAAWithRetry(
          CHAIN_ID_ETH,
          emitterAddress,
          sequence.toString(),
          networkType
        );
        setSignedVAAHex(uint8ArrayToHex(vaaBytes));
        console.log(receipt);
      },
      (e) => {
        console.error("Error in transaction", e);
        setStatus("Failed");
        setProgress("");
      }
    );
  }, [isToExecute, status, estTx, terraContext, ethereumContext]);

  return [status, progress, txHash, signedVAAHex];
}

function useAllowance(estTx: EstTx | undefined) {
  const ethereumContext = useContext(EthereumContext);
  const { networkType, signer } = ethereumContext;

  if (!networkType || !signer || !estTx) {
    return () => {};
  }

  const approveFn = function () {
    return approveEth(
      ETH_TOKEN_BRIDGE_ADDRESS[networkType],
      estTx.tokenAddress,
      signer,
      estTx.amount
    );
  };

  return approveFn;
}

function useRedeem(txHash: string, signedVAAHex: string) {
  const ethereumContext = useContext(EthereumContext);
  const wallet = useSolanaWallet();
  const { networkType, signer } = ethereumContext;
  const solanaSignTransaction = wallet.signTransaction;
  const payerAddress = wallet.publicKey?.toString();

  if (
    !txHash ||
    !networkType ||
    !signer ||
    !solanaSignTransaction ||
    !payerAddress
  ) {
    return () => {};
  }
  const isNative = false;
  const SOLANA_HOST = clusterApiUrl(
    networkType === "testnet" ? "testnet" : "mainnet-beta"
  );
  const signedVAA = hexToUint8Array(signedVAAHex);
  const redeemFn = async function () {
    const connection = new Connection(SOLANA_HOST, "confirmed");
    await postVaaSolana(
      connection,
      solanaSignTransaction,
      SOL_BRIDGE_ADDRESS[networkType],
      payerAddress,
      Buffer.from(signedVAA)
    );
    // TODO: how do we retry in between these steps
    const transaction = isNative
      ? await redeemAndUnwrapOnSolana(
          connection,
          SOL_BRIDGE_ADDRESS[networkType],
          SOL_TOKEN_BRIDGE_ADDRESS[networkType],
          payerAddress,
          signedVAA
        )
      : await redeemOnSolana(
          connection,
          SOL_BRIDGE_ADDRESS[networkType],
          SOL_TOKEN_BRIDGE_ADDRESS[networkType],
          payerAddress,
          signedVAA
        );
    const txid = await signSendAndConfirm(wallet, connection, transaction);
    console.log("Transaction", txid);
  };
  return redeemFn;
}

// TODO: Add Polygon information
const TOKEN_OPTIONS: TokenOption[] = [
  {
    name: "Polygon USDC",
    symbol: "pUSDC",
    // https://polygonscan.com/token/0x2791bca1f2de4661ed88a30c99a7a9449aa84174
    address: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
  },
  {
    name: "Polygon Wormhole UST",
    symbol: "pwUST",
    // https://polygonscan.com/token/0xe6469ba6d2fd6130788e0ea9c0a0515900563b59
    address: "0xe6469ba6d2fd6130788e0ea9c0a0515900563b59",
  },
];

function useTokenOptions(): [
  token: TokenOption | null,
  tokenOptions: TokenOption[],
  onPickTokenByAddress: (tokenAddress: string) => void
] {
  const [token, setToken] = useState<TokenOption | null>(null);
  // const ethereumContext = useContext(EthereumContext);
  // const { networkType } = ethereumContext;
  const [tokenOptions, onPickTokenByAddress] = useMemo(() => {
    const tokenOptions = TOKEN_OPTIONS;
    const onPickTokenByAddress = (tokenAddress: string) =>
      setToken(
        tokenOptions.find(
          (tokenOption) => tokenAddress === tokenOption.address
        ) || null
      );
    return [tokenOptions, onPickTokenByAddress];
  }, []);

  return [token, tokenOptions, onPickTokenByAddress];
}

export function WormholeBridge({
  isToExecute,
  onExecuted = () => {},
}: StepProps) {
  const [amount, setAmount] = useState<string>("0");
  const estTx = useEstimateTx(amount);
  const [status, progress, txHash, signedVAAHex] = useExecuteTx(
    isToExecute,
    estTx
  );
  const onFetchForeignAsset = useForeignAsset();
  const onApproveAmount = useAllowance(estTx);
  const onRedeem = useRedeem(txHash, signedVAAHex);
  const [token, tokenOptions, onPickTokenByAddress] = useTokenOptions();
  const onChangeToken = useCallback(
    (event) => onPickTokenByAddress(event.target.value),
    [onPickTokenByAddress]
  );

  // Call onExecuted callback if status is available
  useEffect(() => {
    if (!status) {
      return;
    }
    onExecuted(status);
  }, [status, onExecuted]);

  // No constraints, pick whatever you want and handle the estimates
  return (
    <TerraToEthStepRender
      amount={amount}
      isToExecute={isToExecute}
      token={token}
      tokenOptions={tokenOptions}
      onChangeToken={onChangeToken}
      onApproveAmount={onApproveAmount}
      onAmountChanged={(event) => setAmount(event.target.value)}
      onFetchForeignAsset={onFetchForeignAsset}
      onRedeem={onRedeem}
      progress={progress}
      status={status}
    />
  );
}

interface TokenOption {
  name: string;
  address: string;
  symbol: string;
}

export interface TerraToEthStepRenderProps {
  amount: string;
  isToExecute: boolean;

  token: TokenOption | null;
  tokenOptions: TokenOption[];
  onChangeToken: ChangeEventHandler<HTMLSelectElement>;

  onApproveAmount: (() => Promise<ContractReceipt>) | (() => void);
  onFetchForeignAsset: (() => Promise<ContractReceipt>) | (() => void);
  onAmountChanged: ChangeEventHandler<HTMLInputElement>;
  onRedeem: () => void;
  progress: string;
  status: string;
}

export function TerraToEthStepRender({
  amount,
  isToExecute,
  token,
  tokenOptions,
  onChangeToken,
  onApproveAmount,
  onFetchForeignAsset,
  onAmountChanged,
  onRedeem,
  progress,
  status,
}: TerraToEthStepRenderProps) {
  return (
    <VStack spacing={4}>
      <FormControl>
        <FormLabel>Token to Bridge</FormLabel>
        <Select
          placeholder="Select token"
          value={token?.address}
          onChange={onChangeToken}
        >
          {tokenOptions.map((tokenOption) => (
            <option key={tokenOption.address} value={tokenOption.address}>
              {tokenOption.name} {tokenOption.symbol} {tokenOption.address}
            </option>
          ))}
        </Select>
      </FormControl>
      <FormControl>
        <FormLabel>Amount to bridge to Ethereum</FormLabel>
        <InputGroup>
          <Input
            placeholder="Enter amount"
            type="number"
            pr="4.5rem"
            min="0"
            value={amount || ""}
            disabled={isToExecute}
            onChange={onAmountChanged}
          />
          <InputRightElement
            pointerEvents="none"
            color="gray.300"
            fontSize="1.2em"
            width="4.5rem"
            children={token?.symbol}
          />
        </InputGroup>
      </FormControl>
      <HStack>
        <Button onClick={onFetchForeignAsset}>Fetch Foreign Asset</Button>
        <Button onClick={onApproveAmount}>Approve Amount</Button>
        <Button onClick={onRedeem}>Redeem</Button>
      </HStack>
      <HStack>
        {progress ? <Spinner /> : null}
        {status === "Success" ? <Text>🟢</Text> : null}
        <Text color={status && status !== "Success" ? "red" : "current"}>
          {progress || status}
        </Text>
      </HStack>
    </VStack>
  );
}
