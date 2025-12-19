/**
 * Script de Verificação do Projeto Supabase
 * Verifica se todas as configurações estão apontando para o projeto correto
 */

const fs = require('fs');
const path = require('path');

const EXPECTED_PROJECT_REF = 'adzaqkduxnpckbcuqpmg';
const EXPECTED_URL = 'https://adzaqkduxnpckbcuqpmg.supabase.co';
const OLD_PROJECT_REFS = ['rpcixpbmtpyrnzlsuuus', 'npcgtjrgxxrhvrptkzip'];

let errors = [];
let warnings = [];
let success = [];

function checkFile(filePath, content) {
  const fileName = path.basename(filePath);
  
  // Verificar se contém referências ao projeto antigo
  OLD_PROJECT_REFS.forEach((oldRef) => {
    if (content.includes(oldRef)) {
      errors.push(`❌ ${filePath}: Contém referência ao projeto antigo "${oldRef}"`);
    }
  });

  // Verificar se contém referências ao projeto correto
  if (content.includes(EXPECTED_PROJECT_REF) || content.includes(EXPECTED_URL)) {
    success.push(`✅ ${filePath}: Configurado corretamente`);
  }

  // Verificar URLs hardcoded
  const urlPattern = /https?:\/\/[a-z0-9]+\.supabase\.co/g;
  const urls = content.match(urlPattern);
  if (urls) {
    urls.forEach((url) => {
      if (!url.includes(EXPECTED_PROJECT_REF)) {
        errors.push(`❌ ${filePath}: URL incorreta encontrada: ${url}`);
      }
    });
  }

  // Verificar project refs hardcoded
  const refPattern = /['"]([a-z0-9]{20})['"]/g;
  let match;
  while ((match = refPattern.exec(content)) !== null) {
    const ref = match[1];
    if (ref.length === 20 && ref !== EXPECTED_PROJECT_REF && !OLD_PROJECT_REFS.includes(ref)) {
      warnings.push(`⚠️ ${filePath}: Possível project ref encontrado: ${ref}`);
    }
  }
}

function scanDirectory(dir, extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.toml', '.sql']) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Ignorar node_modules, .git, etc
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist' && file !== 'build') {
        scanDirectory(filePath, extensions);
      }
    } else if (extensions.some((ext) => file.endsWith(ext))) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        checkFile(filePath, content);
      } catch (e) {
        warnings.push(`⚠️ ${filePath}: Erro ao ler arquivo: ${e.message}`);
      }
    }
  });
}

console.log('🔍 Verificando configuração do Supabase...\n');
console.log(`Projeto esperado: ${EXPECTED_PROJECT_REF}`);
console.log(`URL esperada: ${EXPECTED_URL}\n`);

// Escanear diretórios relevantes
const rootDir = path.join(__dirname, '..');
scanDirectory(path.join(rootDir, 'src'));
scanDirectory(path.join(rootDir, 'supabase'));
scanDirectory(path.join(rootDir, 'scripts'));

// Verificar arquivos específicos
const criticalFiles = [
  'src/integrations/supabase/client.ts',
  'supabase/config.toml',
  'src/hooks/useFileUpload.tsx',
];

criticalFiles.forEach((file) => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    checkFile(file, content);
  } else {
    warnings.push(`⚠️ Arquivo crítico não encontrado: ${file}`);
  }
});

// Relatório
console.log('\n📊 RELATÓRIO DE VERIFICAÇÃO\n');
console.log('='.repeat(60));

if (success.length > 0) {
  console.log(`\n✅ Arquivos corretos (${success.length}):`);
  success.slice(0, 10).forEach((msg) => console.log(`  ${msg}`));
  if (success.length > 10) {
    console.log(`  ... e mais ${success.length - 10} arquivos`);
  }
}

if (warnings.length > 0) {
  console.log(`\n⚠️ Avisos (${warnings.length}):`);
  warnings.forEach((msg) => console.log(`  ${msg}`));
}

if (errors.length > 0) {
  console.log(`\n❌ ERROS ENCONTRADOS (${errors.length}):`);
  errors.forEach((msg) => console.log(`  ${msg}`));
  console.log('\n❌ AÇÃO NECESSÁRIA: Corrija os erros antes de continuar!');
  process.exit(1);
} else {
  console.log('\n✅ Nenhum erro encontrado! Todas as configurações estão corretas.');
  process.exit(0);
}


