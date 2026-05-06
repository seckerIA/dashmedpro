# Relatorio de Comportamento da IA — DashMedPro

**Modulo testado:** `whatsapp-ai-agent` (Edge Function Deno)
**Componentes:** `router.ts` + `prompt.ts` + `index.ts` + `whatsapp-webhook/index.ts`
**Tipo de teste:** simulacao deterministica de interacoes humanas reais sobre a logica de fases, gating, identidade, postProcess e regras de roteamento.
**Modo:** offline (sem Supabase / OpenAI), reproduzindo os algoritmos do agente real.

---

## 1. Resumo Executivo

| Indicador | Valor |
|-----------|-------|
| Total de checagens | 77 |
| Passaram | 39 |
| Falharam | 10 |
| Atencoes (warn) | 28 |
| **Achados CRITICOS** | **3** |
| **Achados ALTOS** | **5** |

A IA apresenta 8 problemas que explicam, com alta probabilidade, os relatos de
"em alguns momentos especificos a IA deveria responder e nao responde".
A maioria nao eh bug do prompt — eh **gating, lock, fire-and-forget e regex
amplos** que silenciam a IA inteira sem feedback ao usuario.

---

## 2. Cenarios Simulados (paciente real)

### Cenario A — Lead quente vindo de anuncio (Meta/Instagram)

```
PACIENTE: Oi, vi o anuncio de voces no Instagram         → abertura      [OK]
PACIENTE: Queria saber sobre harmonizacao facial          → abertura      [LIMITE: nao avanca para triagem]
PACIENTE: Voces atendem Unimed?                          → abertura      [LIMITE: cap 3 msgs]
PACIENTE: Tem horario essa semana?                       → agendamento   [OK]
PACIENTE: Pode ser quinta as 10h                         → agendamento   [OK]
PACIENTE: Sim, pode confirmar                            → agendamento   [OK]
```
**Diagnostico:** o "cap" rigido de `messageCount<=3` em `router.ts` faz a IA
manter postura de **abertura** mesmo quando o paciente ja deu procedimento +
convenio. O prompt de fase nao carrega RAG nem agenda nessa janela —
respostas ficam genericas.

### Cenario B — Lead seco / monossilabico

```
PACIENTE: oi                  → abertura       [OK]
PACIENTE: consulta            → abertura       [WARN: shouldLoadSchedule via regex independente — leak]
PACIENTE: sim                 → abertura       [OK]
PACIENTE: particular          → triagem        [OK — mas IA tem que puxar conversa]
```
**Diagnostico:** ficou OK mas o regex de `consulta` na linha 547 do `index.ts`
carrega agenda inteira mesmo em pergunta de preco — gera latencia.

### Cenario C — Cliente quer CANCELAR consulta agendada

```
[lead.status = agendado, data_agendamento = +24h]
PACIENTE: Bom dia                              → pos_agendamento  [OK]
PACIENTE: Preciso cancelar minha consulta      → pos_agendamento  [BUG]
```
**Diagnostico:** comportamento INESPERADO. Quando lead ja agendado, a guarda
`leadData.status==='agendado' && !wantsNewBooking` faz a fase ficar fixa em
`pos_agendamento`, independente da palavra "cancelar". A IA recebe um prompt
de pos-atendimento e tenta resolver o cancelamento sozinha — sem handoff,
sem fluxo de cancelamento real, sem atualizacao do agendamento. **Risco de
no-show silencioso.**

### Cenario D — Cliente quer REMARCAR

```
[lead.status = agendado, data_agendamento = +48h]
PACIENTE: Oi tudo bem?                          → pos_agendamento  [OK]
PACIENTE: Preciso REMARCAR minha consulta       → agendamento      [OK — sai por wantsNewBooking]
PACIENTE: Tem horario sexta?                    → pos_agendamento  [BUG]
```
**Diagnostico:** o `wantsNewBooking` so dispara em `remarcar/marcar/agendar`.
Apos a primeira mensagem que disparou, a proxima ("tem horario sexta") nao
contem palavra-chave — volta para `pos_agendamento` e a IA fica sem
`shouldLoadSchedule`. O paciente nao recebe horarios disponiveis.

