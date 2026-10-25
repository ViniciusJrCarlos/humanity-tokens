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

/** Reescritas no modo técnico: pedidos viram instruções diretas. */
const IMPERATIVE: Rule[] = ([
  ['me (?:explique|explica|explicar)', 'Explique'], ['^(?:olá|oi|bom dia|boa tarde|boa noite)[,!]?', ''], ['me (?:diga|diz)', 'Diga'], ['me (?:mostre|mostra)', 'Mostre'],
  ['eu preciso que você', ''], ['preciso que você', ''], ['quero que você', ''],
] as const).map(([s, r]) => ({ pattern: w(s), replacement: r ? `$1${r}` : '$1', label: 'instrução direta' }))

export const LEVELS: Record<LevelId, OptimizationLevel> = {
  humano: new OptimizationLevel('humano', 'Mais Humano', 'Tira enrolação mantendo tom natural e cordial.', [...FILLERS.slice(3), ...CONCISE]),
  tecnico: new OptimizationLevel('tecnico', 'Mais Técnico', 'Instruções diretas, sem cortesias nem preenchimento.', [...FILLERS, ...CONCISE, ...IMPERATIVE]),
  custom: new OptimizationLevel('custom', 'Custom', 'Aplica as regras conforme a intensidade escolhida.', [...FILLERS, ...CONCISE, ...IMPERATIVE]),
}
