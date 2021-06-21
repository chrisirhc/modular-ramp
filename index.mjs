import { LCDClient, Coin, MnemonicKey, MsgSend, Coins, Int, StdFee } from '@terra-money/terra.js';

// connect to soju testnet
const terra = new LCDClient({
  URL: 'https://tequila-lcd.terra.dev',
  chainID: 'tequila-0004',
});

const mk = new MnemonicKey({
  mnemonic: process.env.TERRA_PRIVATE_KEY
});
const wallet = terra.wallet(mk);

console.log(mk.accAddress);
console.log(await terra.bank.balance(mk.accAddress));

// Grab from https://github.com/terra-money/shuttle/blob/main/TERRA_ASSET.md#usage-instructions
const SHUTTLE_TO_TERRA_ADDRESS = {
  ropsten: 'terra10a29fyas9768pw8mewdrar3kzr07jz8f3n73t3',
};

const ETH_TARGET_NETWORK = 'ropsten';
const ETH_DEST_ADDRESS = '0x88fc7C092aFF64bf5319e9F1Ab2D9DDC5f854449';
// https://docs.terra.money/dev/#currency-denominations
const TERRA_DECIMAL = 1e6;
const msg = new MsgSend(
  wallet.key.accAddress,
  SHUTTLE_TO_TERRA_ADDRESS[ETH_TARGET_NETWORK],
  new Coins([
    new Coin('uusd', new Int(10).mul(TERRA_DECIMAL))
  ])
);

// Fee calculation is a PITA
// See https://github.com/terra-money/bridge-web-app/blob/060979b7966d66368d54819a7c83f68949e71014/src/hooks/useSend.ts#L139-L197
const estTx = await wallet.createTx({
  msgs: [msg],
  memo: ETH_DEST_ADDRESS,
  gasPrices: {uusd: 0.15},
});
const estimatedFee = await terra.tx.estimateFee(estTx);
console.log('estimated fee gas', estimatedFee.gas);

// Fee calculation is a PITA
const taxAmount = await terra.utils.calculateTax(new Coin('uusd', new Int(10).mul(TERRA_DECIMAL)));
// From https://tequila-fcd.terra.dev/v1/txs/gas_prices
const gasPrice = 0.15; // in uusd
const gasFeeForGasLimit = Math.ceil(0.15 * estimatedFee.gas); // in uusd
const gasFeeNoTax = new StdFee(estimatedFee.gas, new Coins({uusd: gasFeeForGasLimit}));
const fullFee = new StdFee(gasFeeNoTax.gas, gasFeeNoTax.amount.add(taxAmount));
console.log('fullFee', fullFee.amount, 'gasFeeNoTax', gasFeeNoTax.amount);

// Grab the amount of gas estimated here
console.log(estimatedFee.gas);

const tx = await wallet.createAndSignTx({
  msgs: [msg],
  memo: ETH_DEST_ADDRESS,
  gasPrices: {uusd: 0.15},
  fee: fullFee
});

console.log('estimated fee gas 2', tx.fee.gas)

const txResult = await terra.tx.broadcast(tx);

console.log(txResult);