### Cenario E — Emergencia medica

```
PACIENTE: estou com muita dor forte no peito   → handoff   [OK]
```
Funciona corretamente.

### Cenario F — Cliente reclamando

```
PACIENTE: Oi                                                         → abertura   [OK]
PACIENTE: esse atendimento esta uma reclamacao, demoraram muito       → abertura   [BUG]
```
**Diagnostico:** `router.ts` exige `messageCount > 2` para handoff de
keyword. Na 2a mensagem, a reclamacao eh **ignorada** e a IA tenta responder
casualmente. Pessima primeira impressao em situacao critica.

### Cenario G — Lead pede horario que ja passou hoje

```
PACIENTE: pode ser as 09h hoje?  → agendamento   [OK]
```
A IA chega na fase certa. A protecao real depende do prompt (regra 9 em
`prompt.ts`) e da listagem de horarios em `buildScheduleContext` (filtra
apenas horarios futuros, linha 250). **Mas isso depende do GPT-4o respeitar
o prompt** — sem teste E2E nao se garante.

---

## 3. Pontos Criticos Identificados

### F-01 [CRITICO] — Auto-reply desligado por padrao
- **Sintoma:** clinica reporta que IA "nao responde nada".
- **Causa:** `whatsapp_ai_config.auto_reply_enabled` tem `DEFAULT false`. Se o usuario nunca abriu o `AISettingsDialog`, **nao existe row** na tabela. O agent retorna `status: 'auto_reply_disabled'` e segue silencioso.
- **Fix:** Banner amarelo na UI quando config esta `false`/inexistente, OU trigger SQL que cria registro default ativo no primeiro webhook.

### F-02 [CRITICO] — Handoff trava IA permanentemente
- **Sintoma:** apos paciente dizer "cancelar", "reclamacao", emergencia ou pedir atendente, IA **nunca mais responde** nessa conversa.
- **Causa:** `index.ts:540` faz `UPDATE whatsapp_conversations SET ai_autonomous_mode=false`. Sem expiracao, sem reset.
- **Fix:** adicionar coluna `handoff_until TIMESTAMPTZ` e voltar a `null` apos 24h. Ou migrar para flag `handoff_active` com TTL.

### F-13 [CRITICO] — Webhook → Agent fire-and-forget
- **Sintoma:** em ambientes sem `EdgeRuntime.waitUntil`, o `fetch` morre com a resposta do webhook. Resultado: paciente envia msg, mas o agent nem executa.
- **Causa:** `whatsapp-webhook/index.ts:453-479`.
- **Fix:** mover para fila (`pg_cron` + `net.http_post`, ou Supabase Realtime + worker dedicado).

### F-03 [ALTO] — "cancelar" amplo demais
- Frases legitimas como "posso cancelar minha consulta" (que querem reagendar) caem em handoff e perdem suporte automatizado.
- **Fix:** detectar contexto `cancelar consulta` separado de `cancelar plano/convenio`. Adicionar fase `cancelamento` que oferece reagendamento antes do handoff.

### F-04 [ALTO] — Lock de 60s sem try-finally
- Excecoes nao capturadas em `buildScheduleContext` ou `searchKB` deixam o lock preso. Mensagens nesse intervalo retornam `status: 'locked'` invisivel.
- **Fix:** envelopar bloco principal em `try { ... } finally { releaseLock() }`.

### F-05 [ALTO] — `OPENAI_API_KEY` ausente: silencio total
- IA retorna 200 OK mas nao envia nada. Webhook nao detecta. Cliente espera resposta que nunca chega.
- **Fix:** quando `OAI` faltar, inserir mensagem outbound de fallback ("Estamos com instabilidade, ja te chamamos!") ou alertar admin via `debug_logs`.

