//######################################################
//############### GET USER ACTIVITY DATA ###############
//###################################################### 

////////////////////////////
////// CONFIG IMPORTS //////
////////////////////////////
import { sysMsg } from '../../config/systemMessages.js';

////////////////////////////////
////// DATA MODEL IMPORTS //////
////////////////////////////////
import { usersModel } from '../../models/usersModel.js';
import { usersHistoryModel } from '../../models/usersHistoryModel.js';
import { userTagsModel } from '../../models/userTagsModel.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { requestUserCheck } from '../../functions/requestUserCheck.js';
import { logActivity, logSystemActivity } from '../../functions/logActivity.js';
import { getUser, getUsers } from '../../functions/getUser.js';
import { getUserTagDataByName } from '../../functions/getUserTagData.js';
import { getUserPrivileges } from '../../functions/getUserPrivileges.js';
import { getPlatformData } from '../../functions/getPlatformData.js';
import { createUUID } from '../../functions/createUUID.js';

//////////////////////////////////////
////// RESULT SENDING FUNCTIONS //////
////////////////////////////////////// 
import { resSendOk } from '../../functions/resSend/resSendOk.js';

//////////////////////////////
////// HELPER FUNCTIONS //////
//////////////////////////////
import { theEpochTime } from '../../functions/helpers/theEpochTime.js';
import { isNullOrEmpty } from '../../functions/helpers/isNullOrEmpty.js';

//////////////////////////////////////////
////// MALICIOUS ACTIVITY FUNCTIONS //////
//////////////////////////////////////////
import { logMalicious } from '../../functions/malicious/logMalicious.js';

//////////////////////////
////// THIS HANDLER //////
//////////////////////////
async function handleUpdateTag(app, req, res) {

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

    //////////////////////
    ////// Check Privileges //////
    //////////////////////
    let userGroups = userData.userData[platform].user_groups;
    let fullPrivileges = await getUserPrivileges(userGroups, platform, true);
    let privileges = fullPrivileges.privileges;
    if (!(privileges.reception.edit_tags === 1 || privileges.settings.super_admin === 1)) {
      logSystemActivity(req, userData.userID, platform, "DENIED TAG DATA EDIT");

      msg[13] = sysMsg[13];

      logMalicious(req, "13");
      resSendOk(req, res, outputResult, msg);
      return null;
    }

    let submitType = req.body.submit_type;
    let tagID = req.body.tag_id;
    let tag = req.body.tag;
    let description = req.body.description;

    let newCreationTime = theEpochTime();

    if (submitType === 0 || submitType === "0") {

      const doesTagExist = await getUserTagDataByName(tag, platform)

      if (doesTagExist === false) {

        let newID = createUUID();

        userTagsModel.create({
          tag_id: newID,
          tag_name: tag,
          platform: platform,
          data: {
            created: newCreationTime,
            description: description
          }
        });

        outputResult['status'] = 1;
        outputResult['new_id'] = newID;

        logActivity(req, userData.userID, platform, "CREATED NEW USER TAG '" + tag + "' ID: " + newID);

      } else {
        msg[37] = sysMsg[37];
      }
    }


    if (submitType === 1 || submitType === "1") {

      let filter = { tag_id: tagID };
      let update = {
        $set: {
          tag_name: tag,
          data: {
            created: newCreationTime,
            description: description
          }
        }
      };
      let opts = { upsert: true };
      await userTagsModel.collection.updateOne(filter, update, opts);


      outputResult['status'] = 2;
      outputResult['qry'] = 1;

      //backup data
      const backupTime = await theEpochTime();

      let usersData = await getUsers(platform);

      //console.log(usersData)

      for (const user of usersData) {

        if (user?.data[platform]?.user_tags?.[tagID] !== undefined) {

          const thisUserID = user.user_id;

          await usersHistoryModel.create({
            user_id: thisUserID,
            platform: platform,
            time_saved: backupTime,
            data: user,
          }, async function (err, createdDocument) {
            if (err) {

              outputResult['status'] = 0;
              msg[31] = sysMsg[31];

            } else {

              user.data[platform].user_tags[tagID] = tag;

              let filter = { user_id: thisUserID };
              let update = {
                $set: {
                  data: user.data,
                }
              };
              let opts = { upsert: true };
              await usersModel.collection.updateOne(filter, update, opts)

            }
          });

        }

      }
 
      logActivity(req, userData.userID, platform, "EDITED USER TAG '" + tag + "' ID: " + tagID);

    }


    if (submitType === 2 || submitType === "2") {

      if (privileges.reception.delete_tags === 1) {

        userTagsModel.deleteOne({ tag_id: tagID }, function () { });

        outputResult['status'] = 1;
        outputResult['qry'] = 1;

        //backup data
        const backupTime = theEpochTime();

        let usersData = await getUsers(platform);

        //console.log(usersData)

        for (const user of usersData) {

          if (user?.data[platform]?.user_tags?.[tagID] !== undefined) {

            const thisUserID = user.user_id;
            delete user.data[platform].user_tags[tagID];

            await usersHistoryModel.create({
              user_id: thisUserID,
              platform: platform,
              time_saved: backupTime,
              data: user,
            }, async function (err, createdDocument) {
              if (err) {

                outputResult['status'] = 1;
                msg[31] = sysMsg[31];

              } else {

                let filter = { user_id: thisUserID };
                let update = {
                  $set: {
                    data: user.data,
                  }
                };
                let opts = { upsert: true };
                await usersModel.collection.updateOne(filter, update, opts)

              }
            });

          }

        }
 
        logActivity(req, userData.userID, platform, "DELETED USER TAG '" + tag + "' ID: " + tagID);

      } else { 
        msg[54] = sysMsg[54];
      }

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

export default handleUpdateTag;