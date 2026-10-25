/** Prefixo das chaves de localStorage: a prévia não compartilha sessão/preferências com a oficial. */
const prefix = import.meta.env?.VITE_STORAGE_PREFIX ? `humanity_${import.meta.env.VITE_STORAGE_PREFIX}_` : 'humanity_'
export const storageKey = (name: string) => prefix + name
