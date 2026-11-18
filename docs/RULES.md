# RULES — Regras de desenvolvimento e negócio

Status: aprovado em 29/09/2026. Fonte comum: [regras do portfólio](../../docs/RULES.md). CLAUDE.md e AGENTS.md apontam para as regras, preservando instruções específicas do framework.

Ruflo é obrigatório neste e nos próximos projetos, conforme instrução explícita do usuário. Aplicar a política da fonte comum; registrar análise efetivamente realizada e limitações, sem substituir outras verificações.

## Finalidade

### Agent Skills — seleção por tarefa

Usar o plugin **Agent Skills**, identificado explicitamente pelo usuário em 01/10/2026: `agent-skills:using-agent-skills`, versão instalada 0.6.10. A indicação explícita substitui a interpretação anterior de que o pedido significava apenas as skills instaladas em geral. Carregar a meta-skill para escolher o fluxo por fase, sem executar o catálogo inteiro. Nesta revisão: `security-and-hardening` e `incremental-implementation`; aplicar testes, revisão e frontend conforme a etapa. Reutilizar especificação e plano aprovados, sem reiniciar perguntas resolvidas. Não realizar commits/publicação automáticos sugeridos por uma skill: as regras do projeto continuam válidas.

Ler a skill escolhida, anunciar seu uso e registrar evidências; evitar executar várias skills equivalentes para a mesma verificação. Taste orienta referências da apresentação pública; Impeccable orienta UX e acabamento; **Canva é o destino dos mockups**, substituindo Figma por instrução posterior do usuário. Ruflo continua obrigatório nas análises pertinentes.

### Skills do projeto — 01/10/2026

Usar Impeccable nas tarefas de UX/UI deste projeto, conforme solicitação do usuário. Preservar a identidade aprovada; coordenar com frontend-design sem duplicar decisões ou auditorias. Ruflo permanece obrigatório nas análises técnicas pertinentes. Skills de backend/teste/revisão são aplicadas por etapa, não todas em toda tarefa.

Seleção e limites: [análise de skills](reviews/2026-10-01-skills.md). Antes de executar qualquer skill, ler suas instruções completas. A análise de nomes/descrições não equivale à execução da skill.

Centralizar regras estáveis e distinguir convenções comuns de regras próprias de cada sistema.

## Estrutura proposta para cada sistema

- Regras de negócio identificadas e respectivas exceções.
- Convenções de código e validação de entradas.
- Segurança, autorização, privacidade e tratamento de segredos.
- Testes e critérios de conclusão.
- Fluxo de planejamento, revisão e implementação.
- Regras para commits, publicação e alterações de banco.
- Hierarquia documental e tratamento de divergências.

## Regras existentes a preservar

Padrão de segurança ampliado solicitado em 01/10/2026 e registrado nas regras comuns. Diagnóstico atual em [auditoria item por item](reviews/2026-10-01-security/REPORT.md); correções propostas em [plano de segurança](superpowers/plans/2026-10-01-seguranca.md). Documentação de controle não significa implementação ou proteção ativa em produção.

TypeScript estrito, validação com Zod, testes de comportamento, autorização no servidor e acessibilidade. Não realizar commit, push ou publicação sem solicitação. Apresentar SQL antes de migration remota. Preservar migrations aplicadas. Não declarar verificação sem executá-la.

No salão: impedir sobreposição, exigir duas horas de antecedência ao criar reserva e calcular a duração pela soma dos serviços no servidor.

## Regras da evolução solicitada

| ID | Regra | Estado |
| --- | --- | --- |
| RN-01 | Duração calculada no servidor; impedir sobreposição inclusive com bloqueios | Implementada |
| RN-02 | Duas horas de antecedência na criação de reserva | Implementada |
| RN-03 | Aprovar, reagendar com acordo, recusar e cancelar pelo painel | Implementada |
| RN-04 | Um número WhatsApp do salão para mensagens ao cliente; sem segundo receptor administrativo | Decisão confirmada |
| RN-05 | Pedidos feitos durante expediente aguardam até 120 minutos | Implementada |
| RN-06 | Fora do expediente aguarda decisão; não expira na próxima abertura; impedir aprovação de horário passado | Implementada |

Reagendamento atual exige acordo prévio no formulário do painel, sem fluxo automatizado de propostas. Instruções atuais substituem a proposta antiga de dois números e 60 minutos. A referência Canva escolhida substitui a direção visual anterior; fotos/textos são editados pelo sistema, sem sincronização com Canva.

Controles e limites verificados em 07–08/10: [revisão de segurança](reviews/2026-10-07-finalizacao/SEGURANCA.md). Upload máximo 4 MB/24 MP; só imagens públicas com autorização de uso. Não apagar automaticamente arquivos antigos nem dados de clientes sem política aprovada. Não declarar segurança completa ou mensagens enviadas apenas porque existe código.

## Manutenção proposta

Alterações nas regras precisam ficar explícitas; não revogar instruções existentes silenciosamente.
