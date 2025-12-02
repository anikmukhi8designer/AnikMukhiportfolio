// Replaced 'vite/client' reference to fix "Cannot find type definition file" error
// /// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GITHUB_TOKEN: string;
  readonly VITE_GITHUB_OWNER: string;
  readonly VITE_GITHUB_REPO: string;
  [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
