/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CampaignCommissionScheme } from './CampaignCommissionScheme';
export type CampaignPlan = {
    plan_id?: string;
    name: string;
    price: number;
    commission_scheme: CampaignCommissionScheme;
    constraints?: Record<string, any>;
};

