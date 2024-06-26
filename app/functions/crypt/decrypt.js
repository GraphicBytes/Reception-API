//################################################
//############### Decrypt Function ###############
//################################################

/////////////////////////////////////
////// NODE & NPM DEPENDENCIES //////
/////////////////////////////////////
import { createDecipheriv } from 'crypto';

///////////////////////////////////////
////// IN-LINE SUPPORT FUNCTIONS //////
///////////////////////////////////////
export function unScrambleToken(str, position, numChars) { 
  let newStr = str.slice(0, position) + str.slice(position + numChars);
  newStr = newStr.replace(/:/g, '=');
  newStr = newStr.replace(/\$/g, '+');
  newStr = newStr.replace(/%/g, '/');
  newStr = newStr.replace(/\./g, '==');
  return newStr;
}

function unScrambleTokenUrlSafe(str, position, numChars) {
  let newStr = str.slice(0, position) + str.slice(position + numChars);
  // Revert Base64 URL encoding to original Base64
  newStr = newStr.replace(/-/g, '+'); // Revert - to +
  newStr = newStr.replace(/_/g, '/'); // Revert _ to /
  return newStr;
}

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export function decrypt(ciphertext, key) {
  try {
    let theCiphertext = unScrambleToken(ciphertext, 9, 17)
    const cipher = 'aes-256-gcm';
    const encrypted = Buffer.from(theCiphertext, 'base64');
    const iv = encrypted.slice(0, 12);
    const authTag = encrypted.slice(12, 28);
    const decipherObject = createDecipheriv(cipher, key, iv);
    decipherObject.setAuthTag(authTag);
    let ciphertextSliced = encrypted.slice(28);
    let plaintext = decipherObject.update(ciphertextSliced, 'base64', 'utf8');
    plaintext += decipherObject.final('utf8');
    return plaintext;
  } catch (error) {
    return false;
  }
}
 
export function decryptUrlSafe(ciphertext, key) {
  try {
    let theCiphertext = unScrambleTokenUrlSafe(ciphertext, 9, 17);
    const cipher = 'aes-256-gcm';
    const encrypted = Buffer.from(theCiphertext, 'base64');
    const iv = encrypted.slice(0, 12);
    const authTag = encrypted.slice(12, 28);
    const decipherObject = createDecipheriv(cipher, key, iv);
    decipherObject.setAuthTag(authTag);
    let ciphertextSliced = encrypted.slice(28);
    let plaintext = decipherObject.update(ciphertextSliced.toString('base64').replace(/\-/g, '+').replace(/_/g, '/'), 'base64', 'utf8'); // Convert back to original Base64 for decryption
    plaintext += decipherObject.final('utf8');
    return plaintext;
  } catch (error) {
    console.error(error);
    return false;
  }
}