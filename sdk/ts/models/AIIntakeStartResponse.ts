/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AIIntakeStartResponse = {
    job_id: string;
    status: AIIntakeStartResponse.status;
};
export namespace AIIntakeStartResponse {
    export enum status {
        UPLOADED = 'uploaded',
        PARSING = 'parsing',
        PARSED = 'parsed',
        FAILED = 'failed',
    }
}

