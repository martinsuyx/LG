/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DashboardAlert = {
    type: DashboardAlert.type;
    level: DashboardAlert.level;
    title: string;
    description?: string;
    action_link?: string;
};
export namespace DashboardAlert {
    export enum type {
        RISK = 'risk',
        CALLBACK = 'callback',
        EXPORT = 'export',
        PAYOUT = 'payout',
    }
    export enum level {
        INFO = 'info',
        WARN = 'warn',
        ERROR = 'error',
    }
}

