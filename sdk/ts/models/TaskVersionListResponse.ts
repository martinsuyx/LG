/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TaskVersionListResponse = {
    total: number;
    page?: number;
    page_size?: number;
    items: Array<{
        version: number;
        operator: string;
        time: string;
        changelog: string;
        diff?: Record<string, any>;
    }>;
};

