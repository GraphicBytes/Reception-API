//#################################################
//############### CHECK AUTH COOKIE ###############
//#################################################

////////////////////////////
////// CONFIG IMPORTS //////
////////////////////////////
import { sysMsg } from '../../config/systemMessages.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { openAuthToken } from '../../functions/openAuthToken.js';
import { getPlatformData } from '../../functions/getPlatformData.js';

//////////////////////////////////////
////// RESULT SENDING FUNCTIONS //////
//////////////////////////////////////
import { resSendOk } from '../../functions/resSend/resSendOk.js';

//////////////////////////////
////// HELPER FUNCTIONS //////
//////////////////////////////
import { isNullOrEmpty } from '../../functions/helpers/isNullOrEmpty.js';

//////////////////////////////////////////
////// MALICIOUS ACTIVITY FUNCTIONS //////
//////////////////////////////////////////
import { logMalicious } from '../../functions/malicious/logMalicious.js';
import { checkMalicious } from '../../functions/malicious/checkMalicious.js';

////////////////////////////
////// CSRF FUNCTIONS //////
////////////////////////////
import { createCsrfToken } from '../../functions/csrf/createCsrfToken.js';

//////////////////////////
////// THIS HANDLER //////
//////////////////////////
async function handleCheckCookie(app, req, res, adminLogin) {

  let outputResult = {
    "status": 0,
    "qry": 0
  };
  let msg = {}

  try {

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

    //////////////////////
    ////// CHECK AUTH COOKIE //////
    //////////////////////    
    let cookieId = platformData.platform_tag.toUpperCase() + 'AUTH';
    let token = req.cookies[cookieId];
    if (
      isNullOrEmpty(token)
    ) {

      msg[56] = sysMsg[56];

      logMalicious(req, "56");
      resSendOk(req, res, outputResult, msg);
      return null;
    }

    //######-----
    //#### ASYNC CHUNK ----
    //######------
    const [isMalicious, authTokenData, newCsrfToken] = await Promise.all([
      checkMalicious(req, platformData),
      openAuthToken(app, req, res, platform, token),
      createCsrfToken(app, req, res, platformData)
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
    ////// OPEN TOKEN //////
    ////////////////////// 
    if (!authTokenData) {

      msg[18] = sysMsg[18];

      logMalicious(req, "18");
      resSendOk(req, res, outputResult, msg);
      return null;
    }

    //##########################
    //##### HANDLE REQUEST #####
    //##########################

    //////////////////////
    ////// Handle Rest //////
    //////////////////////
    let userData = authTokenData.userData;
    //let userPrivileges = authTokenData.userPrivileges;
    let privileges = authTokenData.privileges;

    let userID = userData.userID;
    let userEmail = userData.userEmail;
    let pwAge = userData.userData[platform].pw_age;
    let userMeta = userData.userData[platform].user_meta;

    let frontEndData = {
      "user_id": userID,
      "user_email": userEmail,
      "pw_age": pwAge,
      "user_meta": userMeta,
      "privileges": privileges
    }

    outputResult['status'] = 1;
    outputResult['qry'] = 1;
    outputResult['csrf'] = newCsrfToken;
    outputResult['user_data'] = frontEndData;

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

export default handleCheckCookie;