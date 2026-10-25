/**
 * Modo "Prompt estruturado" (sem IA): reorganiza o pedido em seções
 * Papel, Tarefa, Contexto, Formato de resposta e Restrições.
 * Pode AUMENTAR a quantidade de tokens: o objetivo é clareza, não economia.
 */
export interface StructuredPrompt { role: string; task: string[]; context: string[]; format: string[]; constraints: string[] }

const ROLE_RE = /^(?:(?:você é|voce é|seja)\s+(?=(?:um|uma|o|a)\s)|aja como\s+|atue como\s+|finja ser\s+|imagine que você é\s+)(.+)$/i
const FORMAT_RE = /\b(lista|listar|tópicos?|topicos?|tabela|parágrafos?|resum\w*|passo a passo|json|markdown|linhas|palavras|itens|bullet|exemplos?|código|formato)\b/i
const CONSTRAINT_RE = /^(?:não|nao|nunca|evite|sem\b|apenas|somente|só\b|no máximo|no mínimo|seja (?:breve|objetivo|conciso|direto)|use (?:uma )?linguagem|mantenha|limite)/i
const CONTEXT_RE = /^(?:sou|estou|tenho|trabalho|meu|minha|meus|minhas|nós|nossa|nosso|o contexto|contexto|porque|pois|já|ja)\b/i

/** Pedidos vagos/indiretos -> instruções diretas no imperativo. */
const DIRECT: [RegExp, string][] = [
  [/^(?:por favor,?\s*)?(?:você|voce) (?:poderia|pode|consegue|conseguiria)\s+(?:me\s+)?/i, ''],
  [/^(?:será que|sera que) (?:você|voce) (?:pode|poderia)\s+(?:me\s+)?/i, ''],
  [/^(?:eu )?(?:gostaria|queria|quero|preciso) (?:que você|que voce|de|que)\s+(?:me\s+)?/i, ''],
  [/^(?:eu )?(?:queria|gostaria de|quero) saber\s+/i, 'Explique '],
  [/^me (?:ajuda|ajude) (?:com|a|em)\s+/i, 'Ajude com '],
  [/^(?:fale|fala|falar) (?:sobre|de)\s+/i, 'Explique '],
  [/^(?:me )?(?:explica|explicar|explique)\s+/i, 'Explique '],
  [/^(?:me )?(?:diga|diz|dizer)\s+/i, 'Diga '],
  [/^(?:me )?(?:mostre|mostra|mostrar)\s+/i, 'Mostre '],
  [/^(?:fazer|faça|faz|faca)\s+/i, 'Faça '],
  [/^(?:escrever|escreva|escreve)\s+/i, 'Escreva '],
  [/^(?:resumir|resuma|resume)\s+/i, 'Resuma '],
  [/^(?:listar|liste|lista)\s+/i, 'Liste '],
  [/^(?:criar|crie|cria)\s+/i, 'Crie '],
  [/^(?:traduzir|traduza|traduz)\s+/i, 'Traduza '],
]
const INFINITIVE: [RegExp, string][] = [
  [/^explicar\b/i, 'Explique'], [/^resumir\b/i, 'Resuma'], [/^escrever\b/i, 'Escreva'], [/^listar\b/i, 'Liste'],
  [/^criar\b/i, 'Crie'], [/^dizer\b/i, 'Diga'], [/^mostrar\b/i, 'Mostre'], [/^fazer\b/i, 'Faça'], [/^ajudar\b/i, 'Ajude'],
  [/^analisar\b/i, 'Analise'], [/^revisar\b/i, 'Revise'], [/^corrigir\b/i, 'Corrija'], [/^traduzir\b/i, 'Traduza'], [/^comparar\b/i, 'Compare'],
]
const NOISE = /^(?:olá|ola|oi|bom dia|boa tarde|boa noite|obrigad[oa]|desde já|valeu|grato|grata|agradeço)(?=[\s,.!?]|$)[^.!?]*$/i
const FILLER = /\b(?:basicamente|literalmente|na verdade|realmente|simplesmente|tipo assim|meio que|por favor|por gentileza|desde já|no presente momento|neste momento)\b,?\s*/gi

