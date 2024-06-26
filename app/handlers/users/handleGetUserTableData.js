//####################################################
//############### GET SUPER USER TOKEN ###############
//####################################################

////////////////////////////
////// CONFIG IMPORTS //////
////////////////////////////
import { sysMsg } from '../../config/systemMessages.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { requestUserCheck } from '../../functions/requestUserCheck.js';
import { getUser } from '../../functions/getUser.js';
import { getUsersTableData } from '../../functions/getUsersTableData.js';
import { getUserPrivileges } from '../../functions/getUserPrivileges.js';
import { getUserTags } from '../../functions/getUserTags.js';
import { getUserGroups } from '../../functions/getUserGroups.js';
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
async function handleGetUserTableData(app, req, res) {

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
    ////// CHECK AUTH TOKEN //////
    //////////////////////
    let userData = await getUser(tokenData.user_email, platform);
    if (!userData) {

      msg[18] = sysMsg[18];

      logMalicious(req, "18");
      resSendOk(req, res, outputResult, msg);
      return null;
    }

    //////////////////////
    ////// CHECK TOKEN PRIVILEGES //////
    //////////////////////
    let userGroups = userData.userData[platform].user_groups;
    let fullPrivileges = await getUserPrivileges(userGroups, platform, true);
    let privileges = fullPrivileges.privileges;

    if (!(privileges.reception.view_users === 1 || privileges.settings.super_admin === 1)) {

      msg[13] = sysMsg[13];

      logMalicious(req, "13");
      resSendOk(req, res, outputResult, msg);
      return null;
    }


    //////////////////////////
    ////// THIS HANDLER //////
    //////////////////////////

    let status = "Locked";
    if (userData.banned === 0) {
      status = "Active";

      if (userData.userData[platform].invite_token_open !== undefined) {
        if (userData.userData[platform].invite_token_open === 1) {
          status = "Pending";
        }
      }
    }

    let lastLocked = 0;
    if (userData.userData.time_banned !== undefined) {
      lastLocked = userData.userData.time_banned;
    }

    const [systemUserGroups, tableData, userTags] = await Promise.all([
      getUserGroups(platform),
      getUsersTableData(platform),
      getUserTags(platform)
    ]);

    // get user tags
    const tagNamesClean = await userTags.map(function (tag) {
      return {
        tag_id: tag.tag_id,
        tag_name: tag.tag_name,
        platform: tag.platform
      };
    });

    // get user groups
    let systemUserGroupsClean = await removeObjIds(systemUserGroups);
    systemUserGroupsClean = await removeAdminPrivs(systemUserGroupsClean);
    systemUserGroupsClean = await removeUserPrivs(systemUserGroupsClean);

    outputResult['request'] = 1;
    outputResult['status'] = 1;
    outputResult['qry'] = 1;
    outputResult['user_status'] = status;
    outputResult['last_locked'] = lastLocked;
    outputResult['userGroups'] = systemUserGroupsClean;
    outputResult['userTags'] = tagNamesClean;
    outputResult['tableData'] = tableData;

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

export default handleGetUserTableData;