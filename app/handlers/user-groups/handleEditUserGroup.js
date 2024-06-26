//###################################################
//############### GET USER GROUP DATA ###############
//###################################################

////////////////////////////
////// CONFIG IMPORTS //////
////////////////////////////
import { sysMsg } from '../../config/systemMessages.js';

////////////////////////////////
////// DATA MODEL IMPORTS //////
////////////////////////////////
import { userGroupsModel } from '../../models/userGroupsModel.js';
import { usersHistoryModel } from '../../models/usersHistoryModel.js';
import { usersModel } from '../../models/usersModel.js';
import { defaultPermissions } from '../../config/defaultPermissions.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { requestUserCheck } from '../../functions/requestUserCheck.js';
import { createUUID } from '../../functions/createUUID.js';
import { logActivity } from '../../functions/logActivity.js';
import { getUser, getUsers } from '../../functions/getUser.js';
import { getUserPrivileges } from '../../functions/getUserPrivileges.js';
import { getUserGroup } from '../../functions/getUserGroup.js';
import { getUserGroupByName } from '../../functions/getUserGroupByName.js';
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
import { createUrlSafeString } from '../../functions/helpers/createUrlSafeString.js';
import { replaceBooleans } from '../../functions/helpers/replaceBooleans.js';
import { theEpochTime } from '../../functions/helpers/theEpochTime.js';
import { isObjEmpty } from '../../functions/helpers/isObjEmpty.js';
import { padZero } from '../../functions/helpers/padZero.js';

//////////////////////////////////////////
////// MALICIOUS ACTIVITY FUNCTIONS //////
//////////////////////////////////////////
import { logMalicious } from '../../functions/malicious/logMalicious.js';

