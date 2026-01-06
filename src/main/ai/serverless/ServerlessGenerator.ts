/**
 * Serverless Generator
 * 
 * Generate serverless function code for AWS Lambda,
 * Google Cloud Functions, Azure Functions, and Vercel.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type ServerlessProvider = 'aws-lambda' | 'google-cloud' | 'azure' | 'vercel';
export type Runtime = 'nodejs18' | 'nodejs20' | 'python3.9' | 'python3.11';

export interface FunctionConfig {
    name: string;
    runtime: Runtime;
    handler: string;
    memory?: number;
    timeout?: number;
    environment?: Record<string, string>;
}

// ============================================================================
// SERVERLESS GENERATOR
// ============================================================================

export class ServerlessGenerator extends EventEmitter {
    private static instance: ServerlessGenerator;

    private constructor() {
        super();
    }

    static getInstance(): ServerlessGenerator {
        if (!ServerlessGenerator.instance) {
            ServerlessGenerator.instance = new ServerlessGenerator();
        }
        return ServerlessGenerator.instance;
    }

    // ========================================================================
    // AWS LAMBDA
    // ========================================================================

    generateLambdaFunction(config: FunctionConfig): string {
        return `// ${config.name} Lambda Function

${config.runtime.startsWith('nodejs') ? `
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    console.log('Event:', JSON.stringify(event, null, 2));
    console.log('Context:', JSON.stringify(context, null, 2));
    
    try {
        // Parse request body
        const body = event.body ? JSON.parse(event.body) : {};
        
        // Your business logic here
        const result = {
            message: 'Function executed successfully',
            input: body,
            requestId: context.requestId,
        };
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(result),
        };
    } catch (error) {
        console.error('Error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: (error as Error).message,
            }),
        };
    }
};
` : `
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    logger.info(f"Event: {json.dumps(event)}")
    
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Your business logic here
        result = {
            'message': 'Function executed successfully',
            'input': body,
            'requestId': context.request_id
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result)
        }
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
`}`;
    }

    generateLambdaConfig(config: FunctionConfig): string {
        return `# AWS SAM Template

AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  ${config.name}Function:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: ${config.name}
      Runtime: ${this.mapRuntime(config.runtime)}
      Handler: ${config.handler}
      MemorySize: ${config.memory || 128}
      Timeout: ${config.timeout || 30}
      Environment:
        Variables:
${Object.entries(config.environment || {}).map(([k, v]) => `          ${k}: ${v}`).join('\n')}
      Events:
        ApiEvent:
          Type: Api
          Properties:
            Path: /${config.name.toLowerCase()}
            Method: POST

Outputs:
  ApiUrl:
    Description: API Gateway endpoint URL
    Value: !Sub 'https://\${ServerlessRestApi}.execute-api.\${AWS::Region}.amazonaws.com/Prod/${config.name.toLowerCase()}'
`;
    }

    // ========================================================================
    // GOOGLE CLOUD FUNCTIONS
    // ========================================================================

    generateCloudFunction(config: FunctionConfig): string {
        return `// ${config.name} Cloud Function

${config.runtime.startsWith('nodejs') ? `
import { Request, Response } from '@google-cloud/functions-framework';

export const ${config.name.toLowerCase()} = async (req: Request, res: Response) => {
    console.log('Request:', req.method, req.url);
    console.log('Body:', req.body);
    
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'GET, POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.status(204).send('');
        return;
    }
    
    try {
        const body = req.body || {};
        
        // Your business logic here
        const result = {
            message: 'Function executed successfully',
            input: body,
        };
        
        res.status(200).json(result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: (error as Error).message,
        });
    }
};
` : `
import functions_framework
import logging

@functions_framework.http
def ${config.name.toLowerCase()}(request):
    logging.info(f"Request: {request.method} {request.url}")
    
    # Set CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST',
        'Access-Control-Allow-Headers': 'Content-Type'
    }
    
    if request.method == 'OPTIONS':
        return ('', 204, headers)
    
    try:
        request_json = request.get_json(silent=True)
        
        # Your business logic here
        result = {
            'message': 'Function executed successfully',
            'input': request_json or {}
        }
        
        return (result, 200, headers)
    except Exception as e:
        logging.error(f"Error: {str(e)}")
        return ({
            'error': 'Internal server error',
            'message': str(e)
        }, 500, headers)
`}`;
    }

    // ========================================================================
    // VERCEL FUNCTIONS
    // ========================================================================

    generateVercelFunction(config: FunctionConfig): string {
        return `// api/${config.name.toLowerCase()}.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        const body = req.body || {};
        
        // Your business logic here
        const result = {
            message: 'Function executed successfully',
            input: body,
        };
        
        res.status(200).json(result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: (error as Error).message,
        });
    }
}
`;
    }

    // ========================================================================
    // SERVERLESS FRAMEWORK CONFIG
    // ========================================================================

    generateServerlessConfig(functions: FunctionConfig[]): string {
        return `# serverless.yml

service: ${functions[0]?.name.toLowerCase() || 'my-service'}

provider:
  name: aws
  runtime: ${this.mapRuntime(functions[0]?.runtime || 'nodejs18')}
  stage: \${opt:stage, 'dev'}
  region: \${opt:region, 'us-east-1'}
  memorySize: 256
  timeout: 30
  environment:
    STAGE: \${self:provider.stage}
    
functions:
${functions.map(fn => `  ${fn.name}:
    handler: ${fn.handler}
    events:
      - http:
          path: ${fn.name.toLowerCase()}
          method: post
          cors: true
    environment:
${Object.entries(fn.environment || {}).map(([k, v]) => `      ${k}: ${v}`).join('\n')}`).join('\n\n')}

plugins:
  - serverless-offline
  - serverless-plugin-typescript
`;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private mapRuntime(runtime: Runtime): string {
        const runtimeMap: Record<Runtime, string> = {
            'nodejs18': 'nodejs18.x',
            'nodejs20': 'nodejs20.x',
            'python3.9': 'python3.9',
            'python3.11': 'python3.11',
        };
        return runtimeMap[runtime] || 'nodejs18.x';
    }
}

export const serverlessGenerator = ServerlessGenerator.getInstance();
