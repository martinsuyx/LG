/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CampaignActionResponse } from '../models/CampaignActionResponse';
import type { CampaignBasics } from '../models/CampaignBasics';
import type { CampaignBasicsSaveRequest } from '../models/CampaignBasicsSaveRequest';
import type { CampaignBasicsSaveResponse } from '../models/CampaignBasicsSaveResponse';
import type { CampaignCloneResponse } from '../models/CampaignCloneResponse';
import type { CampaignDetail } from '../models/CampaignDetail';
import type { CampaignExportRequest } from '../models/CampaignExportRequest';
import type { CampaignListResponse } from '../models/CampaignListResponse';
import type { CampaignOfflineRequest } from '../models/CampaignOfflineRequest';
import type { CampaignProductCopyRequest } from '../models/CampaignProductCopyRequest';
import type { CampaignProductCopyResponse } from '../models/CampaignProductCopyResponse';
import type { CampaignProductCreateRequest } from '../models/CampaignProductCreateRequest';
import type { CampaignProductImportRequest } from '../models/CampaignProductImportRequest';
import type { CampaignProductImportTask } from '../models/CampaignProductImportTask';
import type { CampaignProductNode } from '../models/CampaignProductNode';
import type { CampaignProductsTreeResponse } from '../models/CampaignProductsTreeResponse';
import type { CampaignProductTemplateListResponse } from '../models/CampaignProductTemplateListResponse';
import type { CampaignProductUpdateRequest } from '../models/CampaignProductUpdateRequest';
import type { CampaignStatus } from '../models/CampaignStatus';
import type { CampaignUpsertRequest } from '../models/CampaignUpsertRequest';
import type { CampaignUpsertResponse } from '../models/CampaignUpsertResponse';
import type { ExportResponse } from '../models/ExportResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CampaignsService {
    /**
     * List campaigns
     * @param status Filter by campaign status.
     * @param city City code filter.
     * @param companyId Company identifier filter.
     * @param channel Filter by primary acquisition channel.
     * @param keyword Search by campaign name or code.
     * @param start Start date (inclusive) in ISO format.
     * @param end End date (inclusive) in ISO format.
     * @param page One-based page index.
     * @param pageSize Number of records per page.
     * @param sortKey Sort campaigns by field.
     * @param sortOrder Sort order direction.
     * @returns CampaignListResponse Paginated campaign list.
     * @throws ApiError
     */
    public static listCampaigns(
        status?: CampaignStatus,
        city?: string,
        companyId?: string,
        channel?: 'wechat' | 'h5' | 'scan' | 'api',
        keyword?: string,
        start?: string,
        end?: string,
        page: number = 1,
        pageSize: number = 20,
        sortKey: 'start_time' | 'end_time' | 'created_at' | 'updated_at' | 'name' | 'status' = 'updated_at',
        sortOrder: 'asc' | 'desc' = 'desc',
    ): CancelablePromise<CampaignListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/campaigns',
            query: {
                'status': status,
                'city': city,
                'company_id': companyId,
                'channel': channel,
                'keyword': keyword,
                'start': start,
                'end': end,
                'page': page,
                'page_size': pageSize,
                'sort_key': sortKey,
                'sort_order': sortOrder,
            },
            errors: {
                400: `Invalid filters supplied.`,
            },
        });
    }
    /**
     * Create campaign draft
     * @param requestBody
     * @returns CampaignUpsertResponse Campaign draft created.
     * @throws ApiError
     */
    public static createCampaign(
        requestBody: CampaignUpsertRequest,
    ): CancelablePromise<CampaignUpsertResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/campaigns',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid payload.`,
                409: `Campaign code conflict detected.`,
                422: `Campaign scope or plans invalid.`,
            },
        });
    }
    /**
     * Fetch campaign detail
     * @param campaignId
     * @returns CampaignDetail Campaign detail payload.
     * @throws ApiError
     */
    public static getCampaign(
        campaignId: string,
    ): CancelablePromise<CampaignDetail> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/campaigns/{campaign_id}',
            path: {
                'campaign_id': campaignId,
            },
            errors: {
                404: `Campaign not found.`,
            },
        });
    }
    /**
     * Update campaign draft
     * @param campaignId
     * @param requestBody
     * @returns CampaignUpsertResponse Campaign updated successfully.
     * @throws ApiError
     */
    public static updateCampaign(
        campaignId: string,
        requestBody: CampaignUpsertRequest,
    ): CancelablePromise<CampaignUpsertResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/campaigns/{campaign_id}',
            path: {
                'campaign_id': campaignId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid payload.`,
                404: `Campaign not found.`,
                409: `Campaign code conflict detected.`,
                422: `Campaign scope or plans invalid.`,
            },
        });
    }
    /**
     * Fetch campaign basics configuration
     * @param campaignId
     * @returns CampaignBasics Campaign basics payload.
     * @throws ApiError
     */
    public static getCampaignBasics(
        campaignId: string,
    ): CancelablePromise<CampaignBasics> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/campaigns/{campaign_id}/basics',
            path: {
                'campaign_id': campaignId,
            },
            errors: {
                404: `Campaign not found.`,
            },
        });
    }
    /**
     * Save campaign basics configuration
     * @param campaignId
     * @param requestBody
     * @returns CampaignBasicsSaveResponse Basics saved successfully.
     * @throws ApiError
     */
    public static updateCampaignBasics(
        campaignId: string,
        requestBody: CampaignBasicsSaveRequest,
    ): CancelablePromise<CampaignBasicsSaveResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/campaigns/{campaign_id}/basics',
            path: {
                'campaign_id': campaignId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid payload.`,
                404: `Campaign not found.`,
                409: `Campaign state prevents editing.`,
            },
        });
    }
    /**
     * Publish campaign
     * @param campaignId
     * @returns CampaignActionResponse Campaign published successfully.
     * @throws ApiError
     */
    public static publishCampaign(
        campaignId: string,
    ): CancelablePromise<CampaignActionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/campaigns/{campaign_id}/publish',
            path: {
                'campaign_id': campaignId,
            },
            errors: {
                404: `Campaign not found.`,
                409: `Campaign state prevents publishing.`,
                422: `Campaign validation failed.`,
            },
        });
    }
    /**
     * Offline campaign
     * @param campaignId
     * @param requestBody
     * @returns CampaignActionResponse Campaign taken offline.
     * @throws ApiError
     */
    public static offlineCampaign(
        campaignId: string,
        requestBody: CampaignOfflineRequest,
    ): CancelablePromise<CampaignActionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/campaigns/{campaign_id}/offline',
            path: {
                'campaign_id': campaignId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid payload.`,
                404: `Campaign not found.`,
                409: `Campaign state prevents offlining.`,
            },
        });
    }
    /**
     * Clone campaign to draft
     * @param campaignId
     * @returns CampaignCloneResponse Campaign cloned successfully.
     * @throws ApiError
     */
    public static cloneCampaign(
        campaignId: string,
    ): CancelablePromise<CampaignCloneResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/campaigns/{campaign_id}/clone',
            path: {
                'campaign_id': campaignId,
            },
            errors: {
                404: `Campaign not found.`,
            },
        });
    }
    /**
     * Fetch campaign product tree
     * @param campaignId
     * @returns CampaignProductsTreeResponse Hierarchical campaign product/package tree.
     * @throws ApiError
     */
    public static getCampaignProductsTree(
        campaignId: string,
    ): CancelablePromise<CampaignProductsTreeResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/campaigns/{campaign_id}/products_tree',
            path: {
                'campaign_id': campaignId,
            },
            errors: {
                404: `Campaign not found.`,
            },
        });
    }
    /**
     * List campaign product templates
     * @param campaignId
     * @returns CampaignProductTemplateListResponse Available product/package templates.
     * @throws ApiError
     */
    public static listCampaignProductTemplates(
        campaignId: string,
    ): CancelablePromise<CampaignProductTemplateListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/campaigns/{campaign_id}/products/templates',
            path: {
                'campaign_id': campaignId,
            },
            errors: {
                404: `Campaign not found.`,
            },
        });
    }
    /**
     * Create campaign product or package
     * @param campaignId
     * @param requestBody
     * @returns CampaignProductNode Product or package node created.
     * @throws ApiError
     */
    public static createCampaignProductNode(
        campaignId: string,
        requestBody: CampaignProductCreateRequest,
    ): CancelablePromise<CampaignProductNode> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/campaigns/{campaign_id}/products',
            path: {
                'campaign_id': campaignId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid payload.`,
                404: `Campaign not found.`,
                422: `Validation failed for product node.`,
            },
        });
    }
    /**
     * Update campaign product or package
     * @param campaignId
     * @param nodeId
     * @param requestBody
     * @returns CampaignProductNode Product or package node updated.
     * @throws ApiError
     */
    public static updateCampaignProductNode(
        campaignId: string,
        nodeId: string,
        requestBody: CampaignProductUpdateRequest,
    ): CancelablePromise<CampaignProductNode> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/campaigns/{campaign_id}/products/{node_id}',
            path: {
                'campaign_id': campaignId,
                'node_id': nodeId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid payload.`,
                404: `Node not found.`,
                422: `Validation failed for product node.`,
            },
        });
    }
    /**
     * Delete campaign product or package
     * @param campaignId
     * @param nodeId
     * @returns void
     * @throws ApiError
     */
    public static deleteCampaignProductNode(
        campaignId: string,
        nodeId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/campaigns/{campaign_id}/products/{node_id}',
            path: {
                'campaign_id': campaignId,
                'node_id': nodeId,
            },
            errors: {
                404: `Node not found.`,
            },
        });
    }
    /**
     * Copy campaign products from template
     * @param campaignId
     * @param requestBody
     * @returns CampaignProductCopyResponse Products copied from template.
     * @throws ApiError
     */
    public static copyCampaignProductsFromTemplate(
        campaignId: string,
        requestBody: CampaignProductCopyRequest,
    ): CancelablePromise<CampaignProductCopyResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/campaigns/{campaign_id}/products/copy_from',
            path: {
                'campaign_id': campaignId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Campaign or template not found.`,
            },
        });
    }
    /**
     * Submit campaign product import task
     * @param campaignId
     * @param requestBody
     * @returns CampaignProductImportTask Import task accepted.
     * @throws ApiError
     */
    public static importCampaignProductNodes(
        campaignId: string,
        requestBody: CampaignProductImportRequest,
    ): CancelablePromise<CampaignProductImportTask> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/campaigns/{campaign_id}/products/import',
            path: {
                'campaign_id': campaignId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid payload.`,
                404: `Campaign not found.`,
            },
        });
    }
    /**
     * Get campaign product import task
     * @param campaignId
     * @param taskId
     * @returns CampaignProductImportTask Import task status payload.
     * @throws ApiError
     */
    public static getCampaignProductImportTask(
        campaignId: string,
        taskId: string,
    ): CancelablePromise<CampaignProductImportTask> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/campaigns/{campaign_id}/products/import/{task_id}',
            path: {
                'campaign_id': campaignId,
                'task_id': taskId,
            },
            errors: {
                404: `Import task not found.`,
            },
        });
    }
    /**
     * Enqueue campaign export task
     * @param requestBody
     * @returns ExportResponse Export task accepted.
     * @throws ApiError
     */
    public static exportCampaigns(
        requestBody?: CampaignExportRequest,
    ): CancelablePromise<ExportResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/exports/campaigns',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid export payload.`,
            },
        });
    }
}
