/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ReportTemplateDetail } from '../models/ReportTemplateDetail';
import type { ReportTemplateListResponse } from '../models/ReportTemplateListResponse';
import type { ReportTemplateParseRequest } from '../models/ReportTemplateParseRequest';
import type { ReportTemplateParseResponse } from '../models/ReportTemplateParseResponse';
import type { ReportTemplateRecognizeRequest } from '../models/ReportTemplateRecognizeRequest';
import type { ReportTemplateRecognizeResponse } from '../models/ReportTemplateRecognizeResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ReportTemplatesService {
    /**
     * List available report templates
     * @returns ReportTemplateListResponse Report template catalogue.
     * @throws ApiError
     */
    public static listReportTemplates(): CancelablePromise<ReportTemplateListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/report_templates',
        });
    }
    /**
     * Get report template detail
     * @param templateId
     * @returns ReportTemplateDetail Report template detail.
     * @throws ApiError
     */
    public static getReportTemplate(
        templateId: string,
    ): CancelablePromise<ReportTemplateDetail> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/report_templates/{template_id}',
            path: {
                'template_id': templateId,
            },
            errors: {
                404: `Template not found.`,
            },
        });
    }
    /**
     * Parse example data with template
     * @param templateId
     * @param requestBody
     * @returns ReportTemplateParseResponse Parse result summary.
     * @throws ApiError
     */
    public static parseReportTemplateExample(
        templateId: string,
        requestBody: ReportTemplateParseRequest,
    ): CancelablePromise<ReportTemplateParseResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/report_templates/{template_id}/parse_example',
            path: {
                'template_id': templateId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Template not found.`,
            },
        });
    }
    /**
     * Recognize matching report template
     * @param requestBody
     * @returns ReportTemplateRecognizeResponse Recognized template suggestion.
     * @throws ApiError
     */
    public static recognizeReportTemplate(
        requestBody: ReportTemplateRecognizeRequest,
    ): CancelablePromise<ReportTemplateRecognizeResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/report_templates/recognize',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
