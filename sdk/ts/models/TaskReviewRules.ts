/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskAutoCheck } from './TaskAutoCheck';
import type { TaskSampling } from './TaskSampling';
import type { TaskThreshold } from './TaskThreshold';
export type TaskReviewRules = {
    auto_checks?: Array<TaskAutoCheck>;
    thresholds?: Array<TaskThreshold>;
    sampling?: TaskSampling;
    double_review?: boolean;
    /**
     * Review SLA in minutes.
     */
    sla?: number;
};

