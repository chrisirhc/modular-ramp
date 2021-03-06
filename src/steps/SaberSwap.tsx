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
  IExchangeInfo,
} from "@saberhq/stableswap-sdk";
import { TokenAmount, Token, TokenInfo } from "@saberhq/token-utils";
import {
  getConnection,
  useCreateTokenAccount,
  useTokenAccount,
  signSendAndConfirm,
} from "../operations/solana";
import { useSolanaWallet } from "../wallet/SolanaWalletProvider";
import { useNetworkType } from "../wallet/NetworkTypeContext";
import { PublicKey, Transaction } from "@solana/web3.js";
import { NetworkType } from "../constants";
import { SWAP_LIST, TOKEN_LIST } from "../operations/saber";
import { u64 } from "@solana/spl-token";

SaberSwap.stepTitle = "SaberSwap";

export function SaberSwap({}: StepProps) {
  const networkType = useNetworkType();
  const wallet = useSolanaWallet();
  const fromTokenState = useTokenInfoSelectState(networkType);
  const toTokenState = useTokenInfoSelectState(networkType);
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
  const [stableSwap, setStableSwap] = useState<StableSwap>();
  const [exchangeInfo, setExchangeInfo] = useState<IExchangeInfo>();

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
    const swapCandidate = SWAP_LIST[networkType].find(
      ({ underlyingTokens }) =>
        (underlyingTokens[0] === tokenA && underlyingTokens[1] === tokenB) ||
        (underlyingTokens[1] === tokenA && underlyingTokens[0] === tokenB)
    );
    return swapCandidate;
  }, [
    fromTokenState.selectedTokenInfo,
    networkType,
    toTokenState.selectedTokenInfo,
  ]);

  console.log("Swap find", swap);

  useEffect(() => {
    if (
      !wallet.publicKey ||
      !sourceTokenAccount ||
      !fromTokenState.selectedTokenInfo ||
      !toTokenState.selectedTokenInfo ||
      !swap
    ) {
      setStableSwap(undefined);
      setExchangeInfo(undefined);
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

      // TODO: Note we may want to do this again later / refresh this later at some interval
      const newExchangeInfo = await loadExchangeInfo(connection, exchange, s);
      if (canceled) {
        return;
      }
      setExchangeInfo(newExchangeInfo);
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
    toTokenState.selectedTokenInfo,
    networkType,
  ]);

  const estimate = useMemo(() => {
    // Run estimation
    if (!fromTokenState.selectedTokenInfo || !amount || !exchangeInfo) {
      return;
    }
    const fromToken = new Token(fromTokenState.selectedTokenInfo);
    const fromAmount = TokenAmount.parse(fromToken, amount);
    const swapPrice = calculateSwapPrice(exchangeInfo);
    console.log(swapPrice);

    const estimate = calculateEstimatedSwapOutputAmount(
      exchangeInfo,
      fromAmount
    );
    return estimate;
  }, [amount, exchangeInfo, fromTokenState.selectedTokenInfo]);

  const onClickSwap = useCallback(async () => {
    if (
      !wallet.publicKey ||
      !sourceTokenAccount ||
      !fromTokenState.selectedTokenInfo ||
      !swap ||
      !estimate ||
      !amount ||
      !stableSwap
    ) {
      return;
    }
    const connection = getConnection(networkType);

    // Source token account "USDC"
    const userSource = new PublicKey(sourceTokenAccount);

    const tokenAIsFromToken =
      fromTokenState.selectedTokenInfo.address === swap.underlyingTokens[0];
    const poolSource = new PublicKey(
      swap.addresses.reserves[tokenAIsFromToken ? 0 : 1]
    );
    const poolDestination = new PublicKey(
      swap.addresses.reserves[tokenAIsFromToken ? 1 : 0]
    );

    const userAuthority = wallet.publicKey;
    const userDestination = destTokenAccount;
    if (!userAuthority || !userDestination) {
      return;
    }

    const fromToken = new Token(fromTokenState.selectedTokenInfo);
    const fromAmount = TokenAmount.parse(fromToken, amount);
    const amountIn: u64 = fromAmount.toU64();
    const minimumAmountOut = estimate.outputAmount.toU64();
    const swapArg = {
      userAuthority,
      userSource,
      userDestination,
      poolSource,
      poolDestination,
      amountIn,
      // TODO: Check whether the calculation of the minimumAmount out is correct
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
    estimate,
    fromTokenState.selectedTokenInfo,
    networkType,
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
      estimatedAmountOut={estimate?.outputAmount?.asNumber || ""}
      isExecuting={false}
    ></SaberSwapRender>
  );
}

interface TokenInfoSelectState {
  selectedTokenInfo: TokenInfo | undefined;
  onChangeSelect: ChangeEventHandler<HTMLSelectElement>;
  tokenInfoOptions: TokenInfo[];
}

export function useTokenInfoSelectState(
  networkType: NetworkType
): TokenInfoSelectState {
  const [selectedTokenInfo, setSelectedTokenInfo] = useState<TokenInfo>();
  const tokenInfoOptions = TOKEN_LIST[networkType];
  const onChangeSelect: ChangeEventHandler<HTMLSelectElement> = useCallback(
    (event) => {
      const addressToFind = event.target.value;
      const tokenInfo = tokenInfoOptions.find(
        ({ address }) => address === addressToFind
      );
      setSelectedTokenInfo(tokenInfo);
    },
    [tokenInfoOptions]
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
              placeholder="-"
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
