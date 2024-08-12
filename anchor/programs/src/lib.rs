use anchor_lang::prelude::*;

declare_id!("8BThYttJrWRaQYwZmYkZiHQrE5nLaGYCS5mWXapyEEoa");

#[program]
pub mod pigeon_cctp {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let transfer_data = &mut ctx.accounts.transfer_data;
        transfer_data.amount = 0;
        transfer_data.from = *ctx.accounts.user.key;
        Ok(())
    }

    pub fn create_transfer(ctx: Context<CreateTransfer>, amount: u64) -> Result<()> {
        let transfer_data = &mut ctx.accounts.transfer_data;
        transfer_data.amount = amount;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 8 + 32)]
    pub transfer_data: Account<'info, TransferData>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateTransfer<'info> {
    #[account(mut)]
    pub transfer_data: Account<'info, TransferData>,
    pub user: Signer<'info>,
}

#[account]
pub struct TransferData {
    pub amount: u64,
    pub from: Pubkey,
}
