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
} from "@chakra-ui/react";
import { utils } from "ethers";
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { ContractReceipt } from "@ethersproject/contracts";
import { Connection, clusterApiUrl } from "@solana/web3.js";

import { StepProps } from "../types";
import {
  EthereumContext,
  EthereumContextProps,
} from "../wallet/MetamaskWalletConnector";
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
  ChainId,
  CHAIN_ID_POLYGON,
} from "@certusone/wormhole-sdk";
import {
  POLYGON_TOKEN_BRIDGE_ADDRESS,
  POLYGON_BRIDGE_ADDRESS,
  ETH_TOKEN_BRIDGE_ADDRESS,
  SOL_BRIDGE_ADDRESS,
  ETH_BRIDGE_ADDRESS,
  getSignedVAAWithRetry,
  SOL_TOKEN_BRIDGE_ADDRESS,
} from "../operations/wormhole";
import { useSolanaWallet } from "../wallet/SolanaWalletProvider";
import {
  signSendAndConfirm,
  useCreateTokenAccount,
} from "../operations/solana";

WormholeBridge.stepTitle = "Terra to Ethereum Bridge";

interface EstTx {
  tokenAddress: string;
  recipientAddress: Uint8Array;
  amount: BigNumberish;
  amountStr: string;
  sourceChain: ChainOption;
  destChain: ChainOption;
}

interface UseEstimateTxArgs {
  amount: string;
  sourceChain: ChainOption;
  destChain: ChainOption;
  token: TokenOption | null;
}
function useEstimateTx({
  amount,
  token,
  sourceChain,
  destChain,
}: UseEstimateTxArgs): EstTx | undefined {
  const terraContext = useContext(TerraContext);
  const ethereumContext = useContext(EthereumContext);
  const solanaWalletState = useSolanaWallet();
  const [estTx, setEstTx] = useState<EstTx>();

  // Run estimates on the amount
  useEffect(() => {
    // To Shuttle
    if (!amount || !token) {
      return;
    }
    // Don't run this if amount didn't change from the past estimate
    // TODO: Is this really necessary? Seems like an effect of not using the right abstractions.
    if (amount === estTx?.amountStr) {
      return;
    }

    let recipientPublicKey;
    switch (destChain.key) {
      case CHAIN_ID_ETH:
      case CHAIN_ID_POLYGON:
        recipientPublicKey = ethereumContext.publicAddress;
        break;
      case CHAIN_ID_SOLANA:
        recipientPublicKey = solanaWalletState.publicKey?.toString();
        break;
      default:
        throw new Error("Unsupported chain");
    }
    if (!recipientPublicKey) {
      throw new Error("No recipient set");
    }
    const recipientHexString = nativeToHexString(
      recipientPublicKey,
      destChain.key
    );
    if (!recipientHexString) {
      return;
    }
    const recipientAddress = hexToUint8Array(recipientHexString);

    setEstTx({
      amount: utils.parseUnits(amount, token.decimals),
      amountStr: amount,
      tokenAddress: token.address,
      recipientAddress,
      sourceChain,
      destChain,
    });
  }, [
    amount,
    estTx,
    ethereumContext,
    terraContext,
    solanaWalletState,
    token,
    sourceChain,
    destChain,
  ]);

  return estTx;
}

