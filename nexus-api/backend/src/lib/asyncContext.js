const { AsyncLocalStorage } = require('async_hooks');

// This singleton holds the context for the current HTTP request,
// allowing deeply nested services and Prisma Extensions to access
// the tenant_id without passing it through every function signature.
const asyncLocalStorage = new AsyncLocalStorage();

module.exports = { asyncLocalStorage };
