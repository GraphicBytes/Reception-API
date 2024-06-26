//####################################################
//############### GET USER GROUPS DATA ###############
//####################################################

////////////////////////////
////// CONFIG IMPORTS //////
//////////////////////////// 
import { defaultPermissions } from '../../config/defaultPermissions.js';
import { sysMsg } from '../../config/systemMessages.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { requestUserCheck } from '../../functions/requestUserCheck.js'; 
import { getUser } from '../../functions/getUser.js';
import { getUserPrivileges } from '../../functions/getUserPrivileges.js';
import { getAllUserGroups } from '../../functions/getUserGroups.js';
import { getPlatformData } from '../../functions/getPlatformData.js';

//////////////////////////////////////
////// RESULT SENDING FUNCTIONS //////
//////////////////////////////////////
import { resSendOk } from '../../functions/resSend/resSendOk.js';

//////////////////////////////
////// HELPER FUNCTIONS //////
//////////////////////////////
import { isNullOrEmpty } from '../../functions/helpers/isNullOrEmpty.js';
import { removeObjIds } from '../../functions/helpers/removeObjIds.js';
import { removeAdminPrivs } from '../../functions/helpers/removeAdminPrivs.js';
import { removeUserPrivs } from '../../functions/helpers/removeUserPrivs.js';

//////////////////////////////////////////
////// MALICIOUS ACTIVITY FUNCTIONS //////
//////////////////////////////////////////
import { logMalicious } from '../../functions/malicious/logMalicious.js'; 

//////////////////////////
////// THIS HANDLER //////
//////////////////////////
async function handleGetUserGroups(app, req, res) {

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

    //##########################
    //##### HANDLE REQUEST #####
    //##########################
      
    //////////////////////
    ////// GET USER DATA //////
    //////////////////////
    let userData = await getUser(tokenData.user_email, platform);
    if (!userData) {
      
      msg[18] = sysMsg[18];

      logMalicious(req, "18");
      resSendOk(req, res, outputResult, msg);
      return null;
    }

    //////////////////////
    ////// GET USER GROUPS //////
    //////////////////////
    let userGroups = userData.userData[platform].user_groups;
    let fullPrivileges = await getUserPrivileges(userGroups, platform, true);
    let privileges = fullPrivileges.privileges;

    if (
      (
        privileges.reception.view_user_groups === 1
        && privileges.reception.view_user_groups === 1
      )
      || privileges.settings.super_admin === 1
    ) {

      // get user groups
      const systemUserGroups = await getAllUserGroups(platform); 

      let systemUserGroupsClean = await removeObjIds(systemUserGroups);
      systemUserGroupsClean = await removeAdminPrivs(systemUserGroupsClean);
      systemUserGroupsClean = await removeUserPrivs(systemUserGroupsClean);
      
      //outputResult['groups'] = systemUserGroupsClean;
      outputResult['default_permissions'] = JSON.parse(JSON.stringify(defaultPermissions.privileges));
      outputResult['status'] = 1; 
      outputResult['qry'] = 1;
      
      outputResult['data'] = systemUserGroupsClean;

      resSendOk(req, res, outputResult, msg);
      return null;

    } else {
      outputResult['status'] = 0;
      msg[13] = sysMsg[13];
      resSendOk(req, res, outputResult, msg);
      return null;
    }

  } catch (error) {

    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }

    msg[0] = sysMsg[0];
    resSendOk(req, res, outputResult, msg);

    return null;
  }
}

export default handleGetUserGroups;