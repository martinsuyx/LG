/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CampaignBasicsExampleResult } from './CampaignBasicsExampleResult';
import type { CampaignBasicsFieldMapping } from './CampaignBasicsFieldMapping';
import type { CampaignBasicsRecognition } from './CampaignBasicsRecognition';
export type CampaignBasics = {
    campaign_id: string;
    customer_name?: string;
    campaign_name: string;
    campaign_code: string;
    matching_mode: CampaignBasics.matching_mode;
    channels: Array<'wechat' | 'h5' | 'scan' | 'api'>;
    start_time: string;
    end_time: string;
    template_id?: string;
    recognition?: CampaignBasicsRecognition;
    field_mappings?: Array<CampaignBasicsFieldMapping>;
    example_input?: string;
    example_result?: CampaignBasicsExampleResult;
    updated_at?: string | null;
    updated_by?: string;
};
export namespace CampaignBasics {
    export enum matching_mode {
        TEMPLATE = 'template',
        MANUAL = 'manual',
    }
}

