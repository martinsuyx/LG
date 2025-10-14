/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TaskReleasePlan = {
    mode?: TaskReleasePlan.mode;
    schedule_time?: string;
    gray_percent?: number;
    rollback_to_version?: number;
};
export namespace TaskReleasePlan {
    export enum mode {
        IMMEDIATE = 'immediate',
        SCHEDULED = 'scheduled',
        GRAY = 'gray',
    }
}

