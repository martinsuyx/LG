/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RiskService {
    /**
     * List risk hits
     * @param start
     * @param end
     * @param severity
     * @param status
     * @param channel
     * @param page
     * @param pageSize
     * @returns any Risk hit list.
     * @throws ApiError
     */
    public static listRiskHits(
        start?: string,
        end?: string,
        severity?: 'low' | 'medium' | 'high' | 'critical',
        status?: 'new' | 'processing' | 'resolved' | 'ignored',
        channel?: string,
        page?: number,
        pageSize?: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/risk/hits',
            query: {
                'start': start,
                'end': end,
                'severity': severity,
                'status': status,
                'channel': channel,
                'page': page,
                'page_size': pageSize,
            },
        });
    }
    /**
     * Get risk hit detail
     * @param hitId
     * @returns any Risk hit detail payload.
     * @throws ApiError
     */
    public static getRiskHitDetail(
        hitId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/risk/hits/{hit_id}',
            path: {
                'hit_id': hitId,
            },
            errors: {
                404: `Hit not found.`,
            },
        });
    }
    /**
     * Batch ignore risk hits
     * @param requestBody
     * @returns any Ignore result.
     * @throws ApiError
     */
    public static batchIgnoreRiskHits(
        requestBody: {
            ids?: Array<string>;
            note?: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/risk/hits/batch_ignore',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Create export task for risk hits
     * @param requestBody
     * @returns any Export task enqueued.
     * @throws ApiError
     */
    public static exportRiskHits(
        requestBody: Record<string, any>,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/exports/risk-hits',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * List risk tickets
     * @returns any Ticket list payload.
     * @throws ApiError
     */
    public static listRiskTickets(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/risk/tickets',
        });
    }
    /**
     * Create risk ticket
     * @param requestBody
     * @returns any Ticket created.
     * @throws ApiError
     */
    public static createRiskTicket(
        requestBody: {
            hit_id?: string;
            priority?: string;
            note?: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/risk/tickets',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get risk ticket detail
     * @param ticketId
     * @returns any Ticket detail payload.
     * @throws ApiError
     */
    public static getRiskTicketDetail(
        ticketId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/risk/tickets/{ticket_id}',
            path: {
                'ticket_id': ticketId,
            },
            errors: {
                404: `Ticket not found.`,
            },
        });
    }
    /**
     * Assign risk ticket
     * @param ticketId
     * @returns any Assignment accepted.
     * @throws ApiError
     */
    public static assignRiskTicket(
        ticketId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/risk/tickets/{ticket_id}/assign',
            path: {
                'ticket_id': ticketId,
            },
        });
    }
    /**
     * Start investigation
     * @param ticketId
     * @returns any Ticket moved to investigating.
     * @throws ApiError
     */
    public static startRiskTicket(
        ticketId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/risk/tickets/{ticket_id}/start',
            path: {
                'ticket_id': ticketId,
            },
        });
    }
    /**
     * Mark ticket pending information
     * @param ticketId
     * @returns any Ticket moved to pending.
     * @throws ApiError
     */
    public static pendRiskTicket(
        ticketId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/risk/tickets/{ticket_id}/pend',
            path: {
                'ticket_id': ticketId,
            },
        });
    }
    /**
     * Resolve risk ticket
     * @param ticketId
     * @returns any Ticket resolved.
     * @throws ApiError
     */
    public static resolveRiskTicket(
        ticketId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/risk/tickets/{ticket_id}/resolve',
            path: {
                'ticket_id': ticketId,
            },
        });
    }
    /**
     * Reject risk ticket
     * @param ticketId
     * @returns any Ticket rejected.
     * @throws ApiError
     */
    public static rejectRiskTicket(
        ticketId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/risk/tickets/{ticket_id}/reject',
            path: {
                'ticket_id': ticketId,
            },
        });
    }
    /**
     * Close risk ticket
     * @param ticketId
     * @returns any Ticket closed.
     * @throws ApiError
     */
    public static closeRiskTicket(
        ticketId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/risk/tickets/{ticket_id}/close',
            path: {
                'ticket_id': ticketId,
            },
        });
    }
    /**
     * List risk lists
     * @returns any Risk lists.
     * @throws ApiError
     */
    public static listRiskLists(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/risk/lists',
        });
    }
    /**
     * Create risk list item
     * @param requestBody
     * @returns any List item created.
     * @throws ApiError
     */
    public static createRiskList(
        requestBody: Record<string, any>,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/risk/lists',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get list detail
     * @param listId
     * @returns any List detail payload.
     * @throws ApiError
     */
    public static getRiskListDetail(
        listId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/risk/lists/{list_id}',
            path: {
                'list_id': listId,
            },
        });
    }
    /**
     * Import risk lists
     * @param requestBody
     * @returns any Import task accepted.
     * @throws ApiError
     */
    public static importRiskLists(
        requestBody: Record<string, any>,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/risk/lists/import',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get import task
     * @param taskId
     * @returns any Import task detail.
     * @throws ApiError
     */
    public static getRiskListImportTask(
        taskId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/risk/lists/import/{task_id}',
            path: {
                'task_id': taskId,
            },
        });
    }
    /**
     * Preview deduplication result
     * @param requestBody
     * @returns any Dedup preview.
     * @throws ApiError
     */
    public static previewRiskListDedup(
        requestBody: Record<string, any>,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/risk/lists/dedup_preview',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * List risk rules
     * @returns any Risk rule list.
     * @throws ApiError
     */
    public static listRiskRules(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/risk/rules',
        });
    }
    /**
     * Get rule detail
     * @param ruleId
     * @returns any Rule detail payload.
     * @throws ApiError
     */
    public static getRiskRuleDetail(
        ruleId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/risk/rules/{rule_id}',
            path: {
                'rule_id': ruleId,
            },
        });
    }
    /**
     * Run rule simulation
     * @param ruleId
     * @returns any Simulation result.
     * @throws ApiError
     */
    public static simulateRiskRule(
        ruleId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/risk/rules/{rule_id}/simulate',
            path: {
                'rule_id': ruleId,
            },
        });
    }
    /**
     * Publish risk rule
     * @param ruleId
     * @returns any Publish accepted.
     * @throws ApiError
     */
    public static publishRiskRule(
        ruleId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/risk/rules/{rule_id}/publish',
            path: {
                'rule_id': ruleId,
            },
        });
    }
    /**
     * Replay risk rule
     * @param ruleId
     * @returns any Replay enqueued.
     * @throws ApiError
     */
    public static replayRiskRule(
        ruleId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/risk/rules/{rule_id}/replay',
            path: {
                'rule_id': ruleId,
            },
        });
    }
}
