#!/usr/bin/env node
/**
 * UserPromptSubmit hook — Injeta contexto SDD APENAS quando relevante.
 * Lê o prompt e só injeta para tarefas de feature/refactor/implementação.
 *
 * Exit 0 com JSON no stdout: { hookSpecificOutput: { hookEventName, additionalContext } }
 * Exit 0 sem stdout: segue normal (sem injeção).
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const SPECS_DIR = path.join(PROJECT_ROOT, 'specs');
const CONSTITUTION = path.join(PROJECT_ROOT, '.specify', 'memory', 'constitution.md');

// Palavras-chave que sinalizam tarefa de desenvolvimento (PT + EN)
const TASK_KEYWORDS = [
  // feature / nova funcionalidade
  'feature', 'funcionalidade', 'modulo', 'módulo', 'modulo novo', 'nova', 'novo',
  'adiciona', 'adicionar', 'add ', 'criar', 'cria ', 'crie ', 'create ', 'build ',
  'implementa', 'implementar', 'implement',
  // refactor / estrutura
  'refatora', 'refatorar', 'refactor', 'reestrutura', 'restructure',
  'migra', 'migrar', 'migrate', 'migration',
  // integração
  'integra', 'integrar', 'integrate', 'integração', 'integracao',
  // backend / banco
  'tabela', 'table', 'rls', 'schema', 'edge function', 'trigger', 'policy',
  // frontend / UI
  'componente', 'component', 'hook novo', 'página', 'pagina', 'page novo', 'screen',
  // bug (para lembrar do pipeline correto)
  'bug', 'erro', 'não funciona', 'nao funciona', 'fix ',
];

function isTaskPrompt(prompt) {
  if (!prompt || typeof prompt !== 'string') return false;
  const trimmed = prompt.trim();
  if (trimmed.length < 10) return false; // muito curto, provavelmente não é tarefa
  const lower = trimmed.toLowerCase();
  return TASK_KEYWORDS.some(kw => lower.includes(kw));
}

function listSpecs() {
  if (!fs.existsSync(SPECS_DIR)) return [];
  try {
    return fs.readdirSync(SPECS_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith('.'))
      .map(d => {
        const specPath = path.join(SPECS_DIR, d.name, 'spec.md');
        const planPath = path.join(SPECS_DIR, d.name, 'plan.md');
        const tasksPath = path.join(SPECS_DIR, d.name, 'tasks.md');
        return {
          name: d.name,
          hasSpec: fs.existsSync(specPath),
          hasPlan: fs.existsSync(planPath),
          hasTasks: fs.existsSync(tasksPath),
        };
      });
  } catch {
    return [];
  }
}

function buildContext() {
  const specs = listSpecs();
  const hasConstitution = fs.existsSync(CONSTITUTION);

  const lines = [
    '## SDD Context (auto-injected)',
    '',
    hasConstitution
      ? '- Constitution ativa: `.specify/memory/constitution.md`'
      : '- Constitution NAO encontrada — rodar `/speckit.constitution` para features novas',
  ];

  if (specs.length === 0) {
    lines.push('- Nenhuma spec em `specs/` ainda.');
  } else {
    lines.push(`- Specs existentes (${specs.length}):`);
    for (const s of specs) {
      const parts = [];
      if (s.hasSpec) parts.push('spec');
      if (s.hasPlan) parts.push('plan');
      if (s.hasTasks) parts.push('tasks');
      lines.push(`  - \`specs/${s.name}/\` [${parts.join(', ') || 'vazio'}]`);
    }
  }

  lines.push('');
  lines.push('**Auto-activation** (`.claude/CLAUDE.md`):');
  lines.push('- Feature nova / cross-module / toca RLS/banco/Edge Functions → SDD (`/speckit.specify` → `plan` → `tasks` → `implement`)');
  lines.push('- Bug fix isolado → Detective → Researcher → Fixer → Guardian');
  lines.push('- Ajuste < 3 linhas → Spider-Man direto');

  return lines.join('\n');
}

async function readStdin() {
  let input = '';
  try {
    for await (const chunk of process.stdin) input += chunk;
  } catch {
    // sem stdin, tudo bem
  }
  return input;
}

function extractPrompt(stdinRaw) {
  if (!stdinRaw) return '';
  try {
    const parsed = JSON.parse(stdinRaw);
    // Claude Code envia { prompt, session_id, cwd, ... }
    return parsed.prompt || parsed.user_prompt || '';
  } catch {
    // stdin não é JSON — assume que é o prompt direto
    return stdinRaw;
  }
}

async function main() {
  const stdinRaw = await readStdin();
  const prompt = extractPrompt(stdinRaw);

  if (!isTaskPrompt(prompt)) {
    // Prompt trivial ou conversacional — não injetar nada
    process.exit(0);
  }

  const additionalContext = buildContext();
  const payload = {
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext,
    },
  };

  process.stdout.write(JSON.stringify(payload));
  process.exit(0);
}

main().catch((err) => {
  console.error('[sdd-context hook error]', err.message);
  process.exit(0); // nunca bloquear o prompt
});
