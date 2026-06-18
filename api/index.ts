// /api/index.ts
// Mengimpor file hasil build (server.cjs) yang sudah menyertakan semua depedency
const app = require('../dist/server.cjs');

module.exports = app;