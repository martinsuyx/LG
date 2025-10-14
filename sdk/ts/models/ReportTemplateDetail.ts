/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ReportTemplateField } from './ReportTemplateField';
export type ReportTemplateDetail = {
    template_id: string;
    name: string;
    category?: string;
    version?: string;
    description?: string;
    fields: Array<ReportTemplateField>;
    sample?: string;
};

