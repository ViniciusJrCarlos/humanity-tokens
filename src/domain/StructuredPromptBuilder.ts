/**
 * Modo "Prompt estruturado" (sem IA): reorganiza o pedido em seções
 * Papel, Tarefa, Contexto, Formato de resposta e Restrições.
 * Pode AUMENTAR a quantidade de tokens: o objetivo é clareza, não economia.
 */
export interface StructuredPrompt { role: string; task: string[]; context: string[]; format: string[]; constraints: string[] }

const ROLE_RE = /^(?:(?:você é|voce é|seja)\s+(?=(?:um|uma|o|a)\s)|(?:(?:você|voce) poderia,?\s+)?(?:aja|agir|atue|atuar) como\s+|finja ser\s+|imagine que você é\s+)(.+)$/i
const FORMAT_RE = /\b(lista|listar|tópicos?|topicos?|tabela|parágrafos?|resum\w*|passo a passo|json|markdown|linhas|palavras|itens|bullet|formato)\b/i
const CONSTRAINT_RE = /^(?:(?:não|nao|nunca) (?:use|usar|utilize|invente|inclua|incluir|faça|fale|escreva|mencione|cite|ultrapasse|passe|seja|dê|de|responda|repita|adicione|coloque|esqueça)\b|evite|sem (?:jargão|jargao|jargões|termos|rodeios|enrolação|emojis?|introdução|introdu\w+|explicaç\w+|tecniquês)|apenas|somente|só\b|no máximo|no mínimo|seja (?:breve|objetivo|conciso|direto)|use (?:uma )?linguagem|mantenha|limite)/i
const CONTEXT_RE = /^(?:(?:eu )?(?:não|nao) (?:sei|tenho|entendo|conheço|conheco|domino|sou)\b|sou|estou|tenho|trabalho|meu|minha|meus|minhas|nós|nossa|nosso|o contexto|contexto|porque|pois|já|ja)\b/i

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
const NOISE = /^(?:olá|ola|oi|bom dia|boa tarde|boa noite|obrigad[oa]|desde já|espero que sim|tudo bem|valeu|grato|grata|agradeço)(?=[\s,.!?]|$)[^.!?]*$/i
const FILLER = /\b(?:basicamente|literalmente|na verdade|realmente|simplesmente|tipo assim|meio que|por favor|por gentileza|desde já|no presente momento|neste momento)\b,?\s*/gi

/** Papel deduzido pelo tema quando o texto não define um (v1.1.4). */
const ROLE_TOPICS: [RegExp, string][] = [
  [/\b(site|sites|página web|landing page|loja virtual|blog)\b/i, 'desenvolvedor web que explica de forma simples para iniciantes'],
  [/\b(marketing|instagram|tiktok|redes sociais|postage(?:m|ns)|engajamento|campanha|anúncios? pagos?|vendas)\b/i, 'especialista em marketing digital e redes sociais'],
  [/\b(hospedage\w*|banco de dados|aplicativo|app|android|ios|play ?store|usuários|usuarios|assinatura|monetiza\w*|donate|doaç\w*|produto digital|startup)\b/i, 'especialista em produto digital, custos e viabilidade de aplicativos'],
  [/\b(código|codigo|programa\w*|python|javascript|typescript|java|react|api|bug|erro de compila\w*|sql|função|funcao|algoritmo)\b/i, 'desenvolvedor de software sênior'],
  [/\b(contrato|lei|jurídic\w*|juridic\w*|advogad\w*|processo judicial|direitos?|lgpd|trabalhista)\b/i, 'especialista em direito brasileiro (com a ressalva de não substituir um advogado)'],
  [/\b(saúde|saude|sintoma\w*|doença|doenca|médic\w*|medic\w*|remédio|remedio|dieta|nutri\w*|exercício|treino)\b/i, 'profissional de saúde (com a ressalva de não substituir uma consulta)'],
  [/\b(finanç\w*|financ\w*|investi\w*|orçamento|orcamento|dívida|divida|impostos?|contabil\w*)\b/i, 'consultor financeiro'],
  [/\b(aula|professor|alun[oa]s?|ensino|escola|estud\w*|prova|enem|didátic\w*|fotossíntese)\b/i, 'professor experiente e didático'],
  [/\b(texto|redação|redacao|artigo|e-?mail|carta|revis\w*|escrev\w*|post de blog|roteiro)\b/i, 'redator e revisor profissional'],
  [/\b(currículo|curriculo|entrevista|carreira|vaga|linkedin)\b/i, 'especialista em carreira e recrutamento'],
  [/\b(tradu\w*|inglês|ingles|espanhol)\b/i, 'tradutor profissional'],
]
/** Perguntas de checagem soltas ("O que expliquei??", "entende?") -> instrução de confirmação. */
const CHECK_RE = /^(?:o que (?:eu )?(?:expliquei|disse|quis dizer)|entende|entendeu|entendido|deu (?:pra|para) entender|ficou claro|faz sentido|captou|sacou|certo|ok)\s*[?!.]*$/i
const CHECK_TAIL = /,?\s*\b(?:entende|entendeu|entendido|sacou|captou|certo|ok)\s*[?!.]*$/i
const VOCATIVE = /^(?:chat(?:gpt)?|gpt|grok|gemini|claude|ia|assistente|amigo)\s*,\s*/i
/** Conectivos que normalmente iniciam uma nova ideia em frases longas. */
const SPLIT_RE = /,?\s+(?=(?:porém|porem|mas|nesse caso|além disso|alem disso|e também|e tambem|tipo|ou seja|enquanto|e se|e mostrar|e deixar|e a pessoa|e (?:queria|quero|gostaria|seria))\b)/i
const LEAD_CONNECTIVE = /^(?:porém|porem|mas|nesse caso|além disso|alem disso|e também|e tambem|tipo|ou seja|e)\b\s*,?\s*/i
const LONG = 110
export const CONFIRM_INSTRUCTION = 'Confirme o que entendeu do pedido antes de responder.'

