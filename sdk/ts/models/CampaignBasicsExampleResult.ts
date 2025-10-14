/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CampaignBasicsExampleColumn } from './CampaignBasicsExampleColumn';
export type CampaignBasicsExampleResult = {
    status?: CampaignBasicsExampleResult.status;
    rows?: number;
    columns?: Array<CampaignBasicsExampleColumn>;
    messages?: Array<{
        level?: 'info' | 'warning' | 'error';
        text?: string;
    }>;
};
export namespace CampaignBasicsExampleResult {
    export enum status {
        PARSED = 'parsed',
        FAILED = 'failed',
        PENDING = 'pending',
    }
}

