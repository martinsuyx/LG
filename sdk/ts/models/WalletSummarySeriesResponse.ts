/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WalletSummarySeriesPoint } from './WalletSummarySeriesPoint';
export type WalletSummarySeriesResponse = {
    metric: WalletSummarySeriesResponse.metric;
    points: Array<WalletSummarySeriesPoint>;
};
export namespace WalletSummarySeriesResponse {
    export enum metric {
        BALANCE = 'balance',
        IN_OUT = 'in_out',
    }
}

