/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type OrderSubmitResponse = {
    order_id: string;
    status: OrderSubmitResponse.status;
    /**
     * Optional URL to navigate after submission (e.g., order detail page).
     */
    redirect_url?: string;
};
export namespace OrderSubmitResponse {
    export enum status {
        SUBMITTED = 'submitted',
        UNDER_REVIEW = 'under_review',
    }
}

