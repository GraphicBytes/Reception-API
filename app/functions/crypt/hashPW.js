//######################################################
//############### Hash Password Function ###############
//######################################################

/////////////////////////////////////
////// NODE & NPM DEPENDENCIES //////
/////////////////////////////////////
import { hash as _hash } from 'bcrypt';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function hashPW(password) {
  const saltRounds = 10;
  const hash = await _hash(password, saltRounds);
  return hash;
}