### F-11 [ALTO] — Sem retry/fallback em falha de GPT-4o
- Rate limit / 500 da OpenAI → IA sem resposta, sem aviso, sem fallback.
- **Fix:** retry com backoff exponencial + mensagem de fallback ao paciente.

### F-14 [ALTO] — Mark-as-read sem timeout
- Se Meta API trava, `fetch` sem `AbortController` segura a execucao da function.
- **Fix:** `AbortController` com timeout 3s.

---

## 4. Limites de Comportamento (warn)

- `messageCount <= 3` rigido bloqueia transicao precoce mesmo quando lead ja se qualificou. Considerar permitir transicao por **dados qualificados** (procedimento + convenio) independentemente da contagem.
- `pos_agendamento` muito restritivo: paciente que ja agendou e faz pergunta sobre horario de **outra** consulta nao avanca.
- Schedule regex pega `consulta` em qualquer pergunta — carrega agenda mesmo em mensagens de preco.
- RAG threshold 0.5 retorna trechos pouco similares; subir para 0.65-0.7.
- Debounce de 8s percebido como "robo lento" em conversa fluida.

---

## 5. Pontos OK

- Identidade do agente cai em fallback Sofia/nossa clinica corretamente para `null`, strings vazias, whitespace.
- `postProcess` remove prefixos "Sofia:", limita a 1 emoji por resposta, divide mensagens longas em frases (<120 chars).
- Gating de auto-reply respeita override por conversa (`ai_autonomous_mode=true` ativa local mesmo com global off).
- Handoff de **emergencia** (sangramento, dor forte, PS, UPA) funciona em qualquer turno.
- Dual provider: regex de schedule e debounce nao discriminam Meta/Evolution incorretamente.

---

## 6. Recomendacoes Priorizadas

### P0 — Acoes imediatas
1. **F-01:** garantir row default em `whatsapp_ai_config` ao criar usuario. [SQL trigger ou seed no signup]
2. **F-02:** TTL no handoff. [Coluna `handoff_until` + check no agent]
3. **F-13:** garantir execucao do agent (fila ou await explicito).
4. **F-05/F-11:** mensagem de fallback quando OAI falha.

### P1 — Robustez
5. **F-04:** try-finally em volta do main handler.
6. **F-14:** AbortController nos fetchs.
7. **F-03:** distinguir cancelamento de consulta vs cancelamento de plano.
8. Ajustar router para permitir transicao precoce com dados qualificados.

### P2 — Refinamento
9. F-09: schedule regex mais restritivo.
10. F-15: RAG threshold 0.65.
11. F-06: debounce dinamico.
12. F-07: log explicito em `extractLeadData` falha.
13. F-08: criar CRM contact desde triagem.
14. F-12: onboarding obrigatorio de identidade.

---

## 7. Como reproduzir

```bash
npx tsx scripts/qa/test-ai-behavior.ts
```

Saida: console + `scripts/qa/reports/ai-behavior-report.md` (gerado).

---

## 8. Apendice — Limitacoes do Teste

- Teste **NAO chama** a OpenAI real. Todas as conclusoes sobre prompt obedecido pelo modelo (ex: respeito a regra de horarios passados, anti-alucinacao) sao **inferenciais a partir do texto do prompt**.
- Teste **NAO chama** o Supabase. Hipoteses sobre estado real do banco (ex: existencia de row em `whatsapp_ai_config`) sao baseadas no schema e default values.
- Teste **NAO simula** o webhook do Meta/Evolution. Cenario F-13 eh inferido por leitura de codigo.
- Para validacao end-to-end com API real, seria necessario adicionar credenciais OpenAI + Supabase (cursor.com/onboard) e habilitar suite live (nao incluida nesse PR).
