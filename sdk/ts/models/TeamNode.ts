/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TeamNode = {
    team_id: string;
    name: string;
    parent_id?: string | null;
    has_children: boolean;
    members_count: number;
    lead_user_id?: string | null;
    lead_user_name?: string | null;
    company_bindings?: Array<string>;
    tags?: Array<string>;
};

