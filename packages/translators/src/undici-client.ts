import { Pool, Agent } from "undici";
import type { Method } from "axios";

/**
 * High-performance HTTP client using Undici with connection pooling
 * Provides axios-compatible interface while leveraging HTTP/2 and connection reuse
 */

interface UndiciRequestConfig {
    url?: string;
    method?: Method;
    data?: any;
    headers?: any;
    timeout?: number;
    params?: any;
    responseType?: "json" | "text" | "blob" | "arraybuffer";
    baseURL?: string;
    validateStatus?: (status: number) => boolean;
}

interface UndiciResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: any;
    config: UndiciRequestConfig;
    request?: any;
}

/**
 * Connection pool manager for different hosts
 */
class PoolManager {
    private pools = new Map<string, Pool>();
    private agent: Agent;

    constructor() {
        // Create a global agent with optimal settings
        this.agent = new Agent({
            connections: 12, // Max concurrent connections per origin
            pipelining: 6, // Max requests per connection
            keepAliveTimeout: 60_000, // Keep connections alive for 1 minute
            keepAliveMaxTimeout: 120_000,
            allowH2: true, // Enable HTTP/2 when available
            bodyTimeout: 30_000, // Body timeout
            headersTimeout: 30_000, // Headers timeout
        });
    }

    getPool(origin: string): Pool {
        if (!this.pools.has(origin)) {
            const pool = new Pool(origin, {
                connections: 10,
                pipelining: 6,
                keepAliveTimeout: 60_000,
                allowH2: true,
                bodyTimeout: 30_000,
                headersTimeout: 30_000,
            });
            this.pools.set(origin, pool);
        }
        return this.pools.get(origin)!;
    }

    getAgent(): Agent {
        return this.agent;
    }

    async closeAll(): Promise<void> {
        await Promise.all([
            ...Array.from(this.pools.values()).map((pool) => pool.close()),
            this.agent.close(),
        ]);
        this.pools.clear();
    }
}

// Global pool manager instance
const poolManager = new PoolManager();

/**
 * Undici-based HTTP client with axios-compatible interface
 */
