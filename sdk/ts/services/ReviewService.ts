/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OrderStatus } from '../models/OrderStatus';
import type { ReviewOrdersResponse } from '../models/ReviewOrdersResponse';
import type { ReviewStatsResponse } from '../models/ReviewStatsResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ReviewService {
    /**
     * List orders awaiting review
     * @param start Start date (inclusive) in ISO format.
     * @param end End date (inclusive) in ISO format.
     * @param status Filter by one or more order statuses.
     * @param channel Channel multi-select filter.
     * @param storeCode Filter by store code.
     * @param campaignId Filter by campaign identifier.
     * @param riskTag Filter review queue by risk tags.
     * @param page One-based page index.
     * @param pageSize Number of records per page.
     * @returns ReviewOrdersResponse Review queue with pagination.
     * @throws ApiError
     */
    public static listReviewOrders(
        start?: string,
        end?: string,
        status?: Array<OrderStatus>,
        channel?: Array<'wechat' | 'h5' | 'scan' | 'api'>,
        storeCode?: string,
        campaignId?: string,
        riskTag?: Array<string>,
        page: number = 1,
        pageSize: number = 20,
    ): CancelablePromise<ReviewOrdersResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/review/orders',
            query: {
                'start': start,
                'end': end,
                'status': status,
                'channel': channel,
                'store_code': storeCode,
                'campaign_id': campaignId,
                'risk_tag': riskTag,
                'page': page,
                'page_size': pageSize,
            },
            errors: {
                400: `Invalid filters supplied.`,
            },
        });
    }
    /**
     * Review workbench statistics
     * @param start Start date (inclusive) in ISO format.
     * @param end End date (inclusive) in ISO format.
     * @returns ReviewStatsResponse Aggregated review statistics.
     * @throws ApiError
     */
    public static getReviewStats(
        start?: string,
        end?: string,
    ): CancelablePromise<ReviewStatsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/review/stats',
            query: {
                'start': start,
                'end': end,
            },
            errors: {
                400: `Invalid date range supplied.`,
            },
        });
    }
}
