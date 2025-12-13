# Guia de Prospecção - Documentação

## 📋 Visão Geral

O **Guia de Prospecção** é um sistema integrado que auxilia vendedores durante chamadas de prospecção, fornecendo scripts estruturados, tratamento de objeções e integração direta com o CRM.

## 🎯 Funcionalidades Principais

### 1. Gerenciamento de Roteiros
- **Criar até 5 roteiros** personalizados
- **Configurar de 3 a 10 cards** por roteiro
- **Dois tipos de cards:**
  - **Script**: Fala que o vendedor deve dizer
  - **Objeção**: Possível resposta negativa do cliente
- **Editar durante o uso**: Cards podem ser modificados em tempo real

### 2. Interface de Sessão
- **Fundo totalmente preto** para foco máximo
- **2 cards de script** visíveis simultaneamente
- **1 card de objeção** menor abaixo
- **Edição inline** de conteúdo
- **Botão de check** para marcar como concluído
- **Barra de progresso** discreta
- **Navegação** entre pares de cards

### 3. Registro de Atendimentos
- **Contador diário** de atendimentos
- **Duas opções de finalização:**
  - ✅ **Atendimento Encerrado**: Cliente não interessado
  - ✅ **Contato do Decisor Adquirido**: Abre formulário do CRM

### 4. Integração com CRM
- Ao selecionar "Contato do Decisor Adquirido"
- Abre automaticamente o formulário de novo contato
- Cria lead no estágio "Lead Novo"
- Registra atendimento nas métricas

## 🗄️ Estrutura do Banco de Dados

### Tabela: `prospecting_scripts`
```sql
- id (uuid)
- user_id (uuid)
- name (text)
- cards (jsonb) - Array de cards
- is_active (boolean)
- created_at, updated_at
```

### Tabela: `prospecting_sessions`
```sql
- id (uuid)
- user_id (uuid)
- script_id (uuid, nullable)
- completed_at (timestamp)
- result (enum: 'atendimento_encerrado' | 'contato_decisor')
- contact_id (uuid, nullable)
- created_at
```

## 🔧 Componentes Criados

### Hooks
- `useProspectingScripts.tsx` - Gerenciamento de roteiros
- `useProspectingSessions.tsx` - Registro de sessões

### Componentes
- `DailyStats.tsx` - Contador de atendimentos do dia
- `ScriptCard.tsx` - Card de script com edição
- `ObjectionCard.tsx` - Card de objeção
- `ScriptConfiguration.tsx` - Modal de configuração
- `ScriptSelector.tsx` - Lista de roteiros salvos
- `ProspectingSession.tsx` - Interface principal (fundo preto)
- `SessionResults.tsx` - Modal de finalização

### Páginas
- `ProspectingGuide.tsx` - Orquestrador principal

## 🚀 Como Usar

### 1. Acessar o Guia
- No menu lateral, clique em **"Guia de Prospecção"** (ícone de bússola)
- Ou acesse diretamente: `/comercial/guia-prospeccao`

### 2. Criar um Roteiro
1. Clique em **"Criar Novo Roteiro"**
2. Dê um nome ao roteiro
3. Escolha a quantidade de cards (3-10)
4. Configure cada card:
   - Tipo: Script ou Objeção
   - Conteúdo: Texto do script/objeção
5. Salve o roteiro

### 3. Iniciar uma Sessão
1. Selecione um roteiro salvo
2. A tela ficará preta com os primeiros cards
3. Leia o script ao cliente
4. Marque como concluído
5. Navegue pelos próximos cards

### 4. Editar Durante o Uso
- Clique em **"Editar"** em qualquer card
- Modifique o texto conforme necessário
- Salve as alterações

### 5. Finalizar o Atendimento
- Quando terminar todos os cards, clique em **"Finalizar"**
- Ou use o botão lateral **"Finalizar"** a qualquer momento
- Escolha o resultado:
  - **Atendimento Encerrado**: Conta +1 atendimento
  - **Contato do Decisor**: Abre CRM + conta +1 atendimento

## 📊 Métricas e Relatórios

### Contador Diário
- Localização: Canto superior esquerdo
- Informações:
  - Total de atendimentos do dia
  - Atendimentos encerrados
  - Contatos de decisores adquiridos
- **Reset automático à meia-noite**

### Histórico de Sessões
- Todas as sessões completadas são registradas
- Query para acessar: `prospecting_sessions`
- Filtros por data, resultado, script utilizado

## 🎨 Design e UX

### Paleta de Cores
- **Sessão ativa**: Fundo preto (#000000)
- **Cards de script**: Branco (#FFFFFF)
- **Cards de objeção**: Branco com 90% opacidade
- **Botões**: Verde para finalizar, outline para navegação

### Animações
- Fade in/out entre cards
- Transições suaves (300ms)
- Hover states em botões

### Responsividade
- Desktop: Grid de 2 colunas para scripts
- Mobile: Coluna única
- Adaptativo para tablets

## 🔒 Segurança

### Row Level Security (RLS)
- Usuários veem apenas seus próprios roteiros
- Usuários registram apenas suas próprias sessões
- Políticas automáticas no Supabase

### Validações
- Máximo 5 roteiros por usuário
- Mínimo 3, máximo 10 cards por roteiro
- Campos obrigatórios validados

## 🧪 Testes Recomendados

### Fluxo Completo
1. ✅ Criar novo roteiro
2. ✅ Editar roteiro existente
3. ✅ Excluir roteiro
4. ✅ Iniciar sessão
5. ✅ Editar cards durante uso
6. ✅ Navegar entre cards
7. ✅ Finalizar com "Atendimento Encerrado"
8. ✅ Finalizar com "Contato do Decisor"
9. ✅ Verificar contador de atendimentos
10. ✅ Verificar registro no banco

### Edge Cases
- Tentar criar 6º roteiro (deve bloquear)
- Criar roteiro com campos vazios (deve validar)
- Cancelar durante sessão (deve sair sem registrar)
- Editar card e cancelar (deve voltar ao original)

## 🚧 Melhorias Futuras

### Curto Prazo
- [ ] Atalhos de teclado (Ctrl+Enter para concluir)
- [ ] Suporte a templates pré-definidos
- [ ] Exportar/importar roteiros

### Médio Prazo
- [ ] Estatísticas por roteiro (taxa de conversão)
- [ ] Timer por card (quanto tempo em cada etapa)
- [ ] Compartilhamento de roteiros entre equipe

### Longo Prazo
- [ ] Gravação de áudio das objeções
- [ ] IA para sugerir respostas a objeções
- [ ] Integração com softphone

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Verifique os logs do console (F12)
2. Consulte esta documentação
3. Entre em contato com o administrador do sistema

---

**Versão:** 1.0.0  
**Data:** Outubro 2025  
**Autor:** Sistema SVM Business





