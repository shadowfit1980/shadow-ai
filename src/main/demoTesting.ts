/**
 * Simple demo for Automated Testing Framework
 * Compile and run with: npm run build:main && node dist/main/main/demoTesting.js
 */

import { getTestingFramework } from './ai/testing';
import { TestGenerationOptions } from './ai/testing/types';

async function main(): Promise<void> {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  Shadow AI - Automated Testing Framework Demo             ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const framework = getTestingFramework();

    // Example code to test
    const sampleCode = `
function calculateTotal(items: any[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

function applyDiscount(total: number, discountPercent: number): number {
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error('Invalid discount percentage');
  }
  return total * (1 - discountPercent / 100);
}

class ShoppingCart {
  private items: any[] = [];
  
  addItem(item: any): void {
    this.items.push(item);
  }
  
  getTotal(): number {
    return calculateTotal(this.items);
  }
  
  checkout(discount: number = 0): number {
    const total = this.getTotal();
    return applyDiscount(total, discount);
  }
}
  `.trim();

    // Test generation options
    const options: TestGenerationOptions = {
        includeEdgeCases: true,
        includeMocks: true,
        coverageTarget: 90,
        generateFixtures: true,
        testStyle: 'unit'
    };

    try {
        // Step 1: Generate tests
        console.log('📝 Step 1: Generating tests...\n');
        const suite = await framework.generateTests(sampleCode, options);

        console.log(`\n✅ Generated test suite:`);
        console.log(`   Framework: ${suite.framework}`);
        console.log(`   Test cases: ${suite.testCases.length}`);
        console.log(`   Imports: ${suite.imports.length}`);
        console.log(`   Mocks: ${suite.mocks?.length || 0}`);
        console.log(`   Fixtures: ${suite.fixtures?.length || 0}`);

        // Display first test case
        if (suite.testCases.length > 0) {
            console.log(`\n📋 Sample test case:`);
            console.log(`   Name: ${suite.testCases[0].name}`);
            console.log(`   Description: ${suite.testCases[0].description}`);
            console.log(`\n   Code:`);
            console.log('   ' + suite.testCases[0].code.split('\n').join('\n   '));
        }

        // Step 2: Analyze test quality
        console.log('\n\n📊 Step 2: Analyzing test quality...\n');
        const analysis = await framework.analyzeTests(suite);

        console.log(`Quality Score: ${(analysis.quality * 100).toFixed(1)}%`);
        if (analysis.suggestions.length > 0) {
            console.log(`\nSuggestions:`);
            analysis.suggestions.forEach((s, i) => {
                console.log(`  ${i + 1}. ${s}`);
            });
        }

        console.log('\n\n✅ Demo complete!\n');

    } catch (error: any) {
        console.error('\n❌ Demo failed:', error.message);
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    main().catch(console.error);
}

export { main };
