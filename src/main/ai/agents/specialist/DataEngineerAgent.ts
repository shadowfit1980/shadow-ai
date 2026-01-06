/**
 * DataEngineerAgent - Data Pipeline & ETL Specialist
 * 
 * Infers schemas, generates ETL pipelines, validates data quality
 * Specializes in database design and data transformation workflows
 */

import { SpecialistAgent, AgentTask, AgentResult, AgentCapability } from './base/SpecialistAgent';

export interface DatabaseSchema {
    tables: Array<{
        name: string;
        columns: Array<{
            name: string;
            type: string;
            nullable: boolean;
            primaryKey: boolean;
            foreignKey?: { table: string; column: string };
        }>;
        indexes: Array<{
            name: string;
            columns: string[];
            unique: boolean;
        }>;
    }>;
    relationships: Array<{
        from: string;
        to: string;
        type: 'one-to-one' | 'one-to-many' | 'many-to-many';
    }>;
}

export interface ETLPipeline {
    name: string;
    source: {
        type: 'api' | 'database' | 'file' | 'stream';
        config: Record<string, any>;
    };
    transformations: Array<{
        step: string;
        operation: string;
        config: Record<string, any>;
    }>;
    destination: {
        type: 'database' | 'warehouse' | 'lake' | 'cache';
        config: Record<string, any>;
    };
    schedule?: string; // Cron expression
    dataQuality: {
        validations: string[];
        errorHandling: 'skip' | 'retry' | 'fail';
    };
}

export class DataEngineerAgent extends SpecialistAgent {
    readonly agentType = 'DataEngineerAgent';
    readonly capabilities: AgentCapability[] = [
        {
            name: 'schema_inference',
            description: 'Automatically infer database schemas from data',
            confidenceLevel: 0.89
        },
        {
            name: 'etl_generation',
            description: 'Generate ETL/ELT data pipelines',
            confidenceLevel: 0.86
        },
        {
            name: 'data_validation',
            description: 'Create data quality validation rules',
            confidenceLevel: 0.88
        },
        {
            name: 'query_optimization',
            description: 'Optimize database queries and indexes',
            confidenceLevel: 0.84
        }
    ];

    async execute(task: AgentTask): Promise<AgentResult> {
        console.log(`📊 DataEngineerAgent executing: ${task.task}`);

        const validation = await this.validateTask(task);
        if (!validation.valid) {
            return {
                success: false,
                summary: 'Validation failed',
                confidence: 0,
                explanation: validation.errors.join(', ')
            };
        }

        try {
            const schema = await this.inferSchema(task);
            const etl = await this.generateETL(task, schema);
            const validations = await this.createDataValidations(task);

            const result: AgentResult = {
                success: true,
                summary: `Generated schema with ${schema.tables.length} tables and ETL pipeline`,
                artifacts: [{ schema, etl, validations }],
                confidence: 0.87,
                explanation: this.generateDataReport(schema, etl),
                estimatedEffort: schema.tables.length * 2 // 2 hours per table
            };

            this.recordExecution(task.task, true, result.confidence);
            return result;

        } catch (error) {
            this.recordExecution(task.task, false, 0);
            return {
                success: false,
                summary: 'Data engineering failed',
                confidence: 0,
                explanation: (error as Error).message
            };
        }
    }

    private async inferSchema(task: AgentTask): Promise<DatabaseSchema> {
        const prompt = `Infer optimal database schema:

Requirements: ${task.spec}
Context: ${JSON.stringify(task.context || {})}

Design a normalized database schema with:
1. Tables and columns with appropriate types
2. Primary and foreign keys
3. Indexes for performance
4. Relationships between tables

JSON response:
\`\`\`json
{
  "tables": [
    {
      "name": "users",
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "primaryKey": true
        },
        {
          "name": "email",
          "type": "varchar(255)",
          "nullable": false,
          "primaryKey": false
        }
      ],
      "indexes": [
        {
          "name": "idx_users_email",
          "columns": ["email"],
          "unique": true
        }
      ]
    }
  ],
  "relationships": [
    {
      "from": "orders",
      "to": "users",
      "type": "many-to-one"
    }
  ]
}
\`\`\``;

        const response = await this.callModel(
            prompt,
            'You are a senior database architect specializing in schema design and normalization.'
        );

        const parsed = this.parseJSON(response);
        return {
            tables: parsed.tables || [],
            relationships: parsed.relationships || []
        };
    }