export class StructuredPromptBuilder {
  static readonly DEFAULT_ROLE = 'Você é um assistente especialista no assunto do pedido.'
  static readonly DEFAULT_FORMAT = 'Resposta clara e organizada, em parágrafos curtos ou tópicos.'
  static readonly DEFAULT_CONSTRAINT = 'Não invente informações; se faltar algum dado, diga o que falta.'

  /** Divide em frases, já limpando ruído e espaços. */
  static sentences(text: string): string[] {
    return text.replace(/\s+/g, ' ').split(/(?<=[.!?;])\s+|\n+/)
      .map((s) => s.replace(/,\s*(?:no presente momento|neste momento|na verdade)\s*,/gi, ' ').replace(FILLER, '').replace(/\s{2,}/g, ' ').replace(/^[\s,;:]+|[\s,;:]+$/g, '').trim())
      .filter((s) => s && !NOISE.test(s.replace(/[.!?]+$/, '')))
  }

  /** Corrige maiúscula inicial e pontuação final. */
  static punctuate(s: string): string {
    let t = s.trim().replace(/\s+([,.;:!?])/g, '$1').replace(/([,;:])\1+/g, '$1').replace(/[;,]$/, '')
    if (!t) return t
    t = t[0].toUpperCase() + t.slice(1)
    if (/\?$/.test(t)) t = t.replace(/\?$/, '.')
    return /[.!]$/.test(t) ? t : t + '.'
  }

  /** Transforma pedidos vagos em instrução direta. */
  static direct(s: string): string {
    let t = s.trim()
    for (const [re, rep] of DIRECT) if (re.test(t)) { t = t.replace(re, rep); break }
    for (const [re, rep] of INFINITIVE) if (re.test(t)) { t = t.replace(re, rep); break }
    return t
  }

  parse(text: string): StructuredPrompt {
    const out: StructuredPrompt = { role: '', task: [], context: [], format: [], constraints: [] }
    for (const raw of StructuredPromptBuilder.sentences(text)) {
      const roleMatch = raw.replace(/[.!?]+$/, '').match(ROLE_RE)
      if (roleMatch && !out.role) { out.role = StructuredPromptBuilder.punctuate(`Você é ${roleMatch[1]}`); continue }
      if (CONSTRAINT_RE.test(raw)) { out.constraints.push(StructuredPromptBuilder.punctuate(raw)); continue }
      if (CONTEXT_RE.test(raw)) { out.context.push(StructuredPromptBuilder.punctuate(raw)); continue }
      const d = StructuredPromptBuilder.punctuate(StructuredPromptBuilder.direct(raw))
      if (FORMAT_RE.test(raw) && out.task.length > 0) out.format.push(d)
      else out.task.push(d)
    }
    // Restrições embutidas no fim de uma tarefa ("..., com linguagem simples").
    return out
  }

  build(text: string): string {
    const p = this.parse(text)
    if (p.task.length === 0 && p.context.length === 0 && p.constraints.length === 0) return ''
    const dedupe = (xs: string[]) => [...new Map(xs.map((x) => [x.toLowerCase(), x])).values()]
    const section = (title: string, items: string[]) => `${title}:\n${dedupe(items).map((i) => `- ${i}`).join('\n')}`
    return [
      `Papel:\n${p.role || StructuredPromptBuilder.DEFAULT_ROLE}`,
      section('Tarefa', p.task.length ? p.task : ['Responda ao pedido descrito no contexto.']),
      p.context.length ? section('Contexto', p.context) : '',
      section('Formato de resposta', p.format.length ? p.format : [StructuredPromptBuilder.DEFAULT_FORMAT]),
      section('Restrições', [...p.constraints, StructuredPromptBuilder.DEFAULT_CONSTRAINT]),
    ].filter(Boolean).join('\n\n')
  }
}
