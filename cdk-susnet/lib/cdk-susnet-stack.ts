import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";

import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

import {
  CertificateValidation,
  KeyAlgorithm,
} from "aws-cdk-lib/aws-certificatemanager";
import { BlockPublicAccess, Bucket, BucketAccessControl, HttpMethods } from "aws-cdk-lib/aws-s3";
import { AnyPrincipal, Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";

export class CdkSusnetStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //CHATGPT GENERATED SO DON'T @ ME
    //IAM STUFF
    // Step 1: Reference GitHub's OIDC provider (or create it if not already added)
    const provider = new iam.OpenIdConnectProvider(this, "GitHubOIDCProvider", {
      url: "https://token.actions.githubusercontent.com",
      clientIds: ["sts.amazonaws.com"],
    });

    // Step 2: Define the IAM Role that GitHub Actions can assume
    const githubActionsRole = new iam.Role(this, "GitHubActionsRole", {
      roleName: "GitHubActionsDeploymentRole",
      assumedBy: new iam.WebIdentityPrincipal(
        provider.openIdConnectProviderArn,
        {
          StringLike: {
            "token.actions.githubusercontent.com:sub":
              "repo:miniconomy2025/susnet:*",
          },
        },
      ),
      description: "IAM role assumable by GitHub Actions via OIDC",
    });

    // Step 3: Attach the desired policies
    githubActionsRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AdministratorAccess"),
    );

    //CERT STUFF
    const hostedZone = new HostedZone(this, "hostedZone", {
      zoneName: "susnet.co.za",
    });

    //SERVER STUFF
    const vpc = new ec2.Vpc(this, "generalVPC", {
      maxAzs: 1,
      natGateways: 0,
    });

    const securityGroup = new ec2.SecurityGroup(this, "generalSecurityGroup", {
      vpc,
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.allTraffic(),
      "let it in",
    );

    const imageStore = new Bucket(this, 'imageStoreS3Bucket', {
      bucketName: 'susnet-s3-bucket-images', // Make this globally unique!
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Optional: for cleanup
    });

    // Attach a bucket policy allowing only public **GET** (read)
    imageStore.addToResourcePolicy(
      new PolicyStatement({
        sid: 'PublicReadGetObject',
        effect: Effect.ALLOW,
        principals: [new AnyPrincipal()],
        actions: ['s3:GetObject'],
        resources: [`${imageStore.bucketArn}/*`],
      }),
    );

    const server = new ec2.Instance(this, "susnetServer", {
      vpc,
      securityGroup: securityGroup,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO,
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      keyPair: ec2.KeyPair.fromKeyPairName(this, "KeyPair", "the-key"),
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    const eip = new ec2.CfnEIP(this, 'EIP', {
      instanceId: server.instanceId
    })

    imageStore.grantPut(server.role);

    // A RECORD FOR SERVER
    const serverRecord = new ARecord(this, "ARecordServer", {
      target: RecordTarget.fromIpAddresses(eip.attrPublicIp),
      zone: hostedZone,
    });
  }
}
