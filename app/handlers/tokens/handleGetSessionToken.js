//##############################################
//############### GET CSRF TOKEN ###############
//##############################################

////////////////////////////
////// CONFIG IMPORTS //////
////////////////////////////
import { sysMsg } from '../../config/systemMessages.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { getPlatformData } from '../../functions/getPlatformData.js';

//////////////////////////////////////
////// RESULT SENDING FUNCTIONS //////
//////////////////////////////////////
import { resSendOk } from '../../functions/resSend/resSendOk.js';

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
async function handleGetSessionToken(app, req, res) {

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

    //######-----
    //#### ASYNC CHUNK ----
    //######------
    const [isMalicious, newCsrfToken] = await Promise.all([
      checkMalicious(req, platformData),
      createCsrfToken(app, req, res, platformData), 
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

    //##########################
    //##### HANDLE REQUEST #####
    //##########################
    if (newCsrfToken) {
      outputResult['status'] = 1;
      outputResult['qry'] = 1;
      outputResult['token'] = newCsrfToken;
    } else {
      outputResult['qry'] = 0;
      msg[3] = sysMsg[3];
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

export default handleGetSessionToken;