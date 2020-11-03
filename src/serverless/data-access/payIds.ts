import { AddressInformation } from '../../types/database'

import { getRecordByPayId } from './dynamodb'

/**
 * Retrieve all of the address information associated with a given PayID from the database.
 *
 * @param payId - The PayID used to retrieve address information.
 * @returns All of the address information associated with a given PayID.
 */
export default async function getAllAddressInfoFromDatabase(
  payId: string,
): Promise<readonly AddressInformation[]> {
  const record = await getRecordByPayId(payId)
  if (record === null) {
    return []
  }
  return record.addresses
}
