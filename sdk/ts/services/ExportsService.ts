/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExportResponse } from '../models/ExportResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ExportsService {
    /**
     * Export wallet summary
     * @returns ExportResponse Export task created.
     * @throws ApiError
     */
    public static exportWalletSummary(): CancelablePromise<ExportResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/exports/wallet-summary',
            errors: {
                400: `Invalid request.`,
            },
        });
    }
    /**
     * Export wallet ledger
     * @returns ExportResponse Export task created.
     * @throws ApiError
     */
    public static exportWalletLedger(): CancelablePromise<ExportResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/exports/wallet-ledger',
            errors: {
                400: `Invalid request.`,
            },
        });
    }
    /**
     * Export withdraw list
     * @returns ExportResponse Export task created.
     * @throws ApiError
     */
    public static exportWithdraws(): CancelablePromise<ExportResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/exports/withdraws',
            errors: {
                400: `Invalid request.`,
            },
        });
    }
    /**
     * List export jobs
     * @param status
     * @param type
     * @param page
     * @param pageSize
     * @returns any Export job list.
     * @throws ApiError
     */
    public static listExportJobs(
        status?: string,
        type?: string,
        page?: number,
        pageSize?: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/exports',
            query: {
                'status': status,
                'type': type,
                'page': page,
                'page_size': pageSize,
            },
        });
    }
    /**
     * Get export job detail
     * @param jobId
     * @returns any Export job detail.
     * @throws ApiError
     */
    public static getExportJobDetail(
        jobId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/exports/{job_id}',
            path: {
                'job_id': jobId,
            },
            errors: {
                404: `Export job not found.`,
            },
        });
    }
    /**
     * Retry export job
     * @param jobId
     * @returns any New job created.
     * @throws ApiError
     */
    public static retryExportJob(
        jobId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/exports/{job_id}/retry',
            path: {
                'job_id': jobId,
            },
            errors: {
                409: `Job cannot be retried.`,
            },
        });
    }
    /**
     * Cancel export job
     * @param jobId
     * @returns any Job canceled.
     * @throws ApiError
     */
    public static cancelExportJob(
        jobId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/exports/{job_id}/cancel',
            path: {
                'job_id': jobId,
            },
            errors: {
                409: `Job cannot be canceled.`,
            },
        });
    }
    /**
     * Delete expired export jobs
     * @returns any Delete count.
     * @throws ApiError
     */
    public static deleteExpiredExportJobs(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/exports/batch_delete_expired',
        });
    }
}
