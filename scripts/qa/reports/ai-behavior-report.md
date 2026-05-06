# RELATORIO DE TESTE — COMPORTAMENTO DA IA

**Data:** 2026-04-30T12:41:19.968Z
**Escopo:** whatsapp-ai-agent (router + prompt + handler)

## Sumario

- Total de checagens: 77
- Passaram: 39
- Falharam: 10
- Atencao (warn): 28
- **Achados CRITICOS:** 3
- **Achados ALTO:** 5

### router

- [+] **Primeiro contato — "Oi"** (msg: "oi")
  - Esperado: `abertura` | Obtido: `abertura`
- [+] **Primeiro contato — Saudacao com pergunta** (msg: "Bom dia, vcs atendem convenio Unimed?")
  - Esperado: `abertura` | Obtido: `abertura`
- [~] **CRITICO — "Quero agendar uma consulta" como PRIMEIRA mensagem** (msg: "Quero agendar uma consulta")
  - Esperado: `abertura` | Obtido: `abertura`
  - PROBLEMA: msg=1 sempre cai em abertura, mesmo com intencao clara de agendamento. Schedule context NAO eh carregado.
- [+] **Triagem — quarta mensagem sem dados** (msg: "Pode me explicar como funciona?")
  - Esperado: `triagem` | Obtido: `triagem`
- [+] **Agendamento — paciente menciona "tem horario"** (msg: "Tem horario disponivel pra essa semana?")
  - Esperado: `agendamento` | Obtido: `agendamento`
- [+] **Agendamento — qualificado (procedimento + convenio)** (msg: "Qual valor?")
  - Esperado: `agendamento` | Obtido: `agendamento`
- [-] **BUG-CONFIRMADO — horario "10h" na 3a msg deveria ir agendamento, mas vai abertura** (msg: "Pode ser as 10h da manha?")
  - Esperado: `agendamento` | Obtido: `abertura`
  - BUG: detectPhase verifica messageCount<=3 ANTES de checar timeRegex/dateRegex. Paciente que ja na 2a/3a msg manda horario nao avanca — IA fica genérica em fase abertura, sem carregar agenda.
- [-] **BUG-CONFIRMADO — data "dia 24" na 3a msg deveria ir agendamento, mas vai abertura** (msg: "Tenho disponibilidade dia 24")
  - Esperado: `agendamento` | Obtido: `abertura`
  - BUG: dateRegex nao eh consultado em mensagens 1-3. Cliente adianta data → IA ignora.
- [+] **Pos-agendamento — lead ja agendado (futuro)** (msg: "Posso levar acompanhante?")
  - Esperado: `pos_agendamento` | Obtido: `pos_agendamento`
- [~] **Pos-agendamento → agendamento se paciente quer remarcar** (msg: "Preciso remarcar minha consulta")
  - Esperado: `agendamento` | Obtido: `agendamento`
  - wantsNewBooking + agendamentoKeywords ("remarcar") → cai em agendamento (CORRETO).
- [+] **Handoff — emergencia detectada** (msg: "Estou com sangramento muito forte")
  - Esperado: `handoff` | Obtido: `handoff`
- [+] **Handoff — paciente pede atendente humano** (msg: "quero falar com humano por favor")
  - Esperado: `handoff` | Obtido: `handoff`
- [~] **CRITICO — palavra "cancelar" mata IA mesmo em contexto neutro** (msg: "Posso cancelar minha consulta de amanha?")
  - Esperado: `handoff` | Obtido: `handoff`
  - PROBLEMA: "cancelar" silencia a IA permanentemente (handoff fixa ai_autonomous_mode=false).
- [+] **Conversa longa com procedimento → agendamento** (msg: "qual outro horario?")
  - Esperado: `agendamento` | Obtido: `agendamento`
- [+] **Triagem default em msg media** (msg: "Quanto custa?")
  - Esperado: `triagem` | Obtido: `triagem`
- [~] **Sintoma curto — fica em abertura sem evoluir** (msg: "to com dor no joelho")
  - Esperado: `abertura` | Obtido: `abertura`
  - OK em abertura, mas se o paciente NAO mandar mais nada, IA fica perdida. Precisa proativa.
