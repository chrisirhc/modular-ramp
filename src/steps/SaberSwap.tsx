import React, {
  useEffect,
  useState,
  useRef,
  ChangeEventHandler,
  useCallback,
  useMemo,
  FC,
  MouseEventHandler,
} from "react";
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  VStack,
  HStack,
} from "@chakra-ui/react";
import { StepProps } from "../types";
import {
  StableSwap,
  makeExchange,
  loadExchangeInfo,
  calculateEstimatedSwapOutputAmount,
  calculateSwapPrice,
} from "@saberhq/stableswap-sdk";
import { TokenAmount, Token, TokenInfo } from "@saberhq/token-utils";
import {
  getConnection,
  useCreateTokenAccount,
  useTokenAccount,
  signSendAndConfirm,
} from "../operations/solana";
import { useSolanaWallet } from "../wallet/SolanaWalletProvider";
import { PublicKey, Transaction } from "@solana/web3.js";
import { NetworkType } from "../constants";
import {
  mainnetSwapList as swapList,
  mainnetTokenList as tokenList,
} from "../operations/saber";
import { u64 } from "@solana/spl-token";

SaberSwap.stepTitle = "SaberSwap";

export function SaberSwap({}: StepProps) {
  const networkType: NetworkType = "mainnet";
  const wallet = useSolanaWallet();
  const fromTokenState = useTokenInfoSelectState();
  const toTokenState = useTokenInfoSelectState();
  const sourceTokenAccount = useTokenAccount({
    networkType,
    targetAsset: fromTokenState.selectedTokenInfo?.address,
  });
  const destTokenAccount = useTokenAccount({
    networkType,
    targetAsset: toTokenState.selectedTokenInfo?.address,
  });
  const createTokenAccount = useCreateTokenAccount({
    networkType,
    targetAsset: toTokenState.selectedTokenInfo?.address,
  });
  const [amount, setAmount] = useState<string>();
  const [estimatedAmountOut, setEstimatedAmountOut] = useState<TokenAmount>();
  const [stableSwap, setStableSwap] = useState<StableSwap>();

  const onChangeSetAmount = useCallback((event) => {
    setAmount(event.target.value);
  }, []);

  const swap = useMemo(() => {
    if (!fromTokenState.selectedTokenInfo || !toTokenState.selectedTokenInfo) {
      return;
    }
    // Find the matching based on from and to token
    const tokenA = fromTokenState.selectedTokenInfo.address;
    const tokenB = toTokenState.selectedTokenInfo.address;
    const swapCandidate = swapList.find(
      ({ underlyingTokens }) =>
        (underlyingTokens[0] === tokenA && underlyingTokens[1] === tokenB) ||
        (underlyingTokens[1] === tokenA && underlyingTokens[0] === tokenB)
    );
    return swapCandidate;
  }, [fromTokenState, toTokenState]);

  console.log("Swap find", swap);

  useEffect(() => {
    if (
      !wallet.publicKey ||
      !sourceTokenAccount ||
      !fromTokenState.selectedTokenInfo ||
      !toTokenState.selectedTokenInfo ||
      !swap
    ) {
      return;
    }
    const connection = getConnection(networkType);
    const swapAccount = new PublicKey(swap.addresses.swapAccount);

    const exchange = makeExchange({
      swapAccount,
      lpToken: new PublicKey(swap.addresses.lpTokenMint),
      tokenA: fromTokenState.selectedTokenInfo,
      tokenB: toTokenState.selectedTokenInfo,
    });

    if (!exchange) {
      return;
    }
    console.log(exchange);

    let canceled = false;
    // Use this to test effects
    const s = StableSwap.loadFromExchange(connection, exchange);
    s.then(async (s) => {
      if (canceled) {
        return;
      }
      setStableSwap(s);

      // Run estimation
      if (
        !wallet.publicKey ||
        !sourceTokenAccount ||
        !fromTokenState.selectedTokenInfo ||
        !amount
      ) {
        return;
      }
      console.log("StableSwap ready", s);

      const fromToken = new Token(fromTokenState.selectedTokenInfo);
      const fromAmount = TokenAmount.parse(fromToken, amount);
      const amountIn: u64 = fromAmount.toU64();

      console.log("sourceTokenAccount", sourceTokenAccount);
      console.log("destTokenAccount", destTokenAccount);
      console.log("amountIn", amountIn);

      const exchangeInfo = await loadExchangeInfo(connection, exchange, s);
      const swapPrice = calculateSwapPrice(exchangeInfo);
      console.log(swapPrice);

      const estimate = calculateEstimatedSwapOutputAmount(
        exchangeInfo,
        fromAmount
      );
      setEstimatedAmountOut(estimate.outputAmount);

      console.log(estimate);
    });

    return () => {
      canceled = true;
    };
  }, [
    wallet,
    sourceTokenAccount,
    destTokenAccount,
    fromTokenState.selectedTokenInfo,
    swap,
    amount,
  ]);

  const onClickSwap = useCallback(async () => {
    if (
      !wallet.publicKey ||
      !sourceTokenAccount ||
      !fromTokenState.selectedTokenInfo ||
      !swap ||
      !estimatedAmountOut ||
      !amount ||
      !stableSwap
    ) {
      return;
    }
    const connection = getConnection(networkType);

    // Source token account "USDC"
    const userSource = new PublicKey(sourceTokenAccount);

    // May not be right
    const poolSource = new PublicKey(swap.underlyingTokens[0]);
    const poolDestination = new PublicKey(swap.underlyingTokens[1]);

    const userAuthority = wallet.publicKey;
    const userDestination = destTokenAccount;
    if (!userAuthority || !userDestination) {
      return;
    }

    const fromToken = new Token(fromTokenState.selectedTokenInfo);
    const fromAmount = TokenAmount.parse(fromToken, amount);
    const amountIn: u64 = fromAmount.toU64();
    const minimumAmountOut = estimatedAmountOut.toU64();
    const swapArg = {
      userAuthority,
      userSource,
      userDestination,
      poolSource,
      poolDestination,
      amountIn,
      minimumAmountOut,
    };

    console.log(swapArg);
    const instruction = stableSwap.swap(swapArg);
    const { blockhash } = await connection.getRecentBlockhash();
    const t = new Transaction({
      recentBlockhash: blockhash,
      feePayer: wallet.publicKey,
    });
    t.add(instruction);

    signSendAndConfirm(wallet, connection, t);
  }, [
    amount,
    destTokenAccount,
    estimatedAmountOut,
    fromTokenState.selectedTokenInfo,
    sourceTokenAccount,
    stableSwap,
    swap,
    wallet,
  ]);

  // Make sure the token account is created. Otherwise, the transaction will fail.
  return (
    <SaberSwapRender
      fromTokenState={fromTokenState}
      toTokenState={toTokenState}
      onChangeSetAmount={onChangeSetAmount}
      onClickSwap={onClickSwap}
      amount={amount || ""}
      estimatedAmountOut={estimatedAmountOut?.asNumber || ""}
      isExecuting={false}
    ></SaberSwapRender>
  );
}

