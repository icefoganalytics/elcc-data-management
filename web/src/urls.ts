import * as config from "./config"

export const HEALTHCHECK_URL = `${config.API_BASE_URL}/api/healthcheck`

// App specific URLS
export const CENTRE_URL = `${config.API_BASE_URL}/api/centre`
export const SUBMISSION_LINES_URL = `${config.API_BASE_URL}/api/submission-line`
