//#####################################################
//############### GET FILE ACCESS TOKEN ###############
//#####################################################

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
import { getFileUserGroupIDs } from '../../functions/getFileUserGroupIDs.js';
import { getPlatformData } from '../../functions/getPlatformData.js';
import { getSession } from '../../functions/getSession.js';
import { getUserPrivileges } from '../../functions/getUserPrivileges.js';

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
import { md5 } from '../../functions/crypt/md5.js';

//////////////////////////////////////////
////// MALICIOUS ACTIVITY FUNCTIONS //////
//////////////////////////////////////////
import { logMalicious } from '../../functions/malicious/logMalicious.js'; 

//////////////////////////
////// THIS HANDLER //////
//////////////////////////
async function handleGetFileAccessToken(app, req, res) {

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
    let userID = userData.userID;
    let userGroups = userData.userData[platform].user_groups;

    let fullPrivileges = await getUserPrivileges(userGroups, platform, true);
    let privileges = fullPrivileges.privileges;

    let canModerate = privileges.archives.view_submissions;

    let currentTime = theEpochTime();
    let userAgent = theUserAgent(req);
    let userAgentMD5 = md5(userAgent);

    let sessionID = await getSession(app, req, res, platformData);

    let userIp = theUserIP(req);
    let userIpMD5 = md5(userIp);

    let fileAccessGroups = await getFileUserGroupIDs(userGroups, platform, false);

    let newTokenData = {
      user_id: userID,
      user_agent: userAgentMD5,
      user_ip: userIpMD5,
      created: currentTime,
      groups: fileAccessGroups,
      bypass_perms: canModerate,
      session_id: sessionID
    }

    let encryptedTokenData = encrypt(JSON.stringify(newTokenData), process.env.NETWORK_MINOR_ENCRYPTION_KEY);
    encryptedTokenData = encryptedTokenData.replace(".", '_');

    outputResult['status'] = 1;
    outputResult['qry'] = 1;
    outputResult['token'] = encryptedTokenData;

    logSystemActivity(req, userData.userID, platform, "REQUESTED FILE ACCESS TOKEN");

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

export default handleGetFileAccessToken;