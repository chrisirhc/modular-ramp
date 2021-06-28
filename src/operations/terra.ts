import { LCDClient, Extension, Coin, Coins, Dec, MsgSend, StdFee, CreateTxOptions, Int } from "@terra-money/terra.js";
import { getLCDClient, printTerraAmount, TERRA_DECIMAL } from "../utils";
import {TerraContextProps} from "../WalletConnector";

const ETH_TARGET_NETWORK = 'ropsten';
const ETH_DEST_ADDRESS = '0x88fc7C092aFF64bf5319e9F1Ab2D9DDC5f854449';

// Grab from https://github.com/terra-money/shuttle/blob/main/TERRA_ASSET.md#usage-instructions
const SHUTTLE_TO_TERRA_ADDRESS = {
  ropsten: 'terra10a29fyas9768pw8mewdrar3kzr07jz8f3n73t3',
};

const MIN_FEE = new Coin('uusd', new Int(1 * TERRA_DECIMAL));

export interface EstTx {
  amount: Coin,
  estTx: CreateTxOptions,
  estFees: StdFee,
  relayingFee: Coin,
};

export async function TerraToEth(
  uusdDec: string,
  {terraContext}: {terraContext: TerraContextProps}
): Promise<EstTx> {
  const {address} = terraContext;
  if (!address) {
    throw new Error('No address found.');
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
    memo: ETH_DEST_ADDRESS,
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

  extension.post({
    ...estTx.estTx,
    fee: estTx.estFees,
  });
  extension.once('onPost', payload => {
    console.log(payload);
    onProgress(`Trancation ID: ${payload.id}, Success: ${payload.success}`)
  });
  onProgress('Converting...');
}