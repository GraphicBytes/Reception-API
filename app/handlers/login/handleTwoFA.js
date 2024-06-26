//########################################
//############### USER 2FA ###############
//######################################## 

////////////////////////////
////// CONFIG IMPORTS //////
////////////////////////////
import { sysMsg } from '../../config/systemMessages.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { logActivity } from '../../functions/logActivity.js';
import { getPlatformData } from '../../functions/getPlatformData.js';
import { getSession } from '../../functions/getSession.js';

//////////////////////////////////////
////// RESULT SENDING FUNCTIONS //////
//////////////////////////////////////
import { resSendOk } from '../../functions/resSend/resSendOk.js';

//////////////////////////////
////// HELPER FUNCTIONS //////
//////////////////////////////
import { theUserIP } from '../../functions/helpers/theUserIP.js';
import { theEpochTime } from '../../functions/helpers/theEpochTime.js';
import { theUserAgent } from '../../functions/helpers/theUserAgent.js';
import { isNullOrEmpty } from '../../functions/helpers/isNullOrEmpty.js';
import { getBaseDomain } from '../../functions/helpers/getBaseDomain.js';
import { appendUniqueCookie } from '../../functions/helpers/appendUniqueCookie.js';

//////////////////////////////////
////// ENCRYPTION FUNCTIONS //////
//////////////////////////////////
import { encrypt } from '../../functions/crypt/encrypt.js';
import { decrypt } from '../../functions/crypt/decrypt.js';

//////////////////////////////////////////
////// MALICIOUS ACTIVITY FUNCTIONS //////
//////////////////////////////////////////
import { logMalicious } from '../../functions/malicious/logMalicious.js';
import { checkMalicious } from '../../functions/malicious/checkMalicious.js';
import { clearMalicious } from '../../functions/malicious/clearMalicious.js';

////////////////////////////
////// CSRF FUNCTIONS //////
////////////////////////////
import { createCsrfToken } from '../../functions/csrf/createCsrfToken.js';
import { checkCsrfToken } from '../../functions/csrf/checkCsrfToken.js';

