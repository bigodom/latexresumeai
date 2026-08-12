# Estratégia do prompt para ATS e matching de recrutamento

O prompt `resume-v2-ats-evidence` foi desenhado para melhorar a extração e a
relevância legítima do currículo. Ele não tenta burlar filtros e não garante
aprovação: fornecedores usam configurações, dados e etapas diferentes, e a decisão
continua envolvendo recrutadores.

## O que a pesquisa mostrou

- Parsers transformam o documento em campos como contato, empresa, experiência e
  habilidades. A documentação do Greenhouse relata falhas com colunas, tabelas,
  cabeçalhos, rodapés, imagens, títulos incompletos e seções inconsistentes. O
  template determinístico do projeto usa uma coluna e seções convencionais.
- O LinkedIn Recruiter extrai cargos e habilidades do currículo. Seu Skills Match
  considera habilidades explícitas e habilidades encontradas no contexto do
  resumo e das experiências, além de normalizar termos relacionados.
- O Intelligent Matching da Oracle compara perfil, formação, experiência e
  habilidades. A documentação informa que NLP e representações matemáticas são
  usados para similaridade contextual, portanto não basta repetir palavras exatas.
- O SAP SuccessFactors compara habilidades extraídas do currículo com a descrição
  da vaga usando uma taxonomia e também pode reconhecer habilidades relacionadas.
- A literatura recente descreve sistemas híbridos que combinam busca lexical,
  embeddings, taxonomias de habilidades e reranqueamento. Outro estudo encontrou
  apenas correlação limitada entre avaliações de LLM e avaliações humanas, reforçando
  que não existe uma pontuação universal confiável.

Fontes:

- [Greenhouse — Unsuccessful resume parse](https://support.greenhouse.io/hc/en-us/articles/200989175-Unsuccessful-resume-parse)
- [LinkedIn — Skills filter and Skills Match](https://www.linkedin.com/help/recruiter/answer/a593591)
- [LinkedIn — Resume Search](https://www.linkedin.com/help/recruiter/answer/a770588/discover-candidates-with-resume-search-in-recruiter)
- [Oracle — Suggested Candidates](https://docs.oracle.com/en/cloud/saas/talent-management/faush/understand-suggested-candidates.html)
- [Oracle — funcionamento do Intelligent Matching](https://docs.oracle.com/en/cloud/saas/talent-management/25b/faush/overview-of-suggested-candidates.html)
- [SAP — AI-Assisted Skills Matching](https://help.sap.com/docs/SAP_SUCCESSFACTORS_RECRUITING/8477193265ea4172a1dda118505ca631/8134bbc02518434a8ef1c28f3fd2c7a1.html)
- [ACL 2026 — JobMatchAI](https://aclanthology.org/2026.acl-demo.52/)
- [NAACL 2025 — Human and LLM-Based Resume Matching](https://aclanthology.org/2025.findings-naacl.270/)

## Decisões aplicadas ao prompt

1. A vaga define prioridade, mas nunca é usada como prova de uma qualificação.
2. Cargo, competências, experiência e formação recebem prioridade por serem campos
   usados pelos mecanismos documentados pelos fornecedores.
3. Termos da vaga só entram quando o currículo base contém evidência equivalente.
4. Competências importantes aparecem em uma seção explícita e, quando comprovado,
   também no contexto da experiência correspondente.
5. Keyword stuffing, texto oculto e cópia da lista de requisitos são proibidos.
6. Nome, contato, empresas, cargos, datas e números passam por uma conferência
   textual instruída antes da resposta.
7. Currículo e vaga são serializados como JSON não confiável para reduzir a
   ambiguidade entre dados e instruções.

## Comportamento dos modos

- **Fiel:** melhora redação e organização; usa vocabulário da vaga somente em
  equivalências inequívocas já comprovadas.
- **Estratégico:** prioriza requisitos obrigatórios e recorrentes que tenham
  evidência, colocando as correspondências mais fortes nas posições mais visíveis.
- **Análise de lacunas:** aplica a priorização factual e mantém requisitos sem
  evidência exclusivamente em `gaps`, fora do LaTeX.

Mesmo com essas instruções, a saída do modelo deve ser revisada pelo usuário. O
prompt é uma camada de controle, não uma validação determinística de factualidade.
