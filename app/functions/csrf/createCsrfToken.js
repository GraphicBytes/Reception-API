//#################################################
//############### Create CSRF Token ###############
//#################################################

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { encrypt } from '../crypt/encrypt.js';
import { sha256 } from '../crypt/sha256.js';
import { getSession } from '../getSession.js';
import { theUserIP } from '../helpers/theUserIP.js';
import { theEpochTime } from '../helpers/theEpochTime.js';
import { theUserAgent } from '../helpers/theUserAgent.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function createCsrfToken(app, req, res, platformData) {

  let sessionID = await getSession(app, req, res, platformData);

  return new Promise((resolve) => {

      let csrfSalt = platformData.csrf_salt;
      let csrfTimeLimit = platformData.csrf_time_limit;
      let csrfIpSecured = platformData.csrf_ip_secure;
      let currentTime = theEpochTime();

      let userAgent = theUserAgent(req);
      let userAgentHash = sha256(userAgent);

      let csrfTokenData = {};
      csrfTokenData['platform'] = req.params.fromPlatform;
      csrfTokenData['session_id'] = sessionID;
      csrfTokenData['csrf_salt'] = csrfSalt;
      csrfTokenData['user_agent'] = userAgentHash;

      if (csrfTimeLimit > 0) {
        csrfTokenData['created'] = currentTime;
      }

      if (csrfIpSecured === 1) {
        csrfTokenData['user_ip'] = theUserIP(req);
      }

      let encryptedCsrfTokenData = encrypt(JSON.stringify(csrfTokenData), process.env.NETWORK_MINOR_ENCRYPTION_KEY);
      
      resolve(encryptedCsrfTokenData);
 

  });
}