/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CampaignPlan } from './CampaignPlan';
import type { CampaignScope } from './CampaignScope';
export type CampaignUpsertRequest = {
    name: string;
    code: string;
    desc?: string;
    start_time: string;
    end_time: string;
    channels: Array<'wechat' | 'h5' | 'scan' | 'api'>;
    plans: Array<CampaignPlan>;
    scope: CampaignScope;
    form_dsl_id: string;
    risk_policy_id?: string | null;
    visible_to_roles?: Array<string>;
    require_invite?: boolean;
};

