//##################################################################
//############### PASSWORD RESET NEW PASSWORD SUBMIT ###############
//################################################################## 

////////////////////////////
////// CONFIG IMPORTS //////
////////////////////////////
import { sysMsg } from '../../config/systemMessages.js';

////////////////////////////////
////// DATA MODEL IMPORTS //////
////////////////////////////////
import { usersModel } from '../../models/usersModel.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { logActivity } from '../../functions/logActivity.js';
import { getUser } from '../../functions/getUser.js';
import { checkPasswordStrength } from '../../functions/checkPasswordStrength.js';
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

//////////////////////////////////
////// ENCRYPTION FUNCTIONS //////
//////////////////////////////////
import { decrypt } from '../../functions/crypt/decrypt.js';
import { hashPW } from '../../functions/crypt/hashPW.js';
import { randomString } from '../../functions/crypt/randomString.js';

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
async function handlePwResetNewPwSubmit(app, req, res) {

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
      isNullOrEmpty(req.body.transittoken)
      || isNullOrEmpty(req.body.csrf)
      || isNullOrEmpty(req.body.pwa)
      || isNullOrEmpty(req.body.pwb)
    ) {

      msg[4] = sysMsg[4];

      logMalicious(req, "4");
      resSendOk(req, res, outputResult, msg);
      return null;
    }

    let transitToken = req.body.transittoken;
    let pwa = req.body.pwa;
    let pwb = req.body.pwb;

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

    let sessionID = await getSession(app, req, res, platformData);
    let transitTokenData = JSON.parse(decrypt(transitToken, process.env.NETWORK_PRIMARY_ENCRYPTION_KEY));

    let tokenSessionID = transitTokenData.session_id;
    let tokenPlatform = transitTokenData.platform;
    let tokenUserID = transitTokenData.user_id;
    let tokenUserEmail = transitTokenData.user_email;
    let tokenCookieString = transitTokenData.cookie_string;
    let tokenCreated = transitTokenData.created;
    let tokenIP = transitTokenData.user_ip;
    let tokenUserAgent = transitTokenData.user_agent;
    let tokenAction = transitTokenData.action;

    let userAgent = theUserAgent(req);
    let userIP = theUserIP(req);
    let requestTime = theEpochTime();
    let tokenAgeCutoff = requestTime - platformData.two_fa_timeout;

    if (
      tokenPlatform === platform
      && tokenCreated > tokenAgeCutoff
      && tokenAction === "reset_pw_allowed"
      && (
        (
          userIP === tokenIP
          && userAgent === tokenUserAgent
          && tokenSessionID === sessionID
        )
        || (
          tokenSessionID === "user-invite"
        )
      )
    ) {

      let userData = await getUser(tokenUserEmail, platform);

      let savedCookieString = userData.userData[platform].cookie_string;

      if (tokenCookieString === savedCookieString) {

        if (pwa === pwb) {

          let passwordStrongEnough = await checkPasswordStrength(platform, pwa);

          if (passwordStrongEnough) {

            let newCsrfToken = await createCsrfToken(app, req, res, platformData);
            let newPwHash = await hashPW(pwa);
            let newCookieString = randomString(32);

            userData.userData[platform].cookie_string = newCookieString;
            userData.userData[platform].password = newPwHash;
            userData.userData[platform].invite_token_open = 0;

            let filter = { email: tokenUserEmail, platform: platform };
            let update = {
              $set: {
                data: userData.userData
              }
            };
            let opts = { upsert: true };
            usersModel.collection.updateOne(filter, update, opts);

            outputResult['newcsrf'] = newCsrfToken;
            outputResult['status'] = 2;
            outputResult['qry'] = 1;

            clearMalicious(req);

          } else {
            outputResult['status'] = 1;
            msg[49] = sysMsg[49];
            logActivity(req, tokenUserID, platform, "USER " + tokenUserID + ": TRIED TO USE RESET PASSWORD TO ONE THAT IS INSECURE");
          }
        } else {

          msg[46] = sysMsg[46];
          logMalicious(req, "46");

          logActivity(req, tokenUserID, platform, "USER " + tokenUserID + ": DIDN'T SUBMIT MATCHING PASSWORDS WHILE TRYING TO RESET");
        }

      } else {
        logActivity(req, tokenUserID, platform, "USER " + tokenUserID + ": INVALID PASSWORD RESET COOKIE STRING OR USER LOCKED OUT OR BANNED");

        msg[45] = sysMsg[45];
        logMalicious(req, "45");
      }

    } else {
      logActivity(req, tokenUserID, platform, "USER " + tokenUserID + ": INVALID PASSWORD RESET TOKEN USED");

      msg[16] = sysMsg[16];
      logMalicious(req, "16");
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

export default handlePwResetNewPwSubmit;