//#####################################################
//############### GET USER DETAILS DATA ###############
//##################################################### 

////////////////////////////
////// CONFIG IMPORTS //////
////////////////////////////
import { sysMsg } from '../../config/systemMessages.js';

////////////////////////////////
////// DATA MODEL IMPORTS //////
////////////////////////////////
import { usersHistoryModel } from '../../models/usersHistoryModel.js';
import { usersModel } from '../../models/usersModel.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { requestUserCheck } from '../../functions/requestUserCheck.js';
import { logActivity, logSystemActivity } from '../../functions/logActivity.js';
import { getUser } from '../../functions/getUser.js';
import { getUserByIdUnfiltered } from '../../functions/getUserById.js';
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

//////////////////////////////////////////
////// MALICIOUS ACTIVITY FUNCTIONS //////
//////////////////////////////////////////
import { logMalicious } from '../../functions/malicious/logMalicious.js';

//////////////////////////
////// THIS HANDLER //////
//////////////////////////
async function handleUpdateUser(app, req, res) {

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

    let userID = req.params.id;
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

    if (privileges.settings.super_admin !== 1) {
      if (privileges.reception.edit_users !== 1) {
        if (userData.userID !== userID) {

          msg[13] = sysMsg[13];

          logMalicious(req, "13");
          resSendOk(req, res, outputResult, msg);
          logSystemActivity(req, userData.userID, platform, "DENIED DATA EDIT FOR USER: " + userID);
          return null;

        }
      }
    }

    //////////////////////
    //// Get old data ////
    //////////////////////
    let doUpdate = 1;
    let oldData = await getUserByIdUnfiltered(userID, platform);
    let newData = JSON.parse(req.body.newData);
    if (!oldData || !newData) {

      msg[28] = sysMsg[28];

      logMalicious(req, "28");
      resSendOk(req, res, outputResult, msg);
      logSystemActivity(req, userData.userID, platform, "FAILED TO EDIT USER: " + userID);
      return null;
    }


    //////////////////////////////
    //// Backup current user data ////
    //////////////////////////////
    const backupTime = theEpochTime();

    await usersHistoryModel.create({
      user_id: oldData.user_id,
      platform: oldData.platform,
      time_saved: backupTime,
      data: oldData,
    }, async function (err, createdDocument) {
      if (err) {

        msg[31] = sysMsg[31];

        resSendOk(req, res, outputResult, msg);
        logSystemActivity(req, userData.userID, platform, "FAILED PROFILE BACKUP OF: " + oldData.user_id);
        return null;

      } else {
        logSystemActivity(req, userData.userID, platform, "TRIGGERED PROFILE BACKUP OF: " + oldData.user_id);
      }
    });

    //////////////////////////////
    //// check for new avatar ////
    ////////////////////////////// 
    if (
      oldData.data[platform].user_meta.avatar !== newData.updateUser.avatar
      && typeof (newData.updateUser.avatar) === "string"
      && !isNullOrEmpty(newData.updateUser.avatar)
    ) {

      if (newData.updateUser.avatar === "default") {

        oldData.data[platform].user_meta.avatar = "default"

        let filter = { user_id: oldData.user_id };
        let update = {
          $set: {
            data: oldData.data,
          }
        };
        let opts = { upsert: true };
        await usersModel.collection.updateOne(filter, update, opts)

      } else {

        const defaultGroup = await getPlatformDataByName(platform, "default");
        const defaultGroupId = defaultGroup.group_tag;

        const processingTriggered = await triggerFileProcessing(platform, newData.updateUser.avatar, defaultGroupId);



        if (processingTriggered) {

          oldData.data[platform].user_meta.avatar = newData.updateUser.avatar;

          let filter = { user_id: oldData.user_id };
          let update = {
            $set: {
              data: oldData.data,
            }
          };
          let opts = { upsert: true };
          await usersModel.collection.updateOne(filter, update, opts)

          logSystemActivity(req, userData.userID, platform, "UPDATED AVATAR OF USER: " + oldData.user_id);

        } else {
          doUpdate = 0;
          msg[29] = sysMsg[29];
          logSystemActivity(req, userData.userID, platform, "ERROR SAVING NEW AVATAR FOR USER: " + userID);
        }
      }
    }


    ///////////////////////////////////////
    //// check for first name change ////
    ///////////////////////////////////////
    if (
      oldData.data[platform].user_meta.first_name !== newData.updateUser.first_name
      && typeof (newData.updateUser.first_name) === "string"
      && newData.updateUser.first_name.trim().length > 0
    ) {

      let displayNameUnsafe = safeDisplayNameCheck(newData.updateUser.first_name);

      if (!displayNameUnsafe) {

        oldData.data[platform].user_meta.first_name = newData.updateUser.first_name;

        let filter = { user_id: oldData.user_id };
        let update = {
          $set: {
            data: oldData.data,
          }
        };
        let opts = { upsert: true };
        await usersModel.collection.updateOne(filter, update, opts)

        logSystemActivity(req, userData.userID, platform, "UPDATED NAME DATA OF USER: " + oldData.user_id);


      } else {

        doUpdate = 0;
        msg[20] = sysMsg[20];

      }
    } else {

      if (
        typeof (newData.updateUser.first_name) === "string"
        && newData.updateUser.first_name.trim().length < 1
      ) {
        doUpdate = 0;
        msg[21] = sysMsg[21];
      }

    }

    ///////////////////////////////////////
    //// check for surname name change ////
    ///////////////////////////////////////
    if (
      oldData.data[platform].user_meta.surname !== newData.updateUser.surname
      && typeof (newData.updateUser.surname) === "string"
      && newData.updateUser.surname.trim().length > 0
    ) {

      let displayNameUnsafe = await safeDisplayNameCheck(newData.updateUser.surname);

      if (!displayNameUnsafe) {

        oldData.data[platform].user_meta.surname = newData.updateUser.surname;

        let filter = { user_id: oldData.user_id };
        let update = {
          $set: {
            data: oldData.data,
          }
        };
        let opts = { upsert: true };
        await usersModel.collection.updateOne(filter, update, opts)

        logSystemActivity(req, userData.userID, platform, "UPDATED SURNAME DATA OF USER: " + oldData.user_id);

      } else {

        doUpdate = 0;
        msg[22] = sysMsg[22];

      }
    } else {

      if (
        typeof (newData.updateUser.surname) === "string"
        && newData.updateUser.surname.trim().length < 1
      ) {
        doUpdate = 0;
        msg[23] = sysMsg[23];
      }

    }

    /////////////////////////////////
    //// check for email changes ////
    /////////////////////////////////
    if (
      oldData.email !== newData.updateUser.email
      && typeof (newData.updateUser.email) === "string"
    ) {

      if (
        !isNullOrEmpty(newData.updateUser.email)
        && isValidEmail(newData.updateUser.email)
      ) {

        let testUserData = await getUser(newData.updateUser.email, platform);

        if (!testUserData) {

          oldData.email = newData.updateUser.email;

          let filter = { user_id: oldData.user_id };
          let update = {
            $set: {
              email: oldData.email,
            }
          };
          let opts = { upsert: true };
          await usersModel.collection.updateOne(filter, update, opts)

          logSystemActivity(req, userData.userID, platform, "UPDATED EMAIL DATA OF USER: " + oldData.user_id);


        } else {
          doUpdate = 0;
          msg[25] = sysMsg[25];
        }

      } else {
        doUpdate = 0;
        msg[24] = sysMsg[24];
      }
    }

    ///////////////////////////////////////
    //// check for phone number change ////
    ///////////////////////////////////////
    if (
      oldData.data[platform].user_meta.phone_number !== newData.updateUser.phone_number
      && typeof (newData.updateUser.phone_number) === "string"
    ) {

      if (isValidPhoneNumber(newData.updateUser.phone_number) || newData.updateUser.phone_number === "") {

        oldData.data[platform].user_meta.phone_number = newData.updateUser.phone_number;

        let filter = { user_id: oldData.user_id };
        let update = {
          $set: {
            data: oldData.data,
          }
        };
        let opts = { upsert: true };
        await usersModel.collection.updateOne(filter, update, opts)

        logSystemActivity(req, userData.userID, platform, "UPDATED PHONE NUMBER DATA OF USER: " + oldData.user_id);

      } else {
        doUpdate = 0;
        msg[26] = sysMsg[26];
      }
    }

    /////////////////////////////
    //// check for new notes ////
    /////////////////////////////
    if (newData.updateUser.notes) {

      if (
        oldData.data[platform].user_meta.notes !== newData.updateUser.notes
        && typeof (newData.updateUser.notes) === "string"
      ) {

        oldData.data[platform].user_meta.notes = newData.updateUser.notes;

        let filter = { user_id: oldData.user_id };
        let update = {
          $set: {
            data: oldData.data,
          }
        };
        let opts = { upsert: true };
        await usersModel.collection.updateOne(filter, update, opts)

        logSystemActivity(req, userData.userID, platform, "UPDATED NOTES DATA OF USER: " + oldData.user_id);


      }
    }

    ////////////////////////////////
    //// check for new location ////
    ////////////////////////////////
    if (newData.updateUser.location) {

      if (
        oldData.data[platform].user_meta.location !== newData.updateUser.location
        && typeof (newData.updateUser.location) === "string"
      ) {

        oldData.data[platform].user_meta.location = newData.updateUser.location;

        let filter = { user_id: oldData.user_id };
        let update = {
          $set: {
            data: oldData.data,
          }
        };
        let opts = { upsert: true };
        await usersModel.collection.updateOne(filter, update, opts)

        logSystemActivity(req, userData.userID, platform, "UPDATED LOCATION DATA OF USER: " + oldData.user_id);

      }
    }

    ///////////////////////////////
    //// check for user groups ////
    /////////////////////////////// 
    if (privileges.reception.edit_user_groups === 1 || privileges.reception.super_admin === 1) {

      let newGroups = newData.updateUser.defaultGroups;
      let oldGroups = oldData.data[platform].user_groups;

      let groupsChanged = false;

      Object.keys(newGroups).forEach(key => {
        if (!oldGroups[key] && newGroups[key] === true) {
          groupsChanged = true;
        }
      });

      Object.keys(oldGroups).forEach(key => {
        if (!newGroups[key] && newGroups[key] === false) {
          groupsChanged = true;
        }
      });

      if (groupsChanged) {

        let groupsUpdate = {};
        const newGroupKeys = Object.keys(newGroups);

        for (const key of newGroupKeys) {

          if (newGroups[key] === true) {

            let thisGroupData = await getUserGroupData(key, platform)

            groupsUpdate[key] = thisGroupData.group_name;
          }

        };

        const newGroupCount = Object.keys(groupsUpdate).length;

        if (newGroupCount > 0) {

          oldData.data[platform].user_groups = groupsUpdate;

          let filter = { user_id: oldData.user_id };
          let update = {
            $set: {
              data: oldData.data,
            }
          };
          let opts = { upsert: true };
          await usersModel.collection.updateOne(filter, update, opts)

          logSystemActivity(req, userData.userID, platform, "UPDATED GROUP DATA OF USER: " + oldData.user_id);

        } else {
          doUpdate = 0;
          msg[27] = sysMsg[27];
        }

      }
    }

    /////////////////////////////
    //// check for user tags ////
    ///////////////////////////// 
    if (privileges.reception.edit_tags === 1 || privileges.reception.super_admin === 1) {

      let newTags = newData.updateUser.defaultTags;
      let oldTags = oldData.data[platform].user_tags;
      let newTagsLooped = {};

      if (oldTags === undefined) {
        oldTags = {}
      }
      let tagsChanged = false;

      Object.keys(newTags).forEach(key => {

        newTagsLooped[newTags[key].value] = true;

        if (!oldTags[newTags[key].value]) {
          tagsChanged = true;
        }
      });

      Object.keys(oldTags).forEach(key => {
        if (!newTagsLooped[key]) {
          tagsChanged = true;
        }
      });

      if (tagsChanged) {
        const backupTime = theEpochTime();

        let tagsUpdate = {};
        const newTagsKeys = Object.keys(newTagsLooped);

        for (const key of newTagsKeys) {

          if (newTagsLooped[key] === true) {

            let thisTagData = await getUserTagData(key, platform);
            tagsUpdate[key] = thisTagData.tag_name;
          }

        };

        oldData.data[platform].user_tags = tagsUpdate;

        let filter = { user_id: oldData.user_id };
        let update = {
          $set: {
            data: oldData.data,
          }
        };
        let opts = { upsert: true };
        await usersModel.collection.updateOne(filter, update, opts)

        logSystemActivity(req, userData.userID, platform, "UPDATED TAG DATA OF USER: " + oldData.user_id);

      }
    }

    ////////////////////////////////
    //// check for new user_bio ////
    ////////////////////////////////
    if (newData.updateUser.user_bio) {

      if (
        oldData.data[platform].user_meta.user_bio !== newData.updateUser.user_bio
        && typeof (newData.updateUser.user_bio) === "string"
      ) {

        oldData.data[platform].user_meta.user_bio = newData.updateUser.user_bio;

        let filter = { user_id: oldData.user_id };
        let update = {
          $set: {
            data: oldData.data,
          }
        };
        let opts = { upsert: true };
        await usersModel.collection.updateOne(filter, update, opts)

        logSystemActivity(req, userData.userID, platform, "UPDATED NOTES DATA OF USER: " + oldData.user_id);

      }
    }

    //////////////////////////////
    //// check for new status ////
    //////////////////////////////
    if (privileges.reception.edit_users === 1 || privileges.reception.super_admin === 1) {

      if (newData.updateUser.status !== undefined) {

        let userStatus = 1;
        if (newData.updateUser.status === "active" || newData.updateUser.status === "Active") {
          userStatus = 0;
        }

        oldData.banned = userStatus;

        let filter = { user_id: oldData.user_id };
        let update = {
          $set: {
            banned: oldData.banned,
            "data.time_banned": backupTime
          }
        };
        let opts = { upsert: true };
        await usersModel.collection.updateOne(filter, update, opts)

        let logmsg;
        if (oldData.banned === 1) {
          logmsg = "LOCKED USER ACCOUNT: " + oldData.user_id;
        } else if (oldData.banned === 0) {
          logmsg = "UNLOCKED USER ACCOUNT: " + oldData.user_id;
        }

        logSystemActivity(req, userData.userID, platform, logmsg);

      } else {
        doUpdate = 0;
        msg[52] = sysMsg[52];
      }
    }

    /////////////////////////////////
    //// check for being deleted ////
    /////////////////////////////////
    if (privileges.reception.delete_user === 1 || privileges.reception.super_admin === 1) {

      if (
        oldData.hidden !== newData.updateUser.hidden
        && typeof (newData.updateUser.hidden) === "number"
        && newData.updateUser.hidden === 1
      ) {

        if (privileges.reception.delete_user === 1) {

          oldData.hidden = newData.updateUser.hidden;
          oldData.data[platform].user_groups = {};
          oldData.data[platform].user_tags = {};

          let filter = { user_id: oldData.user_id };
          let update = {
            $set: {
              hidden: oldData.hidden,
            }
          };
          await usersModel.collection.updateOne(filter, update, { upsert: true })

        } else {
          doUpdate = 0;
          msg[53] = sysMsg[53];
        }

      }
    }

    ///////////////////////////////
    //// check for new company ////
    ///////////////////////////////
    if (newData.updateUser.company) {

      if (
        oldData.data[platform].user_meta.company !== newData.updateUser.company
        && typeof (newData.updateUser.company) === "string"
      ) {

        oldData.data[platform].user_meta.company = newData.updateUser.company;

        let filter = { user_id: oldData.user_id };
        let update = {
          $set: {
            data: oldData.data,
          }
        };
        let opts = { upsert: true };
        await usersModel.collection.updateOne(filter, update, opts)

        logSystemActivity(req, userData.userID, platform, "UPDATED NOTES DATA OF USER: " + oldData.user_id);

      }
    }

    ////////////////////////////////////
    //// check for new facebook_url ////
    ////////////////////////////////////
    if (newData.updateUser.facebook_url) {

      if (
        oldData.data[platform].user_meta.facebook_url !== newData.updateUser.facebook_url
        && typeof (newData.updateUser.facebook_url) === "string"
      ) {

        oldData.data[platform].user_meta.facebook_url = newData.updateUser.facebook_url;

        let filter = { user_id: oldData.user_id };
        let update = {
          $set: {
            data: oldData.data,
          }
        };
        let opts = { upsert: true };
        await usersModel.collection.updateOne(filter, update, opts)

        logSystemActivity(req, userData.userID, platform, "UPDATED NOTES DATA OF USER: " + oldData.user_id);

      }
    }

    ////////////////////////////////////
    //// check for new twitter_url ////
    ////////////////////////////////////
    if (newData.updateUser.twitter_url) {

      if (
        oldData.data[platform].user_meta.twitter_url !== newData.updateUser.twitter_url
        && typeof (newData.updateUser.twitter_url) === "string"
      ) {

        oldData.data[platform].user_meta.twitter_url = newData.updateUser.twitter_url;

        let filter = { user_id: oldData.user_id };
        let update = {
          $set: {
            data: oldData.data,
          }
        };
        let opts = { upsert: true };
        await usersModel.collection.updateOne(filter, update, opts)

        logSystemActivity(req, userData.userID, platform, "UPDATED NOTES DATA OF USER: " + oldData.user_id);

      }
    }

    ////////////////////////////////////
    //// check for new twitter_url ////
    ////////////////////////////////////
    if (newData.updateUser.youtube_url) {

      if (
        oldData.data[platform].user_meta.youtube_url !== newData.updateUser.youtube_url
        && typeof (newData.updateUser.youtube_url) === "string"
      ) {

        oldData.data[platform].user_meta.youtube_url = newData.updateUser.youtube_url;

        let filter = { user_id: oldData.user_id };
        let update = {
          $set: {
            data: oldData.data,
          }
        };
        let opts = { upsert: true };
        await usersModel.collection.updateOne(filter, update, opts)

        logSystemActivity(req, userData.userID, platform, "UPDATED NOTES DATA OF USER: " + oldData.user_id);

      }
    }

    ////////////////////////////////////
    //// check for new instagram_url ////
    ////////////////////////////////////
    if (newData.updateUser.instagram_url) {

      if (
        oldData.data[platform].user_meta.instagram_url !== newData.updateUser.instagram_url
        && typeof (newData.updateUser.instagram_url) === "string"
      ) {

        oldData.data[platform].user_meta.instagram_url = newData.updateUser.instagram_url;

        let filter = { user_id: oldData.user_id };
        let update = {
          $set: {
            data: oldData.data,
          }
        };
        let opts = { upsert: true };
        await usersModel.collection.updateOne(filter, update, opts)

        logSystemActivity(req, userData.userID, platform, "UPDATED NOTES DATA OF USER: " + oldData.user_id);

      }
    }


    ////////////////////////////////////
    //// check for new instagram_url ////
    ////////////////////////////////////
    if (newData.updateUser.website_url) {

      if (
        oldData.data[platform].user_meta.website_url !== newData.updateUser.website_url
        && typeof (newData.updateUser.website_url) === "string"
      ) {

        oldData.data[platform].user_meta.website_url = newData.updateUser.website_url;

        let filter = { user_id: oldData.user_id };
        let update = {
          $set: {
            data: oldData.data,
          }
        };
        let opts = { upsert: true };
        await usersModel.collection.updateOne(filter, update, opts)

        logSystemActivity(req, userData.userID, platform, "UPDATED NOTES DATA OF USER: " + oldData.user_id);

      }
    }

    if (doUpdate === 1) {
      logActivity(req, userData.userID, platform, "EDITED DATA FOR USER: " + oldData.user_id);

      delete oldData._id;
      delete oldData.super_admin;
      delete oldData.data[platform].password;
      delete oldData.data[platform].cookie_string;

      const fullPrivileges = await getUserPrivileges(oldData.data[platform].user_groups, platform, true);

      oldData.data['privileges'] = fullPrivileges.privileges;

      outputResult['userData'] = oldData;
      outputResult['status'] = 1;
      outputResult['qry'] = 1;
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

export default handleUpdateUser;