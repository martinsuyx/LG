/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type WalletLedgerItem = {
    tx_id: string;
    created_at: string;
    entity_name: string;
    tx_type: WalletLedgerItem.tx_type;
    order_id?: string | null;
    amount: number;
    balance_after: number;
    status: WalletLedgerItem.status;
    note?: string;
};
export namespace WalletLedgerItem {
    export enum tx_type {
        ORDER_SETTLEMENT = 'order_settlement',
        FREEZE = 'freeze',
        UNFREEZE = 'unfreeze',
        WITHDRAW = 'withdraw',
        ADJUSTMENT = 'adjustment',
    }
    export enum status {
        SUCCESS = 'success',
        PENDING = 'pending',
        FAILED = 'failed',
    }
}

