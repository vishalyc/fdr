import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LambdaSQSService } from './lambda-sqs-service';
import { SnsService } from './sns-service';
import { CMAlarmsManager } from './alarms';
import { PinpointService } from './pinpoint-service'

export interface CommunicationsManagerConstructProps extends cdk.StackProps {
  topicArn: string;
}

export class CommunicationsManagerStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: any) {
        super(scope, id, props);
        
        const cmAlarmsManager = new CMAlarmsManager(this, 'SNSAlarmsTopicName');
        props.topicArn = cmAlarmsManager.topic.topicArn;
        
        // SNS Topic
        new SnsService(this, 'CommunicationsManagerSnsService', props);

        //Create SQS/lambda stack
        new LambdaSQSService (this, 'CommunicationsManagerLambdaSQSService', props);

        new PinpointService (this, 'PinpointService');
    }
}
