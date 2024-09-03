import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import { SnsService } from './sns-service';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { createAlarm } from './alarms';

export class LambdaSQSService extends Construct {
    communicationsManagerQueName = 'communicationsManagerQueue';
    communicationsManagerDLQQueName = 'communicationsManagerDLQ'
    cmLambdaFunctionName = 'communicationsManagerHandler';

    // SNS Topic
    constructor(scope: Construct, id: string, props: any) {
        super(scope, id);

        // SQS Queue and DLQ
        const dlq = new sqs.Queue(this, this.communicationsManagerDLQQueName);
        const queue = new sqs.Queue(this, this.communicationsManagerQueName, {
        visibilityTimeout: cdk.Duration.seconds(300),
        deadLetterQueue: {
            queue: dlq,
            maxReceiveCount: 5,
        },
        });

        // Add SQS Queues as subscriptions
        const snsService = new SnsService (this, "communicationsManagerSnsService", props)
        snsService.addSqsSubscription(queue);

        // VPC for Lambda
        const vpc = new ec2.Vpc(this, 'LambdaVPC');

        // Lambda Function
        const fn = new lambda.Function(this, this.cmLambdaFunctionName, {
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
        const logGroup = new logs.LogGroup(this, 'lambdaLogGroup', {
        logGroupName: `/aws/lambda/${fn.functionName}`,
        retention: logs.RetentionDays.ONE_WEEK,
        });

        new cloudwatch.Alarm(this, 'sqsQueueAlarm', {
        metric: queue.metricApproximateAgeOfOldestMessage(),
        threshold: 300,
        evaluationPeriods: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        });

        new cloudwatch.Alarm(this, 'lambdaErrorAlarm', {
        metric: fn.metricErrors(),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        });

        var baseConfig = {
            serviceName: 'Lambda',
            resourceId: 'communicationsManagerHandler',
            namespace: 'AWS/Lambda',
            snsTopicArn: props.topicArn,
            statistic: 'Sum',
        };

        // setup alarms for SQS function
        baseConfig = {
            serviceName: 'SQS',
            resourceId: this.communicationsManagerQueName,
            namespace: 'AWS/SQS',
            snsTopicArn: props.topicArn,
            statistic: 'Maximum',
        };
    }

    public CreateSQSAlarms (baseConfig: any, cmalarmsManagerInstance: any) {
        createAlarm ({
            ...baseConfig,
            metricName: 'ApproximateAgeOfOldestMessage',
            threshold: 7200, // 2 hours in seconds
            period: 3600, // 1 hour
            evaluationPeriods: 2,
            comparisonOperator: 'GreaterThanThreshold',
            alarmName: `UnprocessedMessagesWarning-${this.communicationsManagerQueName}`,
            alarmDescription: 'Warning: Message not processed in 2 hours',
        }).then(() => {
            console.log(`UnprocessedMessagesWarning-${this.communicationsManagerQueName}` + ' Alarms setup successfully.');
        })
        .catch((error:Error) => {
            console.error('Error setting up alarms:', error);
        });

        createAlarm({
            ...baseConfig,
            metricName: 'ApproximateAgeOfOldestMessage',
            threshold: 28800, // 8 hours in seconds
            period: 3600, // 1 hour
            evaluationPeriods: 8,
            comparisonOperator: 'GreaterThanThreshold',
            alarmName: `UnprocessedMessagesCritical-${this.communicationsManagerQueName}`,
            alarmDescription: 'Critical: Message not processed in 8 hours',
        }).then(() => {
            console.log(`UnprocessedMessagesCritical-${this.communicationsManagerQueName}` + ' Alarms setup successfully.');
        })
        .catch((error:Error) => {
            console.error('Error setting up alarms:', error);
        });
    }

    public CreateLambdaAlarms (baseConfig: any) {
        // setup alarms for Lambda function

        createAlarm({
            ...baseConfig,
            metricName: 'Errors',
            threshold: 5,
            period: 1800, // 30 minutes
            evaluationPeriods: 1,
            comparisonOperator: 'GreaterThanThreshold',
            alarmName: `LambdaUnhandledExceptionInfo-${this.cmLambdaFunctionName}`,
            alarmDescription: 'Info: 5 unhandled exceptions in 30 minutes',
        }).then(() => {
            console.log(`LambdaUnhandledExceptionInfo-${this.cmLambdaFunctionName}`+ ' Alarms setup successfully.');
        })
        .catch((error:Error) => {
            console.error('Error setting up alarms:', error);
        });

        createAlarm({
            ...baseConfig,
            metricName: 'Errors',
            threshold: 10,
            period: 1800, // 30 minutes
            evaluationPeriods: 1,
            comparisonOperator: 'GreaterThanThreshold',
            alarmName: `LambdaUnhandledExceptionWarning-${this.cmLambdaFunctionName}`,
            alarmDescription: 'Warning: 10 unhandled exceptions in 30 minutes',
        }).then(() => {
            console.log(`LambdaUnhandledExceptionWarning-${this.cmLambdaFunctionName}` + ' Alarms setup successfully.');
        })
        .catch((error:Error) => {
            console.error('Error setting up alarms:', error);
        });

        createAlarm({
            ...baseConfig,
            metricName: 'Errors',
            threshold: 11, // More than 10 exceptions
            period: 1800, // 30 minutes
            evaluationPeriods: 1,
            comparisonOperator: 'GreaterThanThreshold',
            alarmName: `LambdaUnhandledExceptionCritical-${this.cmLambdaFunctionName}`,
            alarmDescription: 'Critical: More than 10 unhandled exceptions in 30 minutes',
        }).then(() => {
            console.log(`LambdaUnhandledExceptionCritical-${this.cmLambdaFunctionName}` + ' Alarms setup successfully.');
        })
        .catch((error:Error) => {
            console.error('Error setting up alarms:', error);
        });
    }
}