- [~] **CRITICO — lead agendado e pede agendamento NOVO → agendamento** (msg: "queria marcar uma outra consulta")
  - Esperado: `agendamento` | Obtido: `agendamento`
  - wantsNewBooking detectado → sai de pos_agendamento → "marcar" trigger agendamento. CORRETO.

### identity

- [+] **fallback default**
- [+] **empty strings → fallback**
- [+] **config completa**
- [+] **whitespace → fallback**

### postprocess

- [+] **split basico**
- [+] **remove prefix Sofia:**
- [+] **limita emojis**
- [+] **split long sentences**
- [+] **fallback empty**
- [~] **[SPLIT] em nome de medico**
  - IA pode dividir "Dr. Rafael" em duas mensagens. Sem fix automatico no codigo, depende do prompt.

### gate

- [+] **IA global ON, conversa neutra (null)**
- [~] **IA global ON, conversa LOCAL OFF**
  - Local OFF prevalece sobre global ON.
- [~] **IA global OFF, conversa LOCAL ON**
  - Local ON prevalece sobre global OFF.
- [~] **IA global OFF, conversa neutra**
  - Default state — silenciosa. Configuracao nunca ativada na clinica.
- [~] **IA global undefined (sem registro), conversa neutra**
  - PROBLEMA: clinica que nunca abriu o dialog → nao ha row em whatsapp_ai_config → IA nao responde nunca.
- [+] **IA global undefined, conversa LOCAL ON**

### schedule_regex

- [+] **Paciente pergunta horario** (msg: "tem horario amanha?")
- [+] **Paciente quer agendar** (msg: "gostaria de agendar")
- [~] **Cita "consulta"** (msg: "qual o valor da consulta?")
  - Trigger excessivo: pergunta de PRECO carrega agenda inutilmente.
- [+] **Cita dia da semana** (msg: "pode ser segunda-feira?")
- [+] **Cita horario especifico** (msg: "as 10h ta bom")
- [~] **Pergunta neutra (custo)** (msg: "quanto custa?")
  - OK — nao deve carregar agenda.
- [+] **Pergunta de localizacao** (msg: "qual o endereco?")
- [+] **Saudacao simples** (msg: "oi")

### flow_A

- [+] **Msg 1 ("Oi, vi o anuncio de voces no Instagram...") → abertura** (msg: "Oi, vi o anuncio de voces no Instagram")
  - Esperado: `undefined` | Obtido: `abertura`
- [+] **Msg 2 ("Queria saber sobre harmonizacao facial...") → abertura** (msg: "Queria saber sobre harmonizacao facial")
  - Esperado: `undefined` | Obtido: `abertura`
- [+] **Msg 3 ("Voces atendem Unimed?...") → abertura** (msg: "Voces atendem Unimed?")
  - Esperado: `undefined` | Obtido: `abertura`
- [+] **Msg 4 ("Tem horario essa semana?...") → agendamento** (msg: "Tem horario essa semana?")
  - Esperado: `undefined` | Obtido: `agendamento`
- [+] **Msg 5 ("Pode ser quinta as 10h...") → agendamento** (msg: "Pode ser quinta as 10h")
  - Esperado: `undefined` | Obtido: `agendamento`
- [+] **Msg 6 ("Sim, pode confirmar...") → agendamento** (msg: "Sim, pode confirmar")
  - Esperado: `undefined` | Obtido: `agendamento`

### flow_B

- [+] **Msg 1 ("oi") → abertura** (msg: "oi")
  - Esperado: `undefined` | Obtido: `abertura`
- [~] **Msg 2 ("consulta") → abertura** (msg: "consulta")
  - Esperado: `undefined` | Obtido: `abertura`
  - msg=2 e nada qualificado: cai em abertura. POREM regex de schedule pega "consulta" e carrega agenda mesmo assim.
- [+] **Msg 3 ("sim") → abertura** (msg: "sim")
  - Esperado: `undefined` | Obtido: `abertura`
- [~] **Msg 4 ("particular") → triagem** (msg: "particular")
  - Esperado: `undefined` | Obtido: `triagem`
  - msg=4: padrao triagem. IA precisa puxar conversa.

