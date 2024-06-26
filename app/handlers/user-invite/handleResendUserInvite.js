//################################################
//############### UPDATE USER DATA ###############
//################################################

////////////////////////////
////// CONFIG IMPORTS //////
////////////////////////////
import { sysMsg } from '../../config/systemMessages.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { requestUserCheck } from '../../functions/requestUserCheck.js';
import { getUser } from '../../functions/getUser.js';
import { getUserByIdUnfiltered } from '../../functions/getUserById.js';
import { getUserPrivileges } from '../../functions/getUserPrivileges.js';
import { getPlatformData } from '../../functions/getPlatformData.js';

//////////////////////////////////////
////// RESULT SENDING FUNCTIONS //////
//////////////////////////////////////
import { resSendOk } from '../../functions/resSend/resSendOk.js';

//////////////////////////////
////// HELPER FUNCTIONS //////
//////////////////////////////
import { isNullOrEmpty } from '../../functions/helpers/isNullOrEmpty.js';
import { theEpochTime } from '../../functions/helpers/theEpochTime.js';
import { theUserAgent } from '../../functions/helpers/theUserAgent.js';
import { theUserIP } from '../../functions/helpers/theUserIP.js';

//////////////////////////////////
////// ENCRYPTION FUNCTIONS //////
//////////////////////////////////
import { encrypt, encryptUrlSafe } from '../../functions/crypt/encrypt.js';
import { randomString } from '../../functions/crypt/randomString.js';

//////////////////////////////////////////
////// MALICIOUS ACTIVITY FUNCTIONS //////
//////////////////////////////////////////
import { logMalicious } from '../../functions/malicious/logMalicious.js';

//////////////////////////
////// THIS HANDLER //////
//////////////////////////
async function handleResendUserInvite(app, req, res) {

  let outputResult = {
    "status": 0,
    "qry": 0,
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

    let userID = req.params.userid;
    if (userID === undefined || userID === "") {

      msg[14] = sysMsg[14];

      logMalicious(req, "14");
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

    //////////////////////////////
    //// check user privileges ////
    //////////////////////////////
    let userGroups = userData.userData[platform].user_groups;
    let fullPrivileges = await getUserPrivileges(userGroups, platform, true);
    let privileges = fullPrivileges.privileges;
    if (!(privileges.reception.edit_users === 1 || privileges.settings.super_admin === 1)) {

      msg[13] = sysMsg[13];

      logMalicious(req, "13");
      resSendOk(req, res, outputResult, msg);
      logSystemActivity(req, userData.userID, platform, "DENIED USER INVITE RESEND: " + userID);
      return null;
    }

    //////////////////////
    //// Get old data ////
    ////////////////////// 
    let newUserData = await getUserByIdUnfiltered(userID, platform);
    if (!newUserData) {

      msg[18] = sysMsg[18];

      logMalicious(req, "18");
      resSendOk(req, res, outputResult, msg);
      logSystemActivity(req, userData.userID, platform, "DENIED USER INVITE RESEND: " + userID);
      return null;
    }

    ////////////////////////////////////////////////////
    //// Check user hasn't already completed signup ////
    ////////////////////////////////////////////////////

    // console.log(newUserData.data[platform].invite_token_open)
    let inviteAlreadyComplete = 1;

    if (newUserData.data[platform] !== undefined) {
      if (newUserData.data[platform].invite_token_open !== undefined) {
        inviteAlreadyComplete = newUserData.data[platform].invite_token_open;
      }
    }

    if (inviteAlreadyComplete === 1 && newUserData.banned === 0 && newUserData.hidden === 0) {

      msg[50] = sysMsg[50];

      logMalicious(req, "50");
      resSendOk(req, res, outputResult, msg);
      return null;
    }



    let requestTime = theEpochTime();
    let emailerTokenDataMarker = randomString(10) + "-" + requestTime;
    let userAgent = theUserAgent(req);
    let userIP = theUserIP(req);

    let twoFaCode = randomString(platformData.two_fa_characters);
    let tokenMarker = randomString(8);

    let groupData = {};

    let loginUrlTokenData = {
      platform: platform,
      two_fa: twoFaCode,
      user_id: userID,
      marker: tokenMarker,
      time_created: requestTime
    }

    const loginUrlToken = encryptUrlSafe(JSON.stringify(loginUrlTokenData), process.env.NETWORK_PRIMARY_ENCRYPTION_KEY);

    const inviteLoginUrl = platformData.admin_app_url + "/login?invite=" + loginUrlToken;

    let transitTokenData = {
      "platform": platform,
      "user_ip": userIP,
      "user_agent": userAgent,
      "token_age": requestTime,
      "new_user_id": userID,
    }

    
    const capitalizeFirstLetter = string =>
      string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();

    let inviteGroups = Object.values(newUserData.data[platform].user_groups)
      .map(value => capitalizeFirstLetter(value))
      .join(', ');

    let emailerTokenData = {
      "platform": platform,
      "template": "user_invite",
      "sendto": newUserData.email,
      "priority": 1,
      "marker": emailerTokenDataMarker,
      "user_ip": userIP,
      "user_agent": userAgent,
      "token_age": requestTime,
      "email_template_values": {
        "two_fa_token": twoFaCode,
        "ip_address": userIP,
        "inviter_email": newUserData.email,
        "login_url": inviteLoginUrl,
        "support_email": platformData.support_email,
        "inviter_name": newUserData.data[platform].user_meta.first_name + " " + newUserData.data[platform].user_meta.surname,
        "invite_groups": inviteGroups
      },
      "transit_token": transitTokenData
    }

    let encryptedEmailerTokenData = encrypt(JSON.stringify(emailerTokenData), process.env.NETWORK_PRIMARY_ENCRYPTION_KEY);

    outputResult['status'] = 1;
    outputResult['qry'] = 1;
    outputResult['emailer_token'] = encryptedEmailerTokenData;

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

export default handleResendUserInvite;