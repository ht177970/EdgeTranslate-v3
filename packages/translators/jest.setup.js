Object.assign(global, require('jest-chrome'))

// fetch polyfill for Node.js environment
const fetch = require('node-fetch');
global.fetch = fetch;
global.Request = fetch.Request;
global.Response = fetch.Response;
global.Headers = fetch.Headers;

// TextEncoder/TextDecoder polyfill for Undici
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// URL and URLSearchParams polyfill
global.URL = URL;
global.URLSearchParams = URLSearchParams;