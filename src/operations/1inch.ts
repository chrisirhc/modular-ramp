import { utils } from "ethers";
import { EthereumContextProps } from "../EthWalletConnector";
import { PrepTx, UST_CONTRACT } from "./ethereum";

// https://etherscan.io/token/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
const USDC_CONTRACT = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

export type Arg = {
  args: PrepTx;
  info: {
    amountString: string;
    fromToken: TokenResponse;
    fromTokenAmount: string;
    toToken: TokenResponse;
    toTokenAmount: string;
    outputAmount?: string;
  };
};

interface TokenResponse {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
}

type SwapResponse = {
  fromToken: TokenResponse;
  toToken: TokenResponse;
  fromTokenAmount: string;
  toTokenAmount: string;
  tx: any;
};

export async function estimate(
  {
    amountString,
    inputCurrency,
    outputCurrency,
  }: { amountString: string; inputCurrency: string; outputCurrency: string },
  { ethereumContext }: { ethereumContext: EthereumContextProps }
): Promise<Arg> {
  const { publicAddress } = ethereumContext;

  if (!(inputCurrency === "UST" && outputCurrency === "USDC")) {
    throw new Error(
      `Unsupported currencies, only UST to USDC is supported. You requested ${inputCurrency} -> ${outputCurrency}`
    );
  }

  const fromTokenAddress = UST_CONTRACT.mainnet;
  const toTokenAddress = USDC_CONTRACT;
  const amount = utils.parseEther(amountString);
  // TODO: Add referrerAddress is pretty cool, incentivizes the right behaviors, along with fee
  // const url = `https://api.1inch.exchange/v3.0/1/quote?fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}`;

  const fromAddress = publicAddress;
  const slippage = 0.5;
  // TODO: Check back later
  // Will return fail if it doesn't have allowance.
  const disableEstimate = true; // remove later
  const url = `https://api.1inch.exchange/v3.0/1/swap?fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}&fromAddress=${fromAddress}&slippage=${slippage}${
    disableEstimate ? "&disableEstimate=true" : ""
  }`;
  return fetch(url)
    .then((r) => r.json())
    .then((data: SwapResponse) => {
      console.log(data);

      /* Not yet tested */
      const { tx, fromToken, fromTokenAmount, toToken, toTokenAmount } = data;
      return {
        info: {
          amountString,
          fromToken,
          fromTokenAmount,
          toToken,
          toTokenAmount,
        },
        args: {
          type: "tx",
          txArg: convertTxForTxArg(tx),
        },
      };
    });
}

export function convertTxForTxArg(rawTx: any) {
  const tx = { ...rawTx };
  // Ethers will fill these
  delete tx.gas;
  delete tx.gasPrice;

  // Make value into hex per https://docs.1inch.io/api/nodejs-web3-example
  const valueInt = parseInt(tx["value"]); //get the value from the transaction
  const valueStr = "0x" + valueInt.toString(16); //add a leading 0x after converting from decimal to hexadecimal
  tx["value"] = valueStr;
  return tx;
}
