//###############################################
//############### OPEN AUTH TOKEN ###############
//###############################################

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { decrypt } from './crypt/decrypt.js';
import { getUser } from './getUser.js';
import { getUserGroupData } from '../functions/getUserGroupData.js';
import { getPlatformData } from '../functions/getPlatformData.js';
import { getSession } from '../functions/getSession.js';
import { theUserIP } from '../functions/helpers/theUserIP.js';
import { theEpochTime } from '../functions/helpers/theEpochTime.js';
import { theUserAgent } from '../functions/helpers/theUserAgent.js';
import { isNullOrEmpty } from '../functions/helpers/isNullOrEmpty.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function openAuthToken(app, req, res, platform, tokenString) {
  try {

    let outputResult = false;

    if (
      !isNullOrEmpty(tokenString)
    ) {

      let tokenData = JSON.parse(decrypt(tokenString, process.env.NETWORK_PRIMARY_ENCRYPTION_KEY));

      if (tokenData !== null) {

        let platformData = await getPlatformData(platform);
        let sessionID = await getSession(app, req, res, platformData);

        if (platformData) { 

          let requestTime = theEpochTime();

          let tokenSessionID = tokenData.session_id;
          let tokenUserID = tokenData.user_id;
          let tokenSuperUser = parseInt(tokenData.super_user);
          let tokenPlatform = tokenData.platform;
          let tokenUserEmail = tokenData.user_email;
          let tokenCreated = parseInt(tokenData.created);
          let tokenCookieString = tokenData.cookie_string;
          let tokenUserAgent = tokenData.user_agent;
          let userIP = theUserIP(req);
          let tokenUserIP = tokenData.user_ip;
          let tokenRememberMe = parseInt(tokenData.remember_me);

          let userAgent = theUserAgent(req);

          let rememberMeCutOFf = requestTime - platformData.auth_remember_me_age_limit;
          let nonRememberMeCutOFf = requestTime - platformData.auth_non_remember_me_age_limit;

          if ( 
            sessionID === tokenSessionID
            && platform === tokenPlatform
            && tokenUserAgent === userAgent
            && (
              (tokenRememberMe === 1 && tokenCreated > rememberMeCutOFf)
              || (tokenRememberMe === 0 && tokenCreated > nonRememberMeCutOFf)
            )
            && (
              (tokenSuperUser === 0)
              || (tokenSuperUser === 1 && tokenUserIP === userIP)
            )
          ) {

            let userData = await getUser(tokenUserEmail, platform);

            if (userData) {

              if (
                userData.userID === tokenUserID
                && userData.userData[tokenPlatform].cookie_string === tokenCookieString
                && userData.userBanned === 0
                && userData.userLoginFail <= platformData.maximum_pw_attempts
              ) {

                let userGroups = userData.userData[platform].user_groups;
 
                let privileges = {};

                for (let groupTag in userGroups) {

                  let thisGroupData = await getUserGroupData(groupTag, platform);

                  if (thisGroupData) {

                    let groupName = thisGroupData.group_name; 
                    let adminGroupPrivileges = thisGroupData.privileges;

                    for (let privKey in adminGroupPrivileges) {

                      if (typeof privileges[privKey] === 'undefined') {
                        privileges[privKey] = {}
                      }

                      if (typeof privileges["user_groups"] === 'undefined') {
                        privileges["user_groups"] = {}
                      }

                      if (typeof privileges["user_groups"][groupName] === 'undefined') {
                        privileges["user_groups"][groupName] = { group_id: groupTag }
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

                outputResult = {
                  "tokenData": tokenData,
                  "userData": userData,
                  "privileges": privileges
                } 

              }  
            }  
          }  
        }  
      } 
    } 

    return outputResult;

  } catch (error) {

    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }

    return false;
  }
} 