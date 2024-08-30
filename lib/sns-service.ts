import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

const apiGatewayArn = "";

export class SnsService extends Construct {
    public readonly topic: sns.Topic;

    // SNS Topic
    constructor(scope: Construct, id: string) {
        super(scope, id);
        this.topic = new sns.Topic(this, 'CommunicationsTopic', {
            displayName: 'Communications SNS Topic',
        });
    
        // Restrict SNS Topic access to API Gateway
        this.topic.addToResourcePolicy(new iam.PolicyStatement({
            actions: ['SNS:Publish'],
            resources: [this.topic.topicArn],
            //principals: [new iam.ArnPrincipal(apiGatewayArn)],
            principals: [new iam.ServicePrincipal('apigateway.amazonaws.com')],
            effect: iam.Effect.ALLOW,
        }));

        // CloudWatch Alarms
        new cloudwatch.Alarm(this, 'SNSTopicAlarm', {
            metric: this.topic.metricNumberOfMessagesPublished(),
            threshold: 100,
            evaluationPeriods: 1,
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        });
    }

    // Function to add an SQS queue as a subscription to the SNS topic
    public addSqsSubscription(queue: sqs.Queue): void {
        this.topic.addSubscription(new sns_subscriptions.SqsSubscription(queue));
    }
}