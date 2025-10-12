/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type OrderBatchReviewResponse = {
    processed_ids: Array<string>;
    action: OrderBatchReviewResponse.action;
    note?: string;
};
export namespace OrderBatchReviewResponse {
    export enum action {
        APPROVE = 'approve',
        REJECT = 'reject',
    }
}

