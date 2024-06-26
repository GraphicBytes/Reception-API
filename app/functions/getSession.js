//#####################################################
//############### Get Session Functions ###############
//#####################################################

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { encrypt } from './crypt/encrypt.js';
import { decrypt } from './crypt/decrypt.js';
import { sha256 } from './crypt/sha256.js';
import { randomString } from './crypt/randomString.js';
import { theEpochTime } from './helpers/theEpochTime.js';
import { theUserAgent } from './helpers/theUserAgent.js';
import { getBaseDomain } from './helpers/getBaseDomain.js';
import { appendUniqueCookie } from './helpers/appendUniqueCookie.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function getSession(app, req, res, platformData) {

  return new Promise((resolve) => {

    if (app.locals.session_id !== null) {
      resolve(app.locals.session_id);
      return null;
    } else {

      if (platformData) {

        let cookieId = platformData.platform_tag.toUpperCase() + 'SID';
        let sessionData = {};
        let sessionID = "null";
        let currentTime = theEpochTime();
        let ageLimitToReset = currentTime - 3600;

        let userAgent = theUserAgent(req);
        let hashedUserAgent = sha256(userAgent);
        let referer = req.headers.referer;

        let validCookie = false; 

        if (req.cookies[cookieId]) {

          const userCookieString = req.cookies[cookieId];
          let userCookieData = JSON.parse(decrypt(userCookieString, process.env.NETWORK_MINOR_ENCRYPTION_KEY));

          if (userCookieData) {

            if (
              userCookieData.platform === platformData.platform_tag
              && userCookieData.user_agent === hashedUserAgent
              //&& userCookieData.referer === referer
            ) {

              sessionData['platform'] = userCookieData.platform;
              sessionData['session_id'] = userCookieData.session_id;
              sessionData['user_agent'] = userCookieData.user_agent;
              sessionData['referer'] = userCookieData.referer;

              let tokenAge = parseInt(userCookieData.token_age);

              if (tokenAge < ageLimitToReset || tokenAge === NaN || !tokenAge) {
                sessionData['token_age'] = currentTime;
              } else {
                sessionData['token_age'] = userCookieData.token_age; 
              }
              validCookie = true;

            }
          }
        }

        if (!validCookie) {

          sessionID = randomString(32);
          sessionData['platform'] = platformData.platform_tag;
          sessionData['session_id'] = sessionID;
          sessionData['user_agent'] = hashedUserAgent;
          sessionData['referer'] = referer;
          sessionData['token_age'] = currentTime;

        }

        const domain = getBaseDomain(req.headers.host);

        const cookieString = encrypt(JSON.stringify(sessionData), process.env.NETWORK_MINOR_ENCRYPTION_KEY);  

        appendUniqueCookie(res, cookieId, cookieString, domain, 900);

        app.locals.session_id = sessionData.session_id;
        resolve(sessionData.session_id);
        return null;

      } else {
        resolve(false);
        return null;
      }
    }
  });
}
