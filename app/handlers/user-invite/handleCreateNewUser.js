//#####################################################
//############### GET USER DETAILS DATA ###############
//##################################################### 

////////////////////////////
////// CONFIG IMPORTS //////
////////////////////////////
import { sysMsg } from '../../config/systemMessages.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { usersModel } from '../../models/usersModel.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { requestUserCheck } from '../../functions/requestUserCheck.js';
import { createUUID } from '../../functions/createUUID.js';
import { getUser } from '../../functions/getUser.js';
import { getUserGroupData } from '../../functions/getUserGroupData.js';
import { getUserTagData } from '../../functions/getUserTagData.js';
import { getUserPrivileges } from '../../functions/getUserPrivileges.js';
import { getPlatformData } from '../../functions/getPlatformData.js';
import { getPlatformDataByName } from '../../functions/getPlatformDataByName.js';
import { triggerFileProcessing } from '../../functions/loading-dock/triggerFileProcessing.js';

//////////////////////////////////////
////// RESULT SENDING FUNCTIONS //////
//////////////////////////////////////
import { resSendOk } from '../../functions/resSend/resSendOk.js';

//////////////////////////////
////// HELPER FUNCTIONS //////
//////////////////////////////
import { safeDisplayNameCheck } from '../../functions/helpers/safeDisplayNameCheck.js';
import { theEpochTime } from '../../functions/helpers/theEpochTime.js';
import { isNullOrEmpty } from '../../functions/helpers/isNullOrEmpty.js';
import { isValidEmail } from '../../functions/helpers/isValidEmail.js';
import { isValidPhoneNumber } from '../../functions/helpers/isValidPhoneNumber.js';
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
async function handleCreateNewUser(app, req, res) {

  let outputResult = {
    "status": 0,
    "qry": 0,
  };
  let msg = {};

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

      logMalicious(req, sysMsg[4]);
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

      logMalicious(req, sysMsg[1]);
      resSendOk(req, res, outputResult, msg);
      return null;
    }

    //////////////////////
    ////// CHECK USER //////
    ////////////////////// 
    const tokenData = await requestUserCheck(app, req, res, platformData);

    //////////////////////
    ////// CHECK TOKEN AND USER DATA //////
    ////////////////////// 
    let userData = await getUser(tokenData.user_email, platform);
    if (!userData) {

      msg[18] = sysMsg[18];

      logMalicious(req, sysMsg[18]);
      resSendOk(req, res, outputResult, msg);
      return null;
    }

    //////////////////////
    ////// CHECK PERMISSION //////
    //////////////////////

    let userGroups = userData.userData[platform].user_groups;
    let fullPrivileges = await getUserPrivileges(userGroups, platform, true);
    let privileges = fullPrivileges.privileges;

    if (!(privileges.reception.edit_users === 1 || privileges.settings.super_admin === 1)) {
      msg[13] = sysMsg[13];
      logMalicious(req, sysMsg[13]);
      resSendOk(req, res, outputResult, msg);
      return null;
    }

    //##########################
    //##### HANDLE REQUEST #####
    //##########################

    //////////////////////
    ////// CREATE NEW USER //////
    //////////////////////

    let doUpdate = 1;
    let newData = JSON.parse(req.body.newData);

    let userID;
    let firstName;
    let surname;
    let email;
    let phoneNumber;
    let groupData = {};
    let tagData = {};
    let notes;
    let avatar;

    ///////////////////////////////////////
    //// check for first name change ////
    ///////////////////////////////////////
    if (
      typeof (newData.updateUser.first_name) === "string"
      && newData.updateUser.first_name.trim().length > 0
    ) {

      let displayNameUnsafe = await safeDisplayNameCheck(newData.updateUser.first_name);

      if (displayNameUnsafe) {
        msg[20] = sysMsg[20];
      } else {

        firstName = newData.updateUser.first_name;

      }
    } else {
      doUpdate = 0;
      msg[21] = sysMsg[21];
    }


    ////////////////////////////////// 
    //// check for surname change ////
    ////////////////////////////////// 
    if (
      typeof (newData.updateUser.surname) === "string"
      && newData.updateUser.surname.trim().length > 0
    ) {

      let displayNameUnsafe = await safeDisplayNameCheck(newData.updateUser.surname);

      if (displayNameUnsafe) {
        doUpdate = 0;
        msg[22] = sysMsg[22];
      } else {

        surname = newData.updateUser.surname;

      }
    } else {
      doUpdate = 0;
      msg[23] = sysMsg[23];
    }

    /////////////////////////////////
    //// check for email changes ////
    ///////////////////////////////// 
    if (typeof (newData.updateUser.email) === "string") {

      if (
        !isNullOrEmpty(newData.updateUser.email)
        && isValidEmail(newData.updateUser.email)
      ) {

        let testUserData = await getUser(newData.updateUser.email, platform);

        if (testUserData) {
          doUpdate = 0;
          msg[25] = sysMsg[25];
          //resSendOk(req, res, outputResult, msg);
        } else {
          email = newData.updateUser.email;
        }

      } else {
        doUpdate = 0;
        msg[24] = sysMsg[24];
        //resSendOk(req, res, outputResult, msg); //deprecated 25.04.24
        //return null; //deprecated 25.04.24
      }
    } else {
      doUpdate = 0;
      msg[24] = sysMsg[24];
    }


    ///////////////////////////////////////
    //// check for phone number change ////
    ///////////////////////////////////////

    if (typeof (newData.updateUser.phone_number) === "string") {

      if (isValidPhoneNumber(newData.updateUser.phone_number) || newData.updateUser.phone_number === "") {

        if (newData.updateUser.phone_number !== undefined && newData.updateUser.phone_number !== "undefined") {
          phoneNumber = newData.updateUser.phone_number;
        } else {
          phoneNumber = "";
        }

      } else {
        doUpdate = 0;
        msg[26] = sysMsg[26];
        //resSendOk(req, res, outputResult, msg); //deprecated 25.04.24
        //return null; //deprecated 25.04.24
      }
    } else {
      phoneNumber = "";
    }

    ///////////////////////////////
    //// check for user groups ////
    /////////////////////////////// 
    let newGroups = newData.updateUser.defaultGroups;

    let groupsUpdate = {};

    if (newGroups) {

      const newGroupKeys = Object.keys(newGroups);

      for (const key of newGroupKeys) {

        if (newGroups[key] === true) {

          let thisGroupData = await getUserGroupData(key, platform)

          groupsUpdate[key] = thisGroupData.group_name;
        }

      };

      const newGroupCount = Object.keys(groupsUpdate).length;


      if (newGroupCount > 0) {
        groupData = groupsUpdate;

      } else {
        doUpdate = 0;
        msg[27] = sysMsg[27];
      }

    } else {
      doUpdate = 0;
      msg[27] = sysMsg[27];
    }

    /////////////////////////////
    //// check for user tags ////
    ///////////////////////////// 
    let newTags = newData.updateUser.defaultTags;
    let newTagsLooped = {};

    let tagsUpdate = {};

    if (newTags !== undefined) {
      Object.keys(newTags).forEach(key => {
        newTagsLooped[newTags[key].value] = true;

      });

      const newTagsKeys = Object.keys(newTagsLooped);

      for (const key of newTagsKeys) {

        if (newTagsLooped[key] === true) {

          let thisTagData = await getUserTagData(key, platform);
          tagsUpdate[key] = thisTagData.tag_name;
        }

      };

    }

    tagData = tagsUpdate;

    /////////////////////////////
    //// check for new notes ////
    /////////////////////////////
    if (newData.updateUser.notes) {

      if (
        typeof (newData.updateUser.notes) === "string"
      ) {

        if (newData.updateUser.notes !== undefined && newData.updateUser.notes !== "undefined") {

          notes = newData.updateUser.notes;
        } else {
          notes = "";
        }
      } else {
        notes = "";
      }
    } else {
      notes = "";
    }


    //////////////////////////////
    //// check for new avatar ////
    //////////////////////////////
    if (
      typeof (newData.updateUser.avatar) === "string"
      && !isNullOrEmpty(newData.updateUser.avatar)
    ) {

      const defaultGroup = await getPlatformDataByName(platform, "default");
      const defaultGroupId = defaultGroup.group_tag;

      const processingTriggered = await triggerFileProcessing(platform, newData.updateUser.avatar, defaultGroupId);

      if (processingTriggered) {

        avatar = newData.updateUser.avatar;

      } else {
        doUpdate = 0
        msg[29] = sysMsg[29];
        // resSendOk(req, res, outputResult, msg);
        // return null;
      }


    } else {
      avatar = platformData.default_user_data.avatar;
    }

    userID = createUUID();

    if (doUpdate === 0) {

      msg[28] = sysMsg[28];
      resSendOk(req, res, outputResult, msg);
      return null;
    }

    /////////////////////////
    //// Create New User ////
    /////////////////////////

    let doSave = 0;
    if (req.body.save === undefined) {
      msg[51] = sysMsg[51];
    } else {
      doSave = parseInt(req.body.save);
    }

    if (doUpdate === 1 && doSave === 1) {

      let newUserData = {};
      let newCookieString = randomString(32);
      let randomPw = randomString(32);
      let uniqueNameNeeded = parseInt(platformData.unique_display_names);
      let requestTime = theEpochTime();

      userData = platformData.default_user_data;

      userData.first_name = firstName;
      userData.surname = surname;
      userData.phone_number = phoneNumber;
      userData.notes = notes;
      userData.avatar = avatar;

      newUserData[platform] = {
        user_id: userID,
        super_user: 0,
        email: email,
        use_2fa: 1,
        password: randomPw,
        cookie_string: newCookieString,
        pw_age: requestTime,
        user_meta: userData,
        user_groups: groupData,
        user_tags: tagData,
        last_attempt_ip: "",
        invite_token_open: 1
      }

      newUserData[platform].user_meta.dashboard_layout = {
        sections: {
          'row-main': [
            {
              id: 'column-main',
              inputs: []
            }
          ],
          'row-sidebar': [
            {
              id: 'column-sidebar',
              inputs: []
            }
          ]
        },
        links: {
          "row-empty": {
            "type": "empty"
          }
        }
      }

      await usersModel.create({
        user_id: userID,
        email: email,
        platform: platform,
        super_admin: 0,
        banned: 0,
        hidden: 0,
        login_fail: 0,
        last_attempt: 0,
        data: newUserData
      });

      if (uniqueNameNeeded === 1) {
        await displayNamesModel.create({
          user_id: userID,
          platform: platform,
          display_name: (firstName + "-" + surname).toLowerCase(),
        });
      }

      let userAgent = theUserAgent(req);
      let userIP = theUserIP(req);

      let twoFaCode = randomString(platformData.two_fa_characters);
      let tokenMarker = randomString(8);

      let emailerTokenDataMarker = randomString(10) + "-" + requestTime;

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

      let inviteGroups = Object.values(groupData)
        .map(value => capitalizeFirstLetter(value))
        .join(', ');

      let emailerTokenData = {
        "platform": platform,
        "template": "user_invite",
        "sendto": email,
        "priority": 1,
        "marker": emailerTokenDataMarker,
        "user_ip": userIP,
        "user_agent": userAgent,
        "token_age": requestTime,
        "email_template_values": {
          "two_fa_token": twoFaCode,
          "ip_address": userIP,
          "inviter_email": email,
          "login_url": inviteLoginUrl,
          "support_email": platformData.support_email,
          "inviter_name": userData.first_name + " " + userData.surname,
          "invite_groups": inviteGroups
        },
        "transit_token": transitTokenData
      }
      let encryptedEmailerTokenData = encrypt(JSON.stringify(emailerTokenData), process.env.NETWORK_PRIMARY_ENCRYPTION_KEY);

      outputResult['status'] = 1;
      outputResult['qry'] = 1;
      outputResult['new_user_id'] = userID;
      outputResult['emailer_token'] = encryptedEmailerTokenData;

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

export default handleCreateNewUser;