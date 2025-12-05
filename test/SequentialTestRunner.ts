import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface TestResult {
    testName: string;
    success: boolean;
    output: string;
    error?: string;
}

class SequentialTestRunner {
    private tests = [
        {
            name: 'Fix My_Track Header',
            file: 'test/fixMyTrackHeader.spec.ts',
            description: 'Validate and fix My_Track.csv header if corrupted (e.g., from Excel sorting)',
        },
        {
            name: 'Track 52-Week Highs',
            file: 'test/52WeekStocksTrack.spec.ts',
            description: 'Add new stocks hitting 52-week high to the master list',
        },
        {
            name: 'Update Current Prices',
            file: 'test/updateCurrentPrice.spec.ts',
            description: 'Update current prices for all tracked stocks',
        },
        {
            name: 'Sort My_Track',
            file: 'test/sortMyTrack.spec.ts',
            description: 'Sort My_Track.xlsx by PcntChange (ascending)',
        },
    ];

    async runSequentialTests(): Promise<void> {
        console.log('🚀 Starting Sequential Stock-Market Pipeline\n');
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

                // Playwright might output warnings to stderr, so we only fail on actual errors if needed.
                // However, usually if the exit code is 0, execAsync won't throw.
                // If exit code is non-zero, it throws.

                results.push({ testName: test.name, success: true, output: stdout });
                console.log(`✅ ${test.name} completed successfully!`);
                console.log(stdout); // Optional: print the output

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

                console.log('\n⚠️  Pipeline stopped due to failure.');
                break;
            }
        }

        this.printSummary(results);
    }

    private printSummary(results: TestResult[]): void {
        console.log('\n' + '='.repeat(60));
        console.log('📊 PIPELINE EXECUTION SUMMARY');
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
            console.log('\n🎉 All stages completed successfully!');
        } else {
            console.log('\n⚠️  Some stages failed. Please check the errors above.');
        }
    }
}

async function main() {
    const runner = new SequentialTestRunner();
    await runner.runSequentialTests();
}

main().catch(console.error);
