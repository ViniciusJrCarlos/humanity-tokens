import { PromptTemplate } from '../domain'
import type { TemplateRepository } from '../domain'

/** Modelos de prompt favoritos. */
export class TemplateService {
  constructor(private readonly repo: TemplateRepository, private readonly idGen: () => string) {}
  async list(userId: string) {
    return (await this.repo.listByUser(userId)).sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))
  }
  async save(userId: string, title: string, text: string) {
    const t = PromptTemplate.create(this.idGen(), userId, title, text)
    await this.repo.add(t)
    return t
  }
  remove(id: string) { return this.repo.delete(id) }
}
