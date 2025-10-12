/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OrderBatchReviewRequest } from '../models/OrderBatchReviewRequest';
import type { OrderBatchReviewResponse } from '../models/OrderBatchReviewResponse';
import type { OrderDetailResponse } from '../models/OrderDetailResponse';
import type { OrderListResponse } from '../models/OrderListResponse';
import type { OrderReviewRequest } from '../models/OrderReviewRequest';
import type { OrderReviewResponse } from '../models/OrderReviewResponse';
import type { OrderStatus } from '../models/OrderStatus';
import type { OrderSubmitRequest } from '../models/OrderSubmitRequest';
import type { OrderSubmitResponse } from '../models/OrderSubmitResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class OrdersService {
    /**
     * List orders with filters
     * @param start Start date (inclusive) in ISO format.
     * @param end End date (inclusive) in ISO format.
     * @param status Filter by one or more order statuses.
     * @param channel Channel multi-select filter.
     * @param storeCode Filter by store code.
     * @param promoterId Filter by promoter identifier.
     * @param orderId Exact order identifier search.
     * @param phone Contact phone number (supports partial match).
     * @param page One-based page index.
     * @param pageSize Number of records per page.
     * @param sort Sort key for the order list.
     * @param order Sort direction.
     * @returns OrderListResponse Paginated list of orders.
     * @throws ApiError
     */
    public static listOrders(
        start?: string,
        end?: string,
        status?: Array<OrderStatus>,
        channel?: Array<'wechat' | 'h5' | 'scan' | 'api'>,
        storeCode?: string,
        promoterId?: string,
        orderId?: string,
        phone?: string,
        page: number = 1,
        pageSize: number = 20,
        sort: 'created_at' | 'amount' | 'status' = 'created_at',
        order: 'asc' | 'desc' = 'desc',
    ): CancelablePromise<OrderListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/orders',
            query: {
                'start': start,
                'end': end,
                'status': status,
                'channel': channel,
                'store_code': storeCode,
                'promoter_id': promoterId,
                'order_id': orderId,
                'phone': phone,
                'page': page,
                'page_size': pageSize,
                'sort': sort,
                'order': order,
            },
            errors: {
                400: `Invalid filters supplied.`,
            },
        });
    }
    /**
     * Submit an order confirmed from AI intake
     * Persist an order after operators review and confirm AI parsed fields.
     *
     * @param requestBody
     * @returns OrderSubmitResponse Order created successfully.
     * @throws ApiError
     */
    public static submitOrder(
        requestBody: OrderSubmitRequest,
    ): CancelablePromise<OrderSubmitResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/orders',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Validation error on submitted fields.`,
                409: `Duplicate submission detected.`,
            },
        });
    }
    /**
     * Fetch order detail
     * @param orderId
     * @returns OrderDetailResponse Order detail payload.
     * @throws ApiError
     */
    public static getOrderDetail(
        orderId: string,
    ): CancelablePromise<OrderDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/orders/{order_id}',
            path: {
                'order_id': orderId,
            },
            errors: {
                404: `Order not found.`,
            },
        });
    }
    /**
     * Review single order
     * @param orderId
     * @param requestBody
     * @returns OrderReviewResponse Order review result.
     * @throws ApiError
     */
    public static reviewOrder(
        orderId: string,
        requestBody: OrderReviewRequest,
    ): CancelablePromise<OrderReviewResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/orders/{order_id}/actions/review',
            path: {
                'order_id': orderId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid action or note.`,
                403: `Not allowed to review this order.`,
            },
        });
    }
    /**
     * Batch review orders
     * @param requestBody
     * @returns OrderBatchReviewResponse Batch review processed successfully.
     * @throws ApiError
     */
    public static batchReviewOrders(
        requestBody: OrderBatchReviewRequest,
    ): CancelablePromise<OrderBatchReviewResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/orders/batch_review',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid batch payload.`,
                403: `Not allowed to perform batch review.`,
            },
        });
    }
}
