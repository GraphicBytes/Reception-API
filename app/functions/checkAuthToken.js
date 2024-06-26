//################################################
//############### CHECK AUTH TOKEN ###############
//################################################

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { decrypt } from './crypt/decrypt.js';
import { getUser } from './getUser.js';
import { getSession } from './getSession.js';
import { theUserIP } from './helpers/theUserIP.js';
import { theEpochTime } from './helpers/theEpochTime.js';
import { theUserAgent } from './helpers/theUserAgent.js';
import { isNullOrEmpty } from '../functions/helpers/isNullOrEmpty.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function checkAuthToken(app, req, res, platform, tokenString, platformData) {
  try {

    if (isNullOrEmpty(tokenString)) { return false; }
    if (!platformData) { return false; }

    let tokenData = JSON.parse(decrypt(tokenString, process.env.NETWORK_PRIMARY_ENCRYPTION_KEY));
    if (tokenData === null) { return false }

    let sessionID = await getSession(app, req, res, platformData);
    let requestTime = theEpochTime();
    let tokenSessionID = tokenData.session_id;
    let tokenUserID = tokenData.user_id;
    let tokenSuperUser = parseInt(tokenData.super_user);
    let tokenPlatform = tokenData.platform;
    let tokenUserEmail = tokenData.user_email;
    let tokenCreated = parseInt(tokenData.created);
    let tokenCookieString = tokenData.cookie_string;
    let tokenUserAgent = tokenData.user_agent;
    let userIP = theUserIP(req);
    let tokenUserIP = tokenData.user_ip;
    let tokenRememberMe = parseInt(tokenData.remember_me);

    let userAgent = theUserAgent(req);

    let rememberMeCutOFf = requestTime - platformData.auth_remember_me_age_limit;
    let nonRememberMeCutOFf = requestTime - platformData.auth_non_remember_me_age_limit;

    if (
      sessionID === tokenSessionID
      && platform === tokenPlatform
      && tokenUserAgent === userAgent
      && (
        (tokenRememberMe === 1 && tokenCreated > rememberMeCutOFf)
        || (tokenRememberMe === 0 && tokenCreated > nonRememberMeCutOFf)
      )
      && (
        (tokenSuperUser === 0)
        || (tokenSuperUser === 1 && tokenUserIP === userIP)
      )
    ) {

      let userData = await getUser(tokenUserEmail, platform);
      if (!userData) { return false; }

      if (
        userData.userID === tokenUserID
        && userData.userData[tokenPlatform].cookie_string === tokenCookieString
        && userData.userBanned === 0
        && userData.userLoginFail <= platformData.maximum_pw_attempts
      ) {

        return true;

      } else {
        return false;
      }

    } else {
      return false;
    }



  } catch (error) {

    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }

    return false;
  }
} 