### flow_C

- [+] **Msg 1 ("Bom dia") → pos_agendamento** (msg: "Bom dia")
  - Esperado: `undefined` | Obtido: `pos_agendamento`
- [~] **Msg 2 ("Preciso cancelar minha consulta") → pos_agendamento** (msg: "Preciso cancelar minha consulta")
  - Esperado: `undefined` | Obtido: `pos_agendamento`
  - INESPERADO: lead com data_agendamento futura mantem-se em pos_agendamento mesmo com keyword "cancelar". Handoff so vale se messageCount>2 E nao tem proteção pos_agendamento → IA tenta tratar cancelamento sozinha.

### flow_D

- [+] **Msg 6 ("Oi tudo bem?...") → pos_agendamento** (msg: "Oi tudo bem?")
  - Esperado: `undefined` | Obtido: `pos_agendamento`
- [~] **Msg 7 ("Preciso REMARCAR minha consulta...") → agendamento** (msg: "Preciso REMARCAR minha consulta")
  - Esperado: `undefined` | Obtido: `agendamento`
  - wantsNewBooking=true (palavra "remarcar") → sai de pos_agendamento → cai em agendamento.
- [~] **Msg 8 ("Tem horario sexta?...") → pos_agendamento** (msg: "Tem horario sexta?")
  - Esperado: `undefined` | Obtido: `pos_agendamento`
  - PROBLEMA SUTIL: "tem horario" sem palavra de novo agendamento mantem em pos_agendamento. shouldLoadSchedule=false → IA nao oferece horarios.

### flow_E

- [+] **Msg 1 ("Oi...") → abertura** (msg: "Oi")
  - Esperado: `undefined` | Obtido: `abertura`
- [~] **Msg 2 ("estou com muita dor forte no peito...") → handoff** (msg: "estou com muita dor forte no peito")
  - Esperado: `undefined` | Obtido: `handoff`
  - "dor forte" → handoff de emergencia. CORRETO. IA orienta procurar PS.

### flow_F

- [+] **Msg 1 ("Oi...") → abertura** (msg: "Oi")
  - Esperado: `undefined` | Obtido: `abertura`
- [~] **Msg 2 ("esse atendimento esta uma reclamaca...") → abertura** (msg: "esse atendimento esta uma reclamacao, demoraram muito")
  - Esperado: `undefined` | Obtido: `abertura`
  - BUG-CONFIRMADO: handoff exige messageCount>2 (router linha 60). Na 2a msg, mesmo com "reclamacao", cai em abertura e IA TENTA responder ao inves de transferir.

### flow_G

- [~] **Msg 5 ("Voces tem horario?...") → agendamento** (msg: "Voces tem horario?")
  - Esperado: `undefined` | Obtido: `agendamento`
  - Cai em agendamento. Schedule context vai listar somente horarios futuros (filtra na linha 250 do index.ts).
- [~] **Msg 6 ("pode ser as 09h hoje?...") → agendamento** (msg: "pode ser as 09h hoje?")
  - Esperado: `undefined` | Obtido: `agendamento`
  - IA deve detectar horario passado e oferecer alternativas. Depende do prompt (regra 9 em prompt.ts).

### finding

- [-] **F-01 — Auto-reply OFF por default (clinica nunca configurou)**
  - CRITICO
  - Sintoma: IA nunca responde nada. Cliente reclama que mensagens chegam mas IA fica muda.
  - Raiz: whatsapp_ai_config.auto_reply_enabled tem DEFAULT false. Se o usuario nunca abriu AISettingsDialog, sequer ha row na tabela. Resultado: globalOn=false → gate retorna false → status: "auto_reply_disabled".
  - Fix: Considerar default=true ao criar config inicial; OU mostrar banner amarelo na UI quando config.auto_reply_enabled=false; OU criar trigger que insere row default quando primeiro webhook chega.
