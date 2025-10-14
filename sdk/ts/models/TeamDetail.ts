/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TeamStatus } from './TeamStatus';
export type TeamDetail = {
    team_id: string;
    name: string;
    parent_id?: string | null;
    lead_user_id?: string | null;
    lead_user_name?: string | null;
    tags?: Array<string>;
    company_bindings?: Array<string>;
    status: TeamStatus;
    created_at?: string | null;
    members_count: number;
    stores_count: number;
    desc?: string | null;
};

