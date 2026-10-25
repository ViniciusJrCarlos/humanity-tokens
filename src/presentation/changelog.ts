/** Novidades exibidas na tela Sobre. */
export const CHANGELOG = [
  { version: '1.1.3', title: 'Ajuste', items: ['Rodapé mostra a versão atual'] },
  {
    version: '1.1.2', title: 'Tokens exatos e prompt estruturado', items: [
      'Contagem exata de tokens no padrão OpenAI (tokenizador o200k_base, GPT-4o e posteriores)',
      'Novo modo "Prompt estruturado": Papel, Tarefa, Contexto, Formato de resposta e Restrições',
      'Diferença de tokens com sinal (+/−): aumento não é chamado de economia',
      'Resultado editável e botão grande "Copiar prompt" (copia o texto editado)',
      'Relatórios comparando original × resultado por modo e por método; análises antigas recontadas',
    ],
  },
  {
    version: '1.1.0', title: 'Personalização e relatórios', items: [
      'Nome e e-mail de quem está logado no cabeçalho, com menu do usuário',
      'Temas Claro, Escuro e Suave (ou o do sistema) e cor de destaque',
      'Perfil: editar nome e trocar senha',
      'Configurações: tema, cor, exportar (JSON/CSV) e limpar histórico',
      'Relatórios com gráficos de pizza e de linhas (sem IA × com IA, em breve)',
      'Modelos de prompt favoritos e botão copiar no Analisador',
      'Navegação inferior no celular e confirmação ao sair',
    ],
  },
  {
    version: '1.0.0', title: 'Primeira prévia', items: [
      'Login de teste com troca obrigatória de senha',
      'Analisador com níveis Mais Humano, Mais Técnico e Custom',
      'Histórico local e PWA instalável com modo offline',
    ],
  },
]
