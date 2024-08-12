import { PublicKey } from "@solana/web3.js";

export const SOLANA_HOST =
  process.env.REACT_APP_SOLANA_RPC_HOST || "https://api.devnet.solana.com";
export const PROGRAM_ID = new PublicKey(
  process.env.REACT_APP_PROGRAM_ID ||
    "8BThYttJrWRaQYwZmYkZiHQrE5nLaGYCS5mWXapyEEoa"
);
export const CIRCLE_API_KEY =
  process.env.REACT_APP_CIRCLE_API_KEY ||
  "fa39facbab0311591f155b974bf13d68:38e5215e325c4c43034e14be7b5ec51b";
