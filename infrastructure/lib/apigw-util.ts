import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export function withCorsIntegration(fn: lambda.IFunction): apigw.LambdaIntegration {
    return new apigw.LambdaIntegration(fn, {
        integrationResponses: [
            {
                statusCode: '200',
                responseParameters: { 'method.response.header.Access-Control-Allow-Origin': "'*'", }
            },
            {
                statusCode: '400',
                responseParameters: { 'method.response.header.Access-Control-Allow-Origin': "'*'", }
            },
            {
                statusCode: '404',
                responseParameters: { 'method.response.header.Access-Control-Allow-Origin': "'*'", }
            },
        ],
        passthroughBehavior: apigw.PassthroughBehavior.WHEN_NO_TEMPLATES
    });
}

export const defaultCorsMethodResponses: apigw.MethodResponse[] = [
    {
        statusCode: '200',
        responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
        },
    },
    {
        statusCode: '400',
        responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
        },
    },
    {
        statusCode: '404',
        responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
        },
    },
]

export function addCorsOptions(resource: apigw.Resource, allowedMethods: string[] = ['OPTIONS', 'POST']) {
  resource.addMethod('OPTIONS', new apigw.MockIntegration({
    integrationResponses: [
      {
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': "'Content-Type'",
          'method.response.header.Access-Control-Allow-Origin': "'*'",
          'method.response.header.Access-Control-Allow-Methods': `'${allowedMethods.join(',')}'`
        },
        responseTemplates: {
          'application/json': ''
        }
      }
    ],
    passthroughBehavior: apigw.PassthroughBehavior.NEVER,
    requestTemplates: {
      'application/json': '{"statusCode": 200}'
    }
  }), {
    methodResponses: [
      {
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Methods': true
        }
      }
    ]
  });
}