const createUndiciClient = () => {
    const undiciClient = async function (
        config: UndiciRequestConfig | string
    ): Promise<UndiciResponse> {
        // Handle string URL shorthand
        if (typeof config === "string") {
            config = { url: config, method: "GET" as Method };
        }

        const {
            url,
            method = "GET" as Method,
            data,
            headers = {},
            timeout = 8000,
            params,
            responseType = "json",
            baseURL = "",
            validateStatus = (status: number) => status >= 200 && status < 300,
        } = config;

        // Build full URL
        let fullUrl = baseURL ? baseURL + url : url!;

        // Add query parameters
        if (params) {
            const searchParams = new URLSearchParams(params);
            fullUrl += (fullUrl.includes("?") ? "&" : "?") + searchParams.toString();
        }

        // Parse URL to get origin for pool selection
        const urlObj = new URL(fullUrl);
        const origin = `${urlObj.protocol}//${urlObj.host}`;

        // Prepare request options
        const requestOptions: any = {
            method: method.toUpperCase(),
            headers: { ...headers },
            bodyTimeout: timeout,
            headersTimeout: timeout,
        };

        // Add request body
        if (data && !["GET", "HEAD"].includes(requestOptions.method)) {
            if (typeof data === "string") {
                requestOptions.body = data;
            } else if (data instanceof FormData || data instanceof URLSearchParams) {
                requestOptions.body = data;
            } else if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
                requestOptions.body = data;
            } else {
                requestOptions.body = JSON.stringify(data);
                if (!requestOptions.headers["content-type"]) {
                    requestOptions.headers["content-type"] = "application/json";
                }
            }
        }

        try {
            // Use connection pool for the request
            const pool = poolManager.getPool(origin);
            const response = await pool.request({
                path: urlObj.pathname + urlObj.search,
                ...requestOptions,
            });

            // Process response based on responseType
            let responseData: any;
            const responseText = await response.body.text();

            switch (responseType) {
                case "text":
                    responseData = responseText;
                    break;
                case "blob":
                    responseData = new Blob([responseText]);
                    break;
                case "arraybuffer":
                    responseData = new TextEncoder().encode(responseText).buffer;
                    break;
                case "json":
                default:
                    try {
                        responseData = responseText ? JSON.parse(responseText) : {};
                    } catch (e) {
                        responseData = responseText;
                    }
                    break;
            }

            // Convert headers to plain object
            const headersObj: any = {};
            Object.entries(response.headers).forEach(([key, value]) => {
                headersObj[key] = value;
            });

            const undiciResponse: UndiciResponse = {
                data: responseData,
                status: response.statusCode,
                statusText: `${response.statusCode}`,
                headers: headersObj,
                config: config as UndiciRequestConfig,
                request: { responseURL: fullUrl },
            };

            if (!validateStatus(response.statusCode)) {
                const error = new Error(`Request failed with status ${response.statusCode}`) as any;
                error.config = config;
                error.response = undiciResponse;
                error.code = response.statusCode >= 500 ? "ECONNABORTED" : "ERR_BAD_REQUEST";
                throw error;
            }

            return undiciResponse;
        } catch (error: any) {
            if (error.code === "UND_ERR_HEADERS_TIMEOUT" || error.code === "UND_ERR_BODY_TIMEOUT") {
                throw {
                    errorType: "NET_ERR",
                    errorCode: 0,
                    errorMsg: `Request timeout after ${timeout}ms`,
                };
            } else if (error.response) {
                throw {
                    errorType: "NET_ERR",
                    errorCode: error.response.status || 0,
                    errorMsg: error.message || "Request failed",
                };
            } else {
                throw {
                    errorType: "NET_ERR",
                    errorCode: 0,
                    errorMsg: error.message || "Network Error",
                };
            }
        }
    } as any;

    // Add HTTP method shortcuts
    undiciClient.get = (url: string, config: UndiciRequestConfig = {}) =>
        undiciClient({ ...config, url, method: "GET" as Method });
    undiciClient.post = (url: string, data?: any, config: UndiciRequestConfig = {}) =>
        undiciClient({ ...config, url, data, method: "POST" as Method });
    undiciClient.put = (url: string, data?: any, config: UndiciRequestConfig = {}) =>
        undiciClient({ ...config, url, data, method: "PUT" as Method });
    undiciClient.patch = (url: string, data?: any, config: UndiciRequestConfig = {}) =>
        undiciClient({ ...config, url, data, method: "PATCH" as Method });
    undiciClient.delete = (url: string, config: UndiciRequestConfig = {}) =>
        undiciClient({ ...config, url, method: "DELETE" as Method });
    undiciClient.head = (url: string, config: UndiciRequestConfig = {}) =>
        undiciClient({ ...config, url, method: "HEAD" as Method });
    undiciClient.options = (url: string, config: UndiciRequestConfig = {}) =>
        undiciClient({ ...config, url, method: "OPTIONS" as Method });

    // Add axios-compatible properties
    undiciClient.defaults = {
        headers: {
            common: {},
            get: {},
            post: { "Content-Type": "application/json" },
            put: { "Content-Type": "application/json" },
            patch: { "Content-Type": "application/json" },
        },
        timeout: 8000,
        responseType: "json",
        baseURL: "",
        validateStatus: (status: number) => status >= 200 && status < 300,
    };

    // Mock interceptors for compatibility
    undiciClient.interceptors = {
        request: {
            use: () => {},
            eject: () => {},
        },
        response: {
            use: () => {},
            eject: () => {},
        },
    };

    undiciClient.create = (config: UndiciRequestConfig = {}) => {
        const instance = createUndiciClient();
        Object.assign(instance.defaults, config);
        return instance;
    };

    undiciClient.isAxiosError = (error: any) => {
        return error && (error.errorType === "NET_ERR" || (error.config && error.code));
    };

    // Add cleanup method
    undiciClient.closeConnections = () => poolManager.closeAll();

    return undiciClient;
};

/**
 * High-performance HTTP client with connection pooling
 */
const undiciClient = createUndiciClient();

export default undiciClient;
export { poolManager };
