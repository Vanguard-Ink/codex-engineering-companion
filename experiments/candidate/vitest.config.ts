import {defineConfig} from 'vitest/config';
// Allow cold startup on Windows hosts; this is a ceiling, not a performance assertion.
export default defineConfig({test:{testTimeout:20000,hookTimeout:20000}});
