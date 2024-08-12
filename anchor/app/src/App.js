import React, { useState, useEffect } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, web3, BN } from "@project-serum/anchor";
import { CircleSDK } from "@circle-fin/circle-sdk";
import idl from "./idl.json";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { SOLANA_HOST, PROGRAM_ID, CIRCLE_API_KEY } from "./config";
import "./App.css";

require("@solana/wallet-adapter-react-ui/styles.css");

const programID = new PublicKey(PROGRAM_ID);
const opts = {
  preflightCommitment: "processed",
};

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
      const transferDataAccount = web3.Keypair.generate();
      await program.methods
        .createTransfer(
          new BN(transferAmount),
          new PublicKey(destinationAddress),
          destinationChain
        )
        .accounts({
          transferData: transferDataAccount.publicKey,
          user: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([transferDataAccount])
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

  // ... (rest of the component remains the same)

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Pigeon CCTP</h1>
        <WalletMultiButton />
      </header>
      {wallet.publicKey && (
        <main className="app-main">
          {/* ... (wallet info section remains the same) */}
          <section className="transfer-form">
            <h2>CCTP Transfer</h2>
            {/* ... (form inputs remain the same) */}
            <button
              className="transfer-button"
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
          </section>
        </main>
      )}
    </div>
  );
}

export default App;
