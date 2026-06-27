---
name: BANCO API logging & esbuild-pino coupling
description: pino transport channels in the API server are bundled by esbuild-plugin-pino; any new transport must be registered in build.mjs or it fails at runtime.
---

# pino transports are bundled, not externalized

The api-server (`artifacts/api-server`) is bundled with esbuild and uses
`esbuild-plugin-pino` (see `build.mjs`). pino transports run in worker threads
and are emitted as **separate bundle files** by the plugin. The plugin only
emits the transports listed in its `transports: [...]` array.

**Rule:** Any pino transport used at runtime (a `transport.targets` entry in
`src/lib/logger.ts`) MUST also be listed in the `esbuildPluginPino({ transports })`
array in `build.mjs`. (`pino/file` is internal to pino and does not need listing.)

**Why:** If a runtime transport is missing from the plugin list, the build
succeeds but the logger worker throws "unable to determine transport target" at
boot and the process can crash — typecheck won't catch it.

**How to apply:** When adding a log channel/destination, update both
`src/lib/logger.ts` and `build.mjs` in lockstep, then rebuild and restart.
Check the live values in those two files rather than trusting a remembered list.
