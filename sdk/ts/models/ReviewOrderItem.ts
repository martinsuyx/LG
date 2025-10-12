/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OrderStatus } from './OrderStatus';
export type ReviewOrderItem = {
    order_id?: string;
    created_at?: string;
    user_name?: string;
    phone?: string;
    store_name?: string;
    campaign_name?: string;
    amount?: number;
    status?: OrderStatus;
    risk_flag?: boolean;
};

