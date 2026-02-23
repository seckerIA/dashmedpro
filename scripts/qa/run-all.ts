// =====================================================
// Doctor Strange — QA Test Orchestrator
// Roda todos os 7 fluxos de integracao sequencialmente
// "Eu vi 14 milhoes de futuros... e so 1 sem bugs."
// =====================================================

import { authenticate, cleanup } from './config.js';
import { FlowResult, reportResults, logFlowHeader } from './helpers.js';

// Import all flows
import { runFlow1 } from './test-flow-1-crm-to-financial.js';
import { runFlow2 } from './test-flow-2-pipeline-transitions.js';
import { runFlow3 } from './test-flow-3-sinal-payment.js';
import { runFlow4 } from './test-flow-4-inventory-deduction.js';
import { runFlow5 } from './test-flow-5-medical-records.js';
import { runFlow6 } from './test-flow-6-whatsapp-auto-lead.js';
import { runFlow7 } from './test-flow-7-secretary-permissions.js';

async function main() {
  console.log('');
  console.log('\x1b[1m\x1b[35m╔══════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[1m\x1b[35m║  DOCTOR STRANGE — QA Integration Suite       ║\x1b[0m');
  console.log('\x1b[1m\x1b[35m║  "I went forward in time to view alternate   ║\x1b[0m');
  console.log('\x1b[1m\x1b[35m║   futures... to see all the possible bugs."  ║\x1b[0m');
  console.log('\x1b[1m\x1b[35m╚══════════════════════════════════════════════╝\x1b[0m');
  console.log('');

  // Authenticate
  await authenticate();

  const allResults: FlowResult[] = [];
  const startTime = Date.now();

  // Run all flows sequentially
  const flows = [
    { name: 'Flow 1', fn: runFlow1 },
    { name: 'Flow 2', fn: runFlow2 },
    { name: 'Flow 3', fn: runFlow3 },
    { name: 'Flow 4', fn: runFlow4 },
    { name: 'Flow 5', fn: runFlow5 },
    { name: 'Flow 6', fn: runFlow6 },
    { name: 'Flow 7', fn: runFlow7 },
  ];

  for (const flow of flows) {
    try {
      const result = await flow.fn();
      allResults.push(result);
    } catch (err: any) {
      console.error(`\n\x1b[31m[FATAL] ${flow.name} crashed: ${err.message}\x1b[0m`);
      allResults.push({
        flowName: flow.name,
        tests: [{ name: `${flow.name} execution`, passed: false, error: err.message }],
        passed: 0,
        failed: 1,
        duration: 0,
      });
    }
  }

  const totalDuration = Date.now() - startTime;

  // Report
  reportResults(allResults);

  console.log(`\x1b[2m  Total time: ${(totalDuration / 1000).toFixed(1)}s\x1b[0m`);
  console.log('');

  // Cleanup
  await cleanup();

  // Exit
  const totalFailed = allResults.reduce((sum, r) => sum + r.failed, 0);
  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('[FATAL]', err);
  cleanup().finally(() => process.exit(1));
});
