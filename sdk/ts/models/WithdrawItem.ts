/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type WithdrawItem = {
    withdraw_id: string;
    created_at: string;
    entity_name: string;
    amount: number;
    channel: WithdrawItem.channel;
    account_info: string;
    status: WithdrawItem.status;
    note?: string;
};
export namespace WithdrawItem {
    export enum channel {
        BANK = 'bank',
        ALIPAY = 'alipay',
        WECHAT = 'wechat',
    }
    export enum status {
        PENDING = 'pending',
        PROCESSING = 'processing',
        SUCCEEDED = 'succeeded',
        FAILED = 'failed',
        REJECTED = 'rejected',
    }
}

