/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CampaignListItem } from './CampaignListItem';
import type { CampaignPlan } from './CampaignPlan';
export type CampaignDetail = (CampaignListItem & {
    desc?: string;
    plans: Array<CampaignPlan>;
    form_dsl_id?: string;
    risk_policy_id?: string | null;
    visible_to_roles?: Array<string>;
    require_invite?: boolean;
    offline_note?: string;
});

