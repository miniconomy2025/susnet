#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkSusnetStack } from '../lib/cdk-susnet-stack';

const app = new cdk.App();
new CdkSusnetStack(app, 'CdkSusnetStack', {
  env: { region: 'af-south-1' },
});