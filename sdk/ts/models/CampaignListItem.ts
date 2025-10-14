/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CampaignMetrics } from './CampaignMetrics';
import type { CampaignScope } from './CampaignScope';
import type { CampaignStatus } from './CampaignStatus';
export type CampaignListItem = {
    campaign_id: string;
    name: string;
    code: string;
    status: CampaignStatus;
    start_time: string;
    end_time: string;
    channels: Array<'wechat' | 'h5' | 'scan' | 'api'>;
    scope: CampaignScope;
    metrics?: CampaignMetrics;
};

