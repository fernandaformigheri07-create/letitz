# LETITZ — Reestruturação do Agent

Evolução do projeto atual (sem recomeçar). O Agent vira o centro do produto, todos os dados fictícios saem e tudo passa a refletir apenas dados reais.

## 1. Fim dos dados fictícios
- Remover os 50 leads, campanhas, conversas, vendas e atividades de demonstração.
- Todas as telas começam zeradas (0 leads, R$ 0, 0% conversão) com mensagens elegantes de estado vazio ("Tudo tranquilo. Nenhuma ação pendente.").
- Os badges "dados demo" deixam de existir.

## 2. Dados reais salvos (Lovable Cloud)
- Ativar Lovable Cloud com login do usuário.
- Guardar: leads/empresas/contatos, oportunidades, conversas, follow-ups e lembretes, campanhas, vendas, Business Knowledge, conversas com o Agent, ações do Agent com estado e registro de auditoria, autorizações e permissões do Autopilot.

## 3. Agent de verdade (IA)
- Conversa real com modelo de IA, com histórico completo e memória do contexto ("as 10 melhores", "essas", "essa").
- O Agent usa ferramentas internas: consultar/filtrar leads, criar leads, criar follow-up ou lembrete, preparar mensagem, analisar conversa, registrar aprendizado no Business Knowledge, pedir autorização.
- Intenção separada de autorização: níveis 1 a 9 (pesquisar → tentar fechar). Cada autorização vale para um contato/escopo e nunca se amplia sozinha.
- Estados visíveis de cada ação: preparando, aguardando autorização, executando, concluída, falhou.
- Distinção explícita na resposta entre fato confirmado, inferência, sugestão e informação ausente. Não inventa nada fora do Business Knowledge; pergunta quando falta.
- Envio de mensagens: sem WhatsApp conectado, a ação falha com o motivo real ("WhatsApp ainda não está conectado"). Nunca finge sucesso.
- Prospecção: interpreta segmento, cidade, critério e quantidade; sem fonte de busca conectada, mostra isso claramente em vez de inventar empresas.
- "Me lembra daqui 3 horas" = lembrete; "Tenta novamente daqui 3 horas" = execução agendada que ainda depende de autorização e integração.
- Venda só é registrada com confirmação explícita do usuário.

## 4. Nova interface do Agent
- Central de comando conversacional: conversa ao centro, campo de entrada de destaque, faixa lateral discreta com contexto atual (seleção ativa, autorizações vigentes) e ações aguardando autorização.
- Resultados apresentados progressivamente, poucos painéis e bordas, excelente no celular.

## 5. Command Center e navegação
- Início vira Command Center: decisões pendentes, ações aguardando autorização, oportunidades, follow-ups, conversas importantes e vendas reais — sem mural de cards.
- Menu: Command Center, Prospect, Leads, Campaigns, Opportunities, Sales, Agent, Knowledge, Settings (Conversations passa a viver dentro de Leads/Opportunities; Analytics sai do menu).
- Nova página Knowledge: descrição do negócio, serviços, preços, diferenciais, público, objeções e respostas, FAQ, regras (ex.: "vídeo só após interesse", "desconto só com minha autorização"), mensagens e links de materiais.
- Nova página Opportunities: leads com interesse, intenção e próximos passos.
- Settings: Autopilot desligado por padrão, com permissões independentes (pesquisar, analisar, notificar, preparar, criar follow-up, enviar, negociar, fechar); integrações mostradas como "não conectadas".
- Nova visão de auditoria: o que o Agent fez, por quê, quem autorizou e o resultado real.

## 6. Visual
- Refinar a direção atual (grafite, carvão, preto, azul, violeta) reduzindo bordas, cards e sombras; o globo continua em Prospect.

## Fora desta rodada
WhatsApp real, Google Places real, e-mail real, calendário, planilhas, pagamentos e Autopilot executando sozinho — apenas a arquitetura fica preparada.

## Detalhes técnicos
- Tabelas com workspace_id e RLS por usuário; `agent_actions` (tool, input, status, authorization_level, result, error) e `agent_audit_log`; `authorizations` (contact/lead, level, scope, granted_at, revoked_at); `knowledge_items` (type, content, source: user|learned).
- Rota de streaming do Agent com AI SDK + modelo padrão `openai/gpt-6-astra` via Responses API; ferramentas executadas no servidor verificando autorização antes de qualquer ação de nível ≥5.
- Conversas do Agent persistidas e reenviadas inteiras a cada turno; ids da "seleção atual" guardados no estado da conversa.
- Scoring existente preservado apenas para ordenação interna; a interface mostra sinais e justificativa.
