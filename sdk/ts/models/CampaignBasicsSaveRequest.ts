/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CampaignBasicsFieldMapping } from './CampaignBasicsFieldMapping';
export type CampaignBasicsSaveRequest = {
    customer_name?: string;
    campaign_name?: string;
    campaign_code?: string;
    matching_mode?: CampaignBasicsSaveRequest.matching_mode;
    channels?: Array<'wechat' | 'h5' | 'scan' | 'api'>;
    start_time?: string;
    end_time?: string;
    template_id?: string;
    field_mappings?: Array<CampaignBasicsFieldMapping>;
    example_input?: string;
};
export namespace CampaignBasicsSaveRequest {
    export enum matching_mode {
        TEMPLATE = 'template',
        MANUAL = 'manual',
    }
}

