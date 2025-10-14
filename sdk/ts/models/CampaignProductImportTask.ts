/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CampaignProductImportTaskError } from './CampaignProductImportTaskError';
export type CampaignProductImportTask = {
    task_id: string;
    status: CampaignProductImportTask.status;
    processed?: number | null;
    total?: number | null;
    result_url?: string | null;
    message?: string | null;
    errors?: Array<CampaignProductImportTaskError>;
};
export namespace CampaignProductImportTask {
    export enum status {
        QUEUED = 'queued',
        PROCESSING = 'processing',
        SUCCEEDED = 'succeeded',
        FAILED = 'failed',
    }
}

