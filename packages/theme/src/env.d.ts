/// <reference types="astro/client" />

// Astro compiles components in the consuming apps; tsc checks their TS imports.
declare module '*.astro' {
  const Component: import('astro/runtime/server/index.js').AstroComponentFactory;
  export default Component;
}
