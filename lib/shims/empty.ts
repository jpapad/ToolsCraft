// Empty stand-in for Node built-ins (fs, path, crypto) that some WASM glue code
// only touches when running under Node. See turbopack.resolveAlias in next.config.ts.
const empty = {};
export default empty;
