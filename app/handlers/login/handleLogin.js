//##########################################
//############### USER LOGIN ###############
//########################################## 

////////////////////////////
////// CONFIG IMPORTS //////
////////////////////////////
import { sysMsg } from '../../config/systemMessages.js';

////////////////////////////////
////// DATA MODEL IMPORTS //////
////////////////////////////////
import { usersModel } from '../../models/usersModel.js'; 
import { defaultPermissions } from '../../config/defaultPermissions.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { logActivity, logSystemActivity } from '../../functions/logActivity.js';
import { getUser } from '../../functions/getUser.js';
import { getUserGroupData } from '../../functions/getUserGroupData.js';
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
import { isValidEmail } from '../../functions/helpers/isValidEmail.js';

//////////////////////////////////
////// ENCRYPTION FUNCTIONS //////
//////////////////////////////////
import { encrypt } from '../../functions/crypt/encrypt.js';
import { randomString } from '../../functions/crypt/randomString.js';
import { verifyPW } from '../../functions/crypt/verifyPW.js';

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
async function handleLogin(app, req, res, adminLogin) {

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
      isNullOrEmpty(req.body.email)
      || !isValidEmail(req.body.email)
      || isNullOrEmpty(req.body.password)
      || isNullOrEmpty(req.body.csrf)
    ) {
 
      msg[4] = sysMsg[4];

      logMalicious(req, "4");
      resSendOk(req, res, outputResult, msg);
      return null;
    }

    const defaultPerms = JSON.parse(JSON.stringify(defaultPermissions));
    let submittedEmail = req.body.email;
    let submittedPassword = req.body.password;

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
    let userAgent = theUserAgent(req);
    let userIP = theUserIP(req);    
    let sessionID = await getSession(app, req, res, platformData);

    let minPwLength = platformData.minimum_pw_length;
    let maxPwAttempts = platformData.maximum_pw_attempts;

    let userData = await getUser(submittedEmail, platform);

    
    if (userData !== false) {

      let userBanned = parseInt(userData.userBanned);
      let userLoginFail = parseInt(userData.userLoginFail);
      let userLastAttempt = parseInt(userData.lastAttempt);

      let userID = userData.userID;
      let attemptsUpdateValue = userLoginFail + 1;
      let requestTime = theEpochTime();

      if (submittedPassword.length >= minPwLength) {

        let loginFloodTimer = requestTime - platformData.login_flood_timeout;

        if (userBanned !== 1 && userLoginFail < maxPwAttempts) {

          if (userLastAttempt < loginFloodTimer) { 

            if (!isNullOrEmpty(userData.userData[platform])) { 

              let savedPW = userData.userData[platform].password; 
 
              let pwValid = await verifyPW(savedPW, submittedPassword); 
              if (pwValid) {

                let userEmail = userData.userEmail;
                let superUser = userData.userData[platform].super_user;
                let use2fa = userData.userData[platform].use_2fa;
                let cookieString = userData.userData[platform].cookie_string;
                let pwAge = userData.userData[platform].pw_age;
                let userMeta = userData.userData[platform].user_meta;
                let userGroups = userData.userData[platform].user_groups;
 
                let privileges = defaultPerms.privileges;

                for (let groupTag in userGroups) {

                  let thisGroupData = await getUserGroupData(groupTag, platform);

                  if (thisGroupData) {

                    let groupName = thisGroupData.group_name; 
                    let groupLabel = thisGroupData.group_label; 
                    let adminGroupPrivileges = thisGroupData.privileges;

                    for (let privKey in adminGroupPrivileges) {

                      if (typeof privileges[privKey] === 'undefined') {
                        privileges[privKey] = {}
                      }

                      if (typeof privileges["user_groups"] === 'undefined') {
                        privileges["user_groups"] = {}
                      }

                      if (typeof privileges["user_groups"][groupName] === 'undefined') {
                        privileges["user_groups"][groupName] = {
                          group_id: groupTag,
                          group_name: groupName,
                          group_label: groupLabel,
                        }
                      }

                      privileges["user_groups"][groupName][privKey] = {};

                      if (adminGroupPrivileges[privKey].super_admin === 1) {

                        privileges["user_groups"][groupName][privKey] = {};
                        privileges["user_groups"][groupName][privKey]["super_admin"] = 1

                        privileges[privKey] = {};
                        privileges[privKey]["super_admin"] = 1;

                      } else {

                        let doLoop = true;

                        if (typeof privileges[privKey]["super_admin"] !== 'undefined') {

                          if (privileges[privKey]["super_admin"] === 1) {
                            doLoop = false;
                          }

                        }

                        let thisModulePermsList = adminGroupPrivileges[privKey];

                        if (doLoop) {

                          for (let permissionKey in thisModulePermsList) {

                            if (typeof privileges[privKey][permissionKey] === 'undefined') {

                              privileges[privKey][permissionKey] = thisModulePermsList[permissionKey];

                            } else {

                              if (privileges[privKey][permissionKey] === 0) {
                                privileges[privKey][permissionKey] = thisModulePermsList[permissionKey];
                              }

                            }
                          }
                        }

                        privileges["user_groups"][groupName][privKey] = thisModulePermsList;

                      }
                    }

                  }
                }

                //console.log(userIP)

                let failFilter = { email: userEmail, platform: platform };
                let failUpdate = {
                  $set: {
                    login_fail: 0,
                    last_attempt: requestTime,
                    "data.last_attempt_ip": userIP
                  }
                };
                let failOpts = { upsert: true };
                usersModel.collection.updateOne(failFilter, failUpdate, failOpts);

                clearMalicious(req);

                let frontEndData = {
                  "user_id": userID,
                  "user_email": userEmail,
                  "pw_age": pwAge,
                  "user_meta": userMeta,
                  "privileges": privileges
                }

                delete frontEndData.user_meta.notes;

                let newCsrfToken = await createCsrfToken(app, req, res, platformData);

                if (use2fa === 1 || adminLogin === 1) {

                  let twoFaCode = await randomString(platformData.two_fa_characters);

                  let emailerTokenDataMarker = await randomString(10) + "-" + requestTime;

                  let transitTokenData = {
                    "admin_login": adminLogin,
                    "session_id": sessionID,
                    "user_id": userID,
                    "super_user": superUser,
                    "platform": platform,
                    "user_email": userEmail,
                    "created": requestTime,
                    "cookie_string": cookieString,
                    "user_agent": userAgent,
                    "user_ip": userIP,
                    "pw_age": pwAge,
                    "two_fa_code": twoFaCode,
                    "user_meta": userMeta,
                    "privileges": privileges
                  }                  

                  let emailerTokenData = {
                    "platform": platform,
                    "template": "login_2fa",
                    "sendto": userEmail,
                    "priority": 1,
                    "marker": emailerTokenDataMarker,
                    "user_ip": userIP,
                    "user_agent": userAgent,
                    "newcsrf": newCsrfToken,
                    "token_age": requestTime,
                    "email_template_values": {
                      "two_fa_token": twoFaCode,
                      "ip_address": userIP,
                      "login_url": platformData.admin_app_url,
                      "support_email": platformData.support_email
                    },
                    "transit_token": transitTokenData
                  }
                  let encryptedEmailerTokenData = encrypt(JSON.stringify(emailerTokenData), process.env.NETWORK_PRIMARY_ENCRYPTION_KEY);               

                  outputResult['qry'] = 1;
                  outputResult['status'] = 1;
                  outputResult['token'] = encryptedEmailerTokenData;

                  logSystemActivity(req, userID, platform, "SUCCESSFUL 1ST STAGE LOGIN PRE-2FA");

                } else {

                  let tokenData = {
                    "session_id": sessionID,
                    "user_id": userID,
                    "super_user": superUser,
                    "platform": platform,
                    "user_email": userEmail,
                    "created": requestTime,
                    "cookie_string": cookieString,
                    "user_agent": userAgent,
                    "user_ip": userIP,
                    "remember_me": 0,
                  }
                  let encryptedToken = encrypt(JSON.stringify(tokenData), process.env.NETWORK_PRIMARY_ENCRYPTION_KEY);

                  outputResult['qry'] = 1;
                  outputResult['status'] = 2;
                  outputResult['user_data'] = frontEndData;
                  outputResult['token'] = encryptedToken;
                  outputResult['newcsrf'] = newCsrfToken; 

                  logActivity(req, userID, platform, "SUCCESSFUL LOGIN (NO 2FA)");

                }

              } else {

                let failFilter = { email: submittedEmail, platform: platform };
                let failUpdate = {
                  $set: {
                    login_fail: attemptsUpdateValue,
                    last_attempt: requestTime,
                    "data.last_attempt_ip": userIP
                  }
                };
                let failOpts = { upsert: true };
                usersModel.collection.updateOne(failFilter, failUpdate, failOpts);

                msg[6] = sysMsg[6];

                logActivity(req, userID, platform, "INVALID PASSWORD ATTEMPT");
                logMalicious(req, "6");

              }

            } else {

              msg[7] = sysMsg[7];

              logMalicious(req, "7");
            }
          } else {

            let filter = { email: submittedEmail, platform: platform };
            let update = {
              $set: {
                login_fail: attemptsUpdateValue,
                last_attempt: requestTime,
                "data.last_attempt_ip": userIP
              }
            };
            let opts = { upsert: true };
            usersModel.collection.updateOne(filter, update, opts);
            let floodMessage = "LOGIN ATTEMPT BLOCKED DUE TO FLOODING LIMITS";
            logActivity(req, userID, platform, floodMessage);
            logMalicious(req, "8");

            msg[8] = sysMsg[8];

          }

        } else {

          let filter = { email: submittedEmail, platform: platform };
          let update = {
            $set: {
              login_fail: attemptsUpdateValue,
              last_attempt: requestTime,
              "data.last_attempt_ip": userIP
            }
          };
          let opts = { upsert: true };
          usersModel.collection.updateOne(filter, update, opts);

          if (userBanned === 1) {

            msg[8] = sysMsg[8];

            logActivity(req, userID, platform, "LOGIN ATTEMPT WHILE ACCOUNT LOCKED");

          }

          if (userLoginFail > maxPwAttempts) {

            msg[9] = sysMsg[9];

            var thisMessage = "LOGIN ATTEMPT BLOCKED AFTER REACHING " + userLoginFail + " LOGIN ATTEMPTS WHICH IS OVER THE LIMIT OF " + maxPwAttempts + " ATTEMPTS";
            logActivity(req, userID, platform, thisMessage);
          }

          msg[10] = sysMsg[10];

          logMalicious(req, "10");
        }


        

      } else {

        let failFilter = { email: submittedEmail, platform: platform };
        let failUpdate = {
          $set: {
            login_fail: attemptsUpdateValue,
            last_attempt: requestTime,
            "data.last_attempt_ip": userIP
          }
        };
        let failOpts = { upsert: true };
        usersModel.collection.updateOne(failFilter, failUpdate, failOpts);

        msg[12] = sysMsg[12];

        logSystemActivity(req, userID, platform, "LOGIN PW TOO SHORT");
        logMalicious(req, "12");
      }

    } else {

      msg[18] = sysMsg[18];

      logMalicious(req, "18");
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

export default handleLogin;