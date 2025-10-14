/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CampaignBasicsSaveResponse = {
    ok?: boolean;
    campaign_id?: string;
    saved_at?: string;
    next_step?: CampaignBasicsSaveResponse.next_step;
};
export namespace CampaignBasicsSaveResponse {
    export enum next_step {
        PLANS = 'plans',
        SCOPE = 'scope',
        RULES = 'rules',
        COMPLETE = 'complete',
    }
}

