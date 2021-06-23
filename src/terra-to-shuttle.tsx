import React, { useEffect, useRef, useState } from "react";
import { LCDClient, Extension, Coin, Coins, Dec, MsgSend, StdFee, CreateTxOptions } from "@terra-money/terra.js";

type ConnectResponse = {
  address: string
};

const TERRA_DECIMAL = 1e6;
const ETH_TARGET_NETWORK = 'ropsten';
const ETH_DEST_ADDRESS = '0x88fc7C092aFF64bf5319e9F1Ab2D9DDC5f854449';

// Grab from https://github.com/terra-money/shuttle/blob/main/TERRA_ASSET.md#usage-instructions
const SHUTTLE_TO_TERRA_ADDRESS = {
  ropsten: 'terra10a29fyas9768pw8mewdrar3kzr07jz8f3n73t3',
};

// connect to soju testnet
const terra = new LCDClient({
  URL: 'https://tequila-lcd.terra.dev',
  chainID: 'tequila-0004',
});

function printTerraAmount(coin: Coin | null | undefined) {
  if (!coin) {
    return '';
  }
  return new Dec(coin.amount).div(TERRA_DECIMAL).toString();
}

export function TerraToShuttle() {
  const [extension, setExtension] = useState<Extension | null>(null);
  const [wallet, setWallet] = useState<ConnectResponse | null>(null);
  const [balance, setBalance] = useState<Coins | null>(null);
  const [estTx, setEstTx] = useState<EstTx | null>(null);
  const amountToConvertInputEl = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getBalance();
  }, [wallet])

  const uusdBal = balance && balance.get("uusd");

  return (
    <div>
      <h3>Terra To Shuttle</h3>
      <button onClick={connect} disabled={Boolean(wallet)}>
        {
          wallet ?
          `Connected to ${wallet.address}` :
          'Connect to Terra Station'
        }
      </button>
      {
        balance && balance.get("uusd") ? (
          <div>
            UUSD balance
            <pre>{ printTerraAmount(uusdBal) } UST</pre>
          </div>
        ) : null
      }
      <div>
        <label>
          Amount to convert from UST
          {' '}
          <input 
            type="number"
            min={1}
            max={uusdBal && uusdBal.amount.div(TERRA_DECIMAL).toString() || ''}
            ref={amountToConvertInputEl}
          />
        </label>
        <button onClick={() => {
          const value = amountToConvertInputEl.current?.value;
          if (!value) {
            console.error('No balance', value);
            return;
          }
          toShuttle(value);
        }}>
          Estimate
        </button>
        <div>
          <pre>{ printTerraAmount(estTx?.estFees?.amount?.get('uusd')) } UST</pre>
        </div>
        <EstTxToShuttle estTx={estTx} extension={extension} />
      </div>
    </div>
  );

  function connect() {
    const extension = new Extension();
    extension.connect();
    extension.on('onConnect', (w: ConnectResponse) => {
      setWallet(w);
    });
    setExtension(extension);
  }

  async function getBalance() {
    if (!wallet) {
      return;
    }
    const balance = await terra.bank.balance(wallet.address);
    setBalance(balance);
  }

  async function toShuttle(uusdDec: string) {
    if (!wallet) {
      return;
    }

    const amountToConvert = new Coin('uusd', new Dec(uusdDec).mul(TERRA_DECIMAL).toInt());

    // https://docs.terra.money/dev/#currency-denominations
    const msg = new MsgSend(
      wallet.address,
      SHUTTLE_TO_TERRA_ADDRESS[ETH_TARGET_NETWORK],
      new Coins([
        amountToConvert
      ])
    );

    const estTxOptions: CreateTxOptions = {
      msgs: [msg],
      memo: ETH_DEST_ADDRESS,
      gasPrices: {uusd: 0.15},
    };
    // Fee calculation is a PITA
    // See https://github.com/terra-money/bridge-web-app/blob/060979b7966d66368d54819a7c83f68949e71014/src/hooks/useSend.ts#L139-L197
    const estTx = await terra.tx.create(wallet.address, estTxOptions);
    const estimatedFee = await terra.tx.estimateFee(estTx);
    console.log('estimated gas needed', estimatedFee.gas);

    // Fee calculation is a PITA
    const taxAmount = await terra.utils.calculateTax(amountToConvert);
    // From https://tequila-fcd.terra.dev/v1/txs/gas_prices
    const gasPrice = 0.15; // in uusd
    const gasFeeForGasLimit = Math.ceil(0.15 * estimatedFee.gas); // in uusd
    const gasFeeNoTax = new StdFee(estimatedFee.gas, new Coins({uusd: gasFeeForGasLimit}));
    const fullFee = new StdFee(gasFeeNoTax.gas, gasFeeNoTax.amount.add(taxAmount));
    console.log(
      'fullFee', fullFee.amount.toString(),
      'gasFeeNoTax', gasFeeNoTax.amount.toString()
    );
    setEstTx({
      amount: amountToConvert,
      estTx: estTxOptions,
      estFees: fullFee,
    });
  }
}

type EstTx = {
  amount: Coin,
  estTx: CreateTxOptions,
  estFees: StdFee,
};

function EstTxToShuttle({estTx, extension}: {estTx: EstTx | null, extension: Extension | null}) {
  if (!estTx) {
    return null;
  }
  
  const uusdFees = estTx.estFees?.amount.get('uusd');
  if (!uusdFees) {
    return null;
  }

  return (
    <div>
      <pre>
{`Amount: ${ printTerraAmount(estTx.amount) }
Fees: ${ printTerraAmount(estTx.estFees?.amount.get('uusd')) }
Estimated amount to expect in Ethereum: ${ printTerraAmount(estTx.amount.sub(uusdFees.amount)) }`}
      </pre>
      <button onClick={convert}>Convert!</button>
    </div>
  );

  function convert() {
    if (!estTx || !extension) {
      return;
    }

    extension.post({
      ...estTx.estTx,
      fee: estTx.estFees,
    });
    extension.once('onPost', payload => {
      console.log(payload);

    });
  }
}
