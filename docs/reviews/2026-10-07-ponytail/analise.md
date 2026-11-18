# Simplificação com Ponytail — 07/10/2026

Aplicada a pedido do usuário, preservando regras de negócio, autorização e identidade Canva. Revisão global por inventário/AST e inspeção manual dos fluxos prioritários; não equivale a uma auditoria manual independente de cada linha nem encerra SEC-02.

## Mudanças aplicadas

1. **delete:** removidos `buildServiceSnapshots` e seu tipo sem consumidores. Excluídos somente os dois testes desse helper; snapshots transacionais continuam cobertos nos testes do banco.
2. **reuse:** catálogo público compartilhado por início e agendamento, com seleção explícita de campos, serviços ativos e erro genérico. Nenhum preço do Canva sobrescreve o banco.
3. **reuse:** proxy usa `publicEnv`, incluindo rejeição de chave privilegiada em configuração pública. Acrescentado teste específico dessa barreira.
4. **native:** formulário usa `FormData` e campos descritos uma vez, mantendo rótulos, autocomplete, validação obrigatória e validação Zod no servidor.
5. **reuse:** recuperação por código e token compartilha autorização e redirecionamento fixo; mantidos POST, PKCE, associação da proprietária e encerramento de sessão indevida.
6. **shrink:** removido resultado intermediário da disponibilidade; cálculo de duração reutilizado pelo seletor. Mantidos fuso do salão, duração contínua e regras de antecedência.
7. **reuse:** formatação monetária única e remoção de tokens CSS duplicados. Estados de erro/carregamento do login usam o tema vigente.

## Medida

Comparação com snapshot local imediatamente anterior à simplificação, incluindo arquivos novos: **4.264 → 4.179 linhas**, redução líquida **85 linhas**. Método: linhas físicas após remover linhas vazias finais, em app/components/lib/e2e/supabase, extensões TS/TSX/CSS/SQL. Inclui testes e tipos gerados. Código de produção teve redução de 105 linhas; mudanças em testes adicionaram 20 linhas líquidas. Não confundir com contagem do Ruflo, que usa outra métrica.

Não foram alteradas migrations já aplicadas ou tipos gerados para reduzir tamanho. Não foram removidas dependências necessárias nem controles de segurança. Não houve commit, push ou publicação.

## Validação

- Baseline: 17 arquivos / 158 testes passaram.
- Após alterações: **18 arquivos / 160 testes passaram**, lint sem erros e **build Next.js completo passou**, incluindo TypeScript.
- Ruflo: app (19 arquivos, complexidade), components (22 arquivos, complexidade), lib (43 arquivos, segurança). Saídas JSON dos três escopos anexadas nesta pasta. Alerta `exec()` em `database/booking.integration.test.ts` conferido como preparação SQL estática do banco em memória; não é execução de shell com entrada do usuário. Scanner não prova ausência de vulnerabilidades.
- Prévia local compilada disponível em http://localhost:3000. Página inicial inspecionada a 375px: CTA visível e largura do documento menor que viewport; fotos principais carregaram. Navegador percorreu seleção de serviço, duração de 45 minutos, horários e confirmação com nome/WhatsApp/e-mail obrigatórios, tipos e autocomplete preservados. Confirmação sem overflow horizontal. Formulário não enviado e nenhuma reserva real criada; envio e retorno de erro ainda não foram testados no navegador.

## Limites e próximos passos

Fluxo autenticado completo, auditoria ampla SEC-02, editor de conteúdo e WhatsApp permanecem pendentes. A adaptação pública do Canva está local: ainda há apenas duas fotos de resultados e CTA em lugar do formulário de contato do template. Não declarar reprodução integral nem publicação da correção pública. Testes que escrevem no banco real continuam bloqueados pela guarda de ambiente.
