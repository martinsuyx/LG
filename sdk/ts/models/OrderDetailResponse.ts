/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OrderAuditEntry } from './OrderAuditEntry';
import type { OrderMaterial } from './OrderMaterial';
import type { OrderRiskHit } from './OrderRiskHit';
import type { OrderStatus } from './OrderStatus';
import type { OrderUser } from './OrderUser';
export type OrderDetailResponse = {
    order_id: string;
    created_at: string;
    status: OrderStatus;
    amount: number;
    channel: string;
    store_id: string;
    campaign_id?: string;
    user: OrderUser;
    materials: Array<OrderMaterial>;
    commission?: number;
    settled_amount?: number | null;
    frozen_amount?: number;
    risk_hits?: Array<OrderRiskHit>;
    audits: Array<OrderAuditEntry>;
};

