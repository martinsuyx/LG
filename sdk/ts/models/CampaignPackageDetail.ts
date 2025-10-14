/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CampaignCommissionCaps } from './CampaignCommissionCaps';
import type { CampaignCommissionScheme } from './CampaignCommissionScheme';
export type CampaignPackageDetail = {
    package_id: string;
    price: number;
    commission_default: CampaignCommissionScheme;
    caps?: CampaignCommissionCaps;
    description?: string | null;
    updated_at?: string | null;
    updated_by?: string | null;
};

