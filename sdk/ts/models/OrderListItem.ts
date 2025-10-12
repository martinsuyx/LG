/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OrderStatus } from './OrderStatus';
export type OrderListItem = {
    order_id: string;
    created_at: string;
    status: OrderStatus;
    channel: string;
    store_name: string;
    promoter_name: string;
    amount: number;
    settled_amount?: number | null;
};

