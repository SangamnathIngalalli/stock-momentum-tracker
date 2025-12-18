
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

interface TestResult {
    testName: string;
    success: boolean;
    output: string;
    error?: string;
}

class SpecialistSequentialRunner {
    private tests = [
        {
            name: 'Bull Stock FII Buy',
            file: 'test/bullStockFiiBuy.spec.ts',
            description: 'Track momentum for Bull stock with FII Buy list',
        },
        {
            name: 'High ROIC Growth Momentum',
            file: 'test/highRoicGrowthMomentum.spec.ts',
            description: 'Track momentum for High ROIC Growth Momentum list',
        },
        {
            name: 'Quality Growth Pullback – Positional',
            file: 'test/qualityGrowthPullback.spec.ts',
            description: 'Track momentum for Quality Growth Pullback – Positional list',
        },
        {
            name: 'Quality Growth Institutional Support',
            file: 'test/qualityGrowthInstSupport.spec.ts',
            description: 'Track momentum for Quality Growth with Institutional Support list',
        },
    ];

    async runSequentialTests(): Promise<void> {
        console.log('🚀 Starting Specialist Momentum Trackers Pipeline\n');
        console.log('='.repeat(60));

        const results: TestResult[] = [];

        for (let i = 0; i < this.tests.length; i++) {
            const test = this.tests[i]!;

            console.log(`\n📋 Stage ${i + 1}/${this.tests.length}: ${test.name}`);
            console.log(`📝 Description: ${test.description}`);
            console.log(`📁 File: ${test.file}`);
            console.log('-'.repeat(50));

            try {
                // Using npx playwright test to run the specific file
                const { stdout, stderr } = await execAsync(`npx playwright test "${test.file}"`);

                results.push({ testName: test.name, success: true, output: stdout });
                console.log(`✅ ${test.name} completed successfully!`);
                console.log(stdout);

                if (i < this.tests.length - 1) {
                    console.log('⏳ Waiting 2 seconds before next stage...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            } catch (error: any) {
                const errorMessage = error.message || String(error);
                const stderr = error.stderr || '';

                results.push({ testName: test.name, success: false, output: stderr, error: errorMessage });

                console.log(`❌ ${test.name} failed!`);
                console.log(`Error: ${errorMessage}`);
                if (stderr) console.log(`Stderr: ${stderr}`);

                console.log('\n⚠️  Pipeline continuing to next stage...');
            }
        }

        this.printSummary(results);
    }

    private printSummary(results: TestResult[]): void {
        console.log('\n' + '='.repeat(60));
        console.log('📊 SPECIALIST PIPELINE EXECUTION SUMMARY');
        console.log('='.repeat(60));

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        console.log(`✅ Successful: ${successful}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📈 Success Rate: ${((successful / results.length) * 100).toFixed(1)}%`);

        console.log('\n📋 Detailed Results:');
        results.forEach((result, index) => {
            const status = result.success ? '✅' : '❌';
            console.log(`${status} Stage ${index + 1}: ${result.testName}`);
            if (!result.success && result.error) {
                console.log(`   Error: ${result.error}`);
            }
        });

        if (successful === results.length) {
            console.log('\n🎉 All specialist trackers completed successfully!');
        } else {
            console.log('\n⚠️  Some specialist trackers failed. Please check the errors above.');
        }
    }
}

async function main() {
    const runner = new SpecialistSequentialRunner();
    await runner.runSequentialTests();
}

main().catch(console.error);
