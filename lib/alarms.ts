import * as AWS from 'aws-sdk';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import { idText } from 'typescript';

// Interface for Alarm Configuration
interface AlarmConfig {
    serviceName: string;
    resourceId: string;
    metricName: string;
    namespace: string;
    threshold: number;
    period: number;
    evaluationPeriods: number;
    comparisonOperator: string;
    alarmName: string;
    alarmDescription: string;
    snsTopicArn: string;
    statistic: string;
}

export class CMAlarmsManager  extends Construct {
    public readonly topic: sns.Topic;
    constructor(scope: Construct, id: string) {
        super(scope, id);
        this.topic = new sns.Topic(this, 'SNSAlarmsTopicName', {
            displayName: 'Communications Manager Alarms SNS Topic',
        });
    }
}

// Public method to create a CloudWatch Alarm
export async function createAlarm(config: AlarmConfig): Promise<void> {
    const AWS = require('aws-sdk');
    const cloudwatch = new AWS.CloudWatch();

    const params = {
        AlarmName: config.alarmName,
        MetricName: config.metricName,
        Namespace: config.namespace,
        Statistic: config.statistic || 'Sum',
        Period: config.period,
        EvaluationPeriods: config.evaluationPeriods,
        Threshold: config.threshold,
        ComparisonOperator: config.comparisonOperator,
        AlarmActions: [config.snsTopicArn],
        AlarmDescription: config.alarmDescription,
        TreatMissingData: 'notBreaching'
    };

    try {
        await cloudwatch.putMetricAlarm(params).promise();
        console.log(`Successfully created alarm: ${config.alarmName}`);
    } catch (err) {
        console.error(`Error creating alarm ${config.alarmName}:`, err);
        throw err;
    }
}

/*
    // Public method to subscribe to an SNS Topic
    public async subscribeToSNSTopic(topicArn: string, protocol: string, endpoint: string): Promise<void> {
        const params = {
            Protocol: protocol, // e.g., 'email', 'sms', 'lambda', etc.
            TopicArn: topicArn,
            Endpoint: endpoint
        };

        try {
            await this.sns.subscribe(params).promise();
            console.log(`Subscribed ${endpoint} to SNS Topic ${topicArn}`);
        } catch (err) {
            console.error('Error subscribing to SNS topic:', err);
            throw err;
        }
    }
    */

