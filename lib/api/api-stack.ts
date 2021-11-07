import * as apigateway from '@aws-cdk/aws-apigateway';
import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as path from 'path';
export class BackendStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const api = new apigateway.RestApi(this, 'api', {
            description: 'example api gateway',
            deployOptions: {
                stageName: 'dev'
            },
            //cors options
            defaultCorsPreflightOptions: {
                allowHeaders: ['Content-Type'],
                allowMethods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
                allowCredentials: true,
                allowOrigins: ['http://localhost:3000']
            }
        });

        new cdk.CfnOutput(this, 'apiUrl', {
            value: api.url
        })

        //creating two endpoints for our api
        //1. `/todos` GET
        //2. `/todos/{todoId}` DELETE
        const getTodosLambda = new lambda.Function(this, 'get-todos-lambda', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'index.main',
            code: lambda.Code.fromAsset(path.join(__dirname, '/../src/get-todos'))
        })
        // add a /todos resource
        const todos = api.root.addResource('todos')

        todos.addMethod('GET', new apigateway.LambdaIntegration(getTodosLambda, {
            proxy: true
        }))

        const deleteTodoLambda = new lambda.Function(this, 'delete-todo-lambda', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'index.main',
            code: lambda.Code.fromAsset(path.join(__dirname, '/../src/delete-todo'))
        })

        const todo = todos.addResource('{todoId}')

        todo.addMethod('DELETE', new apigateway.LambdaIntegration(deleteTodoLambda))
    }
}