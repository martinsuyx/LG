/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type OrderReviewRequest = {
    action: OrderReviewRequest.action;
    reviewer_id?: string;
    note: string;
};
export namespace OrderReviewRequest {
    export enum action {
        APPROVE = 'approve',
        REJECT = 'reject',
    }
}

