/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WithdrawActionRequest } from '../models/WithdrawActionRequest';
import type { WithdrawActionResponse } from '../models/WithdrawActionResponse';
import type { WithdrawListResponse } from '../models/WithdrawListResponse';
import type { WithdrawStatsResponse } from '../models/WithdrawStatsResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WithdrawsService {
    /**
     * Withdraw request list
     * @param start Start date (inclusive) in ISO format.
     * @param end End date (inclusive) in ISO format.
     * @param status Withdraw status filter.
     * @param channel Withdraw payout channel.
     * @param dimension Wallet aggregation dimension.
     * @param entityId Entity identifier for wallet or withdraw filters.
     * @param page One-based page index.
     * @param pageSize Number of records per page.
     * @returns WithdrawListResponse Paginated withdraw requests.
     * @throws ApiError
     */
    public static listWithdraws(
        start?: string,
        end?: string,
        status?: Array<'pending' | 'processing' | 'succeeded' | 'failed' | 'rejected'>,
        channel?: Array<'bank' | 'alipay' | 'wechat'>,
        dimension: 'platform' | 'company' | 'team' | 'store' | 'promoter' | 'individual' = 'platform',
        entityId?: string,
        page: number = 1,
        pageSize: number = 20,
    ): CancelablePromise<WithdrawListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/withdraws',
            query: {
                'start': start,
                'end': end,
                'status': status,
                'channel': channel,
                'dimension': dimension,
                'entity_id': entityId,
                'page': page,
                'page_size': pageSize,
            },
            errors: {
                400: `Invalid filters supplied.`,
            },
        });
    }
    /**
     * Withdraw dashboard statistics
     * @param start Start date (inclusive) in ISO format.
     * @param end End date (inclusive) in ISO format.
     * @returns WithdrawStatsResponse Stats for withdraw filters.
     * @throws ApiError
     */
    public static getWithdrawStats(
        start?: string,
        end?: string,
    ): CancelablePromise<WithdrawStatsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/withdraws/stats',
            query: {
                'start': start,
                'end': end,
            },
            errors: {
                400: `Invalid filters supplied.`,
            },
        });
    }
    /**
     * Approve withdraw request
     * @param withdrawId
     * @param requestBody
     * @returns WithdrawActionResponse Withdraw approved.
     * @throws ApiError
     */
    public static approveWithdraw(
        withdrawId: string,
        requestBody?: WithdrawActionRequest,
    ): CancelablePromise<WithdrawActionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/withdraws/{withdraw_id}/approve',
            path: {
                'withdraw_id': withdrawId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request.`,
            },
        });
    }
    /**
     * Reject withdraw request
     * @param withdrawId
     * @param requestBody
     * @returns WithdrawActionResponse Withdraw rejected.
     * @throws ApiError
     */
    public static rejectWithdraw(
        withdrawId: string,
        requestBody: WithdrawActionRequest,
    ): CancelablePromise<WithdrawActionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/withdraws/{withdraw_id}/reject',
            path: {
                'withdraw_id': withdrawId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request.`,
            },
        });
    }
}
