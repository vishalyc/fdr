import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LambdaSQSService } from './lambda-sqs-service';
import { PinpointService } from './pinpoint-service';
import * as pinpoint from 'aws-cdk-lib/aws-pinpoint';
import { SnsService } from './sns-service';
import { CMAlarmsManager } from './alarms';

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

        // Create Pinpoint App (Project)
        const pinpointApp = new pinpoint.CfnApp(this, 'FdrPinpointApp', {
          name: 'fdr',
        });

        // Instantiate the PinpointService construct
        new PinpointService(this, 'FdrPinpointService', {
          applicationId: pinpointApp.ref,
        });
    }
}
