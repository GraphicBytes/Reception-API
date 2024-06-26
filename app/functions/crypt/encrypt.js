//################################################
//############### Encrypt Function ###############
//################################################

/////////////////////////////////////
////// NODE & NPM DEPENDENCIES //////
/////////////////////////////////////
import { randomBytes, createCipheriv } from 'crypto';

///////////////////////////////////////
////// IN-LINE SUPPORT FUNCTIONS //////
///////////////////////////////////////
export function scrambleToken(str, position, numChars) {
  str = str.replace(/==/g, '.');
  str = str.replace(/\//g, '%');  
  str = str.replace(/\+/g, '$');
  str = str.replace(/=/g, ':');
  const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomCharString = Array.from({length: numChars}, () => randomChars.charAt(Math.floor(Math.random() * randomChars.length))).join('');
  const newStr = str.slice(0, position) + randomCharString + str.slice(position);
  return newStr;
}

function scrambleTokenUrlSafe(str, position, numChars) {
  // Base64 URL encoding replaces problematic characters
  str = str.replace(/\+/g, '-'); // Replace + with -
  str = str.replace(/\//g, '_'); // Replace / with _
  const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomCharString = Array.from({ length: numChars }, () => randomChars.charAt(Math.floor(Math.random() * randomChars.length))).join('');
  const newStr = str.slice(0, position) + randomCharString + str.slice(position);
  return newStr;
}

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export function encrypt(plaintext, key) {
  try {
    const cipher = 'aes-256-gcm';
    const iv = randomBytes(12);
    const cipherObject = createCipheriv(cipher, key, iv);
    let ciphertext = cipherObject.update(plaintext, 'utf8', 'base64');
    ciphertext += cipherObject.final('base64');
    const authTag = cipherObject.getAuthTag();
    const preencrypted = Buffer.concat([iv, authTag, Buffer.from(ciphertext, 'base64')]);
    let  encrypted = preencrypted.toString('base64');
    encrypted = scrambleToken(encrypted, 9, 17);
    return encrypted;
  } catch (error) {
    return null;
  }
}

export function encryptUrlSafe(plaintext, key) {
  try {
    const cipher = 'aes-256-gcm';
    const iv = randomBytes(12);
    const cipherObject = createCipheriv(cipher, key, iv);
    let ciphertext = cipherObject.update(plaintext, 'utf8', 'base64');
    ciphertext += cipherObject.final('base64');
    const authTag = cipherObject.getAuthTag();
    const preencrypted = Buffer.concat([iv, authTag, Buffer.from(ciphertext, 'base64')]);
    let encrypted = preencrypted.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); // Use Base64 URL encoding
    encrypted = scrambleTokenUrlSafe(encrypted, 9, 17);
    return encrypted;
  } catch (error) {
    console.error(error);
    return null;
  }
}