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
}
