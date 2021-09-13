import { Transaction } from './Transaction';
import { MintLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, SystemProgram, TransactionCtorFields } from '@solana/web3.js';

interface CreateUninitializedMintCtorFields extends TransactionCtorFields {
  params: {
    newAccountPubkey: PublicKey;
    lamports: number;
    decimals?: number;
    owner?: PublicKey;
    freezeAuthority?: PublicKey;
  };
}

export class CreateMint extends Transaction {
  constructor(options: CreateUninitializedMintCtorFields) {
    const {
      feePayer,
      params: { newAccountPubkey, lamports, decimals, owner, freezeAuthority },
    } = options;

    super(options);

    this.add(
      SystemProgram.createAccount({
        fromPubkey: feePayer,
        newAccountPubkey: newAccountPubkey,
        lamports,
        space: MintLayout.span,
        programId: TOKEN_PROGRAM_ID,
      }),
    );

    this.add(
      Token.createInitMintInstruction(
        TOKEN_PROGRAM_ID,
        newAccountPubkey,
        decimals ?? 0,
        owner ?? feePayer,
        freezeAuthority ?? feePayer,
      ),
    );
  }
}
