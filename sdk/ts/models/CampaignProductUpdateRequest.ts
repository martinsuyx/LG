/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CampaignCommissionCaps } from './CampaignCommissionCaps';
import type { CampaignCommissionScheme } from './CampaignCommissionScheme';
export type CampaignProductUpdateRequest = {
    name?: string;
    price?: number;
    commission_default?: CampaignCommissionScheme;
    caps?: CampaignCommissionCaps;
    description?: string | null;
    status?: CampaignProductUpdateRequest.status;
};
export namespace CampaignProductUpdateRequest {
    export enum status {
        ACTIVE = 'active',
        ARCHIVED = 'archived',
    }
}

