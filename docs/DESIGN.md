# DESIGN — Experiência e identidade visual

Status: diretrizes aprovadas em 29/09/2026. Cada sistema terá identidade própria; foco mobile e acessibilidade são comuns. Profundidade 3D é opcional e deve ajudar a experiência; modo escuro é decidido por projeto.

## Finalidade

Definir a experiência desejada e a linguagem visual sem impor a mesma aparência a negócios diferentes.

## Estrutura proposta para cada sistema

- Público, tarefas principais e direção visual.
- Referências aprovadas e padrões a evitar.
- Cores, tipografia, espaçamento, bordas e profundidade.
- Componentes e seus estados: carregamento, vazio, erro e sucesso.
- Fluxos, conteúdo e tom de voz.
- Responsividade, teclado, contraste e movimento reduzido.
- Critérios de validação visual e limites de desempenho.

## Direção conhecida deste projeto

### Template escolhido pelo usuário — decisão vigente

Releitura após edição do usuário: título “Resultados que encantam”; especialidades Alisamento & Brilho, Make para momentos especiais, Olhar em destaque e Cabelos renovados; depoimento substituído por Luana. Textos integrados à página inicial local, com catálogo vindo do banco e CTA funcional. As fotos novas foram identificadas, mas `get-assets` retorna apenas thumbnails de 112–200px; não incorporá-las como arquivos de produção nem usar URLs assinadas temporárias no código. Preservadas por enquanto as duas fotos locais existentes. Abrir Canva no navegador falhou duas vezes por timeout: composição visual ainda não verificada. Não afirmar reprodução fiel do template.

