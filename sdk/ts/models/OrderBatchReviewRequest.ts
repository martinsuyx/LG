/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type OrderBatchReviewRequest = {
    ids: Array<string>;
    action: OrderBatchReviewRequest.action;
    note: string;
};
export namespace OrderBatchReviewRequest {
    export enum action {
        APPROVE = 'approve',
        REJECT = 'reject',
    }
}