//////////////////////////
////// THIS HANDLER //////
//////////////////////////
async function handleGetUserGroup(app, req, res) {

  let outputResult = {
    "status": 0,
    "qry": 0,
  };
  let msg = {}
  const currentDate = new Date();

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

    let groupID = req.params.id;

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

    ///////////////////////////////////////
    ////// IN-LINE SUPPORT FUNCTIONS //////
    ///////////////////////////////////////
    function mergeWithPriorityZero(obj1, obj2) {
      let result = { ...obj1 };

      Object.keys(obj2).forEach(key => {
        if (obj1.hasOwnProperty(key) && typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
          result[key] = mergeWithPriorityZero(obj1[key], obj2[key]);
        } else if (!obj1.hasOwnProperty(key)) {
          result[key] = obj2[key];
        } else {
          result[key] = (obj1[key] === 0 || obj2[key] === 0) ? 0 : obj2[key];
        }
      });

      return result;
    }
    function mergeWithPrioritOne(obj1, obj2) {
      let result = { ...obj2 }; // Start with obj2 as the base

      Object.keys(obj1).forEach(key => {
        if (obj2.hasOwnProperty(key) && typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
          result[key] = mergeWithPrioritOne(obj1[key], obj2[key]);
        } else if (!obj2.hasOwnProperty(key)) {
          // If key is not in obj2, add it from obj1
          result[key] = obj1[key];
        } else {
          // Now updating with values of 1 from obj1
          result[key] = obj1[key] === 1 ? 1 : obj2[key];
        }
      });

      return result;
    }


    function setAllValuesToZero(obj) {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'object') {
          setAllValuesToZero(obj[key]);
        } else {
          obj[key] = 0;
        }
      });
    }

    function setAllValuesToOne(obj) {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'object') {
          setAllValuesToOne(obj[key]);
        } else {
          obj[key] = 1;
        }
      });
    }


    //##########################
    //##### HANDLE REQUEST #####
    //########################## 

    let userGroups = userData.userData[platform].user_groups;

    let fullPrivileges = await getUserPrivileges(userGroups, platform, true);
    let privileges = fullPrivileges.privileges;

    if (
      !(
        privileges.reception.view_user_groups === 1
        && privileges.reception.edit_user_groups === 1
      )
      && privileges.settings.super_admin !== 1
    ) {
      msg[13] = sysMsg[13];
      logMalicious(req, "13");
      resSendOk(req, res, outputResult, msg);
      return null;
    }

    let newData = JSON.parse(req.body.newData);
    const userGroupsData = await getUserGroup(platform, groupID);
    let oldGroupData = userGroupsData[0];

    let submitType = req.body.submit_type;

    let noError = true;


    //////////////////////
    ////// DELETE GROUP //////
    //////////////////////
    if ((submitType === 2 || submitType === "2") && groupID !== "new-group") {

      if (privileges.reception.delete_user_groups === 1) {

        let thisID = userGroupsData[0].group_tag;
        let parentID = userGroupsData[0].parent;

        let isDefaultLocked = 0;
        if (userGroupsData[0].data.default_locked !== undefined) {
          isDefaultLocked = userGroupsData[0].data.default_locked;
        }

        if (isDefaultLocked !== 1) {

          const childGroupsData = await getUserGroups(platform, thisID);

          if (childGroupsData) {

            const childGroups = Object.values(childGroupsData);

            for (const childGroup of childGroups) {
 
              const fullTimestamp = `${currentDate.getFullYear()}-${padZero(currentDate.getMonth() + 1)}-${padZero(currentDate.getDate())}_${padZero(currentDate.getHours())}-${padZero(currentDate.getMinutes())}-${padZero(currentDate.getSeconds())}`;;

              let disabledNewName = childGroup.group_name + "__disabled__" + fullTimestamp;

              let filter = { group_tag: childGroup.group_tag };
              let update = {
                $set: {
                  group_name: disabledNewName,
                  disabled: 1,
                  "data.time_disabled": currentDate,
                }
              };
              let opts = { upsert: true };
              await userGroupsModel.collection.updateOne(filter, update, opts);

            }
          }

          const backupTime = await theEpochTime();
          let usersData = await getUsers(platform);
          for (const user of usersData) {

            if (user.data[platform].user_groups[thisID] !== undefined) {

              const thisUserID = user.user_id;

              await usersHistoryModel.create({
                user_id: thisUserID,
                platform: platform,
                time_saved: backupTime,
                data: user,
              }, async function (err, createdDocument) {
                if (err) {

                  msg[31] = sysMsg[31];

                } else {

                  delete user.data[platform].user_groups[thisID];

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

            };
          }
 
          const fullTimestamp = `${currentDate.getFullYear()}-${padZero(currentDate.getMonth() + 1)}-${padZero(currentDate.getDate())}_${padZero(currentDate.getHours())}-${padZero(currentDate.getMinutes())}-${padZero(currentDate.getSeconds())}`;

          let disabledNewName = userGroupsData[0].group_name + "__disabled__" + fullTimestamp;


          let filter = { group_tag: thisID };
          let update = {
            $set: {
              group_name: disabledNewName,
              disabled: 1,
              "data.time_disabled": currentDate,
            }
          };
          let opts = { upsert: true };
          let disable = await userGroupsModel.collection.updateOne(filter, update, opts)

          if (disable) {
            outputResult['status'] = 1;
            outputResult['qry'] = 1;
          } else {
            outputResult['status'] = 2;
            msg[0] = sysMsg[0];
          }

        } else {
          outputResult['status'] = 2;
          msg[36] = sysMsg[36];
        }

      } else {
        msg[55] = sysMsg[55];
      }



      //////////////////////
      ////// EDITING GROUP //////
      //////////////////////
    } else if (newData.editing && groupID !== "new-group") {

      let safeName;

      // change group name
      let newGroupLabel = newData.groupData.groupName;
      let oldGroupLabel = oldGroupData.data.group_label;

      if (oldGroupData.data.group_label !== newData.groupData.heading) {
        oldGroupData.data.group_label = newData.groupData.heading;
      } else if (oldGroupData.data.group_label !== newData.groupData.groupName) {
        oldGroupData.data.group_label = newData.groupData.groupName;
      }


      if (newGroupLabel !== oldGroupLabel) {

        if (newGroupLabel !== null && newGroupLabel !== undefined && newGroupLabel !== "") {
          safeName = createUrlSafeString(newGroupLabel);
        } else {
          noError = false;
          msg[32] = sysMsg[32];
        }

        if (noError) {

          const nameTaken = await getUserGroupByName(platform, safeName);

          if (nameTaken.length === 0) {
            oldGroupData.group_name = safeName;
            oldGroupData.data.group_name = safeName;
            oldGroupData.data.group_label = newGroupLabel;
          } else {
            noError = false;
            msg[33] = sysMsg[33];
          }
        }

      }

      if (noError) {

        let newPermissions = replaceBooleans(newData.groupData.permissions);

        oldGroupData.data.privileges = newPermissions;
        oldGroupData.data.description = newData.groupData.description

        let oldParent = oldGroupData.parent;

        let newParent;
        if (newData.defaultParent !== undefined) {
          if (newData.defaultParent.value !== undefined) {
            newParent = newData.defaultParent.value;
          }
        }

        if (newParent !== undefined && oldParent !== newParent) {
          oldGroupData.parent = newParent;
        } else {
          oldGroupData.parent = oldParent;
        }

        let doParent
        if (oldGroupData.parent === null || oldGroupData.parent === undefined) {
          doParent = "0";
        } else {
          doParent = oldGroupData.parent;
        }

        ////// UPDATE THIS GROUP WITH THE ZEROS FROM IT'S PARENT
        const parentData = await getUserGroup(platform, doParent);
        if (parentData[0] !== undefined) {
          if (parentData[0].parent !== undefined) {
            if (parentData[0].parent !== 0 && parentData[0].parent !== "0") {
              const newPermissions = mergeWithPriorityZero(parentData[0].data.privileges, oldGroupData.data.privileges);
              oldGroupData.data.privileges = newPermissions;
            }
          }
        }

        ////// UPDATE ALL THE CHILDEN WITH ANY ZERO PERMISSIONS
        const childGroups = await getUserGroups(platform, groupID);

        if (childGroups !== null && childGroups !== undefined) {

          Object.keys(childGroups).forEach((key) => {

            if (oldGroupData.data.privileges !== null || oldGroupData.data.privileges !== undefined) {

              const newChildData = mergeWithPriorityZero(oldGroupData.data.privileges, childGroups[key].data.privileges);

              let filter = { group_tag: key };
              let update = {
                $set: {
                  "data.privileges": newChildData,
                }
              };
              let opts = { upsert: true };
              userGroupsModel.collection.updateOne(filter, update, opts);

            }

          });

        }


        if (safeName === null || safeName === "" || safeName === undefined) {
          safeName = oldGroupData.group_name;
        }


        let filter = { group_tag: groupID };
        let update = {
          $set: {
            group_name: safeName,
            parent: doParent,
            data: oldGroupData.data,
          }
        };
        let opts = { upsert: true };
        await userGroupsModel.collection.updateOne(filter, update, opts);

        outputResult['status'] = 1;
        outputResult['qry'] = 1;



        const backupTime = await theEpochTime();
        let usersData = await getUsers(platform);
        for (const user of usersData) {

          if (user.data[platform].user_groups[groupID] !== undefined) {

            if (user.data[platform].user_groups[groupID] !== oldGroupData.group_name) {

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

                  user.data[platform].user_groups[groupID] = oldGroupData.group_name;

                  let filter = { user_id: thisUserID };
                  let update = {
                    $set: {
                      data: user.data,
                    }
                  };
                  let opts = { upsert: true };
                  await usersModel.collection.updateOne(filter, update, opts)

                  outputResult['status'] = 1;
                  outputResult['qry'] = 1;

                }
              });

            }

          };

        }

        logActivity(req, userData.userID, platform, "EDITED '" + oldGroupData.group_name + "' ID: " + groupID);

      }

    } else {

      let newGroupLabel;

      if (newData.groupData.heading === undefined) {

        newGroupLabel = newData.groupData.groupName;

      } else if (newGroupLabel !== newData.groupData.heading) {
        newGroupLabel = newData.groupData.heading;
      } else if (oldGroupData.data.group_label !== newData.groupData.groupName) {
        newGroupLabel = newData.groupData.groupName;
      }

      if (newGroupLabel !== null && newGroupLabel !== undefined && newGroupLabel !== "") {

        let safeName = createUrlSafeString(newGroupLabel);

        const nameTaken = await getUserGroupByName(platform, safeName);

        if (nameTaken.length === 0) {

          let newPermissions = replaceBooleans(newData.groupData.permissions);
          if (newPermissions === undefined || isObjEmpty(newPermissions)) {
            newPermissions = JSON.parse(JSON.stringify(defaultPermissions.privileges));
          }

          let groupParent = newData.groupData.parentID;
          if (groupParent === "" || groupParent === undefined || groupParent === null) {
            groupParent = newData.groupData.headingID;

            if (groupParent === "" || groupParent === undefined || groupParent === null) {
              groupParent = newData.groupData.defaultHeading
            }
          }

          if (groupParent === undefined || groupParent === null || groupParent === "") {
            groupParent = 0;
          }

          if (groupParent !== undefined && groupParent !== null && groupParent !== "") {

            let groupDescription = "";
            if (groupDescription !== undefined) {
              groupDescription = newData.groupData.description;
            }

            let groupTag = await createUUID();


            const newDefaultPermissions = JSON.parse(JSON.stringify(defaultPermissions));

            setAllValuesToZero(newDefaultPermissions);


            if (groupParent !== 0 && groupParent !== "0" && groupParent !== undefined && groupParent !== "") {

              const parentData = await getUserGroup(platform, groupParent);

              let newPermissions;
              if (newData.groupData.permissions !== undefined) {

                const newDataPermsJoined = mergeWithPrioritOne(newDefaultPermissions.privileges, newData.groupData.permissions);

                newPermissions = mergeWithPriorityZero(parentData[0].data.privileges, newDataPermsJoined);

              } else {
                newPermissions = newDefaultPermissions;
              }

              newData.groupData.permissions = newPermissions;

            }


            const newPerms = newData.groupData.permissions;

            if (groupParent === 0) {
              setAllValuesToOne(newPerms);
            }


            let newGroupData = {
              group_tag: groupTag,
              group_name: safeName,
              platform: platform,
              parent: groupParent,
              disabled: 0,
              data: {
                group_name: safeName,
                group_label: newGroupLabel,
                group_type: 'group',
                created: theEpochTime(),
                created_by: userData.userID,
                privileges: newPerms,
                description: groupDescription
              }
            }

            outputResult['status'] = 1;
            outputResult['qry'] = 1;
            outputResult['new_id'] = groupTag;

            await userGroupsModel.create({
              group_tag: newGroupData.group_tag,
              group_name: newGroupData.group_name,
              platform: newGroupData.platform,
              parent: newGroupData.parent,
              disabled: newGroupData.disabled,
              data: newGroupData.data,
            }, async function (err, createdDocument) {
              if (err) {

                msg[35] = sysMsg[35];

              } else {

                outputResult['status'] = 1;
                outputResult['qry'] = 1;
                outputResult['new_id'] = groupTag;

                logActivity(req, userData.userID, platform, "CREATED USER GROUP: '" + newGroupLabel + "' ID: " + groupTag);

              }

            });

          } else {
            noError = false;
            msg[34] = sysMsg[34];
          }

        } else {
          noError = false;
          msg[33] = sysMsg[33];
        }

        let groupParent;
        if (newData.groupData.groupHeading || newData.groupData.groupHeading === "true") {
          groupParent = "0"
        } else {
          if (newData.groupData.parentID !== undefined && newData.groupData.parentID !== "") {
            groupParent = newData.groupData.parentID;
          } else {
            groupParent = newData.groupData.headingID;
          }
        }




      } else {
        noError = false;
        msg[32] = sysMsg[32];
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

export default handleGetUserGroup;