Referência aprovada: [Juliana souza — Canva](https://www.canva.com/design/DAHWzk-pxaM/1Do2dFFOmozArnnLfgiCUw/edit), duas páginas. Substitui a proposta de gerar mockups genéricos. Inspeção de textos, posições e nove imagens realizada via API; transação encerrada sem editar o original. Prévias apresentadas ao usuário; cores e fontes exatas não foram retornadas pela API e não estão verificadas.

O site será implementado em Next.js com conteúdo editável **pelo painel da proprietária**, conforme resposta explícita. Não existe sincronização automática com o Canva. A seção atualmente intitulada “Um look para toda ocasião” será **Serviços da Juliana**, com serviços reais do catálogo, imagens e descrições por serviço. As categorias de maquiagem do template não são requisitos. Nomes, preços e durações usam a mesma fonte do agendamento; não copiar preços estáticos do Canva por cima do banco.

Fotos substitutas ainda não fornecidas. Preparar os espaços e permitir troca pelo painel; não inventar imagens de trabalhos reais. O depoimento que cita “Viva Beauty” é exemplo e não deve ser publicado como avaliação da Juliana. CTA “Agendar horário” deve navegar para o fluxo funcional `/agendar`, em vez das âncoras internas do Canva. Preservar o caráter visual do template adaptando composição, leitura e toque para celular.

Experiência mobile-first baseada no Canva aprovado: branco/preto, Manrope e marca condensada Oswald, fotografia e cantos arredondados. Oswald aproxima a marca; fonte exata do Canva não foi identificada. O usuário prefere aparência moderna e própria, sem estética genérica de IA. A implementação atual não utiliza motor 3D. Registros antigos de creme/argila e Fraunces abaixo são históricos e foram substituídos.

## Fundamentos atuais

| Elemento | Valor |
| --- | --- |
| Fundo | #ffffff |
| Texto principal | #171717 |
| Botões | Preto, arredondados em pílula |
| Rodapé | #f3f4e8 |
| Tipografia | Oswald para marca; Manrope para títulos e leitura |
| Profundidade | Fotografia e composição; efeitos discretos |
| Tema atual | Claro; modo escuro não solicitado para esta entrega |

## Critérios de experiência

Verificar 375px, tablet e desktop; teclado e foco visível; contraste AA; rótulos claros; anúncio de erros; estados vazio/carregando/sucesso; movimento reduzido. No fluxo futuro, distinguir solicitação pendente de reserva confirmada. Na agenda, comunicar toda a duração ocupada. Validação visual nova está pendente; a análise de 29/09 foi de código.

## Manutenção proposta

### Referências e Figma — 01/10/2026

**Decisão substituída:** após o bloqueio do Figma, o usuário determinou usar **Canva no lugar do Figma**. Canva será o destino dos mockups de UI/UX; Taste e Impeccable continuam orientando a direção e revisão. O arquivo Figma vazio permanece apenas como histórico. Não insistir em upgrade ou novas chamadas Figma.

Entrega visual prevista no Canva: telas mobile de serviços, data/horário, confirmação de dados e solicitação pendente; painel desktop com ocupação por duração e painel mobile para aprovar, propor horário ou recusar. Dados fictícios; estados futuros identificados como proposta, sem prometer WhatsApp conectado. Paleta e tipografia aprovadas preservadas. Os mockups não substituem validação de acessibilidade e comportamento no navegador.

Usuário aprovou Taste para referências de agendamentos modernos e Figma com Impeccable para UI/UX. Referências funcionais pesquisadas: [Fresha Scheduling](https://www.fresha.com/for-business/features/scheduling) e [Timely Online Bookings](https://go.gettimely.com/online-bookings.html). Orientam clareza de disponibilidade e serviços; não houve inspeção visual dessas páginas nem cópia de marca. Preservar Fraunces/Manrope e creme/argila.

[Arquivo Figma criado](https://www.figma.com/design/4jFJJWEYyCDjmnb4Ps5C4e). Está vazio: chamadas de inspeção e biblioteca recusadas pelo limite MCP do plano Starter. Não declarar telas, protótipo ou validação visual concluídos. Retomar no mesmo arquivo quando o acesso estiver disponível; não criar duplicata nem contratar plano automaticamente.

Impeccable adotado em 01/10/2026 para planejamento, revisão e acabamento visual. O carregamento de contexto reconheceu este documento e a UI existente. PRODUCT.md ainda ausente; preparar contexto via init antes de novas superfícies no fluxo da skill. Não há necessidade de substituir a identidade visual atual. Ver [seleção de skills](reviews/2026-10-01-skills.md).

Registrar decisões visuais aprovadas e evidências de validação. Não chamar uma tela de responsiva ou acessível sem verificar os critérios relevantes.

### Inspeção visual do template — 01/10/2026
Referência acessada no Chrome: fundo branco, tipografia preta sem serifa, botões pretos arredondados, fotos retangulares com cantos arredondados, rodapé amarelo-esverdeado claro. Usar essa direção na adaptação; a paleta creme/terracota atual não representa fielmente o Canva escolhido. Três imagens identificadas preparadas como WebP em public/images (juliana-canva, maquiagem-canva, alisamento-canva); integração visual pendente. Não usar links temporários assinados no site.

## Painel da profissional — 05/10/2026
Modo operacional: fundo branco, texto preto, fonte Manrope, botões arredondados e navegação verde clara derivados do Canva escolhido. Tokens limitados a .admin-site. Agenda ativa, fila de decisões e histórico separados. Site público preservado por instrução do usuário. Validação visual autenticada ainda pendente.

Correção solicitada em 05/10: login, recuperação e nova senha também pertencem à identidade Canva. Retrato real da Juliana no login, composição branca sem cartão terroso, botões pretos arredondados e rodapé verde claro. No celular, formulário precede a foto para facilitar o acesso. Marca compartilhada no painel; sem monograma inventado nem tipografia serifada antiga.

Visual do login explicitamente aprovado pelo usuário em 05/10/2026: manter esta identidade e estender às telas profissionais, sem nova direção visual.

## Correção pública — 07/10/2026
Identidade Canva estendida localmente ao site público e agendamento. Banner corte-canva e rodapé cosmeticos-canva recuperados do template; demais fotos locais preservadas. Inspeção da página inicial a 375px: CTA visível, sem overflow horizontal. Layout desktop já inspecionado na correção anterior; não equivale a revisão completa de todos os breakpoints. Ainda há duas fotos de resultados e CTA no lugar do formulário de contato; edição de conteúdo pelo painel segue pendente. Mudanças públicas ainda não publicadas na Vercel.

## Editor e fechamento — 08/10/2026

A direção é uma extensão do Canva existente, sem nova identidade ou 3D obrigatório. /painel/site usa os controles do painel; campos agrupados por apresentação, sobre, trabalhos, contato e fotos. Preços/duração permanecem no CRUD único. Fotos com preview do rascunho, alt obrigatório, erro sem perder a anterior e confirmação de salvamento. Mobile: campos de 16px e controles mínimos de 44px; catálogo em duas colunas e contato empilhado; desktop com formulário de contato à esquerda e convite à direita.

Não publicar depoimento fictício. Contato abre WhatsApp para revisão/envio manual, sem anunciar automação. Texto editável precisa quebrar linhas compridas sem overflow. Template original não foi modificado: transação Canva usada para inspeção foi cancelada sem alterações. Detector Impeccable rodou uma vez no lote; revisão visual deve registrar ambiente/limitações.
