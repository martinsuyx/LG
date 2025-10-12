/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DashboardSeriesPoint } from './DashboardSeriesPoint';
export type DashboardSeriesResponse = {
    metric: DashboardSeriesResponse.metric;
    points: Array<DashboardSeriesPoint>;
};
export namespace DashboardSeriesResponse {
    export enum metric {
        ORDERS = 'orders',
        GMV = 'gmv',
        APPROVAL_RATE = 'approval_rate',
    }
}

