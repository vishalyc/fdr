#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CommunicationsManagerStack } from '../lib/communications-manager-stack';

const app = new cdk.App();
new CommunicationsManagerStack(app, 'CommunicationsManagerStack', {env: {
  region: '',
  account: ''
}});