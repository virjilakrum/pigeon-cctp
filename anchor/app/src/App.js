import React, { useState, useEffect } from "react";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { Program, Provider, web3 } from "@project-serum/anchor";
import { CircleSDK } from "@circle-fin/circle-sdk";

import idl from "./idl.json";

const programID = new PublicKey(idl.metadata.address);
const opts = {
  preflightCommitment: "processed",
};

function App() {
  const [walletBalance, setWalletBalance] = useState(null);
  const [transferAmount, setTransferAmount] = useState("");

  useEffect(() => {
    const getWalletBalance = async () => {
      try {
        const connection = new Connection(
          "https://api.devnet.solana.com",
          opts.preflightCommitment
        );
        const wallet = Keypair.generate(); // Bu, gerçek bir cüzdan entegrasyonuyla değiştirilmelidir
        const balance = await connection.getBalance(wallet.publicKey);
        setWalletBalance(balance / web3.LAMPORTS_PER_SOL);
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    };

    getWalletBalance();
  }, []);

  const handleTransfer = async () => {
    try {
      const connection = new Connection(
        "https://api.devnet.solana.com",
        opts.preflightCommitment
      );
      const wallet = Keypair.generate(); // Bu, gerçek bir cüzdan entegrasyonuyla değiştirilmelidir
      const provider = new Provider(connection, wallet, opts);
      const program = new Program(idl, programID, provider);

      const circleSDK = new CircleSDK({
        apiKey:
          "fa39facbab0311591f155b974bf13d68:38e5215e325c4c43034e14be7b5ec51b",
        environment: "sandbox", // Testnet için sandbox kullanın
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

      // Anchor programını çağırarak transfer verilerini kaydedin
      await program.rpc.createTransfer(new BN(transferAmount), {
        accounts: {
          transferData: transferResult.id,
          user: wallet.publicKey,
        },
      });

      alert("Transfer başarılı!");
    } catch (error) {
      console.error("Transfer error:", error);
      alert("Transfer başarısız: " + error.message);
    }
  };

  return (
    <div className="App">
      <h1>Pigeon CCTP</h1>
      <p>
        Cüzdan Bakiyesi:{" "}
        {walletBalance !== null ? `${walletBalance} SOL` : "Yükleniyor..."}
      </p>
      <input
        type="number"
        value={transferAmount}
        onChange={(e) => setTransferAmount(e.target.value)}
        placeholder="Transfer miktarı"
      />
      <button onClick={handleTransfer}>Transfer Et</button>
    </div>
  );
}

export default App;
