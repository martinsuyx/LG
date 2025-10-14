/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CampaignPackageDetail } from './CampaignPackageDetail';
export type CampaignProductNode = {
    node_id: string;
    name: string;
    type: CampaignProductNode.type;
    status: CampaignProductNode.status;
    parent_id: string | null;
    sort_order: number;
    has_children: boolean;
    children?: Array<CampaignProductNode>;
    package_detail?: CampaignPackageDetail;
};
export namespace CampaignProductNode {
    export enum type {
        PRODUCT = 'product',
        PACKAGE = 'package',
    }
    export enum status {
        ACTIVE = 'active',
        ARCHIVED = 'archived',
    }
}

