import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import { SnsService } from './sns-service';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export class LambdaSQSService extends Construct {
    // SNS Topic
    constructor(scope: Construct, id: string) {
        super(scope, id);

        // SQS Queue and DLQ
        const dlq = new sqs.Queue(this, 'CommunicationsDLQ');
        const queue = new sqs.Queue(this, 'CommunicationsQueue', {
        visibilityTimeout: cdk.Duration.seconds(300),
        deadLetterQueue: {
            queue: dlq,
            maxReceiveCount: 5,
        },
        });

        // Add SQS Queues as subscriptions
        const snsService = new SnsService (this, "communicationsManagerSnsService")
        snsService.addSqsSubscription(queue);

        // VPC for Lambda
        const vpc = new ec2.Vpc(this, 'LambdaVPC');

        // Lambda Function
        const fn = new lambda.Function(this, 'CommunicationsHandler', {
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromAsset('src/lambda'),
        handler: 'handler.handler',
        vpc,
        environment: {
            QUEUE_URL: queue.queueUrl,
        },
        reservedConcurrentExecutions: 10,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(300),
        });

        // Grant Lambda permissions to read from SQS
        queue.grantConsumeMessages(fn);

        // Use SqsEventSource to trigger Lambda from SQS
        fn.addEventSource(new SqsEventSource(queue, {
        batchSize: 1,
        }));

        // CloudWatch Logs for Lambda
        const logGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
        logGroupName: `/aws/lambda/${fn.functionName}`,
        retention: logs.RetentionDays.ONE_WEEK,
        });

        new cloudwatch.Alarm(this, 'SQSQueueAlarm', {
        metric: queue.metricApproximateAgeOfOldestMessage(),
        threshold: 300,
        evaluationPeriods: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        });

        new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
        metric: fn.metricErrors(),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        });
    }
}