/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class KycService {
    /**
     * List KYC cases
     * @returns any KYC case list.
     * @throws ApiError
     */
    public static listKycCases(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/kyc/cases',
        });
    }
    /**
     * Get KYC case detail
     * @param caseId
     * @returns any KYC case detail payload.
     * @throws ApiError
     */
    public static getKycCaseDetail(
        caseId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/kyc/cases/{case_id}',
            path: {
                'case_id': caseId,
            },
        });
    }
    /**
     * Assign KYC case
     * @param caseId
     * @returns any Assignment result.
     * @throws ApiError
     */
    public static assignKycCase(
        caseId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/kyc/cases/{case_id}/assign',
            path: {
                'case_id': caseId,
            },
        });
    }
    /**
     * Approve KYC case
     * @param caseId
     * @returns any Approval result.
     * @throws ApiError
     */
    public static approveKycCase(
        caseId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/kyc/cases/{case_id}/approve',
            path: {
                'case_id': caseId,
            },
        });
    }
    /**
     * Reject KYC case
     * @param caseId
     * @returns any Rejection result.
     * @throws ApiError
     */
    public static rejectKycCase(
        caseId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/kyc/cases/{case_id}/reject',
            path: {
                'case_id': caseId,
            },
        });
    }
    /**
     * Request more materials
     * @param caseId
     * @returns any Request more result.
     * @throws ApiError
     */
    public static requestMoreKycCase(
        caseId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/kyc/cases/{case_id}/request_more',
            path: {
                'case_id': caseId,
            },
        });
    }
    /**
     * Sync KYC callback result
     * @param caseId
     * @returns any Sync result.
     * @throws ApiError
     */
    public static syncKycCallback(
        caseId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/kyc/cases/{case_id}/sync_callback',
            path: {
                'case_id': caseId,
            },
        });
    }
}