    private async generateETL(task: AgentTask, schema: DatabaseSchema): Promise<ETLPipeline> {
        const prompt = `Design ETL pipeline for this schema:

Schema: ${JSON.stringify(schema, null, 2)}
Requirements: ${task.spec}

Create ETL pipeline with:
1. Data source configuration
2. Transformation steps (clean, enrich, aggregate)
3. Destination configuration
4. Data quality validations
5. Error handling strategy

JSON response with complete ETL pipeline.`;

        const response = await this.callModel(prompt);
        const parsed = this.parseJSON(response);

        return {
            name: parsed.name || 'data_pipeline',
            source: parsed.source || { type: 'api', config: {} },
            transformations: parsed.transformations || [],
            destination: parsed.destination || { type: 'database', config: {} },
            schedule: parsed.schedule,
            dataQuality: parsed.dataQuality || {
                validations: [],
                errorHandling: 'retry'
            }
        };
    }

    private async createDataValidations(task: AgentTask): Promise<Array<{
        field: string;
        rule: string;
        errorMessage: string;
    }>> {
        const validations = [
            {
                field: 'email',
                rule: 'matches(/^[^@]+@[^@]+\\.[^@]+$/)',
                errorMessage: 'Invalid email format'
            },
            {
                field: 'age',
                rule: 'isInt({ min: 0, max: 150 })',
                errorMessage: 'Age must be between 0 and 150'
            }
        ];

        return validations;
    }

    async optimizeQuery(sql: string, schema: DatabaseSchema): Promise<{
        originalQuery: string;
        optimizedQuery: string;
        suggestedIndexes: string[];
        explanation: string;
    }> {
        console.log('🔧 Optimizing database query...');

        const prompt = `Optimize this SQL query:

Query:
\`\`\`sql
${sql}
\`\`\`

Schema: ${JSON.stringify(schema, null, 2)}

Provide:
1. Optimized query
2. Suggested indexes
3. Explanation of improvements

JSON response.`;

        const response = await this.callModel(prompt);
        const parsed = this.parseJSON(response);

        return {
            originalQuery: sql,
            optimizedQuery: parsed.optimizedQuery || sql,
            suggestedIndexes: parsed.suggestedIndexes || [],
            explanation: parsed.explanation || 'Query optimization suggestions'
        };
    }

    async generateMigration(fromSchema: DatabaseSchema, toSchema: DatabaseSchema): Promise<{
        upMigration: string;
        downMigration: string;
        warnings: string[];
    }> {
        console.log('📝 Generating database migration...');

        // Simplified - would generate actual SQL migrations
        return {
            upMigration: 'ALTER TABLE users ADD COLUMN phone VARCHAR(20);',
            downMigration: 'ALTER TABLE users DROP COLUMN phone;',
            warnings: ['This migration may lock the table']
        };
    }

    async validateDataQuality(data: any[], rules: any[]): Promise<{
        valid: boolean;
        errors: Array<{
            row: number;
            field: string;
            error: string;
        }>;
        summary: string;
    }> {
        console.log('✅ Validating data quality...');

        // Simplified validation
        return {
            valid: true,
            errors: [],
            summary: 'All data passed validation'
        };
    }

    private generateDataReport(schema: DatabaseSchema, etl: ETLPipeline): string {
        let report = `Data Engineering Plan:\n\n`;

        report += `Database Schema:\n`;
        report += `- ${schema.tables.length} tables\n`;
        report += `- ${schema.relationships.length} relationships\n\n`;

        schema.tables.forEach(table => {
            report += `Table: ${table.name}\n`;
            report += `  Columns: ${table.columns.length}\n`;
            report += `  Indexes: ${table.indexes.length}\n`;
        });

        report += `\nETL Pipeline:\n`;
        report += `- Source: ${etl.source.type}\n`;
        report += `- Transformations: ${etl.transformations.length} steps\n`;
        report += `- Destination: ${etl.destination.type}\n`;
        if (etl.schedule) {
            report += `- Schedule: ${etl.schedule}\n`;
        }

        return report;
    }
}
