/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskFormBinding } from './TaskFormBinding';
import type { TaskReleasePlan } from './TaskReleasePlan';
import type { TaskReviewRules } from './TaskReviewRules';
import type { TaskScope } from './TaskScope';
export type TaskUpsertRequest = {
    name: string;
    code: string;
    desc?: string;
    start_time: string;
    end_time: string;
    visible_to_roles: Array<string>;
    scope: TaskScope;
    form_dsl_id: string;
    form_dsl: TaskFormBinding;
    review_rules: TaskReviewRules;
    risk_policy_id?: string | null;
    risk_action?: TaskUpsertRequest.risk_action;
    release?: TaskReleasePlan;
};
export namespace TaskUpsertRequest {
    export enum risk_action {
        BLOCK = 'block',
        QUEUE = 'queue',
        FLAG = 'flag',
    }
}

