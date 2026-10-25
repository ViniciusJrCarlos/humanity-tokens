/** Modelo de prompt favorito do usuário. */
export interface PromptTemplateProps { id: string; userId: string; title: string; text: string; createdAt: string }

export class PromptTemplate {
  constructor(readonly props: PromptTemplateProps) {}
  get id() { return this.props.id }
  get title() { return this.props.title }
  get text() { return this.props.text }

  static create(id: string, userId: string, title: string, text: string): PromptTemplate {
    const t = title.trim(), body = text.trim()
    if (!body) throw new Error('O modelo precisa de um texto.')
    return new PromptTemplate({ id, userId, title: (t || body.slice(0, 40)).slice(0, 60), text: body, createdAt: new Date().toISOString() })
  }
}
