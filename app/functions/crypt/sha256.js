//###############################################
//############### sha256 Function ###############
//###############################################

/////////////////////////////////////
////// NODE & NPM DEPENDENCIES //////
/////////////////////////////////////
import { createHash } from 'crypto';
import { hash as _hash } from 'bcrypt';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export function sha256(string) {
  try {

    const hash = createHash('sha256');
    hash.update(string);
    const hashedString = hash.digest('hex');

    return hashedString;

  } catch (error) {
    return false;
  }
}