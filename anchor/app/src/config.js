import { PublicKey } from "@solana/web3.js";

export const SOLANA_HOST =
  process.env.REACT_APP_SOLANA_RPC_HOST || "https://api.devnet.solana.com";
export const PROGRAM_ID = new PublicKey(
  process.env.REACT_APP_PROGRAM_ID ||
    "8BThYttJrWRaQYwZmYkZiHQrE5nLaGYCS5mWXapyEEoa"
);
