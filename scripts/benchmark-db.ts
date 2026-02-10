#!/usr/bin/env tsx
/**
 * Database Connection Benchmark
 *
 * Compares Prisma Accelerate vs Direct PostgreSQL connection performance.
 * Run with: npx tsx scripts/benchmark-db.ts
 */

import { prisma } from '../lib/prisma.js';
import { prismaDirect } from '../lib/prisma-direct.js';

interface BenchmarkResult {
  name: string;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  p50: number;
  p95: number;
  p99: number;
}

const ITERATIONS = 50;
const WARMUP_ROUNDS = 5;

// Simulate auth() callback query - the most common query in the app
async function authQuery(prismaClient: any) {
  return await prismaClient.user.findFirst({
    select: {
      id: true,
      role: true,
      isBanned: true,
      username: true,
      image: true,
    },
  });
}

function calculatePercentiles(times: number[]): { p50: number; p95: number; p99: number } {
  const sorted = [...times].sort((a, b) => a - b);
  return {
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
  };
}

async function benchmark(name: string, prismaClient: any): Promise<BenchmarkResult> {
  console.log(`\n🔍 Benchmarking: ${name}`);
  console.log(`   Warmup (${WARMUP_ROUNDS} rounds)...`);

  // Warmup
  for (let i = 0; i < WARMUP_ROUNDS; i++) {
    await authQuery(prismaClient);
  }

  console.log(`   Running ${ITERATIONS} queries...`);

  const times: number[] = [];

  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now();
    await authQuery(prismaClient);
    const end = performance.now();
    times.push(end - start);

    // Progress indicator every 10 queries
    if ((i + 1) % 10 === 0) {
      process.stdout.write(`   Progress: ${i + 1}/${ITERATIONS}\r`);
    }
  }

  console.log(`   Progress: ${ITERATIONS}/${ITERATIONS} ✅`);

  const totalTime = times.reduce((sum, t) => sum + t, 0);
  const avgTime = totalTime / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const { p50, p95, p99 } = calculatePercentiles(times);

  return {
    name,
    totalTime,
    avgTime,
    minTime,
    maxTime,
    p50,
    p95,
    p99,
  };
}

function formatMs(ms: number): string {
  return `${ms.toFixed(2)}ms`;
}

function printResults(results: BenchmarkResult[]) {
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 BENCHMARK RESULTS');
  console.log('='.repeat(80));

  results.forEach((result) => {
    console.log(`\n🔹 ${result.name}`);
    console.log('─'.repeat(40));
    console.log(`   Total Time:    ${formatMs(result.totalTime)}`);
    console.log(`   Average:       ${formatMs(result.avgTime)}`);
    console.log(`   Min:           ${formatMs(result.minTime)}`);
    console.log(`   Max:           ${formatMs(result.maxTime)}`);
    console.log(`   P50 (Median):  ${formatMs(result.p50)}`);
    console.log(`   P95:           ${formatMs(result.p95)}`);
    console.log(`   P99:           ${formatMs(result.p99)}`);
  });

  // Comparison
  if (results.length === 2) {
    const [accelerate, direct] = results;
    const speedup = accelerate.avgTime / direct.avgTime;
    const improvement = ((accelerate.avgTime - direct.avgTime) / accelerate.avgTime) * 100;

    console.log('\n' + '='.repeat(80));
    console.log('📈 COMPARISON');
    console.log('='.repeat(80));
    console.log(`   Speedup:         ${speedup.toFixed(2)}x`);
    console.log(`   Improvement:     ${improvement.toFixed(1)}%`);

    if (speedup >= 2) {
      console.log(`   ✅ Direct connection is 2x+ faster - RECOMMENDED for production`);
    } else if (speedup >= 1.5) {
      console.log(`   ⚠️  Direct connection is noticeably faster - Consider migration`);
    } else {
      console.log(`   ℹ️  Direct connection is not significantly faster - Keep Accelerate`);
    }

    // TTFB Impact Calculation
    const authCallsPerPage = 2; // proxy.ts + Navbar.tsx
    const worstCaseTtfbImprovement = (accelerate.avgTime - direct.avgTime) * authCallsPerPage;
    console.log(`\n   Estimated TTFB Improvement (worst case with 2 auth calls): ${formatMs(worstCaseTtfbImprovement)}`);
  }

  console.log('\n' + '='.repeat(80));
}

async function main() {
  console.log('🚀 Database Connection Benchmark');
  console.log('='.repeat(80));
  console.log(`   Iterations: ${ITERATIONS}`);
  console.log(`   Warmup: ${WARMUP_ROUNDS} rounds`);
  console.log(`   Query: Auth-style user lookup (findFirst with select)`);

  const results: BenchmarkResult[] = [];

  try {
    // Check what connection type we're using
    const dbUrl = process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL || '';
    const isAccelerate = dbUrl.includes('prisma.io') || dbUrl.includes('accelerate.prisma-data.net');

    const hasDirectUrl = process.env.DIRECT_URL || process.env.DIRECT_DATABASE_URL;

    if (isAccelerate && !hasDirectUrl) {
      console.log('\n⚠️  WARNING: No direct connection URL found!');
      console.log('   Set DIRECT_URL in your .env.local to test direct PostgreSQL connection.');
      console.log('   Example:');
      console.log('   DIRECT_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"');
      console.log('\n   Running Accelerate benchmark only...\n');
    }

    // Benchmark 1: Current connection (likely Accelerate)
    const currentConnectionName = isAccelerate ? 'Prisma Accelerate (via db.prisma.io)' : 'Direct Connection';
    results.push(await benchmark(currentConnectionName, prisma));

    // Benchmark 2: Direct connection (if available)
    if (process.env.DIRECT_DATABASE_URL) {
      results.push(await benchmark('Direct PostgreSQL', prismaDirect));
    }

    printResults(results);

  } catch (error) {
    console.error('\n❌ Benchmark failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    if (process.env.DIRECT_DATABASE_URL) {
      await prismaDirect.$disconnect();
    }
  }
}

main();
