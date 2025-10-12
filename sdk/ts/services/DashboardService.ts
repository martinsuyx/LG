/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DashboardCompareResponse } from '../models/DashboardCompareResponse';
import type { DashboardOverviewResponse } from '../models/DashboardOverviewResponse';
import type { DashboardSeriesResponse } from '../models/DashboardSeriesResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DashboardService {
    /**
     * Dashboard overview metrics
     * @param start Start date (inclusive) in ISO format.
     * @param end End date (inclusive) in ISO format.
     * @param granularity Aggregation granularity for metrics.
     * @param companyId Company identifier filter.
     * @param city City code filter.
     * @param channel Channel multi-select filter.
     * @param tz Timezone identifier in IANA format.
     * @returns DashboardOverviewResponse Overview metrics for dashboard cards.
     * @throws ApiError
     */
    public static getDashboardOverview(
        start?: string,
        end?: string,
        granularity: 'd' | 'w' | 'm' = 'd',
        companyId?: string,
        city?: string,
        channel?: Array<'wechat' | 'h5' | 'scan' | 'api'>,
        tz: string = 'Asia/Shanghai',
    ): CancelablePromise<DashboardOverviewResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/dashboard/overview',
            query: {
                'start': start,
                'end': end,
                'granularity': granularity,
                'company_id': companyId,
                'city': city,
                'channel': channel,
                'tz': tz,
            },
            errors: {
                400: `Invalid request parameters.`,
            },
        });
    }
    /**
     * Dashboard trend series
     * @param metric Which metric series to return.
     * @param start Start date (inclusive) in ISO format.
     * @param end End date (inclusive) in ISO format.
     * @param granularity Aggregation granularity for metrics.
     * @param companyId Company identifier filter.
     * @param city City code filter.
     * @param channel Channel multi-select filter.
     * @param tz Timezone identifier in IANA format.
     * @returns DashboardSeriesResponse Trend data points for dashboard charts.
     * @throws ApiError
     */
    public static getDashboardSeries(
        metric: 'orders' | 'gmv' | 'approval_rate' = 'orders',
        start?: string,
        end?: string,
        granularity: 'd' | 'w' | 'm' = 'd',
        companyId?: string,
        city?: string,
        channel?: Array<'wechat' | 'h5' | 'scan' | 'api'>,
        tz: string = 'Asia/Shanghai',
    ): CancelablePromise<DashboardSeriesResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/dashboard/series',
            query: {
                'metric': metric,
                'start': start,
                'end': end,
                'granularity': granularity,
                'company_id': companyId,
                'city': city,
                'channel': channel,
                'tz': tz,
            },
            errors: {
                400: `Invalid request parameters.`,
            },
        });
    }
    /**
     * Dashboard compare snapshot
     * @param start Start date (inclusive) in ISO format.
     * @param end End date (inclusive) in ISO format.
     * @param granularity Aggregation granularity for metrics.
     * @param companyId Company identifier filter.
     * @param city City code filter.
     * @param channel Channel multi-select filter.
     * @param tz Timezone identifier in IANA format.
     * @returns DashboardCompareResponse Snapshot comparing current period with baseline.
     * @throws ApiError
     */
    public static getDashboardCompare(
        start?: string,
        end?: string,
        granularity: 'd' | 'w' | 'm' = 'd',
        companyId?: string,
        city?: string,
        channel?: Array<'wechat' | 'h5' | 'scan' | 'api'>,
        tz: string = 'Asia/Shanghai',
    ): CancelablePromise<DashboardCompareResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/dashboard/compare',
            query: {
                'start': start,
                'end': end,
                'granularity': granularity,
                'company_id': companyId,
                'city': city,
                'channel': channel,
                'tz': tz,
            },
            errors: {
                400: `Invalid request parameters.`,
            },
        });
    }
}
