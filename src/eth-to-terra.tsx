import React, { useRef, useState, useContext } from "react";
import { ethers, utils, BigNumber } from "ethers";
import { ERC20_ABI } from "./erc20";
import SHUTTLE_ABI from "./shuttle-abi";
import { TerraContext } from "./WalletConnector";
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

type Balance = {
  balance: BigNumber;
  decimals: any;
  symbol: string;
};

function printBalance(bal: Balance | null) {
  return (bal && utils.formatUnits(bal.balance, bal.decimals)) || "";
}

export function EthToTerra() {
  const [publicAddress, setPublicAddress] = useState<string | null>(null);
  const [convertStatus, setConvertStatus] = useState<string | null>(null);
  const [balanceOfErc20, setBalanceOfErc20] = useState<Balance | null>(null);
  const amountToConvertInputEl = useRef<HTMLInputElement>(null);
  const terraContext = useContext(TerraContext);
  const { provider, signer } = useContext(EthereumContext);

  return (
    <div>
      <h3>Etherum UST Bridge to Shuttle</h3>
      <div>
        <button onClick={connect} disabled={Boolean(publicAddress)}>
          {publicAddress ? `Connected to ${publicAddress}` : "Connect"}
        </button>
      </div>
      {balanceOfErc20 ? (
        <div>
          UUSD balance
          <pre>{printBalance(balanceOfErc20)} UST</pre>
        </div>
      ) : null}
      <div>
        <label>
          Amount to convert from UST{" "}
          <input
            type="number"
            min={1}
            max={printBalance(balanceOfErc20)}
            ref={amountToConvertInputEl}
          />
        </label>
        <div>
          <button
            onClick={() =>
              convert(
                terraContext.address,
                amountToConvertInputEl.current?.value
              )
            }
          >
            Convert
          </button>
        </div>
      </div>
    </div>
  );

  async function connect() {
    if (!provider || !signer) {
      return;
    }

    await provider.send("eth_requestAccounts", []);
    const publicAddress = await signer.getAddress();
    setPublicAddress(publicAddress);

    const erc20 = new ethers.Contract(
      UST_CONTRACT[ETH_TARGET_NETWORK],
      ERC20_ABI,
      provider
    );

    const balance: BigNumber = await erc20.balanceOf(publicAddress);
    const decimals = await erc20.decimals();
    const symbol = await erc20.symbol();
    setBalanceOfErc20({ balance, decimals, symbol });
    // Look for transfers to the target address
    // Since it's bridged, this is minted (i.e. fromAddress=0x0).
    // const filter = {
    //     address: UST_CONTRACT[ETH_TARGET_NETWORK],
    //     topics: [
    //         utils.id("Transfer(address,address,uint256)"),
    //         utils.hexZeroPad('0x0', 32 /* length of these fields */),
    //         utils.hexZeroPad(publicAddress, 32)
    //     ]
    // }
    // provider.once(filter, (log, event) => {
    //     const {data} = log;
    //     const amountMinted = utils.formatEther(data);
    //     const amountMintedBN = BigNumber.from(data);
    //     setAmountMinted(amountMinted);
    // });
  }

  async function convert(
    toAddress: string | null | undefined,
    sendAmountInput: string | undefined
  ) {
    if (!toAddress || !balanceOfErc20 || !sendAmountInput) {
      return;
    }

    if (!signer) {
      return;
    }

    const shuttleContract = new ethers.Contract(
      UST_CONTRACT[ETH_TARGET_NETWORK],
      SHUTTLE_ABI,
      signer
    );
    const decoded = decodeTerraAddressOnEtherBase(toAddress);
    const sendAmount = utils.parseUnits(
      sendAmountInput,
      balanceOfErc20.decimals
    );
    try {
      const tx = shuttleContract.burn(sendAmount, decoded.padEnd(66, "0"));
      const { hash } = await tx;
      return { success: true, hash };
    } catch (error) {
      throw error;
      // return handleTxErrorFromEtherBase(error)
    }
  }

  function go() {
    // setConvertStatus('Fetching from 1inch...');
    // // https://etherscan.io/token/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
    // const USDC_CONTRACT = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    // const fromTokenAddress = UST_CONTRACT.mainnet;
    // const toTokenAddress = USDC_CONTRACT;
    // const amount = utils.parseEther(amountMinted ?? '9.0');
    // // TODO: Add referrerAddress is pretty cool, incentivizes the right behaviors, along with fee
    // // const url = `https://api.1inch.exchange/v3.0/1/quote?fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}`;
    // const fromAddress = publicAddress;
    // const slippage = 0.5;
    // // TODO: Check back later
    // const disableEstimate = true; // remove later
    // const url = `https://api.1inch.exchange/v3.0/1/swap?fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}&fromAddress=${fromAddress}&slippage=${slippage}${disableEstimate ? '&disableEstimate=true' : ''}`;
    // fetch(url).then(r => r.json())
    // .then(data => {
    //   console.log(data);
    //   /* Not yet tested */
    //   const {tx} = data;
    //   // Ethers will fill these
    //   delete tx.gas;
    //   delete tx.gasPrice;
    //   // Make value into hex per https://docs.1inch.io/api/nodejs-web3-example
    //   const valueInt = parseInt(tx["value"]);			//get the value from the transaction
    //   const valueStr = '0x' + valueInt.toString(16);				//add a leading 0x after converting from decimal to hexadecimal
    //   tx["value"] = valueStr;
    //   return signer.sendTransaction(tx);
    // })
    // .then(() => {
    //   setConvertStatus('Transaction Sent!');
    // }, () => {
    //   setConvertStatus('Transaction Failed.');
    // });
  }
}
