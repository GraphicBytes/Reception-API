//#############################################################
//############### PASSWORD RESET 2FA SUBMISSION ###############
//#############################################################

////////////////////////////
////// CONFIG IMPORTS //////
////////////////////////////
import { sysMsg } from '../../config/systemMessages.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { getUserById } from '../../functions/getUserById.js';
import { getPlatformData } from '../../functions/getPlatformData.js';

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
import { encrypt } from '../../functions/crypt/encrypt.js';
import { decryptUrlSafe } from '../../functions/crypt/decrypt.js';

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
async function handleUserInviteTwoFa(app, req, res) {

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
      || isNullOrEmpty(req.body.csrf)
      || isNullOrEmpty(req.body.token)
    ) {

      msg[4] = sysMsg[4];

      logMalicious(req, "4");
      resSendOk(req, res, outputResult, msg);
      return null;
    }

    let twofacode = req.body.twofacode;
    const tokenraw = req.body.token;
    const token = tokenraw.replace(/ /g, "%20");

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

      let twoFaTokenData = JSON.parse(decryptUrlSafe(token, process.env.NETWORK_PRIMARY_ENCRYPTION_KEY));

      if (twoFaTokenData !== null && twoFaTokenData !== false) {

        let tokenPlatform = twoFaTokenData.platform;
        let tokenTwoFa = twoFaTokenData.two_fa;
        let tokenUserID = twoFaTokenData.user_id;
        let tokenMarker = twoFaTokenData.marker;
        let tokenCreated = twoFaTokenData.time_created;

        let userAgent = theUserAgent(req);
        let userIP = theUserIP(req);
        let requestTime = theEpochTime();

        const userData = await getUserById(tokenUserID, platform);
        const userInviteTokenOpen = userData.userData[platform].invite_token_open;

        if (userData) {

          if (tokenPlatform === platform) {

            if (userInviteTokenOpen === 1) {

              if (tokenTwoFa === twofacode) {

                let newCsrfToken = await createCsrfToken(app, req, res, platformData);
                let tokenSessionID = "user-invite"

                // console.log(userData)

                let transitTokenData = {
                  "session_id": tokenSessionID,
                  "platform": platform,
                  "user_id": userData.userID,
                  "user_email": userData.userEmail,
                  "cookie_string": userData.userData[platform].cookie_string,
                  "created": requestTime,
                  "user_ip": userIP,
                  "user_agent": userAgent,
                  "action": "reset_pw_allowed"
                }

                let encryptedTransitTokenData = encrypt(JSON.stringify(transitTokenData), process.env.NETWORK_PRIMARY_ENCRYPTION_KEY);

                outputResult['status'] = 1;
                outputResult['qry'] = 1;
                outputResult['transitToken'] = encryptedTransitTokenData;
                outputResult['newcsrf'] = newCsrfToken;

                clearMalicious(req);

              } else {
                msg[15] = sysMsg[15];
                logMalicious(req, "15");
              }
            } else {
              outputResult['status'] = 2;
              outputResult['qry'] = 0;
              msg[19] = sysMsg[19];
              logMalicious(req, "19");
            }
          } else {
            msg[7] = sysMsg[7];
            logMalicious(req, "7");
          }
        } else {
          msg[11] = sysMsg[11];
          logMalicious(req, "11");
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

export default handleUserInviteTwoFa;