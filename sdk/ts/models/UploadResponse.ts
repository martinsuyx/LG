/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UploadResponse = {
    uploads: Array<{
        file_id: string;
        upload_url: string;
        /**
         * Headers required when uploading to object storage.
         */
        headers?: Record<string, any>;
        /**
         * Expiration duration in seconds for the upload URL.
         */
        expires_in?: number;
    }>;
};

