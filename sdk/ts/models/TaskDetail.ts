/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskFormBinding } from './TaskFormBinding';
import type { TaskListItem } from './TaskListItem';
import type { TaskReleasePlan } from './TaskReleasePlan';
import type { TaskReviewRules } from './TaskReviewRules';
import type { TaskVersionListResponse } from './TaskVersionListResponse';
export type TaskDetail = (TaskListItem & {
    desc?: string;
    form_dsl?: TaskFormBinding;
    review_rules?: TaskReviewRules;
    risk_action?: TaskDetail.risk_action;
    release?: TaskReleasePlan;
    versions?: TaskVersionListResponse;
});
export namespace TaskDetail {
    export enum risk_action {
        BLOCK = 'block',
        QUEUE = 'queue',
        FLAG = 'flag',
    }
}

