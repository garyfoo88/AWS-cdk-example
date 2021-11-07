import {CorsHttpMethod, HttpApi, HttpMethod} from '@aws-cdk/aws-apigatewayv2';
import {LambdaProxyIntegration} from '@aws-cdk/aws-apigatewayv2-integrations';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';
import * as path from 'path';

export class HttpApiStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?:cdk.StackProps) {
        super(scope, id, props);

        //create http api
        const httpApi = new HttpApi(this, 'http-api-example', {
            description: 'Http api example',
            corsPreflight: {
                allowHeaders: [
                    'Content-Type'
                ],
                allowMethods: [CorsHttpMethod.OPTIONS, CorsHttpMethod.GET],
                allowCredentials: true,
                allowOrigins: ['http://localhost:3000']
            },
        })

        const getTodosLambda = new lambda.Function(this, 'get-todos', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'index.main',
            code: lambda.Code.fromAsset(path.join(__dirname, '/../src/get-todos'))
        })

        httpApi.addRoutes({
            path: '/todos',
            methods: [HttpMethod.GET],
            integration: new LambdaProxyIntegration({
                handler: getTodosLambda
            })
        })
    }
}