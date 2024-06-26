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
import { logSystemActivity } from '../../functions/logActivity.js';
import { logRecentlyUsed } from '../../functions/logRecentlyUsed.js';
import { getUser } from '../../functions/getUser.js';
import { getUserPrivileges } from '../../functions/getUserPrivileges.js';
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
import { encrypt } from '../../functions/crypt/encrypt.js'; 
import { randomString } from '../../functions/crypt/randomString.js';

//////////////////////////////////////////
////// MALICIOUS ACTIVITY FUNCTIONS //////
//////////////////////////////////////////
import { logMalicious } from '../../functions/malicious/logMalicious.js'; 

//////////////////////////
////// THIS HANDLER //////
//////////////////////////
async function handleGetAdminToken(app, req, res) {

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
    let cookieString = userData.userData[platform].cookie_string;
    let userGroups = userData.userData[platform].user_groups;

    const superUser = userData.userData[platform].super_user === 1 ? 1 : 0;

    let currentTime = theEpochTime();
    let getRawTime = theEpochTime();
    let sessionID = await getSession(app, req, res, platformData);
    let userAgent = theUserAgent(req);

    let reusableToken = platformData.admin_token_reusable;
    let ttl = platformData.user_token_ttl;
    let killAt = currentTime + ttl;
    let userIp = theUserIP(req);
    let tokenMarker = randomString(8) + "-" + getRawTime;

    let fullPrivileges = await getUserPrivileges(userGroups, platform, false);
    //let privileges = fullPrivileges.privileges;
    let individualPrivileges = fullPrivileges.individualPrivileges;

    let newTokenData = {
      platform: platform,
      super_user: superUser,
      user_id: userID,
      privileges: individualPrivileges, 
      user_agent: userAgent,
      user_ip: userIp,
      created: currentTime,
      kill_at: killAt,
      ttl: ttl,
      token_reusable: reusableToken,
      cookie_string: cookieString,
      token_marker: tokenMarker,
      session_id: sessionID
    } 

    if (req.body.log_activity
      && req.body.log_data
      && parseInt(req.body.log_activity) === 1
      && req.body.log_data.length > 0
    ) {

      let logData = JSON.parse(req.body.log_data);

      if (logData) {

        logRecentlyUsed(req, userData.userID, platform, logData)

      } else { 
        msg[30] = sysMsg[30];
      }

    } else {
      logSystemActivity(req, userData.userID, platform, "USER " + userData.userID + ": REQUESTED ADMIN TOKEN");
    }

    let encryptedTokenData = encrypt(JSON.stringify(newTokenData), process.env.NETWORK_PRIMARY_ENCRYPTION_KEY);
    outputResult['status'] = 1;
    outputResult['qry'] = 1;
    outputResult['token'] = encryptedTokenData;

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

export default handleGetAdminToken;