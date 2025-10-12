/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WalletLedgerResponse } from '../models/WalletLedgerResponse';
import type { WalletLedgerStatsResponse } from '../models/WalletLedgerStatsResponse';
import type { WalletSummaryListResponse } from '../models/WalletSummaryListResponse';
import type { WalletSummaryOverview } from '../models/WalletSummaryOverview';
import type { WalletSummarySeriesResponse } from '../models/WalletSummarySeriesResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WalletService {
    /**
     * Wallet summary overview KPIs
     * @param start Start date (inclusive) in ISO format.
     * @param end End date (inclusive) in ISO format.
     * @param dimension Wallet aggregation dimension.
     * @param companyId Company identifier filter.
     * @param city City code filter.
     * @param status Wallet account status filter.
     * @returns WalletSummaryOverview Wallet summary KPIs.
     * @throws ApiError
     */
    public static getWalletSummaryOverview(
        start?: string,
        end?: string,
        dimension: 'platform' | 'company' | 'team' | 'store' | 'promoter' | 'individual' = 'platform',
        companyId?: string,
        city?: string,
        status?: Array<'normal' | 'frozen' | 'closed'>,
    ): CancelablePromise<WalletSummaryOverview> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/wallet/summary/overview',
            query: {
                'start': start,
                'end': end,
                'dimension': dimension,
                'company_id': companyId,
                'city': city,
                'status': status,
            },
            errors: {
                400: `Invalid filters supplied.`,
            },
        });
    }
    /**
     * Wallet summary series data
     * @param start Start date (inclusive) in ISO format.
     * @param end End date (inclusive) in ISO format.
     * @param dimension Wallet aggregation dimension.
     * @param metric Wallet summary metric type.
     * @returns WalletSummarySeriesResponse Wallet summary trend points.
     * @throws ApiError
     */
    public static getWalletSummarySeries(
        start?: string,
        end?: string,
        dimension: 'platform' | 'company' | 'team' | 'store' | 'promoter' | 'individual' = 'platform',
        metric: 'balance' | 'in_out' = 'balance',
    ): CancelablePromise<WalletSummarySeriesResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/wallet/summary/series',
            query: {
                'start': start,
                'end': end,
                'dimension': dimension,
                'metric': metric,
            },
            errors: {
                400: `Invalid filters supplied.`,
            },
        });
    }
    /**
     * Wallet summary dimension list
     * @param start Start date (inclusive) in ISO format.
     * @param end End date (inclusive) in ISO format.
     * @param dimension Wallet aggregation dimension.
     * @param page One-based page index.
     * @param pageSize Number of records per page.
     * @param status Wallet account status filter.
     * @returns WalletSummaryListResponse Paginated wallet summary rows.
     * @throws ApiError
     */
    public static listWalletSummary(
        start?: string,
        end?: string,
        dimension: 'platform' | 'company' | 'team' | 'store' | 'promoter' | 'individual' = 'platform',
        page: number = 1,
        pageSize: number = 20,
        status?: Array<'normal' | 'frozen' | 'closed'>,
    ): CancelablePromise<WalletSummaryListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/wallet/summary/list',
            query: {
                'start': start,
                'end': end,
                'dimension': dimension,
                'page': page,
                'page_size': pageSize,
                'status': status,
            },
            errors: {
                400: `Invalid filters supplied.`,
            },
        });
    }
    /**
     * Wallet ledger list
     * @param start Start date (inclusive) in ISO format.
     * @param end End date (inclusive) in ISO format.
     * @param dimension Wallet aggregation dimension.
     * @param entityId Entity identifier for wallet or withdraw filters.
     * @param txType Wallet transaction type.
     * @param txStatus Wallet transaction status filter.
     * @param page One-based page index.
     * @param pageSize Number of records per page.
     * @returns WalletLedgerResponse Wallet ledger page.
     * @throws ApiError
     */
    public static listWalletLedger(
        start?: string,
        end?: string,
        dimension: 'platform' | 'company' | 'team' | 'store' | 'promoter' | 'individual' = 'platform',
        entityId?: string,
        txType?: Array<'order_settlement' | 'freeze' | 'unfreeze' | 'withdraw' | 'adjustment'>,
        txStatus?: Array<'success' | 'pending' | 'failed'>,
        page: number = 1,
        pageSize: number = 20,
    ): CancelablePromise<WalletLedgerResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/wallet/ledger',
            query: {
                'start': start,
                'end': end,
                'dimension': dimension,
                'entity_id': entityId,
                'tx_type': txType,
                'tx_status': txStatus,
                'page': page,
                'page_size': pageSize,
            },
            errors: {
                400: `Invalid filters supplied.`,
            },
        });
    }
    /**
     * Wallet ledger stats
     * @param start Start date (inclusive) in ISO format.
     * @param end End date (inclusive) in ISO format.
     * @param dimension Wallet aggregation dimension.
     * @param entityId Entity identifier for wallet or withdraw filters.
     * @returns WalletLedgerStatsResponse Ledger totals for current filters.
     * @throws ApiError
     */
    public static getWalletLedgerStats(
        start?: string,
        end?: string,
        dimension: 'platform' | 'company' | 'team' | 'store' | 'promoter' | 'individual' = 'platform',
        entityId?: string,
    ): CancelablePromise<WalletLedgerStatsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/wallet/ledger/stats',
            query: {
                'start': start,
                'end': end,
                'dimension': dimension,
                'entity_id': entityId,
            },
            errors: {
                400: `Invalid filters supplied.`,
            },
        });
    }
}
