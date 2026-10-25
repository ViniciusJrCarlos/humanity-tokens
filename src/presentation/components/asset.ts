/** Resolve arquivos de public/ respeitando o base (/humanity-tokens/). */
export const asset = (file: string) => `${import.meta.env.BASE_URL}${file}`
