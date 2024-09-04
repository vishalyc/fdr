#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CommunicationsManagerStack } from '../lib/communications-manager-stack';
import { environments } from '../environments/dev'

const app = new cdk.App();
new CommunicationsManagerStack(app, 'CommunicationsManagerStack', {env: {
  region: environments.region,
  account: environments.account
}});