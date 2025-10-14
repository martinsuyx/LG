/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuditService {
    /**
     * List audit events
     * @param start
     * @param end
     * @param level
     * @param type
     * @param result
     * @param page
     * @param pageSize
     * @returns any Audit events page.
     * @throws ApiError
     */
    public static listAuditEvents(
        start?: string,
        end?: string,
        level?: string,
        type?: string,
        result?: string,
        page?: number,
        pageSize?: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/audit/events',
            query: {
                'start': start,
                'end': end,
                'level': level,
                'type': type,
                'result': result,
                'page': page,
                'page_size': pageSize,
            },
        });
    }
    /**
     * Get audit event detail
     * @param eventId
     * @returns any Audit event detail.
     * @throws ApiError
     */
    public static getAuditEventDetail(
        eventId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/audit/events/{event_id}',
            path: {
                'event_id': eventId,
            },
            errors: {
                404: `Audit event not found.`,
            },
        });
    }
    /**
     * Verify audit signature chain
     * @param from
     * @param to
     * @returns any Verification result.
     * @throws ApiError
     */
    public static verifyAuditChain(
        from?: string,
        to?: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/audit/verify',
            query: {
                'from': from,
                'to': to,
            },
        });
    }
    /**
     * Request audit evidence package
     * @param requestBody
     * @returns any Evidence package info.
     * @throws ApiError
     */
    public static createAuditEvidence(
        requestBody: {
            event_ids?: Array<string>;
            include_context?: boolean;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/audit/evidence',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
