//#####################################################
//############### RandomString Function ###############
//#####################################################

/////////////////////////////////////
////// NODE & NPM DEPENDENCIES //////
/////////////////////////////////////
import { randomBytes } from 'crypto';
import { hash as _hash } from 'bcrypt';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export function randomString(number) {
  try {

    let randomString = randomBytes(Math.ceil(number/2)).toString('hex')

    return randomString;

  } catch (error) {
    return false;
  }
}