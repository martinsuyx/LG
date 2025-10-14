/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SettingsService {
    /**
     * Get system settings
     * @returns any Settings payload grouped by module.
     * @throws ApiError
     */
    public static getSystemSettings(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/settings',
        });
    }
    /**
     * Save settings draft for group
     * @param group
     * @param requestBody
     * @returns any Draft saved.
     * @throws ApiError
     */
    public static saveSettingsGroup(
        group: 'uploads' | 'secrets' | 'flags' | 'notify' | 'i18n' | 'auth',
        requestBody: Record<string, any>,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/settings/{group}',
            path: {
                'group': group,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Submit settings group for approval
     * @returns any Submitted.
     * @throws ApiError
     */
    public static submitSettingsGroup(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/settings/{group}/submit',
        });
    }
    /**
     * Approve settings group
     * @returns any Group approved.
     * @throws ApiError
     */
    public static approveSettingsGroup(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/settings/{group}/approve',
        });
    }
    /**
     * Test settings group connection
     * @returns any Test result.
     * @throws ApiError
     */
    public static testSettingsGroup(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/settings/{group}/test',
        });
    }
}