- [-] **F-02 — Handoff fixa ai_autonomous_mode=false PERMANENTE**
  - CRITICO
  - Sintoma: Apos paciente dizer "cancelar", "reclamacao", ou ter emergencia, IA nunca mais responde NESSA conversa, mesmo dias depois.
  - Raiz: Linha 540 do whatsapp-ai-agent/index.ts: UPDATE whatsapp_conversations SET ai_autonomous_mode=false. Sem reset automatico ou expiracao.
  - Fix: Adicionar coluna handoff_until (timestamp). Apos 24h, voltar a false→null. Ou criar funcao que reseta handoff quando paciente envia nova msg apos N horas.
- [-] **F-03 — Palavra "cancelar" tem trigger amplo demais**
  - ALTO
  - Sintoma: Frases como "posso cancelar minha consulta de amanha" ou "vou cancelar o convenio antigo" tragam IA → handoff. Cliente legitimo perde atendimento automatizado.
  - Raiz: router.ts linha 39 inclui "cancelar" sem analise de contexto. Match exato sem distincao de cancelamento de consulta vs cancelamento de assinatura/convenio.
  - Fix: Restringir handoff de "cancelar" para casos onde o cliente NAO esta no fluxo de agendamento. OU adicionar fase "remarcacao" que oferece reagendamento antes de handoff.
- [-] **F-04 — Lock de 60s pode prender IA se houver crash silencioso**
  - ALTO
  - Sintoma: Se uma chamada para GPT-4o falha com excecao nao capturada apos lock_acquire mas antes do release, lock fica ate 60s. Mensagens nesse intervalo retornam status:locked sem aviso.
  - Raiz: Linha 447: try_acquire_ai_lock(60s). Se OAI da timeout/rate limit no callGPT (linha 620), o catch chama safeReleaseLock — OK. Mas erros em buildScheduleContext (linha 549), ou em searchKB (linha 557), nao tem try/catch dedicado de release no caminho.
  - Fix: Embrulhar bloco principal em try-finally que SEMPRE libera lock. Atualmente o catch global libera no linha 671, mas dentro do try ha vacios. Adicionar try-finally explicito.
- [-] **F-05 — OPENAI_API_KEY ausente retorna sucesso mudo**
  - ALTO
  - Sintoma: IA retorna 200 OK mas nao envia nada. Webhook nao detecta falha. Cliente vai esperar resposta que nunca chega.
  - Raiz: Linha 441-444: if (!OAI) return 200 com error msg. Mas webhook usa fire-and-forget — nao loga isso na conversa nem alerta admin.
  - Fix: Inserir mensagem outbound de fallback ("Estamos com instabilidade, retornaremos em breve") quando OAI faltar. OU enviar evento para tabela debug_alerts visivel ao admin.
- [~] **F-06 — Debounce de 8s pode atrasar respostas**
  - MEDIO
  - Sintoma: Paciente digita 1 mensagem e espera ate 8s para IA comecar a digitar. Em conversa fluida, parece que IA travou.
  - Raiz: Linhas 459-464: while loop espera 8s sem nova msg para soltar. Em conversa rapida, esse acumulo de delays parece "robo lento".
  - Fix: Reduzir para 4-5s e/ou interromper quando primeira msg do batch tem >100 caracteres (provavel msg unica completa).
- [~] **F-07 — Lead extraction silencioso: dados sumindo**
  - MEDIO
  - Sintoma: Paciente diz "meu nome e Filipe Silva, tenho Bradesco" — mas extractLeadData (gpt-4o-mini) pode falhar silenciosamente (linhas 296-379). IA pergunta de novo.
  - Raiz: extractLeadData eh chamado em background (linha 648). Se OpenAI retorna nao-JSON ou rate limit, tudo eh silenciado pelo try-catch generico. Sem retry.
  - Fix: Adicionar log explicito (debug_logs) quando extractLeadData falha. Implementar retry com backoff. Validar JSON com schema antes de upsert.
- [~] **F-08 — CRM contact criado tarde demais**
  - MEDIO
  - Sintoma: Lead conversa por 5+ msgs em fase "triagem" mas crm_contact nao eh criado. Se paciente abandona conversa antes do agendamento, lead se perde.
  - Raiz: Linha 519-521: ensureCRMContact so eh chamado nas fases agendamento/pos_agendamento.
  - Fix: Criar contact desde fase triagem com tag "lead_em_qualificacao". Permite resgatar leads abandonados via remarketing.
