import React, { createContext, useEffect, useRef, useState } from "react";
import { ethers, utils, BigNumber } from "ethers";
import { ERC20_ABI } from "./erc20";
import SHUTTLE_ABI from "./shuttle-abi";

// From https://github.com/terra-money/shuttle/blob/main/TERRA_ASSET.md#erc20-contracts
const UST_CONTRACT = {
  ropsten: '0x6cA13a4ab78dd7D657226b155873A04DB929A3A4',
  mainnet: '0xa47c8bf37f92aBed4A126BDA807A7b7498661acD',
};
const ETH_TARGET_NETWORK = 'ropsten';

export type EthereumContextProps = {
  USTBalance?: Balance | null,
  publicAddress?: string | null,
};

// Only works with Metamask right now.
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const erc20 = new ethers.Contract(UST_CONTRACT[ETH_TARGET_NETWORK], ERC20_ABI, provider);
const shuttleContract = new ethers.Contract(UST_CONTRACT[ETH_TARGET_NETWORK], SHUTTLE_ABI, signer);

export const EthereumContext = createContext<EthereumContextProps>({});

type Props = {
  children: React.ReactNode,
};

type Balance = {
  balance: BigNumber,
  decimals: any,
  symbol: string,
};

function printBalance(bal: Balance | null) {
  return bal && utils.formatUnits(bal.balance, bal.decimals) || '';
}

export function EthWalletConnector({children}: Props) {
  const [publicAddress, setPublicAddress] = useState<string | null>(null);
  const [USTBalance, setUSTBalance] = useState<Balance | null>(null);

  return (
    <div>
      <div style={{
        border: '1px solid #ccc',
        padding: '5px',
      }}>
        <h3>Ethereum</h3>
        <button onClick={connect} disabled={Boolean(publicAddress)}>
          {publicAddress ? `Connected to ${publicAddress}` : 'Connect'}
        </button>
        {
          USTBalance ? (
            <div>
              UUSD balance
              <pre>{ printBalance(USTBalance) } UST</pre>
            </div>
          ) : null
        }
      </div>
      <EthereumContext.Provider value={{
        USTBalance,
        publicAddress,
      }}>
        {children}
      </EthereumContext.Provider>
    </div>
  );

  async function connect() {
    await provider.send("eth_requestAccounts", []);
    const publicAddress = await signer.getAddress();
    setPublicAddress(publicAddress);

    const balance: BigNumber = await erc20.balanceOf(publicAddress);
    const decimals = await erc20.decimals();
    const symbol = await erc20.symbol();
    setUSTBalance({balance, decimals, symbol});
  }
}