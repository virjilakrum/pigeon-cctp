import React, { useState, useEffect } from "react";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
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
import { SOLANA_HOST, PROGRAM_ID } from "./config";

require("@solana/wallet-adapter-react-ui/styles.css");

const programID = new PublicKey(PROGRAM_ID);
const opts = {
  preflightCommitment: "processed",
};

function App() {
  const [walletBalance, setWalletBalance] = useState(null);
  const [transferAmount, setTransferAmount] = useState("");
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
        apiKey:
          "fa39facbab0311591f155b974bf13d68:38e5215e325c4c43034e14be7b5ec51b",
        environment: "sandbox",
      });

      // Circle CCTP ile transfer işlemi
      const transferResult = await circleSDK.cctp.transfer({
        amount: transferAmount,
        sourceCurrency: "USD",
        destinationCurrency: "USD",
        destinationChain: "SOL",
        walletAddress: wallet.publicKey.toString(),
      });

      console.log("Transfer result:", transferResult);

      // Generate a new keypair for the transfer data account
      const transferDataAccount = Keypair.generate();

      // Anchor programını çağırarak transfer verilerini kaydetme
      await program.methods
        .createTransfer(new BN(transferAmount))
        .accounts({
          transferData: transferDataAccount.publicKey,
          user: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([transferDataAccount])
        .rpc();

      alert("Transfer başarılı!");

      // Cüzdan bakiyesini güncelle
      const connection = new Connection(SOLANA_HOST, opts.preflightCommitment);
      const balance = await connection.getBalance(wallet.publicKey);
      setWalletBalance(balance / web3.LAMPORTS_PER_SOL);

      // Transfer miktarını sıfırla
      setTransferAmount("");
    } catch (error) {
      console.error("Transfer error:", error);
      alert("Transfer başarısız: " + error.message);
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
              <>
                <p>Cüzdan Adresi: {wallet.publicKey.toString()}</p>
                <p>
                  Cüzdan Bakiyesi:{" "}
                  {walletBalance !== null
                    ? `${walletBalance.toFixed(4)} SOL`
                    : "Yükleniyor..."}
                </p>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="Transfer miktarı (USD)"
                />
                <button
                  onClick={handleTransfer}
                  disabled={isLoading || !transferAmount}
                >
                  {isLoading ? "İşlem Yapılıyor..." : "Transfer Et"}
                </button>
              </>
            )}
          </div>
        </WalletModalProvider>
      </ConnectionProvider>
    </WalletProvider>
  );
}

export default App;
