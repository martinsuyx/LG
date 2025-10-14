/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ReportTemplateParseColumn } from './ReportTemplateParseColumn';
import type { ReportTemplateParseMessage } from './ReportTemplateParseMessage';
export type ReportTemplateParseResponse = {
    status?: ReportTemplateParseResponse.status;
    rows?: number;
    columns?: Array<ReportTemplateParseColumn>;
    messages?: Array<ReportTemplateParseMessage>;
};
export namespace ReportTemplateParseResponse {
    export enum status {
        PARSED = 'parsed',
        FAILED = 'failed',
    }
}