export class StructuredPromptBuilder {
  static readonly DEFAULT_ROLE = 'Você é um assistente experiente, didático e preciso.'
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

  /** Deduz o papel pelo tema do texto. */
  static inferRole(text: string): string {
    for (const [re, role] of ROLE_TOPICS) if (re.test(text)) return `Você é um ${role}.`
    return StructuredPromptBuilder.DEFAULT_ROLE
  }

  /** Quebra frases longas em uma ideia por item, pelos conectivos. */
  static splitIdeas(s: string): string[] {
    if (s.length <= LONG) return [s]
    const parts = s.split(SPLIT_RE).map((p) => (/^tipo\s/i.test(p.trim()) && p.trim().split(' ').length <= 5 ? p : p.replace(LEAD_CONNECTIVE, '')).replace(/\b(\w+) \1\b/gi, '$1').replace(/^[\s,;:]+|[\s,;:.]+$/g, '').trim()).filter((p) => p.split(' ').length >= 3)
    return parts.length ? parts : [s]
  }

  /** Limpa item de tarefa: desejos viram substantivos, sem artigo inicial nem conectivo pendurado. */
  static tidyTask(s: string): string {
    return s
      .replace(/^(?:eu )?(?:preciso|quero|queria|gostaria de)\s+(?=\p{L}+r\b)/iu, '')
      .replace(/^(?:(?:eu )?(?:queria|quero|gostaria) que (?:tivesse|tenha)|seria bom (?:ter|que tivesse)|(?:eu )?quero ter)\s+/i, '')
      .replace(/^(?:um|uma)\s+/i, '')
      .replace(/\b(?:pra|para) (minha|meu) /i, (_m, p) => (p.toLowerCase() === 'minha' ? 'para a ' : 'para o '))
      .replace(/\bpra\b/gi, 'para')
      .replace(/\s+(?:e|ou|mas|porém|porem|que|de|com)\s*[.,]?$/i, '')
  }

  parse(text: string): StructuredPrompt {
    const out: StructuredPrompt = { role: '', task: [], context: [], format: [], constraints: [] }
    let confirm = false
    const units: string[] = []
    for (let raw of StructuredPromptBuilder.sentences(text)) {
      raw = raw.replace(VOCATIVE, '')
      if (CHECK_RE.test(raw)) { confirm = true; continue }
      if (CHECK_TAIL.test(raw)) { confirm = true; raw = raw.replace(CHECK_TAIL, '').trim(); if (!raw) continue }
      for (const u of StructuredPromptBuilder.splitIdeas(raw)) {
        // Fragmento curto "tipo um painel fácil" junta-se à ideia anterior.
        const frag = u.match(/^(?:tipo|como|tipo assim)\s+(?:um|uma)?\s*(.+)$/i)
        if (frag && frag[1].split(' ').length <= 4 && units.length) {
          const prev = units.pop()!
          const vp = prev.replace(/^(?:(eu mesmo|eu)\s+)?(?:queria|quero|gostaria de)\s+(?:conseguir\s+|poder\s+)?/i, (_m, eu) => eu ? 'para eu ' : 'para ')
          units.push(vp !== prev ? `${frag[1]} ${vp}` : `${prev}, com ${frag[1]}`)
        } else units.push(u)
      }
    }
    // Fato do usuário embutido no pedido ("pra minha oficina mecânica") vira Contexto.
    const own = units.map((u) => u.match(/\b(?:pra|para|da|na) (minha|meu) (\p{L}+(?: (?:(?:de|do|da) )?(?!(?:porém|porem|e|que|mas|ou|com|pra|para|sem|não|nao)\b)\p{L}+){0,2})/iu)).find(Boolean)
    if (own && !/\b(?:tenho|sou)\b/i.test(text)) out.context.push(StructuredPromptBuilder.punctuate(`Tenho ${own[1].toLowerCase() === 'minha' ? 'uma' : 'um'} ${own[2]}`))
    for (const raw of units) {
      const roleMatch = raw.replace(/[.!?]+$/, '').match(ROLE_RE)
      if (roleMatch && !out.role) { out.role = StructuredPromptBuilder.punctuate(`Você é ${roleMatch[1]}`); continue }
      if (CONSTRAINT_RE.test(raw)) { out.constraints.push(StructuredPromptBuilder.punctuate(raw)); continue }
      if (CONTEXT_RE.test(raw)) { out.context.push(StructuredPromptBuilder.punctuate(raw)); continue }
      const d = StructuredPromptBuilder.punctuate(StructuredPromptBuilder.tidyTask(StructuredPromptBuilder.direct(StructuredPromptBuilder.tidyTask(raw))))
      if (/^Você poderia,? /i.test(d)) { out.task.push(StructuredPromptBuilder.punctuate(d.replace(/^Você poderia,? /i, ''))); continue }
      if (FORMAT_RE.test(raw) && out.task.length > 0) out.format.push(d)
      else out.task.push(d)
    }
    if (!out.role) out.role = StructuredPromptBuilder.inferRole(text)
    if (confirm) out.format.push(CONFIRM_INSTRUCTION)
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
      section('Formato de resposta', p.format.some((f) => f !== CONFIRM_INSTRUCTION) ? p.format : [StructuredPromptBuilder.DEFAULT_FORMAT, ...p.format]),
      section('Restrições', [...p.constraints, StructuredPromptBuilder.DEFAULT_CONSTRAINT]),
    ].filter(Boolean).join('\n\n')
  }
}
