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
import { StepProps } from "../types";
import {
  SwapTokenInfo,
  StableSwap,
  makeExchange,
  loadExchangeInfo,
  calculateEstimatedSwapOutputAmount,
  calculateSwapPrice,
} from "@saberhq/stableswap-sdk";
import { TokenAmount, Token } from "@saberhq/token-utils";
import {
  getConnection,
  useCreateTokenAccount,
  useTokenAccount,
  signSendAndConfirm,
} from "../operations/solana";
import { useSolanaWallet } from "../wallet/SolanaWalletProvider";
import { PublicKey, Transaction } from "@solana/web3.js";
import { NetworkType } from "../constants";
import { tokenList } from "../operations/saber";
import { u64 } from "@solana/spl-token";

SaberSwap.stepTitle = "SaberSwap";

export function SaberSwap({}: StepProps) {
  const networkType: NetworkType = "testnet";
  const wallet = useSolanaWallet();
  const sourceTokenAccount = useTokenAccount({
    networkType,
    targetAsset: "2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8",
  });
  const destTokenAccount = useTokenAccount({
    networkType,
    targetAsset: "EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS",
  });
  const createTokenAccount = useCreateTokenAccount({
    networkType,
    targetAsset: "EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS",
  });

  useEffect(() => {
    if (!wallet.publicKey || !sourceTokenAccount) {
      return;
    }
    const connection = getConnection(networkType);
    /*
      "name": "UST-USDC",
      From https://github.com/saber-hq/saber-registry-dist/blob/23c9cb584e3e115a5af2e0ac2ad99a08e4e27177/data/swaps.mainnet.json#L1656

      "swapAccount": "KwnjUuZhTMTSGAaavkLEmSyfobY16JNH4poL9oeeEvE",
      "swapAuthority": "9osV5a7FXEjuMujxZJGBRXVAyQ5fJfBFNkyAf6fSz9kw"
    */
    const swapAccount = new PublicKey(
      // "KwnjUuZhTMTSGAaavkLEmSyfobY16JNH4poL9oeeEvE"
      "8Uq15j3bmhMAhLjRYh8RsobfcAMhMsgPgJgPCdjxCZv5"
    );

    const exchange = makeExchange({
      swapAccount,
      lpToken: new PublicKey(tokenList[0].address),
      tokenA: tokenList[1],
      tokenB: tokenList[2],
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
      console.log("StableSwap ready", s);

      const userAuthority = wallet.publicKey;
      const userDestination = destTokenAccount;
      if (!userAuthority || !userDestination) {
        return;
      }
      // Source token account "USDC"
      const userSource = new PublicKey(sourceTokenAccount);

      const poolSource = new PublicKey(
        "9tcUgn5Fcbkh1Q1GLKQceAgKt576c8w5MuskH1cSi9x5"
      );
      const poolDestination = new PublicKey(
        "4VtqtD2M5Jb1Du6RQ8YZepFuhFpSZhEjR7Ch3nJAdyLS"
      );

      const token = new Token(tokenList[1]);
      const fromAmount = TokenAmount.parse(token, "1");
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
      console.log(estimate);
      const minimumAmountOut = estimate.outputAmount.toU64();
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
      const instruction = s.swap(swapArg);
      const { blockhash } = await connection.getRecentBlockhash();
      const t = new Transaction({
        recentBlockhash: blockhash,
        feePayer: wallet.publicKey,
      });
      t.add(instruction);

      // Trigger this later
      // signSendAndConfirm(wallet, connection, t);
    });

    return () => {
      canceled = true;
    };
  }, [wallet, sourceTokenAccount, destTokenAccount]);

  // Make sure the token account is created. Otherwise, the transaction will fail.
  return (
    <VStack>
      <button onClick={createTokenAccount}>Create account</button>
    </VStack>
  );
  // return <SaberSwapRender></SaberSwapRender>;
}

interface TokenOption {
  key: string;
}

export interface SaberSwapRenderProps {
  fromTokenOptions: TokenOption[];
  toTokenOptions: TokenOption[];
  onChangeSetAmount: ChangeEventHandler;
  isExecuting: boolean;
  amount: string;
}

// (event) => setAmount(event.target.value)

export function SaberSwapRender({
  fromTokenOptions,
  onChangeSetAmount,
  amount,
  isExecuting,
}: SaberSwapRenderProps) {
  return (
    <VStack>
      <HStack>
        <FormControl>
          <FormLabel>From Token</FormLabel>
          <Select placeholder="Select token">
            {fromTokenOptions.map(({ key }) => (
              <option value="option1" key={key}>
                Option 1
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>To Token</FormLabel>
          <Select placeholder="Select token">
            <option value="option1">Option 1</option>
          </Select>
        </FormControl>
      </HStack>
      <FormControl>
        <FormLabel>Amount</FormLabel>
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
            children="UST"
          />
        </InputGroup>
      </FormControl>
      {/* <ApproveButton amount={amount} ethereumContext={ethereumContext} />
      {progress ? <Spinner /> : null}
      {progress || status} */}
    </VStack>
  );
}
