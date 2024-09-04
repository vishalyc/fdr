import { Construct } from 'constructs';
import * as pinpoint from 'aws-cdk-lib/aws-pinpoint';
import { CfnResource } from 'aws-cdk-lib/core';

export class PinpointService extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const pinpointApp = new CfnResource(this, 'fdr', {
      type: 'AWS::Pinpoint::App',
      properties: {
          Name: 'fdr',
      },
    });

    // Create a Segment
    const segment = new pinpoint.CfnSegment(this, 'FdrVendorsPayersSegment', {
      applicationId: pinpointApp.ref,
      name: 'fdr-vendors-payers',
      segmentGroups: {
        groups: [{
          dimensions: [{
            attributes: {
              Active: {
                AttributeType: 'INCLUSIVE',
                Values: ['true'],
              },
            },
          }],
          sourceType: 'ALL',
        }],
        include: 'ALL',
      },
    });      

    // Create an Email Template
    const emailTemplate = new pinpoint.CfnEmailTemplate(this, 'FdrEmailTemplate', {
      templateName: 'fdr-email',
      subject: 'Hello',
      htmlPart: '<h1>Hello</h1>',
      textPart: 'Hello',
      defaultSubstitutions: '{}',
      templateDescription: 'FDR Email Template',
    });
  }
}
