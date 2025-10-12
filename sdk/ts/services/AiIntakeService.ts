/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AIIntakeStartRequest } from '../models/AIIntakeStartRequest';
import type { AIIntakeStartResponse } from '../models/AIIntakeStartResponse';
import type { AIIntakeStatusResponse } from '../models/AIIntakeStatusResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AiIntakeService {
    /**
     * Start AI intake parsing job
     * Upload references to already stored images and trigger an AI OCR job that extracts order fields.
     *
     * @param requestBody
     * @returns AIIntakeStartResponse Parsing job accepted.
     * @throws ApiError
     */
    public static startAiIntake(
        requestBody: AIIntakeStartRequest,
    ): CancelablePromise<AIIntakeStartResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/orders/ai-intake',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid payload or unsupported images.`,
            },
        });
    }
    /**
     * Get AI intake parsing status
     * @param jobId
     * @returns AIIntakeStatusResponse Current status of the AI intake job.
     * @throws ApiError
     */
    public static getAiIntakeStatus(
        jobId: string,
    ): CancelablePromise<AIIntakeStatusResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/orders/ai-intake/{job_id}',
            path: {
                'job_id': jobId,
            },
            errors: {
                404: `Job not found.`,
            },
        });
    }
}
