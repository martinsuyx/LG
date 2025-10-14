/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TaskFieldValidation = {
    type?: TaskFieldValidation.type;
    value?: string;
    min?: number;
    max?: number;
};
export namespace TaskFieldValidation {
    export enum type {
        REGEX = 'regex',
        ENUM = 'enum',
        RANGE = 'range',
    }
}

