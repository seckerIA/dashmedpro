#!/bin/bash
# setup-hooks.sh
# Instala git hooks automaticamente
# 
# Como usar:
#   chmod +x setup-hooks.sh
#   ./setup-hooks.sh

set -e

echo "🔧 Instalando Git Hooks..."

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verifica se estamos em um repositório git
if [ ! -d .git ]; then
    echo -e "${RED}❌ Erro: Não é um repositório git!${NC}"
    exit 1
fi

# Cria pasta de hooks se não existir
mkdir -p .git/hooks

# Copia pre-commit hook
if [ -f scripts/git-hooks/pre-commit ]; then
    cp scripts/git-hooks/pre-commit .git/hooks/pre-commit
    chmod +x .git/hooks/pre-commit
    echo -e "${GREEN}✅ pre-commit hook instalado${NC}"
else
    echo -e "${YELLOW}⚠️  scripts/git-hooks/pre-commit não encontrado${NC}"
fi

# Copia outros hooks se existirem
for hook in scripts/git-hooks/*; do
    if [ -f "$hook" ]; then
        hook_name=$(basename "$hook")
        if [ "$hook_name" != "pre-commit" ]; then
            cp "$hook" ".git/hooks/$hook_name"
            chmod +x ".git/hooks/$hook_name"
            echo -e "${GREEN}✅ $hook_name hook instalado${NC}"
        fi
    fi
done

echo ""
echo -e "${GREEN}🎉 Git Hooks instalados com sucesso!${NC}"
echo ""
echo "Hooks ativos:"
ls -1 .git/hooks/ | grep -v ".sample"
