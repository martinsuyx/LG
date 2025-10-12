/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type WalletSummaryListItem = {
    entity_id: string;
    entity_name: string;
    balance: number;
    frozen: number;
    available: number;
    withdrawable: number;
    last_tx_time?: string;
    status?: WalletSummaryListItem.status;
};
export namespace WalletSummaryListItem {
    export enum status {
        NORMAL = 'normal',
        FROZEN = 'frozen',
        CLOSED = 'closed',
    }
}

