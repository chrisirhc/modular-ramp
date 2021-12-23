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
  FormErrorMessage,
  Grid,
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
  CHAIN_ID_TERRA,
  redeemOnTerra,
  redeemOnEth,
  redeemOnEthNative,
  transferFromTerra,
  parseSequenceFromLogTerra,
  getEmitterAddressTerra,
} from "@certusone/wormhole-sdk";
import {
  POLYGON_TOKEN_BRIDGE_ADDRESS,
  POLYGON_BRIDGE_ADDRESS,
  ETH_TOKEN_BRIDGE_ADDRESS,
  SOL_BRIDGE_ADDRESS,
  ETH_BRIDGE_ADDRESS,
  getSignedVAAWithRetry,
  SOL_TOKEN_BRIDGE_ADDRESS,
  TERRA_TOKEN_BRIDGE_ADDRESS,
  TERRA_BRIDGE_ADDRESS,
} from "../operations/wormhole";
import { useSolanaWallet } from "../wallet/SolanaWalletProvider";
import {
  signSendAndConfirm,
  useCreateTokenAccount,
  useTokenAccount,
  getConnection,
} from "../operations/solana";
import { NetworkType } from "../constants";
import { postWithFees, waitForTerraExecution } from "../operations/terra";
import { JsonRpcSigner } from "@ethersproject/providers";

WormholeBridge.stepTitle = "Wormhole Bridge";

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
  tokenAccount: PublicKey | undefined | null;
}
function useEstimateTx({
  amount,
  token,
  tokenAccount,
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
        recipientPublicKey = tokenAccount?.toString();
        break;
      case CHAIN_ID_TERRA:
        recipientPublicKey = terraContext.address;
        break;
      default:
        throw new Error("Unsupported chain");
    }
    if (!recipientPublicKey) {
      return;
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
    tokenAccount,
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

    const connection = getConnection(networkType);
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

    switch (estTx.sourceChain.key) {
      case CHAIN_ID_ETH:
      case CHAIN_ID_POLYGON:
        transferEth(
          estTx,
          networkType,
          signer,
          setStatus,
          setProgress,
          setTxHash,
          setSignedVAAHex
        );
        return;
      case CHAIN_ID_TERRA:
        transferTerra(
          terraContext,
          estTx,
          networkType,
          setStatus,
          setProgress,
          setSignedVAAHex
        );
        return;
    }
  }, [isToExecute, status, estTx, terraContext, ethereumContext]);

  return [status, progress, signedVAAHex];
}

async function transferTerra(
  terraContext: TerraContextProps,
  estTx: EstTx,
  networkType: NetworkType,
  setStatus: React.Dispatch<React.SetStateAction<string>>,
  setProgress: React.Dispatch<React.SetStateAction<string>>,
  setSignedVAAHex: React.Dispatch<React.SetStateAction<string>>
) {
  // const amountParsed = parseUnits(amount, decimals).toString();
  if (!terraContext.address) {
    return;
  }

  const { tokenBridgeAddress } = getBridgeAddresses(
    CHAIN_ID_TERRA,
    networkType
  );
  const msgs = await transferFromTerra(
    terraContext.address,
    tokenBridgeAddress,
    estTx.tokenAddress,
    estTx.amount.toString(),
    estTx.destChain.key,
    estTx.recipientAddress
  );

  const result = await postWithFees(
    networkType,
    terraContext,
    msgs,
    "Wormhole - Initiate Transfer"
  );

  const info = await waitForTerraExecution(terraContext, result);
  const sequence = parseSequenceFromLogTerra(info);
  if (!sequence) {
    throw new Error("Sequence not found");
  }
  const emitterAddress = await getEmitterAddressTerra(tokenBridgeAddress);
  const { vaaBytes } = await getSignedVAAWithRetry(
    CHAIN_ID_TERRA,
    emitterAddress,
    sequence,
    networkType
  );
  setSignedVAAHex(uint8ArrayToHex(vaaBytes));
  setStatus(`Successfully transacted: ${info.txhash}`);
  setProgress("");
  console.log(info);
}

