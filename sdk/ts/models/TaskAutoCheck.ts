/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TaskAutoCheck = {
    key: string;
    rule: string;
    level: TaskAutoCheck.level;
    message: string;
};
export namespace TaskAutoCheck {
    export enum level {
        ERROR = 'error',
        WARN = 'warn',
    }
}

