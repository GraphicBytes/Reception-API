//################################################
//############### Check CSRF Token ###############
//################################################

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { decrypt } from '../crypt/decrypt.js';
import { sha256 } from '../crypt/sha256.js';
import { getSession } from '../getSession.js';
import { theUserIP } from '../helpers/theUserIP.js';
import { theEpochTime } from '../helpers/theEpochTime.js';
import { theUserAgent } from '../helpers/theUserAgent.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function checkCsrfToken(app, req, res, platformData) {

  let sessionID = await getSession(app, req, res, platformData);

  return new Promise((resolve) => {

    if (platformData) {
      
      let csrfSalt = platformData.csrf_salt;
      let csrfTimeLimit = platformData.csrf_time_limit;
      let csrfIpSecured = platformData.csrf_ip_secure;

      let userAgent = theUserAgent(req);
      let userAgentHash = sha256(userAgent);

      let token = req.body.csrf;
      let tokenData = decrypt(token, process.env.NETWORK_MINOR_ENCRYPTION_KEY);
      let csrfTokenData = JSON.parse(tokenData); 

      if (csrfTokenData) {

        let tokenCutoffTime = theEpochTime() - csrfTimeLimit;

        let tokenPreValidation = true;

        if (csrfTimeLimit > 0) {
          if (csrfTokenData.created < tokenCutoffTime) {
            tokenPreValidation = false;
            resolve(false);
            return null;
          }
        }

        if (csrfIpSecured === 1) {
          let userIP = theUserIP(req);
          if (csrfTokenData.user_ip !== userIP) {
            tokenPreValidation = false;
            resolve(false);
            return null;
          }
        } 

        if (
          tokenPreValidation
          && csrfTokenData.platform === req.params.fromPlatform
          && csrfTokenData.session_id === sessionID
          && csrfTokenData.user_agent === userAgentHash
          && csrfTokenData.csrf_salt === csrfSalt
        ) {
          resolve(true);
          return null;
        } else {
          resolve(false);
          return null;
        } 

      } else {
        resolve(false);
        return null;
      }
    } else {
      resolve(false);
      return null;
    }

  });
}
