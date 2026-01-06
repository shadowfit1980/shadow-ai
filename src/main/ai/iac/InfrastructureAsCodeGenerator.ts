/**
 * Infrastructure as Code Generator
 * 
 * Generate Terraform, AWS CDK, Pulumi, and CloudFormation
 * configurations.
 */

import { EventEmitter } from 'events';

// ============================================================================
// INFRASTRUCTURE AS CODE GENERATOR
// ============================================================================

export class InfrastructureAsCodeGenerator extends EventEmitter {
    private static instance: InfrastructureAsCodeGenerator;

    private constructor() {
        super();
    }

    static getInstance(): InfrastructureAsCodeGenerator {
        if (!InfrastructureAsCodeGenerator.instance) {
            InfrastructureAsCodeGenerator.instance = new InfrastructureAsCodeGenerator();
        }
        return InfrastructureAsCodeGenerator.instance;
    }

    // ========================================================================
    // TERRAFORM
    // ========================================================================

    generateTerraformAWS(): string {
        return `# ============================================================================
# AWS INFRASTRUCTURE WITH TERRAFORM
# ============================================================================

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-lock"
  }
}

provider "aws" {
  region = var.aws_region
}

# ============================================================================
# VARIABLES
# ============================================================================

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "app_name" {
  description = "Application name"
  type        = string
}

# ============================================================================
# VPC
# ============================================================================

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "\${var.app_name}-vpc"
    Environment = var.environment
  }
}

resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.\${count.index}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "\${var.app_name}-public-\${count.index + 1}"
  }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.\${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "\${var.app_name}-private-\${count.index + 1}"
  }
}

# ============================================================================
# RDS
# ============================================================================

resource "aws_db_instance" "main" {
  identifier        = "\${var.app_name}-db"
  engine            = "postgres"
  engine_version    = "15.3"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  storage_encrypted = true

  db_name  = var.app_name
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  skip_final_snapshot     = false
  final_snapshot_identifier = "\${var.app_name}-final-snapshot"

  tags = {
    Name = "\${var.app_name}-db"
    Environment = var.environment
  }
}

# ============================================================================
# ECS CLUSTER
# ============================================================================

resource "aws_ecs_cluster" "main" {
  name = "\${var.app_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_task_definition" "app" {
  family                   = var.app_name
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"

  container_definitions = jsonencode([{
    name  = var.app_name
    image = "\${var.ecr_repository}:latest"
    
    portMappings = [{
      containerPort = 3000
      protocol      = "tcp"
    }]

    environment = [
      { name = "NODE_ENV", value = var.environment },
      { name = "DATABASE_URL", value = "postgresql://..." }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/\${var.app_name}"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "vpc_id" {
  value = aws_vpc.main.id
}

output "db_endpoint" {
  value     = aws_db_instance.main.endpoint
  sensitive = true
}
`;
    }

    // ========================================================================
    // AWS CDK
    // ========================================================================

    generateAWSCDK(): string {
        return `import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

// ============================================================================
// AWS CDK STACK
// ============================================================================

export class AppStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // VPC
        const vpc = new ec2.Vpc(this, 'VPC', {
            maxAzs: 2,
            natGateways: 1,
        });

        // RDS Database
        const database = new rds.DatabaseInstance(this, 'Database', {
            engine: rds.DatabaseInstanceEngine.postgres({
                version: rds.PostgresEngineVersion.VER_15_3,
            }),
            vpc,
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            instanceType: ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MICRO
            ),
            allocatedStorage: 20,
            storageEncrypted: true,
            multiAz: false,
            deletionProtection: true,
            backupRetention: cdk.Duration.days(7),
        });

        // ECS Cluster
        const cluster = new ecs.Cluster(this, 'Cluster', {
            vpc,
            containerInsights: true,
        });

        // Fargate Service with ALB
        const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(
            this,
            'FargateService',
            {
                cluster,
                cpu: 512,
                memory Limit:1024,
                desiredCount: 2,
                taskImageOptions: {
                    image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
                    containerPort: 3000,
                    environment: {
                        NODE_ENV: 'production',
                        DATABASE_URL: \`postgresql://\${database.dbInstanceEndpointAddress}\`,
                    },
                },
            }
        );

        // Allow ECS to connect to RDS
        database.connections.allowFrom(
            fargateService.service,
            ec2.Port.tcp(5432)
        );

        // S3 Bucket
        const bucket = new s3.Bucket(this, 'AssetsBucket', {
            versioned: true,
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });

        // Outputs
        new cdk.CfnOutput(this, 'LoadBalancerDNS', {
            value: fargateService.loadBalancer.loadBalancerDnsName,
        });

        new cdk.CfnOutput(this, 'BucketName', {
            value: bucket.bucketName,
        });
    }
}

// ============================================================================
// APP
// ============================================================================

const app = new cdk.App();

new AppStack(app, 'ProductionStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
    tags: {
        Environment: 'production',
        Project: 'my-app',
    },
});

app.synth();
`;
    }

