import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CommunicationsManagerStack } from '../lib/communications-manager-stack';

test('SNS Topic Created', () => {
  const app = new cdk.App();
  const stack = new CommunicationsManagerStack(app, 'TestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::SNS::Topic', {});
});

test('SQS Queue Created', () => {
  const app = new cdk.App();
  const stack = new CommunicationsManagerStack(app, 'TestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::SQS::Queue', {});
});
