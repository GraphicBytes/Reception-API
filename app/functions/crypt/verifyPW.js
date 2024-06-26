//########################################################
//############### Verify Password Function ###############
//########################################################

/////////////////////////////////////
////// NODE & NPM DEPENDENCIES //////
/////////////////////////////////////
import { hash as _hash, compare } from 'bcrypt';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function verifyPW(hash, password) {
  const match = await compare(password, hash);
  return match;
}