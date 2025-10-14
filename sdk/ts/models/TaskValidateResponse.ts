/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TaskValidateResponse = {
    ok: boolean;
    missing_fields: Array<string>;
    invalid_rules: Array<{
        key?: string;
        reason?: string;
    }>;
    warnings: Array<{
        message?: string;
    }>;
};

