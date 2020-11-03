/* eslint-disable @typescript-eslint/naming-convention -- naming convention for dynamodb */
import { DynamoDB } from 'aws-sdk'

import { Account, Address } from '../../types/database'
import config from '../serverless.config'

const dynamoDb = new DynamoDB.DocumentClient({
  accessKeyId: config.serverless.awsApiKey,
  secretAccessKey: config.serverless.awsSecret,
  region: config.serverless.awsRegion,
})

type AddressAttribute = Pick<
  Address,
  'paymentNetwork' | 'environment' | 'details' | 'identityKeySignature'
>

interface DynamodbRecord {
  payId: string
  identityKey?: string
  addresses: readonly AddressAttribute[]
}

/**
 * Gets a record associted with a given PayID user.
 *
 * @param payId - The PayID to get a record for.
 *
 * @returns A DynamodbRecord object.
 *
 */
export async function getRecordByPayId(
  payId: string,
): Promise<DynamodbRecord | null> {
  const params: DynamoDB.DocumentClient.QueryInput = {
    TableName: config.serverless.tableName,
    KeyConditionExpression: '#id = :s',
    ExpressionAttributeNames: {
      '#id': 'id',
    },
    ExpressionAttributeValues: {
      ':s': payId,
    },
  }
  const data = await dynamoDb.query(params).promise()
  if (data.Items === undefined || data.Items.length === 0) {
    return null
  }
  return data.Items[0] as DynamodbRecord
}

/**
 * Creates a given record.
 *
 * @param record - The record to create.
 *
 * @returns A created record object.
 *
 */
export async function createRecord(
  record: DynamodbRecord,
): Promise<DynamodbRecord> {
  const params: DynamoDB.DocumentClient.PutItemInput = {
    TableName: config.serverless.tableName,
    Item: {
      id: record.payId,
      identityKey: record.identityKey,
      addresses: record.addresses,
    },
    ConditionExpression: 'attribute_not_exists(id)',
  }
  await dynamoDb.put(params).promise()
  return record
}

/**
 * Deletes the record associated with a given PayID.
 *
 * @param payId - The payID associated with the user to delete.
 * @returns A created record object.
 */
export async function deleteRecord(payId: string): Promise<void> {
  const params: DynamoDB.DocumentClient.DeleteItemInput = {
    TableName: config.serverless.tableName,
    Key: {
      id: payId,
    },
  }
  await dynamoDb.delete(params).promise()
}

/**
 * Maps a DynamoDB record object into Account object.
 *
 * @param record - The record object to convert to an Account object.
 * @returns A created Account object.
 */
export function fromRecordToAccount(record: DynamodbRecord): Account {
  return {
    id: record.payId,
    payId: record.payId,
    identityKey: record.identityKey,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}
