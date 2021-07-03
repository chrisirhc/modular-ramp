import { LCDClient, Extension, Coin, Coins, Dec, MsgSend, StdFee, CreateTxOptions, Int } from "@terra-money/terra.js";
import { EthereumContextProps } from "../EthWalletConnector";
import { getLCDClient, printTerraAmount, TERRA_DECIMAL } from "../utils";
import { RefreshBalanceFn, RefreshBalanceRet, TerraContextProps } from "../WalletConnector";
import { WalletContexts } from "../types";

const ETH_TARGET_NETWORK = 'ropsten';

// Grab from https://github.com/terra-money/shuttle/blob/main/TERRA_ASSET.md#usage-instructions
const SHUTTLE_TO_TERRA_ADDRESS = {
  ropsten: 'terra10a29fyas9768pw8mewdrar3kzr07jz8f3n73t3',
};

const MIN_FEE = new Coin('uusd', new Int(1 * TERRA_DECIMAL));

export interface EstTx {
  network: 'terra',
  amount: Coin,
  estTx: CreateTxOptions,
  estFees: StdFee,
  relayingFee: Coin,
};

export async function TerraToEth(
  uusdDec: string,
  {ethereumContext, terraContext}: 
    {ethereumContext: EthereumContextProps, terraContext: TerraContextProps}
): Promise<EstTx> {
  const {address} = terraContext;
  if (!address) {
    throw new Error('No address found.');
  }
  if (!ethereumContext.publicAddress) {
    throw new Error('No Ethereum address found.');
  }

  const amountToConvert = new Coin('uusd', new Dec(uusdDec).mul(TERRA_DECIMAL).toInt());

  // https://docs.terra.money/dev/#currency-denominations
  const msg = new MsgSend(
    address,
    SHUTTLE_TO_TERRA_ADDRESS[ETH_TARGET_NETWORK],
    new Coins([
      amountToConvert
    ])
  );

  const gasPriceInUusd = 0.15; // in uusd. TODO: This can change and should be retrieved from lcd.
  const estTxOptions: CreateTxOptions = {
    msgs: [msg],
    memo: ethereumContext.publicAddress,
    gasPrices: new Coins({uusd: gasPriceInUusd}),
  };
  // Fee calculation is a PITA
  // See https://github.com/terra-money/bridge-web-app/blob/060979b7966d66368d54819a7c83f68949e71014/src/hooks/useSend.ts#L139-L197
  const terra = getLCDClient();
  const estTx = await terra.tx.create(address, estTxOptions);
  const estimatedFee = await terra.tx.estimateFee(estTx);
  console.log('estimated gas needed', estimatedFee.gas);

  // Fee calculation is a PITA. Assume everything here is being calculated in uusd
  const taxAmount = await terra.utils.calculateTax(amountToConvert);
  // From https://tequila-fcd.terra.dev/v1/txs/gas_prices
  const gasFeeForGasLimit = new Int(estimatedFee.gas).mul(gasPriceInUusd).ceil(); // in uusd

  const estFee = taxAmount.add(gasFeeForGasLimit);
  const relayingFeeBeforMin = amountToConvert.mul(0.1 * 0.01); // 0.1%
  const relayingFee = relayingFeeBeforMin.amount.lessThan(MIN_FEE.amount) ? MIN_FEE : relayingFeeBeforMin; // Or $1
  // Need to apply min fee
  const fullFee = new StdFee(estimatedFee.gas, [estFee]);

  return {
    network: 'terra',
    amount: amountToConvert,
    estTx: estTxOptions,
    estFees: fullFee,
    relayingFee,
  };
}

export type RunArg = EstTx;

export async function Run(estTx: EstTx, {
  onProgress = () => {},
  terraContext,
}: {
  onProgress?: (status: string) => void,
  terraContext: TerraContextProps,
}) {
  const {extension} = terraContext;
  if (!estTx || !extension) {
    return;
  }

  return new Promise((resolve) => {
    extension.post({
      ...estTx.estTx,
      fee: estTx.estFees,
    });
    extension.once('onPost', payload => {
      console.log(payload);
      resolve(payload);
      onProgress(`Trancation ID: ${payload.id}, Success: ${payload.success}`)
    });
    onProgress('Converting...');
  });
}

async function sleep(waitMs: number) {
  return new Promise(resolve => {
    setTimeout(resolve, waitMs)
  });
}

export async function WaitForBalanceChange({terraContext}: WalletContexts) {
  let ret: RefreshBalanceRet | void;
  while (!ret?.balanceHasChanged) {
    // TODO: Exponential backoff?
    console.debug('Waiting, no change');
    await sleep(5000);
    ret = await terraContext.refreshBalance();
  }
  console.debug('Done waiting')
  return;
}
