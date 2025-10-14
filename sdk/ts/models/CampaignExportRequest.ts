/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CampaignStatus } from './CampaignStatus';
export type CampaignExportRequest = {
    status?: CampaignStatus;
    city?: string;
    company_id?: string;
    channel?: CampaignExportRequest.channel;
    keyword?: string;
    page?: number;
    page_size?: number;
    sort_key?: string;
    sort_order?: CampaignExportRequest.sort_order;
};
export namespace CampaignExportRequest {
    export enum channel {
        WECHAT = 'wechat',
        H5 = 'h5',
        SCAN = 'scan',
        API = 'api',
    }
    export enum sort_order {
        ASC = 'asc',
        DESC = 'desc',
    }
}