- [~] **F-09 — Schedule regex pega "consulta" ate em pergunta de preco**
  - MEDIO
  - Sintoma: Trigger desnecessario de buildScheduleContext em mensagens irrelevantes (carrega agenda full toda vez). Lentidao acumulada.
  - Raiz: Linha 547 schRx inclui "consulta" sem qualificadores.
  - Fix: Restringir para "agendar consulta", "marcar consulta" ou usar contexto com phr.shouldLoadSchedule isoladamente.
- [~] **F-10 — Conversation sem phone_number_id em provider Evolution**
  - BAIXO
  - Sintoma: Em ambiente Evolution, mark-as-read pula via guard. OK. Mas se historico tem msgs com `provider=meta` antigas, o getWAConfig pode pegar config errada.
  - Raiz: getWAConfig (linha 30) seleciona is_active=true sem filtro por provider. Se medico tem 2 configs (meta + evolution), retorna a primeira.
  - Fix: Filtrar getWAConfig pelo provider da conversa OU usar a config primaria (com prioridade definida).
- [-] **F-11 — Sem fallback em falha de GPT-4o (linha 619-625)**
  - ALTO
  - Sintoma: Se OpenAI da rate limit ou erro 500, IA simplesmente nao responde. Sem retry, sem mensagem de fallback ao paciente.
  - Raiz: try-catch retorna 200 e libera lock — paciente fica esperando indefinidamente.
  - Fix: Implementar fallback: enviar "Estou com um momento de instabilidade, ja te respondo!" como mensagem outbound + retry em backoff exponencial.
- [~] **F-12 — Identidade da IA depende 100% de whatsapp_ai_config**
  - MEDIO
  - Sintoma: Se medico nao preencheu agent_name/specialist_name, IA se chama "Sofia" e o doutor de "nossa equipe". Cliente acha estranho.
  - Raiz: buildAgentIdentity (linha 14-26) tem fallback Sofia/nossa clinica/nossa equipe.
  - Fix: Forcar onboarding obrigatorio: na primeira ativacao do auto_reply_enabled, exigir preenchimento de specialist_name + clinic_name.
- [-] **F-13 — Webhook chama agent fire-and-forget sem garantia de execucao**
  - CRITICO
  - Sintoma: Em ambientes que nao suportam EdgeRuntime.waitUntil (ex: deploy custom), o fetch eh feito sem aguardar — pode morrer com a resposta do webhook.
  - Raiz: whatsapp-webhook/index.ts linhas 453-479: usa EdgeRuntime.waitUntil quando disponivel, senao fire-and-forget puro.
  - Fix: Em vez de fire-and-forget, gravar tarefa em fila (ex: pg_cron / supabase_functions.queue) e processar com worker dedicado. Garante retry e observabilidade.
- [-] **F-14 — Mark-as-read com timeout pode bloquear thread**
  - ALTO
  - Sintoma: Se Meta API esta lenta, mark-as-read (linha 489-494) sem await timeout pode segurar a execucao por muito tempo.
  - Raiz: fetch sem AbortController. Try/catch protege erro mas nao timeout.
  - Fix: Adicionar AbortController com timeout 3s no fetch.
- [~] **F-15 — RAG threshold 0.5 pode ser baixo demais**
  - BAIXO
  - Sintoma: Resultados irrelevantes da knowledge_base podem poluir prompt.
  - Raiz: searchKB (linha 284): p_match_threshold: 0.5. Para text-embedding-3-small isso eh permissivo.
  - Fix: Subir para 0.65-0.7 e medir taxa de KB-hit. Adicionar log de similaridade no debug_logs.

## Conclusao

A IA tem **falhas criticas** que explicam o comportamento incorreto reportado. Em especifico:

- F-01 — Auto-reply OFF por default (clinica nunca configurou)
- F-02 — Handoff fixa ai_autonomous_mode=false PERMANENTE
- F-13 — Webhook chama agent fire-and-forget sem garantia de execucao

Detalhes e fixes propostos estao na secao `finding` acima.