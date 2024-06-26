//######################################################
//############### GET USER ACTIVITY DATA ###############
//######################################################

////////////////////////////
////// CONFIG IMPORTS //////
////////////////////////////
import { sysMsg } from '../../config/systemMessages.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { requestUserCheck } from '../../functions/requestUserCheck.js'; 
import { logSystemActivity } from '../../functions/logActivity.js';
import { getUser } from '../../functions/getUser.js';
import { getUserPrivileges } from '../../functions/getUserPrivileges.js'; 
import { getRecentlyUsed } from '../../functions/getRecentlyUsed.js';
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

//////////////////////////
////// THIS HANDLER //////
//////////////////////////
async function handleGetRecentlyUsed(app, req, res) {

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

    let userID = tokenData.user_id;

    let userGroups = userData.userData[platform].user_groups;

    let fullPrivileges = await getUserPrivileges(userGroups, platform, true);
    let privileges = fullPrivileges.privileges;

    if (privileges.reception.view_user_activity === 1 || privileges.settings.super_admin === 1) {

      //console.log(privileges)
  
      //const userActivty = await getUserActivity(platform, userID);
      const recentActivtyData = await getRecentlyUsed(platform, userID);

      let recentActivty = {};
      let alreadyUsed = [];
      let i = 0;

      for (const activity of recentActivtyData) {

        let actionkey = JSON.stringify(activity.action)

        if (!alreadyUsed.includes(actionkey)) {
          recentActivty[i] = activity;
          alreadyUsed.push(actionkey)
        }
        i++
      }

      outputResult['status'] = 1; 
      outputResult['qry'] = 1;
      outputResult['data'] = recentActivtyData;

    } else {

      outputResult['status'] = 0;
      msg[13] = sysMsg[13];

      logSystemActivity(req, userData.userID, platform, "DENIED DATA EDIT FOR USER: " + userID);

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

export default handleGetRecentlyUsed;