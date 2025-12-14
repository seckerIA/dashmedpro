# 🚀 Configuração MCP Supabase - Instruções

## ✅ O que foi configurado:

1. **Arquivo de configuração criado**: `.cursor/mcp.json`
2. **MCP Server do Supabase configurado** com suas credenciais
3. **MCP Server do GitHub configurado** com suas credenciais
4. **Project Ref**: `rpcixpbmtpyrnzlsuuus`
5. **Access Tokens**: Configurados (ocultos por segurança)

## 🔄 Próximos passos:

### 1. **REINICIE O CURSOR COMPLETAMENTE**
   - Feche todas as janelas do Cursor
   - Abra o Cursor novamente
   - Abra este projeto

### 2. **Verificar se os MCPs estão ativos**
   - Vá em `Configurações` > `Configurações do Cursor` > `MCP & Integrações`
   - Você deve ver os servidores "supabase" e "github" listados com status ativo (verde)

### 3. **Testar as integrações**
   - **Supabase**: "Liste todas as tabelas do meu banco Supabase"
   - **GitHub**: "Busque repositórios React TypeScript no GitHub"
   - A IA deve conseguir acessar diretamente sem precisar de comandos manuais

## 🎯 O que a IA agora pode fazer sozinha:

### **Supabase:**
- ✅ Listar tabelas e estruturas
- ✅ Criar migrations
- ✅ Configurar RLS policies
- ✅ Criar/editar functions
- ✅ Gerenciar storage
- ✅ Executar queries
- ✅ Configurar autenticação

### **GitHub:**
- ✅ Buscar repositórios por nome, linguagem, estrelas
- ✅ Ler código de qualquer repositório público
- ✅ Criar issues e pull requests
- ✅ Gerenciar branches e commits
- ✅ Acessar organizações e membros
- ✅ Buscar usuários e perfis

## 🔧 Se não funcionar:

1. Verifique se o Cursor foi reiniciado
2. Confirme se o MCP aparece nas configurações
3. Teste com um comando simples primeiro
4. Verifique se não há erros no console do Cursor

## 📝 Arquivo de configuração:

O arquivo `.cursor/mcp.json` contém:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase",
        "--project-ref=rpcixpbmtpyrnzlsuuus"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "seu_token_supabase"
      }
    },
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "seu_token_github"
      }
    }
  }
}
```

---
**🎉 Agora sua IA do Cursor deve funcionar igual ao Lovable!**

