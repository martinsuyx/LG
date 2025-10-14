/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CampaignCommissionCaps } from './CampaignCommissionCaps';
import type { CampaignCommissionScheme } from './CampaignCommissionScheme';
export type CampaignProductCreateRequest = {
    type: CampaignProductCreateRequest.type;
    name: string;
    parent_id?: string | null;
    price?: number;
    commission_default?: CampaignCommissionScheme;
    caps?: CampaignCommissionCaps;
    description?: string | null;
};
export namespace CampaignProductCreateRequest {
    export enum type {
        PRODUCT = 'product',
        PACKAGE = 'package',
    }
}

