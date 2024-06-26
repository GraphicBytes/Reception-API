//######################################################
//############### PASSWORD RESET REQUEST ###############
//###################################################### 

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
import { isValidEmail } from '../../functions/helpers/isValidEmail.js';

//////////////////////////////////
////// ENCRYPTION FUNCTIONS //////
//////////////////////////////////
import { encrypt } from '../../functions/crypt/encrypt.js';
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
async function handlePwResetRequest(app, req, res) {

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
      isNullOrEmpty(req.body.email)
      || isNullOrEmpty(req.body.csrf)
      || !isValidEmail(req.body.email)
    ) {

      msg[4] = sysMsg[4];

      logMalicious(req, "4");
      resSendOk(req, res, outputResult, msg);
      return null;
    }

    let userEmail = req.body.email;

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

    //////////////////////
    ////// GET CURRENT USER DATA //////
    //////////////////////
    let userData = await getUser(userEmail, platform);
    if (!userData) {
      
      msg[18] = sysMsg[18];

      logMalicious(req, "18");
      resSendOk(req, res, outputResult, msg);
      return null;
    }

    //##########################
    //##### HANDLE REQUEST #####
    //##########################
    let sessionID = await getSession(app, req, res, platformData);

    let userID = userData.userID;
    let userBanned = parseInt(userData.userBanned);
    let userLoginFail = parseInt(userData.userLoginFail);
    let userLastAttempt = parseInt(userData.lastAttempt);

    let maxPwAttempts = platformData.maximum_pw_attempts;
    var attemptsUpdateValue = userLoginFail + 1;
    let requestTime = theEpochTime();

    let userAgent = theUserAgent(req);
    let userIP = theUserIP(req);

    let loginFloodTimer = requestTime - platformData.login_flood_timeout;

    if (userBanned !== 1 && userLoginFail < maxPwAttempts) {

      if (userLastAttempt < loginFloodTimer) {

        if (!isNullOrEmpty(userData.userData[platform])) {

          let emailerTokenDataMarker = await randomString(10) + "-" + requestTime;
          let newCsrfToken = await createCsrfToken(app, req, res, platformData);

          let cookieString = userData.userData[platform].cookie_string;

          let twoFaCode = await randomString(platformData.two_fa_characters);

          let transitTokenData = {
            "session_id": sessionID,
            "platform": platform,
            "user_id": userID,
            "user_email": userEmail,
            "cookie_string": cookieString,
            "created": requestTime,
            "user_ip": userIP,
            "user_agent": userAgent,
            "two_fa_code": twoFaCode,
          }

          let emailerTokenData = {
            "platform": platform,
            "template": "pw_reset_2fa",
            "sendto": userEmail,
            "priority": 1,
            "marker": emailerTokenDataMarker,
            "user_ip": userIP,
            "user_agent": userAgent,
            "token_age": requestTime,
            "email_template_values": {
              "two_fa_token": twoFaCode,
              "ip_address": userIP,
              "email": userEmail,
              "login_url": platformData.admin_app_url,
              "support_email": platformData.support_email
            },
            "transit_token": transitTokenData
          }

          let encryptedEmailerTokenData = encrypt(JSON.stringify(emailerTokenData), process.env.NETWORK_PRIMARY_ENCRYPTION_KEY);
 
          outputResult['status'] = 1;
          outputResult['qry'] = 1;
          outputResult['newcsrf'] = newCsrfToken;
          outputResult['token'] = encryptedEmailerTokenData;

          let failFilter = { email: userEmail, platform: platform };
          let failUpdate = {
            $set: {
              login_fail: 0,
              last_attempt: requestTime,
              "data.last_attempt_ip": userIP
            }
          };
          let failOpts = { upsert: true };
          usersModel.collection.updateOne(failFilter, failUpdate, failOpts);

          clearMalicious(req);

        } else {
          msg[7] = sysMsg[7];
          logMalicious(req, "7");
        }

      } else {

        let filter = { email: req.body.email, platform: platform };
        let update = {
          $set: {
            login_fail: attemptsUpdateValue,
            last_attempt: requestTime,
            "data.last_attempt_ip": userIP
          }
        };
        let opts = { upsert: true };
        usersModel.collection.updateOne(filter, update, opts);
        let floodMessage = "PW RESET ATTEMPT BLOCKED DUE TO FLOODING LIMITS"

        logActivity(req, userID, platform, floodMessage);

        msg[10] = sysMsg[10];
        logMalicious(req, "10");
      }

    } else {

      let filter = { email: req.body.email, platform: platform };
      let update = {
        $set: {
          login_fail: attemptsUpdateValue,
          last_attempt: requestTime,
          "data.last_attempt_ip": userIP
        }
      };
      let opts = { upsert: true };
      usersModel.collection.updateOne(filter, update, opts);

      if (userBanned === 1) {

        msg[10] = sysMsg[10];

        logActivity(req, userID, platform, "BANNED USER PW RESET ATTEMPT");
      }
      if (userLoginFail > maxPwAttempts) {

        msg[9] = sysMsg[9];

        var thisMessage = "USER'S LOGIN ATTEMPT BLOCKED AFTER REACHING " + userLoginFail + " LOGIN ATTEMPTS WHICH IS OVER THE LIMIT OF " + maxPwAttempts + " ATTEMPTS";
        logActivity(req, userID, platform, thisMessage);
      }

      msg[10] = sysMsg[10];

      logMalicious(req, "10");

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

export default handlePwResetRequest;