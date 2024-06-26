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
import { requestUserCheck } from '../../functions/requestUserCheck.js';
import { logSystemActivity } from '../../functions/logActivity.js';
import { getUser } from '../../functions/getUser.js';
import { getUserById } from '../../functions/getUserById.js';
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

//////////////////////////////////////////
////// MALICIOUS ACTIVITY FUNCTIONS //////
//////////////////////////////////////////
import { logMalicious } from '../../functions/malicious/logMalicious.js';

//////////////////////////
////// THIS HANDLER //////
//////////////////////////
async function handleGetUsersDetails(app, req, res) {

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

    //////////////////////
    ////// CHECK ID PRAMS //////
    ////////////////////// 
    let userID = req.params.id;
    if (!userID || userID === "undefined" || userID === undefined) {

      msg[14] = sysMsg[14];

      logMalicious(req, "1");
      resSendOk(req, res, outputResult, msg);
      return null;
    }


    let userGroups = userData.userData[platform].user_groups;
    let fullPrivileges = await getUserPrivileges(userGroups, platform, true);
    let privileges = fullPrivileges.privileges;

    msg["test"] = privileges.reception;

    if (privileges.reception.view_users === 1 || privileges.settings.super_admin === 1) {

      const userDbData = await getUserById(userID, platform);

      if (!userDbData) {
        msg[11] = sysMsg[11];
        resSendOk(req, res, outputResult, msg);
        return null;
      }

      let theUsersTags = [];
      if (userDbData.userData[platform].user_tags !== undefined) {
        theUsersTags = Object.keys(userDbData.userData[platform].user_tags);
      }

      let userTags = [];
      for (const tag of theUsersTags) {
        userTags.push({ label: userDbData.userData[platform].user_tags[tag], value: tag })
      }

      let userNotes;
      if (userDbData.userData[platform].user_meta.notes) {
        userNotes = userDbData.userData[platform].user_meta.notes;
      }

      let thisUsersGroups = {}
      if (userDbData.userData[platform].user_groups) {
        thisUsersGroups = Object.keys(userDbData.userData[platform].user_groups);
      }

      let userGroups = [];
      let defaultUserGroups = {};
      if (thisUsersGroups.length > 0) {
        for (const group of thisUsersGroups) {

          userGroups.push({ [group]: true })
          //defaultUserGroups.push({ [group]: true })
          defaultUserGroups[group] = true;
        }
      }


      let firstName = "";
      let surnameName = "";
      let avatar = "";
      let phoneNumber = "";
      let location = "";
      let company = "";
      let facebookUrl = "";
      let twitterUrl = "";
      let youtubeUrl = "";
      let instagramUrl = "";
      let websiteUrl = "";
      let userBio = "";


      if (userDbData.userData[platform] !== undefined) {
        if (userDbData.userData[platform].user_meta !== undefined) {


          if (userDbData.userData[platform].user_meta.first_name !== undefined) {
            firstName = userDbData.userData[platform].user_meta.first_name;
          }

          if (userDbData.userData[platform].user_meta.surname !== undefined) {
            surnameName = userDbData.userData[platform].user_meta.surname;
          }

          if (userDbData.userData[platform].user_meta.avatar !== undefined) {
            avatar = userDbData.userData[platform].user_meta.avatar;
          }

          if (userDbData.userData[platform].user_meta.phone_number !== undefined) {
            phoneNumber = userDbData.userData[platform].user_meta.phone_number;
          }

          if (userDbData.userData[platform].user_meta.location !== undefined) {
            location = userDbData.userData[platform].user_meta.location;
          }

          if (userDbData.userData[platform].user_meta.company !== undefined) {
            company = userDbData.userData[platform].user_meta.company;
          }

          if (userDbData.userData[platform].user_meta.facebook_url !== undefined) {
            facebookUrl = userDbData.userData[platform].user_meta.facebook_url;
          }

          if (userDbData.userData[platform].user_meta.twitter_url !== undefined) {
            twitterUrl = userDbData.userData[platform].user_meta.twitter_url;
          }

          if (userDbData.userData[platform].user_meta.youtube_url !== undefined) {
            youtubeUrl = userDbData.userData[platform].user_meta.youtube_url;
          }

          if (userDbData.userData[platform].user_meta.instagram_url !== undefined) {
            instagramUrl = userDbData.userData[platform].user_meta.instagram_url;
          }

          if (userDbData.userData[platform].user_meta.website_url !== undefined) {
            websiteUrl = userDbData.userData[platform].user_meta.website_url;
          }

          if (userDbData.userData[platform].user_meta.user_bio !== undefined) {
            userBio = userDbData.userData[platform].user_meta.user_bio;
          }

        }
      }

      let status = "Locked";
      if (userDbData.userBanned === 0) {
        status = "Active";

        if (userDbData.userData[platform].invite_token_open !== undefined) {
          if (userDbData.userData[platform].invite_token_open === 1) {
            status = "Pending";
          }
        }
      }

      let lastLocked = 0;
      if (userDbData.userData.time_banned !== undefined) {
        lastLocked = userDbData.userData.time_banned;
      }

      const returnUserData = {
        id: userDbData.userID,
        avatar: avatar,
        defaultTags: userTags,
        first_name: firstName,
        surname: surnameName,
        email: userDbData.userEmail,
        phone_number: phoneNumber,
        notes: userNotes,
        groups: thisUsersGroups,
        defaultGroups: defaultUserGroups,
        status: status,
        hidden: 0,
        location: location,
        company: company,
        //facebook_url: facebookUrl,
        //twitter_url: twitterUrl,
        //youtube_url: youtubeUrl,
        //instagram_url: instagramUrl,
        website_url: websiteUrl,
        user_bio: userBio,
        last_locked: lastLocked
      }

      outputResult['status'] = 1;
      outputResult['qry'] = 1;
      outputResult['userData'] = returnUserData;

      logSystemActivity(req, userData.userID, platform, "REQUESTED DATA FOR USER: " + userID);

    } else {
      outputResult['status'] = 0;
      msg[13] = sysMsg[13];

      logSystemActivity(req, userData.userID, platform, "DENIED PERMISSION TO USER DATA: " + userID);
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

export default handleGetUsersDetails;