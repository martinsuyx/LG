/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UploadRequest } from '../models/UploadRequest';
import type { UploadResponse } from '../models/UploadResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UploadsService {
    /**
     * Request upload credentials for AI intake images
     * @param requestBody
     * @returns UploadResponse Upload credentials and URLs.
     * @throws ApiError
     */
    public static createUploadPolicy(
        requestBody: UploadRequest,
    ): CancelablePromise<UploadResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/uploads',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid filename or content type.`,
            },
        });
    }
}
