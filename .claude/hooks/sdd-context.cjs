#!/usr/bin/env node
/**
 * UserPromptSubmit hook — Injeta contexto SDD em todo prompt.
 * Lista specs existentes e lembra o agente do fluxo Spec-Driven Development.
 *
 * Claude Code passa o prompt via stdin (JSON) e espera:
 *  - exit 0 + stdout JSON { "additionalContext": "..." } para adicionar contexto
 *  - exit 0 sem stdout para seguir normal
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const SPECS_DIR = path.join(PROJECT_ROOT, 'specs');
const CONSTITUTION = path.join(PROJECT_ROOT, '.specify', 'memory', 'constitution.md');

function listSpecs() {
  if (!fs.existsSync(SPECS_DIR)) return [];
  try {
    return fs.readdirSync(SPECS_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
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
      ? '- Constitution ativa: `.specify/memory/constitution.md` (consultar antes de specify/plan/implement)'
      : '- Constitution NAO encontrada — rodar `/speckit.constitution` se iniciar feature nova',
  ];

  if (specs.length === 0) {
    lines.push('- Nenhuma spec em `specs/` ainda. Para feature nova: `/speckit.specify`');
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
  lines.push('**Regras de auto-activation** (`.claude/CLAUDE.md`):');
  lines.push('- Feature nova / cross-module / toca RLS/banco/Edge Functions → fluxo SDD (`/speckit.specify` → `/speckit.plan` → `/speckit.tasks` → `/speckit.implement`)');
  lines.push('- Bug fix isolado → pipeline Detective → Researcher → Fixer → Guardian (sem SDD)');
  lines.push('- Ajuste cirurgico < 3 linhas → Spider-Man direto');

  return lines.join('\n');
}

async function main() {
  // Ler stdin (ignoramos o conteúdo — só precisamos injetar contexto)
  let input = '';
  try {
    for await (const chunk of process.stdin) input += chunk;
  } catch {
    // sem stdin, tudo bem
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
  process.exit(0); // não bloquear o prompt em caso de erro
});
