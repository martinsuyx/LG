/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExportResponse } from '../models/ExportResponse';
import type { TaskActionResponse } from '../models/TaskActionResponse';
import type { TaskCloneResponse } from '../models/TaskCloneResponse';
import type { TaskDetail } from '../models/TaskDetail';
import type { TaskExportRequest } from '../models/TaskExportRequest';
import type { TaskListResponse } from '../models/TaskListResponse';
import type { TaskStatus } from '../models/TaskStatus';
import type { TaskUpsertRequest } from '../models/TaskUpsertRequest';
import type { TaskUpsertResponse } from '../models/TaskUpsertResponse';
import type { TaskValidateResponse } from '../models/TaskValidateResponse';
import type { TaskVersionListResponse } from '../models/TaskVersionListResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TasksService {
    /**
     * List tasks
     * @param status Filter by task status.
     * @param formDslId Filter by bound form DSL identifier.
     * @param riskPolicyId Filter by risk policy identifier.
     * @param role Filter by visible role.
     * @param keyword Search by task name or code.
     * @param page
     * @param pageSize
     * @param sortKey
     * @param sortOrder
     * @returns TaskListResponse Paginated task list.
     * @throws ApiError
     */
    public static listTasks(
        status?: TaskStatus,
        formDslId?: string,
        riskPolicyId?: string,
        role?: 'operator' | 'promoter' | 'store_owner' | 'reviewer',
        keyword?: string,
        page: number = 1,
        pageSize: number = 20,
        sortKey: 'start_time' | 'end_time' | 'name' | 'version' | 'created_at' = 'start_time',
        sortOrder: 'asc' | 'desc' = 'desc',
    ): CancelablePromise<TaskListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/tasks',
            query: {
                'status': status,
                'form_dsl_id': formDslId,
                'risk_policy_id': riskPolicyId,
                'role': role,
                'keyword': keyword,
                'page': page,
                'page_size': pageSize,
                'sort_key': sortKey,
                'sort_order': sortOrder,
            },
            errors: {
                400: `Invalid filters supplied.`,
            },
        });
    }
    /**
     * Create task draft
     * @param requestBody
     * @returns TaskUpsertResponse Task draft created.
     * @throws ApiError
     */
    public static createTask(
        requestBody: TaskUpsertRequest,
    ): CancelablePromise<TaskUpsertResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/tasks',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid payload.`,
                409: `Task code conflict detected.`,
            },
        });
    }
    /**
     * Fetch task detail
     * @param taskId
     * @returns TaskDetail Task detail payload.
     * @throws ApiError
     */
    public static getTaskDetail(
        taskId: string,
    ): CancelablePromise<TaskDetail> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/tasks/{task_id}',
            path: {
                'task_id': taskId,
            },
            errors: {
                404: `Task not found.`,
            },
        });
    }
    /**
     * Update task draft
     * @param taskId
     * @param requestBody
     * @returns TaskUpsertResponse Task draft updated.
     * @throws ApiError
     */
    public static updateTask(
        taskId: string,
        requestBody: TaskUpsertRequest,
    ): CancelablePromise<TaskUpsertResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/tasks/{task_id}',
            path: {
                'task_id': taskId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid payload.`,
                404: `Task not found.`,
                409: `Task code conflict detected.`,
            },
        });
    }
    /**
     * Validate task configuration
     * @param taskId
     * @returns TaskValidateResponse Validation result.
     * @throws ApiError
     */
    public static validateTask(
        taskId: string,
    ): CancelablePromise<TaskValidateResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/tasks/{task_id}/validate',
            path: {
                'task_id': taskId,
            },
            errors: {
                404: `Task not found.`,
            },
        });
    }
    /**
     * Publish task
     * @param taskId
     * @returns TaskActionResponse Task published successfully.
     * @throws ApiError
     */
    public static publishTask(
        taskId: string,
    ): CancelablePromise<TaskActionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/tasks/{task_id}/publish',
            path: {
                'task_id': taskId,
            },
            errors: {
                400: `Task validation failed.`,
                404: `Task not found.`,
            },
        });
    }
    /**
     * Offline task
     * @param taskId
     * @param requestBody
     * @returns TaskActionResponse Task moved offline.
     * @throws ApiError
     */
    public static offlineTask(
        taskId: string,
        requestBody: {
            reason: string;
        },
    ): CancelablePromise<TaskActionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/tasks/{task_id}/offline',
            path: {
                'task_id': taskId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Task not found.`,
            },
        });
    }
    /**
     * Clone task as draft
     * @param taskId
     * @returns TaskCloneResponse Task cloned successfully.
     * @throws ApiError
     */
    public static cloneTask(
        taskId: string,
    ): CancelablePromise<TaskCloneResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/tasks/{task_id}/clone',
            path: {
                'task_id': taskId,
            },
            errors: {
                404: `Task not found.`,
            },
        });
    }
    /**
     * List task versions
     * @param taskId
     * @param page
     * @param pageSize
     * @returns TaskVersionListResponse Paginated version history.
     * @throws ApiError
     */
    public static listTaskVersions(
        taskId: string,
        page: number = 1,
        pageSize: number = 20,
    ): CancelablePromise<TaskVersionListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/tasks/{task_id}/versions',
            path: {
                'task_id': taskId,
            },
            query: {
                'page': page,
                'page_size': pageSize,
            },
            errors: {
                404: `Task not found.`,
            },
        });
    }
    /**
     * Enqueue task export task
     * @param requestBody
     * @returns ExportResponse Export task accepted.
     * @throws ApiError
     */
    public static exportTasks(
        requestBody?: TaskExportRequest,
    ): CancelablePromise<ExportResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/exports/tasks',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid export payload.`,
            },
        });
    }
}
