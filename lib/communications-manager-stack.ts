import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LambdaSQSService } from './lambda-sqs-service';
import { PinpointService } from './pinpoint-service';
import * as pinpoint from 'aws-cdk-lib/aws-pinpoint';
import { SnsService } from './sns-service';

export class CommunicationsManagerStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // SNS Topic
        new SnsService(this, 'CommunicationsManagerSnsService');

        //Create SQS/lambda stack
        new LambdaSQSService (this, 'CommunicationsManagerLambdaSQSService');

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