    // ========================================================================
    // PULUMI
    // ========================================================================

    generatePulumi(): string {
        return `import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';

// ============================================================================
// PULUMI INFRASTRUCTURE
// ============================================================================

const config = new pulumi.Config();
const environment = config.require('environment');

// VPC
const vpc = new awsx.ec2.Vpc('app-vpc', {
    cidrBlock: '10.0.0.0/16',
    numberOfAvailabilityZones: 2,
    natGateways: { strategy: 'Single' },
    tags: { Name: 'app-vpc', Environment: environment },
});

// Security Group
const dbSecurityGroup = new aws.ec2.SecurityGroup('db-sg', {
    vpcId: vpc.vpcId,
    ingress: [{
        protocol: 'tcp',
        fromPort: 5432,
        toPort: 5432,
        cidrBlocks: ['10.0.0.0/16'],
    }],
});

// RDS Instance
const dbSubnetGroup = new aws.rds.SubnetGroup('db-subnet-group', {
    subnetIds: vpc.privateSubnetIds,
});

const database = new aws.rds.Instance('postgres-db', {
    engine: 'postgres',
    engineVersion: '15.3',
    instanceClass: 'db.t3.micro',
    allocatedStorage: 20,
    storageEncrypted: true,
    dbName: 'myapp',
    username: config.requireSecret('dbUsername'),
    password: config.requireSecret('dbPassword'),
    dbSubnetGroupName: dbSubnetGroup.name,
    vpcSecurityGroupIds: [dbSecurityGroup.id],
    skipFinalSnapshot: false,
    finalSnapshotIdentifier: \`myapp-final-\${Date.now()}\`,
});

// ECS Cluster
const cluster = new aws.ecs.Cluster('app-cluster', {
    settings: [{
        name: 'containerInsights',
        value: 'enabled',
    }],
});

// ALB
const alb = new awsx.lb.ApplicationLoadBalancer('app-lb', {
    subnetIds: vpc.publicSubnetIds,
});

// Fargate Service
const service = new awsx.ecs.FargateService('app-service', {
    cluster: cluster.arn,
    assignPublicIp: false,
    desiredCount: 2,
    taskDefinitionArgs: {
        container: {
            image: 'my-app:latest',
            cpu: 512,
            memory: 1024,
            essential: true,
            portMappings: [{
                containerPort: 3000,
                targetGroup: alb.defaultTargetGroup,
            }],
            environment: [
                { name: 'NODE_ENV', value: environment },
                { name: 'DATABASE_URL', value: pulumi.interpolate\`postgresql://\${database.endpoint}\` },
            ],
        },
    },
});

// S3 Bucket
const bucket = new aws.s3.Bucket('assets-bucket', {
    acl: 'private',
    versioning: { enabled: true },
    serverSideEncryptionConfiguration: {
        rule: {
            applyServerSideEncryptionByDefault: {
                sseAlgorithm: 'AES256',
            },
        },
    },
});

// Exports
export const vpcId = vpc.vpcId;
export const albUrl = alb.loadBalancer.dnsName;
export const bucketName = bucket.id;
export const dbEndpoint = database.endpoint;
`;
    }

    // ========================================================================
    // KUBERNETES
    // ========================================================================

    generateKubernetes(): string {
        return `# ============================================================================
# KUBERNETES DEPLOYMENT
# ============================================================================

apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-deployment
  labels:
    app: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: app
        image: myapp:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: app-service
spec:
  type: LoadBalancer
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  app.conf: |
    server {
      listen 80;
      location / {
        proxy_pass http://app-service:3000;
      }
    }
`;
    }
}

export const infrastructureAsCodeGenerator = InfrastructureAsCodeGenerator.getInstance();
