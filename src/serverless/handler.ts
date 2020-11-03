import { APIGatewayProxyEvent, Context } from 'aws-lambda'
import * as awsServerlessExpress from 'aws-serverless-express'
import * as express from 'express'

import sendSuccess from '../middlewares/sendSuccess'
import { adminApiRouter, publicApiRouter } from '../routes'

const privateServer: express.Application = express()
privateServer.use('/users', adminApiRouter)

const publicServer: express.Application = express()
publicServer.use('/status/health', sendSuccess)
publicServer.use('/', publicApiRouter)

const privateServerProxy = awsServerlessExpress.createServer(privateServer)
const publicServerProxy = awsServerlessExpress.createServer(publicServer)

/**
 * Handles the API Gateway request by proxying to express.
 *
 * @param event - A APIGatewayProxyEvent object.
 * @param context - A APIGateway Context object.
 * @returns A AWS Serverless Express response object.
 */
async function handleAdminRequests(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<awsServerlessExpress.Response> {
  return awsServerlessExpress.proxy(
    privateServerProxy,
    event,
    context,
    'PROMISE',
  ).promise
}

/**
 * Handles the API Gateway request by proxying to express.
 *
 * @param event - A APIGatewayProxyEvent object.
 * @param context - A APIGateway Context object.
 * @returns A AWS Serverless Express response object.
 */
async function handlePublicRequests(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<awsServerlessExpress.Response> {
  return awsServerlessExpress.proxy(
    publicServerProxy,
    event,
    context,
    'PROMISE',
  ).promise
}

// eslint-disable-next-line import/no-unused-modules -- serverless function
export { handleAdminRequests as admin, handlePublicRequests as public }
