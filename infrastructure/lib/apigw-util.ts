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