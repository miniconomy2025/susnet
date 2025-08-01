import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';

import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

import { CertificateValidation, KeyAlgorithm } from 'aws-cdk-lib/aws-certificatemanager';

export class CdkSusnetStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //CHATGPT GENERATED SO DON'T @ ME
    //IAM STUFF
    // Step 1: Reference GitHub's OIDC provider (or create it if not already added)
    const provider = new iam.OpenIdConnectProvider(this, 'GitHubOIDCProvider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
    });

    // Step 2: Define the IAM Role that GitHub Actions can assume
    const githubActionsRole = new iam.Role(this, 'GitHubActionsRole', {
      roleName: 'GitHubActionsDeploymentRole',
      assumedBy: new iam.WebIdentityPrincipal(provider.openIdConnectProviderArn, {
        StringLike: {
          'token.actions.githubusercontent.com:sub': 'repo:miniconomy2025/susnet:*',
        },
      }),
      description: 'IAM role assumable by GitHub Actions via OIDC',
    });

    // Step 3: Attach the desired policies
    githubActionsRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'));

    //CERT STUFF
    const hostedZone = new HostedZone(this, 'hostedZone', {
      zoneName: 'susnet.co.za',
    })

    const certificate = new cdk.aws_certificatemanager.Certificate(this, 'domainCertificate', {
      domainName: '*.susnet.co.za',
      certificateName: 'susnet-cert',
      keyAlgorithm: KeyAlgorithm.RSA_2048,
      validation: CertificateValidation.fromDns(hostedZone)
    })

    //SERVER STUFF
    const vpc = new ec2.Vpc(this, 'generalVPC', {
      maxAzs: 1,
      natGateways: 0
    });

    const securityGroup = new ec2.SecurityGroup(this, 'generalSecurityGroup', {
      vpc,
      allowAllOutbound: true
    });

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(), ec2.Port.allTraffic(), 'let it in'
    )
    
    // const server = new ec2.Instance(this, 'susnetServer', {
    //   vpc,
    //   securityGroup: securityGroup,
    //   instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
    //   machineImage: ec2.MachineImage.latestAmazonLinux2023(),
    //   keyPair: ec2.KeyPair.fromKeyPairName(this, 'KeyPair', 'the-key'),
    //   vpcSubnets: {
    //     subnetType: ec2.SubnetType.PUBLIC
    //   },
    // })

    // // A RECORD FOR SERVER
    // const serverRecord = new ARecord(this, 'ARecordServer', {
    //   target: RecordTarget.fromIpAddresses(server.instancePublicIp),
    //   zone: hostedZone
    // })
  }
}