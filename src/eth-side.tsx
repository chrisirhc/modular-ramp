import React, { useState } from "react";
import { ethers, utils, BigNumber } from "ethers";

// From https://github.com/terra-money/shuttle/blob/main/TERRA_ASSET.md#erc20-contracts
const UST_CONTRACT = {
  ropsten: '0x6cA13a4ab78dd7D657226b155873A04DB929A3A4',
  mainnet: '0xa47c8bf37f92aBed4A126BDA807A7b7498661acD',
};
const ETH_TARGET_NETWORK = 'ropsten';

// Only works with Metamask right now.
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

export function EthSideComponent() {
  const [publicAddress, setPublicAddress] = useState(null);
  const [convertStatus, setConvertStatus] = useState(null);
  const [amountMinted, setAmountMinted] = useState(null);

  return (
    <>
      <div>
        <button onClick={connect} disabled={Boolean(publicAddress)}>
          {publicAddress ? `Connected to ${publicAddress}` : 'Connect'}
        </button>
      </div>
      {
        publicAddress ?
        (
          <div>
            {
              amountMinted ?
              `Amount minted ${amountMinted}` :
              'Waiting for transaction...'
            }
          </div>
        ) : null
      }
      <button onClick={() => go()} disabled={Boolean(convertStatus)}>
        {convertStatus || `Convert ${amountMinted} UST to USDC`}
      </button>
    </>
  );

  async function connect() {
    await provider.send("eth_requestAccounts", []);
    const publicAddress = await signer.getAddress();
    setPublicAddress(publicAddress);

    // Look for transfers to the target address
    // Since it's bridged, this is minted (i.e. fromAddress=0x0).
    const filter = {
        address: UST_CONTRACT[ETH_TARGET_NETWORK],
        topics: [
            utils.id("Transfer(address,address,uint256)"),
            utils.hexZeroPad('0x0', 32 /* length of these fields */),
            utils.hexZeroPad(publicAddress, 32)
        ]
    }
    provider.once(filter, (log, event) => {
        const {data} = log;
        const amountMinted = utils.formatEther(data);
        const amountMintedBN = BigNumber.from(data);
        setAmountMinted(amountMinted);
    });
  }

  function go() {
    setConvertStatus('Fetching from 1inch...');

    // https://etherscan.io/token/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
    const USDC_CONTRACT = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

    const fromTokenAddress = UST_CONTRACT.mainnet;
    const toTokenAddress = USDC_CONTRACT;
    const amount = utils.parseEther(amountMinted ?? '9.0');
    // TODO: Add referrerAddress is pretty cool, incentivizes the right behaviors, along with fee
    // const url = `https://api.1inch.exchange/v3.0/1/quote?fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}`;

    const fromAddress = publicAddress;
    const slippage = 0.5;
    // TODO: Check back later
    const disableEstimate = true; // remove later
    const url = `https://api.1inch.exchange/v3.0/1/swap?fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}&fromAddress=${fromAddress}&slippage=${slippage}${disableEstimate ? '&disableEstimate=true' : ''}`;
    fetch(url).then(r => r.json())
    .then(data => {
      console.log(data);

      /* Not yet tested */
      const {tx} = data;
      // Ethers will fill these
      delete tx.gas;
      delete tx.gasPrice;

      // Make value into hex per https://docs.1inch.io/api/nodejs-web3-example
      let value = parseInt(tx["value"]);			//get the value from the transaction
      value = '0x' + value.toString(16);				//add a leading 0x after converting from decimal to hexadecimal
      tx["value"] = value;
      return signer.sendTransaction(tx);
    })
    .then(() => {
      setConvertStatus('Transaction Sent!');
    }, () => {
      setConvertStatus('Transaction Failed.');
    });
  }
}