interface UseForeignAssetArgs {
  sourceChain: ChainOption;
  destChain: ChainOption;
  token: TokenOption | null;
}
interface ForeignAssetState {
  sourceChain: ChainOption;
  destChain: ChainOption;
  token: TokenOption;
  mintAddress: string | null;
}
function useForeignAsset({
  token,
  sourceChain,
  destChain,
}: UseForeignAssetArgs) {
  const [foreignAsset, setForeignAsset] = useState<ForeignAssetState | null>();
  const ethereumContext = useContext(EthereumContext);
  const { networkType } = ethereumContext;

  useEffect(() => {
    if (!token || !networkType) {
      return;
    }

    // TODO: This seems less idiomatic to have this.
    // Seems like some two-way binding issue. Check back later.
    // if (
    //   foreignAsset?.token === token &&
    //   foreignAsset.sourceChain === sourceChain
    // ) {
    //   return;
    // }

    const SOLANA_HOST = clusterApiUrl(
      networkType === "testnet" ? "testnet" : "mainnet-beta"
    );
    const connection = new Connection(SOLANA_HOST, "confirmed");
    const originAssetHex = nativeToHexString(token.address, sourceChain.key);

    if (!originAssetHex) {
      return;
    }

    let cancellation = false;
    const tx = getForeignAssetSolana(
      connection,
      SOL_TOKEN_BRIDGE_ADDRESS[networkType],
      sourceChain.key,
      hexToUint8Array(originAssetHex)
    );

    tx.then((mintAddress) => {
      if (cancellation) {
        return;
      }
      // Foreign asset address
      setForeignAsset({
        sourceChain,
        destChain,
        token,
        mintAddress,
      });
    });

    return () => {
      cancellation = true;
    };
  }, [networkType, sourceChain, destChain, token]);

  return foreignAsset;
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

    // Source chain bridge addresses
    let tokenBridgeAddress: string;
    let bridgeAddress: string;
    switch (estTx.sourceChain.key) {
      case CHAIN_ID_POLYGON:
        bridgeAddress = POLYGON_BRIDGE_ADDRESS[networkType];
        tokenBridgeAddress = POLYGON_TOKEN_BRIDGE_ADDRESS[networkType];
        break;
      case CHAIN_ID_ETH:
        bridgeAddress = ETH_BRIDGE_ADDRESS[networkType];
        tokenBridgeAddress = ETH_TOKEN_BRIDGE_ADDRESS[networkType];
        break;
      default:
        throw new Error("Unsupported source chain");
    }
    const tx = transferFromEth(
      tokenBridgeAddress,
      signer,
      estTx.tokenAddress,
      // TODO: Should use the token's decimals
      estTx.amount,
      estTx.destChain.key,
      estTx.recipientAddress
    );

    tx.then(
      async (receipt: ContractReceipt) => {
        setStatus(`Successfully transacted: ${receipt.transactionHash}`);
        setProgress("");
        setTxHash(receipt.transactionHash);

        const sequence = parseSequenceFromLogEth(receipt, bridgeAddress);
        const emitterAddress = getEmitterAddressEth(tokenBridgeAddress);
        // enqueueSnackbar(null, {
        //   content: <Alert severity="info">Fetching VAA</Alert>,
        // });
        const { vaaBytes } = await getSignedVAAWithRetry(
          // TODO: Check later whether this is scoped correctly
          estTx.sourceChain.key,
          emitterAddress,
          sequence.toString(),
          networkType
        );
        setSignedVAAHex(uint8ArrayToHex(vaaBytes));
        console.log(receipt);
      },
      (e) => {
        // TODO: Make it pop back to no transaction in progress
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

  // Source chain bridge addresses
  let tokenBridgeAddress: string;
  switch (estTx.sourceChain.key) {
    case CHAIN_ID_POLYGON:
      tokenBridgeAddress = POLYGON_TOKEN_BRIDGE_ADDRESS[networkType];
      break;
    case CHAIN_ID_ETH:
      tokenBridgeAddress = ETH_TOKEN_BRIDGE_ADDRESS[networkType];
      break;
    default:
      throw new Error("Unsupported source chain");
  }

  const approveFn = function () {
    return approveEth(
      tokenBridgeAddress,
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
    decimals: 6,
  },
  {
    name: "Polygon Wormhole UST",
    symbol: "pwUST",
    // https://polygonscan.com/token/0xe6469ba6d2fd6130788e0ea9c0a0515900563b59
    address: "0xe6469ba6d2fd6130788e0ea9c0a0515900563b59",
    decimals: 6,
  },
  {
    name: "Faucet Token",
    symbol: "FAU",
    // https://goerli.etherscan.io/token/0xBA62BCfcAaFc6622853cca2BE6Ac7d845BC0f2Dc
    address: "0xBA62BCfcAaFc6622853cca2BE6Ac7d845BC0f2Dc",
    decimals: 18,
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
  const sourceChainPickerState = useChainPickerState();
  const destChainPickerState = useChainPickerState();
  const [token, tokenOptions, onPickTokenByAddress] = useTokenOptions();
  const [amount, setAmount] = useState<string>("0");
  const estTx = useEstimateTx({
    amount,
    token,
    sourceChain: sourceChainPickerState.selectedChainOption,
    destChain: destChainPickerState.selectedChainOption,
  });
  const [status, progress, txHash, signedVAAHex] = useExecuteTx(
    isToExecute,
    estTx
  );
  const foreignAsset = useForeignAsset({
    token,
    sourceChain: sourceChainPickerState.selectedChainOption,
    destChain: destChainPickerState.selectedChainOption,
  });
  const ethereumContext = useContext(EthereumContext);
  const { networkType } = ethereumContext;
  const createTokenAccount = useCreateTokenAccount({
    networkType,
    targetAsset: foreignAsset?.mintAddress,
  });
  const onApproveAmount = useAllowance(estTx);
  const onRedeem = useRedeem(txHash, signedVAAHex);
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
    <WormholeBridgeRender
      amount={amount}
      isToExecute={isToExecute}
      token={token}
      tokenOptions={tokenOptions}
      onChangeToken={onChangeToken}
      onApproveAmount={onApproveAmount}
      onCreateTokenAccount={createTokenAccount}
      onAmountChanged={(event) => setAmount(event.target.value)}
      onRedeem={onRedeem}
      progress={progress}
      status={status}
      sourceChainPickerState={sourceChainPickerState}
      destChainPickerState={destChainPickerState}
    />
  );
}

interface TokenOption {
  name: string;
  address: string;
  symbol: string;
  decimals: number;
}

export interface TerraToEthStepRenderProps {
  amount: string;
  isToExecute: boolean;

  token: TokenOption | null;
  tokenOptions: TokenOption[];
  onChangeToken: ChangeEventHandler<HTMLSelectElement>;

  onApproveAmount: (() => Promise<ContractReceipt>) | (() => void);
  onCreateTokenAccount: () => void;
  onAmountChanged: ChangeEventHandler<HTMLInputElement>;
  onRedeem: () => void;
  progress: string;
  status: string;

  sourceChainPickerState: ChainPickerState;
  destChainPickerState: ChainPickerState;
}

export function WormholeBridgeRender({
  amount,
  isToExecute,
  token,
  tokenOptions,
  onChangeToken,
  onApproveAmount,
  onCreateTokenAccount,
  onAmountChanged,
  onRedeem,
  progress,
  status,

  sourceChainPickerState,
  destChainPickerState,
}: TerraToEthStepRenderProps) {
  return (
    <VStack spacing={4}>
      <FormControl>
        <FormLabel>Source and Destination Chains</FormLabel>
        <HStack>
          <ChainPicker
            state={sourceChainPickerState}
            placeholder="Select Source Chain"
          ></ChainPicker>
          <ChainPicker
            state={destChainPickerState}
            placeholder="Select Destination Chain"
          ></ChainPicker>
        </HStack>
      </FormControl>
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
        <FormLabel>
          Amount to bridge from{" "}
          {sourceChainPickerState.selectedChainOption.name} to{" "}
          {destChainPickerState.selectedChainOption.name}
        </FormLabel>
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
        <Button onClick={onCreateTokenAccount}>Create Token Account</Button>
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

interface ChainOption {
  key: ChainId;
  name: string;
}
const CHAIN_OPTIONS: ReadonlyArray<ChainOption> = [
  {
    key: CHAIN_ID_ETH,
    name: "Ethereum",
  },
  {
    key: CHAIN_ID_POLYGON,
    name: "Polygon",
  },
  {
    key: CHAIN_ID_SOLANA,
    name: "Solana",
  },
];
interface ChainPickerState {
  selectedChainOption: ChainOption;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  chainOptions: typeof CHAIN_OPTIONS;
}
function useChainPickerState(): ChainPickerState {
  const [selectedChainOption, setChainOption] = useState<ChainOption>(
    CHAIN_OPTIONS[2]
  );
  const chainOptions = CHAIN_OPTIONS;
  const onChange: React.ChangeEventHandler<HTMLSelectElement> = useCallback(
    (event) => {
      const selectedChainId: ChainId = Number(event.target.value) as ChainId;
      const newSelectedChainOption = chainOptions.find(
        (chainOption) => chainOption.key === selectedChainId
      );
      if (newSelectedChainOption) {
        setChainOption(newSelectedChainOption);
      }
    },
    [setChainOption, chainOptions]
  );
  return {
    selectedChainOption,
    onChange,
    chainOptions,
  };
}
const ChainPicker: FC<{
  state: ChainPickerState;
  placeholder: string;
}> = ({ state, placeholder }) => {
  return (
    <Select
      placeholder={placeholder || "Select chain"}
      value={state.selectedChainOption.key}
      onChange={state.onChange}
    >
      {state.chainOptions.map((chainOption) => (
        <option key={chainOption.key} value={chainOption.key}>
          {chainOption.name}
        </option>
      ))}
    </Select>
  );
};
