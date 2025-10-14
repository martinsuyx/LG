/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UsersService {
    /**
     * List roles
     * @returns any Role list payload.
     * @throws ApiError
     */
    public static listRoles(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/roles',
        });
    }
    /**
     * Get role detail
     * @param roleId
     * @returns any Role detail payload.
     * @throws ApiError
     */
    public static getRoleDetail(
        roleId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/roles/{role_id}',
            path: {
                'role_id': roleId,
            },
            errors: {
                404: `Role not found.`,
            },
        });
    }
    /**
     * List users
     * @returns any User list payload.
     * @throws ApiError
     */
    public static listUsers(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/users',
        });
    }
    /**
     * Create user
     * @param requestBody
     * @returns any User created.
     * @throws ApiError
     */
    public static createUser(
        requestBody: {
            name?: string;
            phone?: string;
            email?: string;
            role_ids?: Array<string>;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/users',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get user detail
     * @param userId
     * @returns any User detail payload.
     * @throws ApiError
     */
    public static getUserDetail(
        userId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/users/{user_id}',
            path: {
                'user_id': userId,
            },
            errors: {
                404: `User not found.`,
            },
        });
    }
    /**
     * Assign roles to user
     * @param userId
     * @param requestBody
     * @returns any Roles updated.
     * @throws ApiError
     */
    public static assignUserRoles(
        userId: string,
        requestBody: {
            role_ids?: Array<string>;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/users/{user_id}/roles',
            path: {
                'user_id': userId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Reset user password
     * @param userId
     * @returns any Temporary password generated.
     * @throws ApiError
     */
    public static resetUserPassword(
        userId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/users/{user_id}/reset_password',
            path: {
                'user_id': userId,
            },
        });
    }
    /**
     * Freeze user account
     * @param userId
     * @returns any User frozen.
     * @throws ApiError
     */
    public static freezeUser(
        userId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/users/{user_id}/freeze',
            path: {
                'user_id': userId,
            },
        });
    }
    /**
     * Activate frozen user
     * @param userId
     * @returns any User activated.
     * @throws ApiError
     */
    public static activateUser(
        userId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/users/{user_id}/activate',
            path: {
                'user_id': userId,
            },
        });
    }
    /**
     * Create export task for users
     * @param requestBody
     * @returns any Export queued.
     * @throws ApiError
     */
    public static exportUsersList(
        requestBody: Record<string, any>,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/exports/users',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
