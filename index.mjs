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
const tx = await wallet.createAndSignTx({
  msgs: [msg],
  memo: ETH_DEST_ADDRESS,
  gasPrices: { uusd: 0.15 },
  // Fee calculation is a PITA
})

// Fee calculation is a PITA
const taxAmount = await terra.utils.calculateTax(new Coin('uusd', new Int(10).mul(TERRA_DECIMAL)));
const ASSUMED_GAS_LIMIT = 20_000;
// From https://tequila-fcd.terra.dev/v1/txs/gas_prices
const gasPrice = 0.15; // in uusd
const gasFeeForGasLimit = 0.15 * ASSUMED_GAS_LIMIT; // in uusd
const gasFeeNoTax = new StdFee(ASSUMED_GAS_LIMIT, new Coins({uusd: gasFeeForGasLimit}));
const fullFee = new StdFee(gasFeeNoTax.gas, gasFeeNoTax.amount.add(taxAmount));
console.log('fullFee', fullFee.amount, 'gasFeeNoTax', gasFeeNoTax.amount);

console.log(tx.fee.gas);
// const txResult = await terra.tx.broadcast(tx);

// console.log(txResult);