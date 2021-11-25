import { ethers, utils } from "ethers";
import { bech32 } from "bech32";
import SHUTTLE_ABI from "../shuttle-abi";
import { EthereumContextProps } from "../wallet/MetamaskWalletConnector";
import { TerraContextProps } from "../TerraWalletConnector";
import { NetworkType } from "../constants";

// From https://github.com/terra-money/shuttle/blob/main/TERRA_ASSET.md#erc20-contracts
export const UST_CONTRACT: Record<NetworkType, string> = {
  testnet: "0x6cA13a4ab78dd7D657226b155873A04DB929A3A4",
  mainnet: "0xa47c8bf37f92aBed4A126BDA807A7b7498661acD",
} as const;

const UST_ERC20_DECIMALS = 18;

type ShuttleBurnTx = {
  type: "shuttleBurn";
  shuttleBurnArgs: {
    toAddress: string | null | undefined;
    ustAmount: string | undefined;
  };
};

type Tx = {
  type: "tx";
  txArg: ethers.providers.TransactionRequest;
};

export type PrepTx = ShuttleBurnTx | Tx;

type WalletContexts = {
  ethereumContext: EthereumContextProps;
  terraContext: TerraContextProps;
};

/* bech32 */
export const decodeTerraAddressOnEtherBase = (address: string): string => {
  try {
    const { words } = bech32.decode(address);
    const data = bech32.fromWords(words);
    return "0x" + Buffer.from(data).toString("hex");
  } catch (error) {
    return "";
  }
};

export async function EthToTerra(
  ustAmount: string,
  {
    ethereumContext,
    terraContext,
  }: { ethereumContext: EthereumContextProps; terraContext: TerraContextProps }
): Promise<PrepTx> {
  // TODO: Fee estimation on Ethereum is a mystery
  const toAddress = terraContext.address;

  return {
    type: "shuttleBurn",
    shuttleBurnArgs: {
      toAddress,
      ustAmount,
    },
  };
}

export type RunArg = PrepTx;

export async function Run(
  estTx: PrepTx,
  {
    onProgress = () => {},
    ethereumContext,
  }: {
    onProgress?: (status: string) => void;
    ethereumContext: EthereumContextProps;
  }
) {
  switch (estTx.type) {
    case "tx":
      if (!ethereumContext.signer) {
        throw new Error("Missing signer");
      }
      onProgress("Initiating transaction...");
      try {
        const ret = await ethereumContext.signer.sendTransaction(estTx.txArg);
        onProgress("Transaction successful");
        return ret;
      } catch (e) {
        onProgress(`Transaction failed: ${e?.message}`);
        return;
      }
    case "shuttleBurn":
      if (!estTx.shuttleBurnArgs) {
        throw new Error("Missing args");
      }
      return shuttleBurn(estTx.shuttleBurnArgs, {
        ethereumContext,
        onProgress,
      });
    default:
      const _exhaustiveCheck: never = estTx;
      throw new Error(`Unreachable code reached due to ${_exhaustiveCheck}`);
  }
}

async function shuttleBurn(
  {
    toAddress,
    ustAmount,
  }: {
    toAddress: string | null | undefined;
    ustAmount: string | undefined;
  },
  {
    onProgress = () => {},
    ethereumContext,
  }: {
    onProgress?: (status: string) => void;
    ethereumContext: EthereumContextProps;
  }
) {
  const { signer, networkType } = ethereumContext;

  if (!toAddress || !ustAmount || !networkType) {
    return;
  }

  if (!signer) {
    return;
  }

  const shuttleContract = new ethers.Contract(
    UST_CONTRACT[networkType],
    SHUTTLE_ABI,
    signer
  );
  const decoded = decodeTerraAddressOnEtherBase(toAddress);
  const sendAmount = utils.parseUnits(ustAmount, UST_ERC20_DECIMALS);
  try {
    const tx = shuttleContract.burn(sendAmount, decoded.padEnd(66, "0"));
    onProgress("Initiating transaction...");
    const { hash } = await tx;
    onProgress("Transaction successful.");
    return { success: true, hash };
  } catch (error) {
    throw error;
    // return handleTxErrorFromEtherBase(error)
  }
}

export async function waitForShuttle({ ethereumContext }: WalletContexts) {
  const { provider, publicAddress, networkType } = ethereumContext;
  if (!publicAddress) {
    throw new Error("No public address of ethereum wallet");
  }
  if (!provider) {
    throw new Error("No provider");
  }
  if (!networkType) {
    throw new Error("No network type selected");
  }

  return new Promise((resolve) => {
    // Look for transfers to the target address
    // Since it's bridged, this is minted (i.e. fromAddress=0x0).
    const address = UST_CONTRACT[networkType];
    console.debug(
      `Waiting for contract (${address}) transfer() activity to `,
      publicAddress
    );
    const filter = {
      address,
      topics: [
        utils.id("Transfer(address,address,uint256)"),
        utils.hexZeroPad("0x0", 32 /* length of these fields */),
        utils.hexZeroPad(publicAddress, 32),
      ],
    };
    provider.once(filter, (log, _) => {
      const { data } = log;
      const amountMinted = utils.formatEther(data);
      resolve(amountMinted);
    });
  });
}
