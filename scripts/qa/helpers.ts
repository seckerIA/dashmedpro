// =====================================================
// QA Test Helpers — Doctor Strange
// Assertions, logging, reporting utilities
// =====================================================

import { supabaseAdmin } from './config.js';

// =====================================================
// Types
// =====================================================

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

export interface FlowResult {
  flowName: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  duration: number;
}

// =====================================================
// Assertions
// =====================================================

export function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

export function assertNotNull<T>(value: T | null | undefined, label: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`${label}: expected non-null value, got ${value}`);
  }
}

export function assertGreaterThan(actual: number, threshold: number, label: string): void {
  if (actual <= threshold) {
    throw new Error(`${label}: expected > ${threshold}, got ${actual}`);
  }
}

export function assertIncludes<T>(array: T[], item: T, label: string): void {
  if (!array.includes(item)) {
    throw new Error(`${label}: expected array to include ${JSON.stringify(item)}, got ${JSON.stringify(array)}`);
  }
}

// =====================================================
// Database Assertions
// =====================================================

export async function assertRowExists(
  table: string,
  filters: Record<string, any>,
  label: string
): Promise<any> {
  let query = supabaseAdmin.from(table).select('*');
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }
  const { data, error } = await query.limit(1).single();

  if (error || !data) {
    throw new Error(
      `${label}: expected row in "${table}" with ${JSON.stringify(filters)}, but not found. Error: ${error?.message ?? 'no data'}`
    );
  }
  return data;
}

export async function assertRowNotExists(
  table: string,
  filters: Record<string, any>,
  label: string
): Promise<void> {
  let query = supabaseAdmin.from(table).select('id');
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }
  const { data } = await query.limit(1);

  if (data && data.length > 0) {
    throw new Error(
      `${label}: expected NO row in "${table}" with ${JSON.stringify(filters)}, but found ${data.length}`
    );
  }
}

export async function assertCount(
  table: string,
  filters: Record<string, any>,
  expected: number,
  label: string
): Promise<void> {
  let query = supabaseAdmin.from(table).select('id', { count: 'exact', head: true });
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }
  const { count, error } = await query;

  if (error) {
    throw new Error(`${label}: query error — ${error.message}`);
  }
  if (count !== expected) {
    throw new Error(`${label}: expected ${expected} rows in "${table}", got ${count}`);
  }
}

export async function assertRowLike(
  table: string,
  column: string,
  pattern: string,
  label: string
): Promise<any> {
  const { data, error } = await supabaseAdmin
    .from(table)
    .select('*')
    .like(column, pattern)
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error(
      `${label}: expected row in "${table}" where ${column} LIKE '${pattern}', not found. Error: ${error?.message ?? 'no data'}`
    );
  }
  return data;
}

// =====================================================
// Logging
// =====================================================

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
};

export function logStep(step: number, message: string): void {
  console.log(`  ${COLORS.cyan}[STEP ${step}]${COLORS.reset} ${message}`);
}

export function logPass(testName: string): void {
  console.log(`  ${COLORS.green}[PASS]${COLORS.reset} ${testName}`);
}

export function logFail(testName: string, error: string): void {
  console.log(`  ${COLORS.red}[FAIL]${COLORS.reset} ${testName}`);
  console.log(`         ${COLORS.dim}${error}${COLORS.reset}`);
}

export function logSkip(testName: string, reason: string): void {
  console.log(`  ${COLORS.yellow}[SKIP]${COLORS.reset} ${testName} — ${reason}`);
}

export function logInfo(message: string): void {
  console.log(`  ${COLORS.dim}[INFO]${COLORS.reset} ${message}`);
}

export function logFlowHeader(flowName: string): void {
  console.log('');
  console.log(`${COLORS.bright}${COLORS.blue}========================================${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.blue}  ${flowName}${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.blue}========================================${COLORS.reset}`);
}

// =====================================================
// Test Runner
// =====================================================

export async function runTest(
  name: string,
  fn: () => Promise<void>
): Promise<TestResult> {
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    logPass(name);
    return { name, passed: true, duration };
  } catch (err: any) {
    const duration = Date.now() - start;
    const errorMsg = err?.message ?? String(err);
    logFail(name, errorMsg);
    return { name, passed: false, error: errorMsg, duration };
  }
}

// =====================================================
// Report
// =====================================================

export function reportResults(flows: FlowResult[]): void {
  console.log('');
  console.log(`${COLORS.bright}========================================`);
  console.log(`  DOCTOR STRANGE — QA REPORT`);
  console.log(`========================================${COLORS.reset}`);
  console.log('');

  let totalPassed = 0;
  let totalFailed = 0;

  for (const flow of flows) {
    const icon = flow.failed === 0 ? `${COLORS.green}✓` : `${COLORS.red}✗`;
    const stats = `${flow.passed}/${flow.tests.length} passed`;
    const time = `${flow.duration}ms`;
    console.log(`  ${icon} ${flow.flowName}${COLORS.reset} — ${stats} (${time})`);

    for (const test of flow.tests.filter(t => !t.passed)) {
      console.log(`    ${COLORS.red}↳ FAIL: ${test.name}${COLORS.reset}`);
      console.log(`      ${COLORS.dim}${test.error}${COLORS.reset}`);
    }

    totalPassed += flow.passed;
    totalFailed += flow.failed;
  }

  const total = totalPassed + totalFailed;
  console.log('');

  if (totalFailed === 0) {
    console.log(`${COLORS.bgGreen}${COLORS.bright}  ALL ${total} TESTS PASSED  ${COLORS.reset}`);
  } else {
    console.log(`${COLORS.bgRed}${COLORS.bright}  ${totalFailed}/${total} TESTS FAILED  ${COLORS.reset}`);
  }

  console.log('');
}

export function buildFlowResult(
  flowName: string,
  tests: TestResult[],
  startTime: number
): FlowResult {
  return {
    flowName,
    tests,
    passed: tests.filter(t => t.passed).length,
    failed: tests.filter(t => !t.passed).length,
    duration: Date.now() - startTime,
  };
}

// =====================================================
// Utilities
// =====================================================

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
