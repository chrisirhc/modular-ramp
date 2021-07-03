import React, { useContext, useEffect, useState } from "react";
import { ethers, utils, BigNumber, providers } from "ethers";
import { EthereumContext } from "./EthWalletConnector";

// Assume this is injected by Metamask
declare global {
  interface Window {
    ethereum: any;
  }
}

// From https://github.com/terra-money/shuttle/blob/main/TERRA_ASSET.md#erc20-contracts
const UST_CONTRACT = {
  ropsten: "0x6cA13a4ab78dd7D657226b155873A04DB929A3A4",
  mainnet: "0xa47c8bf37f92aBed4A126BDA807A7b7498661acD",
};
const ETH_TARGET_NETWORK = "ropsten";

export function EthSideComponent() {
  const [convertStatus, setConvertStatus] = useState<string | null>(null);
  const [amountMinted, setAmountMinted] = useState<string | null>(null);
  const { publicAddress, provider, signer } = useContext(EthereumContext);

  useEffect(() => {
    if (provider) {
      connect();
    }
  }, [provider]);

  return (
    <div>
      <h3>Etherum Conversion to USDC</h3>
      {publicAddress ? (
        <div>
          {amountMinted
            ? `Amount minted ${amountMinted}`
            : "Waiting for transaction..."}
        </div>
      ) : null}
      <button onClick={() => go()} disabled={Boolean(convertStatus)}>
        {convertStatus || `Convert ${amountMinted} UST to USDC`}
      </button>
    </div>
  );

  async function connect() {
    if (!publicAddress || !provider) {
      console.warn("Connect called without provider or publicAddress.");
      return;
    }

    // Look for transfers to the target address
    // Since it's bridged, this is minted (i.e. fromAddress=0x0).
    const filter = {
      address: UST_CONTRACT[ETH_TARGET_NETWORK],
      topics: [
        utils.id("Transfer(address,address,uint256)"),
        utils.hexZeroPad("0x0", 32 /* length of these fields */),
        utils.hexZeroPad(publicAddress, 32),
      ],
    };
    provider.once(filter, (log, event) => {
      const { data } = log;
      const amountMinted = utils.formatEther(data);
      const amountMintedBN = BigNumber.from(data);
      setAmountMinted(amountMinted);
    });
  }

  function go() {
    if (!signer) {
      console.warn("Convert called without signer.");
      return;
    }

    setConvertStatus("Fetching from 1inch...");

    // https://etherscan.io/token/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
    const USDC_CONTRACT = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

    const fromTokenAddress = UST_CONTRACT.mainnet;
    const toTokenAddress = USDC_CONTRACT;
    const amount = utils.parseEther(amountMinted ?? "9.0");
    // TODO: Add referrerAddress is pretty cool, incentivizes the right behaviors, along with fee
    // const url = `https://api.1inch.exchange/v3.0/1/quote?fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}`;

    const fromAddress = publicAddress;
    const slippage = 0.5;
    // TODO: Check back later
    const disableEstimate = true; // remove later
    const url = `https://api.1inch.exchange/v3.0/1/swap?fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}&fromAddress=${fromAddress}&slippage=${slippage}${
      disableEstimate ? "&disableEstimate=true" : ""
    }`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        console.log(data);

        /* Not yet tested */
        const { tx } = data;
        // Ethers will fill these
        delete tx.gas;
        delete tx.gasPrice;

        // Make value into hex per https://docs.1inch.io/api/nodejs-web3-example
        const valueInt = parseInt(tx["value"]); //get the value from the transaction
        const valueStr = "0x" + valueInt.toString(16); //add a leading 0x after converting from decimal to hexadecimal
        tx["value"] = valueStr;
        return signer.sendTransaction(tx);
      })
      .then(
        () => {
          setConvertStatus("Transaction Sent!");
        },
        () => {
          setConvertStatus("Transaction Failed.");
        }
      );
  }
}
