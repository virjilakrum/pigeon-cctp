import { PublicKey } from "@solana/web3.js";

export const SOLANA_HOST = process.env.REACT_APP_SOLANA_RPC_HOST;
export const PROGRAM_ID = new PublicKey(process.env.REACT_APP_PROGRAM_ID);
