import React, { useState, useEffect } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  Program,
  AnchorProvider,
  web3,
  utils,
  BN,
} from "@project-serum/anchor";
import { CircleSDK } from "@circle-fin/circle-sdk";
import idl from "./idl.json";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import {
  useWallet,
  WalletProvider,
  ConnectionProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { SOLANA_HOST, PROGRAM_ID, CIRCLE_API_KEY } from "./config";

require("@solana/wallet-adapter-react-ui/styles.css");

const programID = new PublicKey(PROGRAM_ID);
const opts = {
  preflightCommitment: "processed",
};

// Supported chains and tokens
const SUPPORTED_CHAINS = ["SOL", "ETH", "AVAX", "ARB"];
const SUPPORTED_TOKENS = ["USDC"];

function App() {
  const [walletBalance, setWalletBalance] = useState(null);
  const [transferAmount, setTransferAmount] = useState("");
  const [sourceChain, setSourceChain] = useState("SOL");
  const [destinationChain, setDestinationChain] = useState("ETH");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [token, setToken] = useState("USDC");
  const [isLoading, setIsLoading] = useState(false);
  const wallet = useWallet();

  useEffect(() => {
    const getWalletBalance = async () => {
      if (wallet.publicKey) {
        try {
          const connection = new Connection(
            SOLANA_HOST,
            opts.preflightCommitment
          );
          const balance = await connection.getBalance(wallet.publicKey);
          setWalletBalance(balance / web3.LAMPORTS_PER_SOL);
        } catch (error) {
          console.error("Error fetching balance:", error);
        }
      }
    };
    getWalletBalance();
  }, [wallet.publicKey]);

  const getProvider = () => {
    const connection = new Connection(SOLANA_HOST, opts.preflightCommitment);
    const provider = new AnchorProvider(connection, wallet, opts);
    return provider;
  };

  const handleTransfer = async () => {
    if (!wallet.publicKey) {
      alert("Please connect your wallet first!");
      return;
    }

    setIsLoading(true);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      const circleSDK = new CircleSDK({
        apiKey: CIRCLE_API_KEY,
      });

      // CCTP Transfer
      const transferResult = await circleSDK.cctp.transfer({
        amount: transferAmount,
        sourceCurrency: token,
        sourceChain,
        destinationCurrency: token,
        destinationChain,
        walletAddress: destinationAddress,
      });

      console.log("CCTP Transfer result:", transferResult);

      // Call Anchor program to record transfer data
      await program.methods
        .createTransfer(new BN(transferAmount))
        .accounts({
          transferData: web3.Keypair.generate().publicKey,
          user: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      alert(`Transfer successful from ${sourceChain} to ${destinationChain}!`);

      // Update wallet balance
      const connection = new Connection(SOLANA_HOST, opts.preflightCommitment);
      const balance = await connection.getBalance(wallet.publicKey);
      setWalletBalance(balance / web3.LAMPORTS_PER_SOL);

      // Reset transfer amount and destination address
      setTransferAmount("");
      setDestinationAddress("");
    } catch (error) {
      console.error("Transfer error:", error);
      alert("Transfer failed: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WalletProvider wallets={[new PhantomWalletAdapter()]}>
      <ConnectionProvider endpoint={SOLANA_HOST}>
        <WalletModalProvider>
          <div className="App">
            <h1>Pigeon CCTP</h1>
            <WalletMultiButton />
            {wallet.publicKey && (
              <div>
                <p>Wallet Address: {wallet.publicKey.toString()}</p>
                <p>
                  Balance:{" "}
                  {walletBalance !== null
                    ? `${walletBalance.toFixed(4)} SOL`
                    : "Loading..."}
                </p>
                <div>
                  <label>Token: </label>
                  <select
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  >
                    {SUPPORTED_TOKENS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Source Chain: </label>
                  <select
                    value={sourceChain}
                    onChange={(e) => setSourceChain(e.target.value)}
                  >
                    {SUPPORTED_CHAINS.map((chain) => (
                      <option key={chain} value={chain}>
                        {chain}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Destination Chain: </label>
                  <select
                    value={destinationChain}
                    onChange={(e) => setDestinationChain(e.target.value)}
                  >
                    {SUPPORTED_CHAINS.filter(
                      (chain) => chain !== sourceChain
                    ).map((chain) => (
                      <option key={chain} value={chain}>
                        {chain}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="Transfer amount"
                />
                <input
                  type="text"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  placeholder="Destination address"
                />
                <button
                  onClick={handleTransfer}
                  disabled={
                    isLoading ||
                    !transferAmount ||
                    !destinationAddress ||
                    sourceChain === destinationChain
                  }
                >
                  {isLoading ? "Processing..." : "Transfer"}
                </button>
              </div>
            )}
          </div>
        </WalletModalProvider>
      </ConnectionProvider>
    </WalletProvider>
  );
}

export default App;
