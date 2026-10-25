import { PromptOptimizer } from '../domain'
import type { TokenCounter } from '../domain'
import { TiktokenCounter } from './TiktokenCounter'
import { AuthService } from '../application/AuthService'
import { AnalyzerService } from '../application/AnalyzerService'
import { HistoryService } from '../application/HistoryService'
import { SeedService } from '../application/SeedService'
import { PreferencesService } from '../application/PreferencesService'
import { TemplateService } from '../application/TemplateService'
import { IndexedDbTemplateRepository } from './IndexedDbTemplateRepository'
import { LocalPreferencesStore } from './LocalPreferencesStore'
import { openDatabase } from './IndexedDb'
import { IndexedDbUserRepository } from './IndexedDbUserRepository'
import { IndexedDbAnalysisRepository } from './IndexedDbAnalysisRepository'
import { Pbkdf2PasswordHasher } from './Pbkdf2PasswordHasher'
import { LocalSessionStore } from './LocalSessionStore'

export interface Services { tokenizer: Promise<TokenCounter>; auth: AuthService; analyzer: AnalyzerService; history: HistoryService; preferences: PreferencesService; templates: TemplateService }

/** Composição de dependências: único lugar que conhece as implementações concretas. */
export async function createServices(): Promise<Services> {
  const db = await openDatabase()
  const users = new IndexedDbUserRepository(db)
  const analyses = new IndexedDbAnalysisRepository(db)
  const hasher = new Pbkdf2PasswordHasher()
  const idGen = () => crypto.randomUUID()
  await new SeedService(users, hasher, idGen).ensureTestUsers()
  const analyzer = new AnalyzerService(new PromptOptimizer(), analyses, idGen)
  // Começa com estimativa e troca para o tokenizador exato assim que ele carregar.
  const tokenizer = TiktokenCounter.load().then((c) => { analyzer.useCounter(c); return c })
  return {
    tokenizer,
    auth: new AuthService(users, hasher, new LocalSessionStore()),
    analyzer,
    history: new HistoryService(analyses),
    preferences: new PreferencesService(new LocalPreferencesStore()),
    templates: new TemplateService(new IndexedDbTemplateRepository(db), idGen),
  }
}