//////////////////////////
////// THIS HANDLER //////
//////////////////////////
async function handleTwoFA(app, req, res) {

  let outputResult = {
    "status": 0,
    "qry": 0 
  };
  let msg = {}
  
  try {

    //##########################
    //##### SUBMITTED DATA #####
    //##########################

    //////////////////////
    ////// CHECK SUBMITTED DATA //////
    //////////////////////
    if (
      isNullOrEmpty(req.body.twofacode)
      || isNullOrEmpty(req.body.transittoken)
      || isNullOrEmpty(req.body.csrf)
    ) {

      msg[4] = sysMsg[4];

      logMalicious(req, "4");
      resSendOk(req, res, outputResult, msg);
      return null;
    }

    let twofacode = req.body.twofacode;
    let transittoken = req.body.transittoken;
    let rememberme = 0;

    //#########################
    //##### CHECK REQUEST #####
    //#########################

    //////////////////////
    ////// CHECK PLATFORM //////
    //////////////////////
    let platform = req.params.fromPlatform;
    let platformData = await getPlatformData(platform);
    if (!platformData) {

      msg[1] = sysMsg[1];

      logMalicious(req, "1");
      resSendOk(req, res, outputResult, msg);
      return null;
    }

    //######-----
    //#### ASYNC CHUNK ----
    //######------
    const [isMalicious, validCsrf] = await Promise.all([
      checkMalicious(req, platformData),
      checkCsrfToken(app, req, res, platformData)
    ]);

    //////////////////////
    ////// CHECK MALICIOUS //////
    ////////////////////// 
    if (isMalicious) {

      msg[2] = sysMsg[2];

      logMalicious(req, "2");
      resSendOk(req, res, outputResult, msg);
      return null;
    }

    //////////////////////
    ////// CHECK CSRF //////
    ////////////////////// 
    if (!validCsrf) {

      msg[5] = sysMsg[5];

      logMalicious(req, "5");
      resSendOk(req, res, outputResult, msg);
      return null;
    }

    //##########################
    //##### HANDLE REQUEST #####
    //##########################

    if (twofacode.length === platformData.two_fa_characters) {

      let twoFaTokenData = JSON.parse(decrypt(transittoken, process.env.NETWORK_PRIMARY_ENCRYPTION_KEY));
      let sessionID = await getSession(app, req, res, platformData);

      if (twoFaTokenData !== null) {

        let tokenAdminLogin = twoFaTokenData.admin_login;
        let tokenSessionID = twoFaTokenData.session_id;
        let tokenUserID = twoFaTokenData.user_id;
        let tokenSuperUser = twoFaTokenData.super_user;
        let tokenPlatform = twoFaTokenData.platform;
        let tokenUserEmail = twoFaTokenData.user_email;
        let tokenCreated = twoFaTokenData.created;
        let tokenCookieString = twoFaTokenData.cookie_string;
        let tokenUserAgent = twoFaTokenData.user_agent;
        let tokenIP = twoFaTokenData.user_ip;
        let tokenPwAge = twoFaTokenData.pw_age;
        let tokenUserMeta = twoFaTokenData.user_meta;
        let tokenPrivileges = twoFaTokenData.privileges;
        let tokenXPrivileges = twoFaTokenData.xPrivileges;
        let tokenTwoFaCode = twoFaTokenData.two_fa_code;

        let userAgent = theUserAgent(req);
        let userIP = theUserIP(req);
        let requestTime = theEpochTime();
        let tokenAgeCutoff = requestTime - platformData.two_fa_timeout;
        
        if (
          tokenPlatform === platform
          && tokenCreated > tokenAgeCutoff
          && userIP === tokenIP
          && userAgent === tokenUserAgent
          && sessionID === tokenSessionID
        ) {

          if (tokenTwoFaCode === twofacode) {

            let newCsrfToken = await createCsrfToken(app, req, res, platformData);

            let tokenData = {
              "admin_login": tokenAdminLogin,
              "session_id": tokenSessionID,
              "user_id": tokenUserID,
              "super_user": tokenSuperUser,
              "platform": tokenPlatform,
              "user_email": tokenUserEmail,
              "created": requestTime,
              "cookie_string": tokenCookieString,
              "user_agent": userAgent,
              "user_ip": userIP,
              "remember_me": rememberme
            }
            let encryptedToken = encrypt(JSON.stringify(tokenData), process.env.NETWORK_PRIMARY_ENCRYPTION_KEY);

            let frontEndData = {
              "user_id": tokenUserID,
              "user_email": tokenUserEmail,
              "pw_age": tokenPwAge,
              "user_meta": tokenUserMeta,
              "privileges": tokenPrivileges,
              "xPrivileges": tokenXPrivileges
            }

            outputResult['status'] = 1;
            outputResult['qry'] = 1;
            outputResult["remember_me"] = rememberme;
            outputResult['user_data'] = frontEndData;
            outputResult["token"] = encryptedToken;
            outputResult["newcsrf"] = newCsrfToken;

            let authCookieId = platformData.platform_tag.toUpperCase() + 'AUTH';

            const domain = getBaseDomain(req.headers.host);
            
            appendUniqueCookie(res, authCookieId, encryptedToken, domain);

            clearMalicious(req);
            logActivity(req, tokenUserID, platform, "LOGGED IN WTH 2FA VALIDATION");

          } else {

            msg[15] = sysMsg[15];

            logActivity(req, tokenUserID, platform, "15");
            logMalicious(req, "INVALID 2FA TOKEN INPUT");
          }

        } else {

          msg[16] = sysMsg[16];

          logMalicious(req, "16");
          logActivity(req, tokenUserID, platform, "Invalid or expired 2fa token");
        }
      } else {
        msg[17] = sysMsg[17];

        logMalicious(req, "17");
      }
    } else {
      msg[15] = sysMsg[15];

      logMalicious(req, "15");
    }

    resSendOk(req, res, outputResult, msg);

    return null;

  } catch (error) {

    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }

    msg[0] = sysMsg[0];
    resSendOk(req, res, outputResult, msg);

    return null;
  }
}

export default handleTwoFA;