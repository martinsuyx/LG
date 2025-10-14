/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MemberRole } from './MemberRole';
import type { MemberStatus } from './MemberStatus';
export type TeamMember = {
    user_id: string;
    name: string;
    phone?: string;
    email?: string | null;
    role: MemberRole;
    status: MemberStatus;
    joined_at: string;
    left_at?: string | null;
    team_path?: Array<string>;
    tags?: Array<string>;
    metrics?: Record<string, any>;
    frozen_reason?: string | null;
};

