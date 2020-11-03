import { Account, AddressInformation } from '../../types/database'
import { LookupError, LookupErrorType } from '../../utils/errors'

import {
  getRecordByPayId,
  fromRecordToAccount,
  createRecord,
  deleteRecord,
} from './dynamodb'

/**
 * Checks if a given PayID exists in the account table in the PayID database.
 *
 * @param payId - The PayID to insert in the account table.
 *
 * @returns A boolean indicating whether the PayID exists.
 *
 * Note: This could actually be done in getAllAddressInfoFromDatabase,
 * if we changed the return type a bit, which would let us always do a single database call,
 * instead of having to call this as a follow-up check, but it's probably cleaner to
 * let them have separate concerns until performance becomes an issue.
 */
// TODO:(hbergren): Type payId better
export async function checkUserExistence(payId: string): Promise<boolean> {
  const record = await getRecordByPayId(payId)
  return record !== null
}

/**
 * Inserts a new user/PayID into the account table in the PayID database.
 *
 * @param payId - The PayID to insert in the account table.
 * @param addresses - The payment addresses for that PayID to insert into the database.
 * @param identityKey - Base64 encoded public key of user for signing addresses.
 *
 * @returns The addresses inserted for this user.
 */
// TODO(hbergren): Type payId better
// TODO:(hbergren) Accept an array of users (insertUsers?)
export async function insertUser(
  payId: string,
  addresses: readonly AddressInformation[],
  identityKey?: string,
): Promise<readonly AddressInformation[]> {
  await createRecord({
    payId,
    identityKey,
    addresses,
  })
  return addresses
}

/**
 * Replace only the user PayID in the account table in the PayID database.
 *
 * @param oldPayId - The current PayID which needs to be updated.
 * @param newPayId - The new PayID of the user.
 *
 * @returns The updated user Account.
 */
export async function replaceUserPayId(
  oldPayId: string,
  newPayId: string,
): Promise<Account | null> {
  const record = await getRecordByPayId(oldPayId)
  if (record === null) {
    return null
  }
  await replaceUser(oldPayId, newPayId, record.addresses)
  return fromRecordToAccount({
    ...record,
    payId: newPayId,
  })
}

/**
 * Update the PayID and addresses for a given user.
 *
 * @param oldPayId - The old PayID of the user.
 * @param newPayId - The new PayID of the user.
 * @param addresses - The array of payment address information to associate with this user.
 * @returns The updated payment addresses for a given PayID.
 * @throws LookupError.
 */
export async function replaceUser(
  oldPayId: string,
  newPayId: string,
  addresses: readonly AddressInformation[],
): Promise<readonly AddressInformation[] | null> {
  const doesExist = await checkUserExistence(oldPayId)
  if (!doesExist) {
    throw new LookupError(
      `The PayID ${oldPayId} doesn't exist.`,
      LookupErrorType.MissingPayId,
    )
  }
  return removeUser(oldPayId).then(async () => insertUser(newPayId, addresses))
}

/**
 * Deletes a user from the database.
 * Addresses associated with that user should be automatically removed by a cascading delete.
 *
 * @param payId - The PayID associated with the user to delete.
 */
export async function removeUser(payId: string): Promise<void> {
  await deleteRecord(payId)
}
