import { ethers, utils, BigNumber, providers } from "ethers";
import { bech32 } from "bech32";
import { ERC20_ABI } from "../erc20";
import SHUTTLE_ABI from "../shuttle-abi";
import { EthereumContextProps } from "../EthWalletConnector";
import { TerraContextProps } from "../WalletConnector";

const ETH_TARGET_NETWORK = 'ropsten';
const ETH_DEST_ADDRESS = '0x88fc7C092aFF64bf5319e9F1Ab2D9DDC5f854449';

// From https://github.com/terra-money/shuttle/blob/main/TERRA_ASSET.md#erc20-contracts
export const UST_CONTRACT = {
  ropsten: '0x6cA13a4ab78dd7D657226b155873A04DB929A3A4',
  mainnet: '0xa47c8bf37f92aBed4A126BDA807A7b7498661acD',
};

const UST_ERC20_DECIMALS = 18;

type ShuttleBurnTx = {
  type: 'shuttleBurn',
  shuttleBurnArgs: {
    toAddress: string | null | undefined,
    ustAmount: string | undefined,
  },
};

type Tx = {
  type: 'tx',
  txArg: ethers.providers.TransactionRequest,
};

export type PrepTx = ShuttleBurnTx | Tx;

/* bech32 */
const decodeTerraAddressOnEtherBase = (address: string): string => {
  try {
    const { words } = bech32.decode(address)
    const data = bech32.fromWords(words)
    return '0x' + Buffer.from(data).toString('hex')
  } catch (error) {
    return ''
  }
}

export async function EthToTerra(
  ustAmount: string,
  {ethereumContext, terraContext}: {ethereumContext: EthereumContextProps, terraContext: TerraContextProps}
): Promise<PrepTx> {
  // TODO: Fee estimation on Ethereum is a mystery
  const toAddress = terraContext.address;

  return {
    type: 'shuttleBurn',
    shuttleBurnArgs: {
      toAddress,
      ustAmount,
    }
  };
}

export type RunArg = PrepTx;

export async function Run(estTx: PrepTx, {
  onProgress = () => {},
  ethereumContext,
}: {
  onProgress?: (status: string) => void,
  ethereumContext: EthereumContextProps,
}) {
  if (estTx.type === 'tx') {
    if (!ethereumContext.signer) {
      throw new Error('Missing signer');
    }
    return ethereumContext.signer.signTransaction(estTx.txArg);
  }

  if (estTx.type === 'shuttleBurn') {
    if (!estTx.shuttleBurnArgs) {
      throw new Error('Missing args');
    }
    return shuttleBurn(estTx.shuttleBurnArgs, {ethereumContext});
  }
}

async function shuttleBurn({
    toAddress,
    ustAmount
  }:{
    toAddress: string | null | undefined,
    ustAmount: string | undefined
  },
  {ethereumContext}: {ethereumContext: EthereumContextProps}) {
  const {signer} = ethereumContext;

  if (!toAddress || !ustAmount) {
    return;
  }

  if (!signer) {
    return;
  }

  const shuttleContract = new ethers.Contract(UST_CONTRACT[ETH_TARGET_NETWORK], SHUTTLE_ABI, signer);
  const decoded = decodeTerraAddressOnEtherBase(toAddress)
  const sendAmount = utils.parseUnits(ustAmount, UST_ERC20_DECIMALS);
  try {
    const tx = shuttleContract.burn(sendAmount, decoded.padEnd(66, '0'))
    const { hash } = await tx;
    return { success: true, hash }
  } catch (error) {
    throw error;
    // return handleTxErrorFromEtherBase(error)
  }
}
