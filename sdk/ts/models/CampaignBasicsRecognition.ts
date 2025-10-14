/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CampaignBasicsRecognition = {
    template_id?: string;
    template_name?: string;
    confidence?: number;
    matched_fields?: Array<{
        field?: string;
        label?: string;
        confidence?: number;
    }>;
    hints?: Array<string>;
};

