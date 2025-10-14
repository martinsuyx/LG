/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CampaignCommissionTier } from './CampaignCommissionTier';
export type CampaignCommissionScheme = ({
    type: CampaignCommissionScheme.type;
    value: number;
} | {
    type: CampaignCommissionScheme.type;
    tiers: Array<CampaignCommissionTier>;
});
export namespace CampaignCommissionScheme {
    export enum type {
        FIXED = 'fixed',
    }
}

