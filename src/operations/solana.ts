import { WalletContextState } from "@solana/wallet-adapter-react";
import {
  Connection,
  Transaction,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  Token,
} from "@solana/spl-token";
import { NetworkType } from "../constants";
import { useCallback } from "react";
import { useSolanaWallet } from "../wallet/SolanaWalletProvider";

export async function signSendAndConfirm(
  wallet: WalletContextState,
  connection: Connection,
  transaction: Transaction
) {
  if (!wallet.signTransaction) {
    throw new Error("wallet.signTransaction is undefined");
  }
  const signed = await wallet.signTransaction(transaction);
  const txid = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction(txid);
  return txid;
}

interface UseCreateTokenAccountArgs {
  networkType: NetworkType | null;
  targetAsset: string | null | undefined;
}
export function useCreateTokenAccount({
  networkType,
  targetAsset,
}: UseCreateTokenAccountArgs) {
  const wallet = useSolanaWallet();

  const handleCreateTokenAccount = useCallback(() => {
    const solPK = wallet.publicKey;
    if (!solPK || !targetAsset || !networkType) {
      return;
    }
    const SOLANA_HOST = clusterApiUrl(
      networkType === "testnet" ? "testnet" : "mainnet-beta"
    );
    (async () => {
      const connection = new Connection(SOLANA_HOST, "confirmed");
      const mintPublicKey = new PublicKey(targetAsset);
      const payerPublicKey = new PublicKey(solPK); // currently assumes the wallet is the owner
      const associatedAddress = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mintPublicKey,
        payerPublicKey
      );
      try {
        const transaction = new Transaction().add(
          await Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            mintPublicKey,
            associatedAddress,
            payerPublicKey, // owner
            payerPublicKey // payer
          )
        );
        const { blockhash } = await connection.getRecentBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = new PublicKey(payerPublicKey);
        await signSendAndConfirm(wallet, connection, transaction);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [networkType, targetAsset, wallet]);

  return handleCreateTokenAccount;
}
