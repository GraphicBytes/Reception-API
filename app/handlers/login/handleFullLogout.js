//################################################
//############### FULL USER LOGOUT ###############
//################################################ 

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
import { requestUserCheck } from '../../functions/requestUserCheck.js'; 
import { logMalicious } from '../../functions/malicious/logMalicious.js'; 
import { getUser } from '../../functions/getUser.js';
import { getPlatformData } from '../../functions/getPlatformData.js';

//////////////////////////////////////
////// RESULT SENDING FUNCTIONS //////
//////////////////////////////////////
import { resSendOk } from '../../functions/resSend/resSendOk.js';

//////////////////////////////
////// HELPER FUNCTIONS //////
//////////////////////////////
import { isNullOrEmpty } from '../../functions/helpers/isNullOrEmpty.js';

//////////////////////////////////
////// ENCRYPTION FUNCTIONS //////
//////////////////////////////////
import { randomString } from '../../functions/crypt/randomString.js';

//////////////////////////
////// THIS HANDLER //////
//////////////////////////
async function handleFullLogout(app, req, res) {

  let outputResult = {
    "status": 0,
    "qry": 0,
    "msg":{}
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
      isNullOrEmpty(req.body.csrf)
    ) {

      msg[4] = sysMsg[4];

      logMalicious(req, "4");
      resSendOk(req, res, outputResult, msg);
      return null;
    }

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
    ////// CHECK USER //////
    ////////////////////// 
    const tokenData = await requestUserCheck(app, req, res, platformData);

    //////////////////////
    ////// GET CURRENT USER DATA //////
    //////////////////////
    let userData = await getUser(tokenData.user_email, platform);
    if (!userData) {
      
      msg[18] = sysMsg[18];

      logMalicious(req, "18");
      resSendOk(req, res, outputResult, msg);
      return null;
    }


    //##########################
    //##### HANDLE REQUEST #####
    //########################## 
 
      let newCookieString = randomString(32);
      userData.userData[platform].cookie_string = newCookieString;

      let filter = { email: tokenData.user_email, platform: platform };
      let update = {
        $set: {
          data: userData.userData
        }
      };
      let opts = { upsert: true };
      usersModel.collection.updateOne(filter, update, opts);
  
    outputResult['status'] = 1;
    outputResult['qry'] = 1;
 

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

export default handleFullLogout;