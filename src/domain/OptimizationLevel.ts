export type LevelId = 'humano' | 'tecnico' | 'custom'

export interface Rule { pattern: RegExp; replacement: string; label: string }

/** Nível de otimização: um conjunto nomeado de regras de reescrita. */
export class OptimizationLevel {
  constructor(
    readonly id: LevelId,
    readonly label: string,
    readonly description: string,
    readonly rules: Rule[],
  ) {}
}

const w = (s: string) => new RegExp(`(^|[\\s,.;:!?(])${s}(?=[\\s,.;:!?)]|$)`, 'gi')

/** Palavras e expressões de preenchimento comuns em prompts em português. */
const FILLERS: Rule[] = [
  'por favor,?', 'por gentileza,?', 'se possível,?', 'se puder,?', 'gostaria (?:muito )?(?:de|que você)',
  'eu queria (?:saber se você poderia|que você)', 'você poderia', 'você pode', 'será que você (?:pode|poderia)',
  'basicamente', 'literalmente', 'na verdade', 'realmente', 'simplesmente', 'meio que', 'tipo assim',
  'obrigad[oa] desde já[.!]?', 'desde já agradeço[.!]?', 'muito obrigad[oa][.!]?',
].map((s) => ({ pattern: w(s), replacement: '$1', label: 'preenchimento' }))

/** Expressões longas trocadas por equivalentes curtos. */
const CONCISE: Rule[] = ([
  ['a fim de', 'para'], ['com o objetivo de', 'para'], ['com a finalidade de', 'para'],
  ['devido ao fato de que', 'porque'], ['pelo fato de que', 'porque'], ['tendo em vista que', 'como'],
  ['no presente momento', 'agora'], ['neste momento', 'agora'], ['nos dias de hoje', 'hoje'],
  ['em relação a', 'sobre'], ['no que diz respeito a', 'sobre'], ['a respeito de', 'sobre'],
  ['uma grande quantidade de', 'muitos'], ['um grande número de', 'muitos'],
  ['é importante (?:ressaltar|destacar|mencionar) que', ''], ['vale (?:a pena )?(?:ressaltar|lembrar) que', ''],
  ['de forma (?:clara e )?detalhada', 'em detalhes'], ['de maneira', 'de forma'],
] as const).map(([s, r]) => ({ pattern: w(s), replacement: r ? `$1${r}` : '$1', label: 'concisão' }))

/** Limpezas seguras em todos os níveis (v1.1.5): saudação de abertura, vocativo, "e e" e perguntas de checagem soltas. */
const CLEAN: Rule[] = [
  { pattern: /^\s*(?:olá|ola|oi|bom dia|boa tarde|boa noite)[,!]?\s*(?:tudo bem|tudo bom|como vai)\s*\?\s*(?:espero que sim[!.]?\s*)?/i, replacement: '', label: 'saudação' },
  { pattern: /(^|[.!?]\s+)(?:chat(?:gpt)?|gpt|grok|gemini|claude|assistente)\s*,\s*/gi, replacement: '$1', label: 'vocativo' },
  { pattern: /\b(e|de|que|o|a) \1\b/gi, replacement: '$1', label: 'repetição' },
  { pattern: /,?\s*\b(?:entende|entendeu|sacou|captou)\s*[?!.]*(?=\s|$)/gi, replacement: '.', label: 'pergunta solta' },
  { pattern: /(^|[.!?]\s+)(?:o que (?:eu )?(?:expliquei|disse|quis dizer)|faz sentido|ficou claro|deu (?:pra|para) entender|entendeu|entende)\s*\?+[!.]*/gi, replacement: '$1', label: 'pergunta solta' },
]

/** Enrolação extra cortada nos níveis Técnico/Custom (v1.1.5). */
const TRIM: Rule[] = ([
  ['queria conseguir', 'quero'], ['eu mesmo', 'eu'], ['além disso,?', 'e'], ['alem disso,?', 'e'], ['queria que (?:tivesse|tenha)', 'quero'], ['seria bom ter', 'quero'],
  ['eu preciso', 'preciso'], ['eu queria', 'quero'], ['nesse caso,?', ''], ['neste caso,?', ''], ['tipo', ''], ['e também', 'e'],
  ['de forma (?:bem )?(?:detalhada e completa|completa)', 'em detalhes'], ['muito importante', 'importante'],
] as const).map(([s, r]) => ({ pattern: w(s), replacement: r ? `$1${r}` : '$1', label: 'enrolação' }))

/** Reescritas no modo técnico: pedidos viram instruções diretas. */
const IMPERATIVE: Rule[] = ([
  ['me (?:explique|explica|explicar)', 'Explique'], ['^(?:olá|oi|bom dia|boa tarde|boa noite)[,!]?', ''], ['me (?:diga|diz)', 'Diga'], ['me (?:mostre|mostra)', 'Mostre'],
  ['eu preciso que você', ''], ['preciso que você', ''], ['quero que você', ''],
] as const).map(([s, r]) => ({ pattern: w(s), replacement: r ? `$1${r}` : '$1', label: 'instrução direta' }))

export const LEVELS: Record<LevelId, OptimizationLevel> = {
  humano: new OptimizationLevel('humano', 'Mais Humano', 'Tira enrolação mantendo tom natural e cordial.', [...CLEAN, ...FILLERS.slice(3), ...CONCISE]),
  tecnico: new OptimizationLevel('tecnico', 'Mais Técnico', 'Instruções diretas, sem cortesias nem preenchimento.', [...CLEAN, ...FILLERS, ...CONCISE, ...IMPERATIVE, ...TRIM]),
  custom: new OptimizationLevel('custom', 'Custom', 'Aplica as regras conforme a intensidade escolhida.', [...CLEAN, ...TRIM, ...FILLERS, ...IMPERATIVE, ...CONCISE]),
}
