import {
  Coin,
  Coins,
  Dec,
  MsgSend,
  StdFee,
  CreateTxOptions,
  Int,
  LCDClient,
} from "@terra-money/terra.js";
import { NetworkInfo, TxResult } from "@terra-money/wallet-provider";
import { printTerraAmount, TERRA_DECIMAL } from "../utils";
import { RefreshBalanceRet, TerraContextProps } from "../TerraWalletConnector";
import { WalletContexts } from "../types";
import { TERRA_NETWORKS, NetworkType } from "../constants";

const MIN_FEE = new Coin("uusd", new Int(1 * TERRA_DECIMAL));

export interface EstTx {
  network: "terra";
  amount: Coin;
  amountStr: string;
  estTx: CreateTxOptions;
  estFees: StdFee;
  relayingFee: Coin;
  estOutputAmount: string;
}

export async function TerraToEth(
  uusdDec: string,
  { ethereumContext, terraContext }: WalletContexts
): Promise<EstTx> {
  const { address, networkType } = terraContext;
  if (!networkType) {
    throw new Error("No network type selected.");
  }
  if (!address) {
    throw new Error("No address found.");
  }
  if (!ethereumContext.publicAddress) {
    throw new Error("No Ethereum address found.");
  }

  const amountToConvert = new Coin(
    "uusd",
    new Dec(uusdDec).mul(TERRA_DECIMAL).toInt()
  );

  // https://docs.terra.money/dev/#currency-denominations
  const msg = new MsgSend(
    address,
    TERRA_NETWORKS[networkType].shuttle.ethereum,
    new Coins([amountToConvert])
  );

  const gasPriceInUusd = 0.15; // in uusd. TODO: This can change and should be retrieved from lcd.
  const estTxOptions: CreateTxOptions = {
    msgs: [msg],
    memo: ethereumContext.publicAddress,
    gasPrices: new Coins({ uusd: gasPriceInUusd }),
  };
  // Fee calculation is a PITA
  // See https://github.com/terra-money/bridge-web-app/blob/060979b7966d66368d54819a7c83f68949e71014/src/hooks/useSend.ts#L139-L197
  const terra = getLCDClient(terraContext);
  const estimatedFee = await terra.tx.estimateFee(address, estTxOptions.msgs);
  console.log("estimated gas needed", estimatedFee.gas);

  // Fee calculation is a PITA. Assume everything here is being calculated in uusd
  const taxAmount = await terra.utils.calculateTax(amountToConvert);
  // From https://tequila-fcd.terra.dev/v1/txs/gas_prices
  const gasFeeForGasLimit = new Int(estimatedFee.gas)
    .mul(gasPriceInUusd)
    .ceil(); // in uusd

  const estFee = taxAmount.add(gasFeeForGasLimit);
  const relayingFeeBeforMin = amountToConvert.mul(0.1 * 0.01); // 0.1%
  const relayingFee = relayingFeeBeforMin.amount.lessThan(MIN_FEE.amount)
    ? MIN_FEE
    : relayingFeeBeforMin; // Or $1
  // Need to apply min fee
  const fullFee = new StdFee(estimatedFee.gas, [estFee]);

  return {
    network: "terra",
    amount: amountToConvert,
    amountStr: uusdDec,
    estTx: estTxOptions,
    estFees: fullFee,
    relayingFee,
    estOutputAmount: printTerraAmount(amountToConvert.sub(relayingFee)),
  };
}

export type RunArg = EstTx;

export async function Run(
  estTx: EstTx,
  {
    onProgress = () => {},
    terraContext,
  }: {
    onProgress?: (status: string) => void;
    terraContext: TerraContextProps;
  }
) {
  const { post } = terraContext;
  if (!estTx || !post) {
    return;
  }

  return new Promise((resolve, reject) => {
    post({
      ...estTx.estTx,
      fee: estTx.estFees,
    }).then((payload) => {
      if (!payload.success) {
        reject(payload);
        onProgress("Transaction failed.");
        return;
      }
      console.log(payload);
      resolve(payload);
      onProgress(
        `Transaction ID: ${payload.result.txhash}, Success: ${payload.success}`
      );
    });
    onProgress("Posting transaction...");
  });
}

async function sleep(waitMs: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, waitMs);
  });
}

export async function WaitForBalanceChange({ terraContext }: WalletContexts) {
  let ret: RefreshBalanceRet | void;
  while (!ret?.balanceHasChanged) {
    // TODO: Exponential backoff?
    console.debug("Waiting, no change");
    await sleep(5000);
    ret = await terraContext.refreshBalance();
  }
  console.debug("Done waiting");
  return;
}

export function getLCDClient({ network }: { network: NetworkInfo | null }) {
  if (!network) {
    throw new Error("Wallet not connected.");
  }
  const URL = network.lcd;
  const chainID = network.chainID;
  return new LCDClient({
    URL,
    chainID,
  });
}

export function getFcdBase(networkType: NetworkType) {
  switch (networkType) {
    case "mainnet":
      return "https://fcd.terra.dev";
    case "testnet":
      return "https://bombay-fcd.terra.dev";
  }
}

export function getGasPricesUrl(networkType: NetworkType) {
  const TERRA_FCD_BASE = getFcdBase(networkType);
  return `${TERRA_FCD_BASE}/v1/txs/gas_prices`;
}

export async function postWithFees(
  networkType: NetworkType,
  wallet: TerraContextProps,
  msgs: any[],
  memo: string
) {
  if (!wallet.address || !wallet.post) {
    throw new Error("No address or post method");
  }

  // don't try/catch, let errors propagate
  const lcd = getLCDClient(wallet);
  //let gasPrices = await lcd.config.gasPrices //Unsure if the values returned from this are hardcoded or not.
  //Thus, we are going to pull it directly from the current FCD.
  let gasPrices = await fetch(getGasPricesUrl(networkType))
    .then((r) => r.json())
    .then((result) => result.data);

  const feeEstimate = await lcd.tx.estimateFee(wallet.address, [...msgs], {
    memo,
    feeDenoms: ["uluna"],
    gasPrices,
  });

  const result = await wallet.post({
    msgs: [...msgs],
    memo,
    feeDenoms: ["uluna"],
    gasPrices,
    fee: feeEstimate,
  });

  return result;
}

export async function waitForTerraExecution(
  wallet: TerraContextProps,
  transaction: TxResult
) {
  const lcd = getLCDClient(wallet);
  let info;
  while (!info) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      info = await lcd.tx.txInfo(transaction.result.txhash);
    } catch (e) {
      console.error(e);
    }
  }
  if (info.code !== undefined) {
    // error code
    throw new Error(
      `Tx ${transaction.result.txhash}: error code ${info.code}: ${info.raw_log}`
    );
  }
  return info;
}
