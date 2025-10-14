/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExportResponse } from '../models/ExportResponse';
import type { InviteCreateRequest } from '../models/InviteCreateRequest';
import type { InviteCreateResponse } from '../models/InviteCreateResponse';
import type { MemberBatchMoveRequest } from '../models/MemberBatchMoveRequest';
import type { MemberBatchMoveResponse } from '../models/MemberBatchMoveResponse';
import type { MemberExportRequest } from '../models/MemberExportRequest';
import type { MemberImportRequest } from '../models/MemberImportRequest';
import type { MemberImportTask } from '../models/MemberImportTask';
import type { MemberRole } from '../models/MemberRole';
import type { MemberStatus } from '../models/MemberStatus';
import type { TeamChildrenResponse } from '../models/TeamChildrenResponse';
import type { TeamDetail } from '../models/TeamDetail';
import type { TeamExportRequest } from '../models/TeamExportRequest';
import type { TeamGrantRequest } from '../models/TeamGrantRequest';
import type { TeamGrantResponse } from '../models/TeamGrantResponse';
import type { TeamListResponse } from '../models/TeamListResponse';
import type { TeamMembersResponse } from '../models/TeamMembersResponse';
import type { TeamMoveRequest } from '../models/TeamMoveRequest';
import type { TeamMoveResponse } from '../models/TeamMoveResponse';
import type { TeamStatus } from '../models/TeamStatus';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TeamsService {
    /**
     * List root teams
     * @param companyId Filter root teams bound to company.
     * @param keyword Search team name or lead.
     * @param status Filter by team status.
     * @returns TeamListResponse Root team forest.
     * @throws ApiError
     */
    public static listTeams(
        companyId?: string,
        keyword?: string,
        status?: TeamStatus,
    ): CancelablePromise<TeamListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/teams',
            query: {
                'company_id': companyId,
                'keyword': keyword,
                'status': status,
            },
            errors: {
                400: `Invalid filters supplied.`,
            },
        });
    }
    /**
     * Fetch team detail
     * @param teamId
     * @returns TeamDetail Team detail payload.
     * @throws ApiError
     */
    public static getTeamDetail(
        teamId: string,
    ): CancelablePromise<TeamDetail> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/teams/{team_id}',
            path: {
                'team_id': teamId,
            },
            errors: {
                404: `Team not found.`,
            },
        });
    }
    /**
     * List immediate children under a team
     * @param teamId
     * @returns TeamChildrenResponse Direct child teams.
     * @throws ApiError
     */
    public static listTeamChildren(
        teamId: string,
    ): CancelablePromise<TeamChildrenResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/teams/{team_id}/children',
            path: {
                'team_id': teamId,
            },
            errors: {
                404: `Team not found.`,
            },
        });
    }
    /**
     * List members under team
     * @param teamId
     * @param status
     * @param role
     * @param keyword
     * @param sortKey
     * @param sortOrder
     * @param page One-based page index.
     * @param pageSize Number of records per page.
     * @returns TeamMembersResponse Paginated team members.
     * @throws ApiError
     */
    public static listTeamMembers(
        teamId: string,
        status?: MemberStatus,
        role?: MemberRole,
        keyword?: string,
        sortKey: 'joined_at' | 'name' | 'role' | 'status' = 'joined_at',
        sortOrder: 'asc' | 'desc' = 'desc',
        page: number = 1,
        pageSize: number = 20,
    ): CancelablePromise<TeamMembersResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/teams/{team_id}/members',
            path: {
                'team_id': teamId,
            },
            query: {
                'status': status,
                'role': role,
                'keyword': keyword,
                'sort_key': sortKey,
                'sort_order': sortOrder,
                'page': page,
                'page_size': pageSize,
            },
            errors: {
                404: `Team not found.`,
            },
        });
    }
    /**
     * Move team to new parent
     * @param teamId
     * @param requestBody
     * @returns TeamMoveResponse Team moved successfully.
     * @throws ApiError
     */
    public static moveTeam(
        teamId: string,
        requestBody: TeamMoveRequest,
    ): CancelablePromise<TeamMoveResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/teams/{team_id}/move',
            path: {
                'team_id': teamId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid payload.`,
                404: `Team not found.`,
                409: `Loop detected or illegal parent.`,
            },
        });
    }
    /**
     * Grant team management roles
     * @param teamId
     * @param requestBody
     * @returns TeamGrantResponse Team roles updated.
     * @throws ApiError
     */
    public static grantTeamRoles(
        teamId: string,
        requestBody: TeamGrantRequest,
    ): CancelablePromise<TeamGrantResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/teams/{team_id}/grant',
            path: {
                'team_id': teamId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid payload.`,
                404: `Team not found.`,
            },
        });
    }
    /**
     * Batch move members to target team
     * @param requestBody
     * @returns MemberBatchMoveResponse Members moved successfully.
     * @throws ApiError
     */
    public static batchMoveMembers(
        requestBody: MemberBatchMoveRequest,
    ): CancelablePromise<MemberBatchMoveResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/members/batch_move',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid payload.`,
                404: `Source or target team not found.`,
            },
        });
    }
    /**
     * Enqueue member import job
     * @param requestBody
     * @returns MemberImportTask Import task accepted.
     * @throws ApiError
     */
    public static importMembers(
        requestBody: MemberImportRequest,
    ): CancelablePromise<MemberImportTask> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/members/import',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid payload.`,
                422: `Validation error for import.`,
            },
        });
    }
    /**
     * Retrieve member import task status
     * @param taskId
     * @returns MemberImportTask Import task status payload.
     * @throws ApiError
     */
    public static getMemberImportTask(
        taskId: string,
    ): CancelablePromise<MemberImportTask> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/members/import/{task_id}',
            path: {
                'task_id': taskId,
            },
            errors: {
                404: `Task not found.`,
            },
        });
    }
    /**
     * Create team invite
     * @param requestBody
     * @returns InviteCreateResponse Invite created.
     * @throws ApiError
     */
    public static createInvite(
        requestBody: InviteCreateRequest,
    ): CancelablePromise<InviteCreateResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/invites',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid payload.`,
                404: `Target team not found.`,
                409: `Invite quota conflict.`,
            },
        });
    }
    /**
     * Enqueue member export
     * @param requestBody
     * @returns ExportResponse Export task accepted.
     * @throws ApiError
     */
    public static exportMembers(
        requestBody?: MemberExportRequest,
    ): CancelablePromise<ExportResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/exports/members',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid export payload.`,
            },
        });
    }
    /**
     * Enqueue team export
     * @param requestBody
     * @returns ExportResponse Export task accepted.
     * @throws ApiError
     */
    public static exportTeams(
        requestBody?: TeamExportRequest,
    ): CancelablePromise<ExportResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/exports/teams',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid export payload.`,
            },
        });
    }
}
