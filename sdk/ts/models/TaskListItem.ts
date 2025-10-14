/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskScope } from './TaskScope';
import type { TaskStatus } from './TaskStatus';
export type TaskListItem = {
    task_id: string;
    name: string;
    code: string;
    status: TaskStatus;
    version: number;
    start_time: string;
    end_time: string;
    form_dsl_id: string;
    risk_policy_id?: string | null;
    visible_to_roles: Array<string>;
    scope: TaskScope;
};

