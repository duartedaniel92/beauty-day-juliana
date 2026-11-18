# Site editável a partir do Canva

Status em 08/10/2026: editor implementado localmente; migration site_content aplicada no Supabase após apresentação do SQL. Publicação e conferência autenticada finais pendentes.

## Produto

- Referência: https://www.canva.com/design/DAHWzk-pxaM/1Do2dFFOmozArnnLfgiCUw/edit
- Preservar composição da apresentação, sobre Juliana e contato, adaptando a responsividade.
- Substituir as quatro categorias de ocasiões por serviços do catálogo vigente.
- Proprietária edita textos, fotos e textos alternativos pelo painel; Canva serve de referência, sem sincronização.
- Fotos novas podem ser adicionadas depois. Nunca apresentar fotos genéricas como trabalhos comprovados nem publicar o depoimento fictício do template.
- Agendamento continua funcional; não prometer envio WhatsApp antes da integração.

## Implementação prevista

1. Conteúdo textual estruturado, limitado por schema, sem HTML livre. Registro único `site_content`; configuração padrão preserva a página quando ainda não houver conteúdo personalizado.
2. Imagem, descrição e texto alternativo associados ao ID de `services`; nomes/preços/durações permanecem no CRUD existente. Catálogo único evita divergência com reserva.
3. Área `/painel/site` autorizada no servidor por `requireOwner`, com prévia e confirmação de salvamento. Operações de serviço usam a mesma autorização já existente.
4. Supabase Storage para imagens destinadas à publicação, sem informações de clientes. Escrita restrita à proprietária; nome aleatório gerado no servidor, sem caminho arbitrário fornecido pelo cliente.
5. Upload limitado a JPEG/PNG/WebP, **4 MB** por arquivo e 24 milhões de pixels; verificar bytes e decodificação no servidor, reprocessar removendo metadados. Recusar SVG, HTML, arquivos inválidos e importação por URL arbitrária. Aplicar limite de requisições e impedir substituição de arquivo alheio por ID. O limite inicialmente proposto de 5 MB foi reduzido para caber no payload de 4,5 MB da Vercel; inclui margem para multipart. Fonte: https://vercel.com/docs/functions/limitations.
6. Persistir somente caminho gerenciado no storage; nada de base64 ou chave privada em conteúdo público. HTML renderizado com escape React; links com protocolos permitidos.
7. Novas migrations aditivas, RLS e políticas de Storage em arquivos revisáveis; apresentar SQL antes de aplicar remotamente. Sem publicar nesta etapa.

## Verificações

- Visitante e autenticado sem vínculo não editam texto nem enviam/excluem imagens.
- Arquivo fora do formato/tamanho/pixels permitido é rejeitado antes da persistência; nome malicioso não define caminho.
- Erro de upload não remove foto anterior; publicação só usa arquivo gravado com sucesso.
- Texto com marcação é mostrado como texto, nunca executado.
- Inativar serviço retira-o da vitrine e seleção pública; mudar preço reflete em ambos.
- Verificar 375/390px e desktop, teclado, foco, contraste e estados de erro/carregamento/vazio.
- Testes de gravação somente em homologação autorizada ou banco local isolado.

## Dependências

Continuar plano de segurança aprovado; nova funcionalidade de upload torna aplicáveis os controles antes marcados como não aplicáveis. Fotos substitutas e confirmação de eventuais mudanças no catálogo ainda pendentes. Não bloquear a preparação da estrutura nem inventar serviços com base nas fotos do template.
