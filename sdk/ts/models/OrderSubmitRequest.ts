/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type OrderSubmitRequest = {
    /**
     * AI intake job identifier associated with this submission.
     */
    job_id?: string;
    /**
     * Confirmed order field values keyed by field identifiers.
     */
    fields: Record<string, string>;
    /**
     * Operator confirmation checkbox state.
     */
    confirm_flag?: boolean;
};

