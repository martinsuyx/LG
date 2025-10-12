/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DashboardKpi = {
    key: DashboardKpi.key;
    label: string;
    value: number;
    /**
     * Absolute change versus comparison period.
     */
    delta?: number;
    /**
     * Relative change versus comparison period.
     */
    delta_rate?: number;
    trend?: DashboardKpi.trend;
    unit: string;
    drill_link: string;
};
export namespace DashboardKpi {
    export enum key {
        ORDERS_TODAY = 'orders_today',
        SETTLEMENT_TODAY = 'settlement_today',
        PENDING_REVIEWS = 'pending_reviews',
        RISK_HITS = 'risk_hits',
        PAYOUT_PROCESSING = 'payout_processing',
        APPROVAL_RATE = 'approval_rate',
    }
    export enum trend {
        UP = 'up',
        DOWN = 'down',
        FLAT = 'flat',
    }
}