interface TokenInfoSelectState {
  selectedTokenInfo: TokenInfo | undefined;
  onChangeSelect: ChangeEventHandler<HTMLSelectElement>;
  tokenInfoOptions: TokenInfo[];
}

export function useTokenInfoSelectState(): TokenInfoSelectState {
  const [selectedTokenInfo, setSelectedTokenInfo] = useState<TokenInfo>();
  const tokenInfoOptions = tokenList;
  const onChangeSelect: ChangeEventHandler<HTMLSelectElement> = useCallback(
    (event) => {
      const addressToFind = event.target.value;
      const tokenInfo = tokenList.find(
        ({ address }) => address === addressToFind
      );
      setSelectedTokenInfo(tokenInfo);
    },
    []
  );

  return useMemo(
    () => ({
      selectedTokenInfo,
      onChangeSelect,
      tokenInfoOptions,
    }),
    [selectedTokenInfo, tokenInfoOptions, onChangeSelect]
  );
}

function TokenInfoSelect({
  state: { selectedTokenInfo, onChangeSelect, tokenInfoOptions },
}: {
  state: TokenInfoSelectState;
}) {
  return (
    <Select
      value={selectedTokenInfo?.address}
      placeholder="Select token"
      onChange={onChangeSelect}
    >
      {tokenInfoOptions.map(({ address, name }) => (
        <option value={address} key={address}>
          {name}
        </option>
      ))}
    </Select>
  );
}

export interface SaberSwapRenderProps {
  fromTokenState: TokenInfoSelectState;
  toTokenState: TokenInfoSelectState;
  onChangeSetAmount: ChangeEventHandler;
  onClickSwap: MouseEventHandler;
  isExecuting: boolean;
  amount: string;
  estimatedAmountOut: string | number;
}

// (event) => setAmount(event.target.value)

export function SaberSwapRender({
  fromTokenState,
  toTokenState,
  onChangeSetAmount,
  onClickSwap,
  amount,
  estimatedAmountOut,
  isExecuting,
}: SaberSwapRenderProps) {
  return (
    <VStack>
      <HStack>
        <FormControl>
          <FormLabel>From Token</FormLabel>
          <TokenInfoSelect state={fromTokenState} />
        </FormControl>
        <FormControl>
          <FormLabel>From Amount</FormLabel>
          <InputGroup>
            <Input
              placeholder="Enter amount"
              type="number"
              pr="4.5rem"
              min="0"
              value={amount || ""}
              disabled={isExecuting}
              onChange={onChangeSetAmount}
            />
            <InputRightElement
              pointerEvents="none"
              color="gray.300"
              fontSize="1.2em"
              width="4.5rem"
              children={fromTokenState.selectedTokenInfo?.symbol}
            />
          </InputGroup>
        </FormControl>
      </HStack>
      <HStack>
        <FormControl>
          <FormLabel>To Token</FormLabel>
          <TokenInfoSelect state={toTokenState} />
        </FormControl>
        <FormControl>
          <FormLabel>To Amount</FormLabel>
          <InputGroup>
            <Input
              placeholder="Enter amount"
              type="number"
              pr="4.5rem"
              min="0"
              value={estimatedAmountOut || ""}
              readOnly
              disabled={isExecuting}
            />
            <InputRightElement
              pointerEvents="none"
              color="gray.300"
              fontSize="1.2em"
              width="4.5rem"
              children={toTokenState.selectedTokenInfo?.symbol}
            />
          </InputGroup>
        </FormControl>
      </HStack>
      <HStack>
        <Button>Create Token Account</Button>
        <Button onClick={onClickSwap}>Swap</Button>
      </HStack>
      {/* <ApproveButton amount={amount} ethereumContext={ethereumContext} />
      {progress ? <Spinner /> : null}
      {progress || status} */}
    </VStack>
  );
}