function transferEth(
  estTx: EstTx,
  networkType: NetworkType,
  signer: JsonRpcSigner,
  setStatus: React.Dispatch<React.SetStateAction<string>>,
  setProgress: React.Dispatch<React.SetStateAction<string>>,
  setTxHash: React.Dispatch<React.SetStateAction<string>>,
  setSignedVAAHex: React.Dispatch<React.SetStateAction<string>>
) {
  // Source chain bridge addresses
  const {
    tokenBridgeAddress,
    bridgeAddress,
  }: { tokenBridgeAddress: string; bridgeAddress: string } = getBridgeAddresses(
    estTx.sourceChain.key,
    networkType
  );
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
}

function getBridgeAddresses(chainId: ChainId, networkType: NetworkType) {
  let tokenBridgeAddress: string;
  let bridgeAddress: string;
  switch (chainId) {
    case CHAIN_ID_POLYGON:
      bridgeAddress = POLYGON_BRIDGE_ADDRESS[networkType];
      tokenBridgeAddress = POLYGON_TOKEN_BRIDGE_ADDRESS[networkType];
      break;
    case CHAIN_ID_ETH:
      bridgeAddress = ETH_BRIDGE_ADDRESS[networkType];
      tokenBridgeAddress = ETH_TOKEN_BRIDGE_ADDRESS[networkType];
      break;
    case CHAIN_ID_TERRA:
      bridgeAddress = TERRA_BRIDGE_ADDRESS[networkType];
      tokenBridgeAddress = TERRA_TOKEN_BRIDGE_ADDRESS[networkType];
      break;
    default:
      throw new Error("Unsupported source chain");
  }
  return { tokenBridgeAddress, bridgeAddress };
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
    case CHAIN_ID_TERRA:
      // No approval needed
      return () => {};
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

interface UseRedeemArgs {
  signedVAAHex: string;
  destChain: ChainOption;
}
function useRedeem({ signedVAAHex, destChain }: UseRedeemArgs) {
  const ethereumContext = useContext(EthereumContext);
  const terraContext = useContext(TerraContext);
  const wallet = useSolanaWallet();
  const { networkType, signer } = ethereumContext;
  const redeemFn = useCallback(
    async function () {
      if (!signedVAAHex) {
        throw new Error("No signed VAA. Please wait a bit and try again.");
      }
      const signedVAA = hexToUint8Array(signedVAAHex);
      if (!networkType) {
        throw new Error("Missing dependencies");
      }
      switch (destChain.key) {
        case CHAIN_ID_ETH:
        case CHAIN_ID_POLYGON:
          if (!signer) {
            throw new Error("Missing dependencies");
          }
          return await redeemViaEth(
            signer,
            signedVAA,
            networkType,
            false,
            destChain.key
          );
        case CHAIN_ID_TERRA:
          return await redeemViaTerra(terraContext, networkType, signedVAA);
        case CHAIN_ID_SOLANA:
          const isNative = false;

          const solanaSignTransaction = wallet.signTransaction;
          const payerAddress = wallet.publicKey?.toString();
          if (!solanaSignTransaction || !payerAddress) {
            throw new Error("Missing dependencies");
          }
          const connection = getConnection(networkType);
          return await redeemViaSolana(
            connection,
            solanaSignTransaction,
            networkType,
            payerAddress,
            signedVAA,
            isNative,
            wallet
          );
        default:
          throw new Error("Unsupported chain");
      }
    },
    [destChain.key, networkType, signedVAAHex, signer, terraContext, wallet]
  );
  return redeemFn;
}

async function redeemViaEth(
  signer: JsonRpcSigner,
  signedVAA: Uint8Array,
  networkType: NetworkType,
  isNative: boolean,
  chainId: ChainId
) {
  const { tokenBridgeAddress } = getBridgeAddresses(chainId, networkType);
  const receipt = isNative
    ? await redeemOnEthNative(tokenBridgeAddress, signer, signedVAA)
    : await redeemOnEth(tokenBridgeAddress, signer, signedVAA);
  return receipt;
}

async function redeemViaTerra(
  terraContext: TerraContextProps,
  networkType: NetworkType,
  signedVAA: Uint8Array
) {
  if (!terraContext.address) {
    throw new Error("No address");
  }

  const msg = await redeemOnTerra(
    TERRA_TOKEN_BRIDGE_ADDRESS[networkType],
    terraContext.address,
    signedVAA
  );
  const result = await postWithFees(
    networkType,
    terraContext,
    [msg],
    "Wormhole - Complete Transfer"
  );

  return result;
}

async function redeemViaSolana(
  connection: Connection,
  solanaSignTransaction: (transaction: Transaction) => Promise<Transaction>,
  networkType: NetworkType,
  payerAddress: string,
  signedVAA: Uint8Array,
  isNative: boolean,
  wallet: any
) {
  if (!networkType) {
    return;
  }

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
}

// TODO: Add Polygon information
const TOKEN_OPTIONS: TokenOption[] = [
  {
    name: "Polygon USDC",
    symbol: "pUSDC",
    // https://polygonscan.com/token/0x2791bca1f2de4661ed88a30c99a7a9449aa84174
    address: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
    decimals: 6,
    chainId: CHAIN_ID_POLYGON,
  },
  {
    name: "Polygon Wormhole UST",
    symbol: "pwUST",
    // https://polygonscan.com/token/0xe6469ba6d2fd6130788e0ea9c0a0515900563b59
    address: "0xe6469ba6d2fd6130788e0ea9c0a0515900563b59",
    decimals: 6,
    chainId: CHAIN_ID_POLYGON,
  },
  {
    name: "Terra UST",
    symbol: "UST",
    // https://polygonscan.com/token/0xe6469ba6d2fd6130788e0ea9c0a0515900563b59
    address: "uusd",
    decimals: 6,
    chainId: CHAIN_ID_TERRA,
  },
  // For testing only in testned
  {
    name: "Faucet Token",
    symbol: "FAU",
    // https://goerli.etherscan.io/token/0xBA62BCfcAaFc6622853cca2BE6Ac7d845BC0f2Dc
    address: "0xBA62BCfcAaFc6622853cca2BE6Ac7d845BC0f2Dc",
    decimals: 18,
    chainId: CHAIN_ID_ETH,
  },
];

function useTokenOptions({
  sourceChain,
}: {
  sourceChain: ChainId;
}): [
  token: TokenOption | null,
  tokenOptions: TokenOption[],
  onPickTokenByAddress: (tokenAddress: string) => void
] {
  const [token, setToken] = useState<TokenOption | null>(null);
  // const ethereumContext = useContext(EthereumContext);
  // const { networkType } = ethereumContext;
  const [tokenOptions, onPickTokenByAddress] = useMemo(() => {
    const tokenOptions = TOKEN_OPTIONS.filter(
      ({ chainId }) => chainId === sourceChain
    );
    const onPickTokenByAddress = (tokenAddress: string) =>
      setToken(
        tokenOptions.find(
          (tokenOption) => tokenAddress === tokenOption.address
        ) || null
      );
    return [tokenOptions, onPickTokenByAddress];
  }, [sourceChain]);

  return [token, tokenOptions, onPickTokenByAddress];
}

export function WormholeBridge({
  isToExecute,
  onExecuted = () => {},
}: StepProps) {
  const ethereumContext = useContext(EthereumContext);
  const { networkType } = ethereumContext;
  const sourceChainPickerState = useChainPickerState();
  const destChainPickerState = useChainPickerState();
  const [token, tokenOptions, onPickTokenByAddress] = useTokenOptions({
    sourceChain: sourceChainPickerState.selectedChainOption.key,
  });
  const foreignAsset = useForeignAsset({
    token,
    sourceChain: sourceChainPickerState.selectedChainOption,
    destChain: destChainPickerState.selectedChainOption,
  });
  const [amount, setAmount] = useState<string>("0");
  const tokenAccount = useTokenAccount({
    networkType,
    targetAsset: foreignAsset?.mintAddress,
  });
  const estTx = useEstimateTx({
    amount,
    token,
    tokenAccount,
    sourceChain: sourceChainPickerState.selectedChainOption,
    destChain: destChainPickerState.selectedChainOption,
  });
  const [status, progress, signedVAAHex] = useExecuteTx(isToExecute, estTx);
  const createTokenAccount = useCreateTokenAccount({
    networkType,
    targetAsset: foreignAsset?.mintAddress,
  });
  const onApproveAmount = useAllowance(estTx);
  const onRedeem = useRedeem({
    signedVAAHex,
    destChain: destChainPickerState.selectedChainOption,
  });
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

  const shouldShowAttest = Boolean(foreignAsset && !foreignAsset.mintAddress);
  const onAttest = useCallback(() => {
    throw new Error("Not implemented");
  }, []);

  // No constraints, pick whatever you want and handle the estimates
  return (
    <WormholeBridgeRender
      amount={amount}
      isToExecute={isToExecute}
      token={token}
      tokenOptions={tokenOptions}
      onChangeToken={onChangeToken}
      shouldShowAttest={shouldShowAttest}
      onAttest={onAttest}
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
  chainId: ChainId;
}

export interface TerraToEthStepRenderProps {
  amount: string;
  isToExecute: boolean;

  token: TokenOption | null;
  tokenOptions: TokenOption[];
  onChangeToken: ChangeEventHandler<HTMLSelectElement>;

  shouldShowAttest: boolean;
  onAttest: () => void;

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

  shouldShowAttest,
  onAttest,
}: TerraToEthStepRenderProps) {
  return (
    <VStack spacing={4}>
      <Grid templateColumns="repeat(2, 1fr)" width="100%">
        <FormControl>
          <FormLabel>Source Chain</FormLabel>
          <ChainPicker
            state={sourceChainPickerState}
            placeholder="Select Source Chain"
          ></ChainPicker>
        </FormControl>
        <FormControl
          isInvalid={
            destChainPickerState.selectedChainOption?.key ===
            sourceChainPickerState.selectedChainOption?.key
          }
        >
          <FormLabel>Destination Chain</FormLabel>
          <ChainPicker
            state={destChainPickerState}
            placeholder="Select Destination Chain"
          ></ChainPicker>
          {destChainPickerState.selectedChainOption?.key ===
          sourceChainPickerState.selectedChainOption?.key ? (
            <FormErrorMessage>
              Source chain and destination need to be different.
            </FormErrorMessage>
          ) : null}
        </FormControl>
      </Grid>
      <FormControl>
        <FormLabel>Token to Bridge</FormLabel>
        <Select
          placeholder="Select token"
          value={token?.address}
          onChange={onChangeToken}
          disabled={!tokenOptions.length}
        >
          {tokenOptions.map((tokenOption) => (
            <option key={tokenOption.address} value={tokenOption.address}>
              {tokenOption.name} {tokenOption.symbol} {tokenOption.address}
            </option>
          ))}
        </Select>
        {shouldShowAttest ? (
          <VStack>
            <Text>
              Wrapped token not found on destination chain. Click "Attest Token"
              to create it.
            </Text>
            <Button onClick={onAttest}>Attest Token</Button>
          </VStack>
        ) : null}
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
            disabled={!tokenOptions.length || isToExecute}
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
      {progress || status ? (
        <HStack>
          {progress ? <Spinner /> : null}
          {status === "Success" ? <Text>🟢</Text> : null}
          <Text color={status && status !== "Success" ? "red" : "current"}>
            {progress || status}
          </Text>
        </HStack>
      ) : null}
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
  {
    key: CHAIN_ID_TERRA,
    name: "Terra",
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
