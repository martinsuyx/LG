/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MemberImportTask = {
    task_id: string;
    status: MemberImportTask.status;
    processed: number;
    total: number;
    error_rows?: Array<{
        row?: number;
        message?: string;
    }>;
    created_at?: string | null;
    updated_at?: string | null;
    finished_at?: string | null;
};
export namespace MemberImportTask {
    export enum status {
        QUEUED = 'queued',
        PROCESSING = 'processing',
        SUCCEEDED = 'succeeded',
        FAILED = 'failed',
    }
}

