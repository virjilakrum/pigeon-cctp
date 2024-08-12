import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { PigeonCctp } from "../target/types/pigeon_cctp";
import { expect } from "chai";

describe("pigeon-cctp", () => {
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.PigeonCctp as Program<PigeonCctp>;

  it("Initializes transfer data", async () => {
    const transferData = anchor.web3.Keypair.generate();
    await program.rpc.initialize({
      accounts: {
        transferData: transferData.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [transferData],
    });

    const account = await program.account.transferData.fetch(
      transferData.publicKey
    );
    expect(account.amount.toNumber()).to.equal(0);
    expect(account.from.toString()).to.equal(
      provider.wallet.publicKey.toString()
    );
  });

  it("Creates a transfer", async () => {
    const transferData = anchor.web3.Keypair.generate();
    await program.rpc.initialize({
      accounts: {
        transferData: transferData.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [transferData],
    });

    const amount = new anchor.BN(100);
    await program.rpc.createTransfer(amount, {
      accounts: {
        transferData: transferData.publicKey,
        user: provider.wallet.publicKey,
      },
    });

    const account = await program.account.transferData.fetch(
      transferData.publicKey
    );
    expect(account.amount.toNumber()).to.equal(100);
  });
});
