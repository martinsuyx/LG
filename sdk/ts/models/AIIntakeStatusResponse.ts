/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AIIntakeField } from './AIIntakeField';
export type AIIntakeStatusResponse = {
    job_id: string;
    status: AIIntakeStatusResponse.status;
    fields: Array<AIIntakeField>;
    /**
     * Optional error messages when status is failed.
     */
    errors?: Array<string>;
};
export namespace AIIntakeStatusResponse {
    export enum status {
        UPLOADED = 'uploaded',
        PARSING = 'parsing',
        PARSED = 'parsed',
        FAILED = 'failed',
        SUBMITTED = 'submitted',
    }
}

