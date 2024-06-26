//###########################################################
//############### GET USER LIST DATA FUNCTION ###############
//########################################################### 

////////////////////////////////
////// DATA MODEL IMPORTS //////
//////////////////////////////// 
import { usersModel } from '../models/usersModel.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
import { getUserGroupData } from './getUserGroupData.js';
import { getUserTagData } from './getUserTagData.js';
import { isIterable } from './helpers/isIterable.js'; 

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function getUsersTableData(platform) {
  try {
 
    return await doFunction();

    async function doFunction() {

      let usersData = {}
      const obj = await usersModel.find({ platform: platform, hidden: 0 })

      if (obj) {

        let i = 0;

        for (const thisUser of obj) {

          let thisUsersGroupsData = {};
          let thisUsersTagsData = [];

          if (thisUser.data[platform] !== undefined) {

            if (thisUser.data[platform].user_tags !== undefined) {
              thisUsersTagsData = Object.keys(thisUser.data[platform].user_tags);
            }

            if (thisUser.data[platform].user_groups !== undefined) {
              thisUsersGroupsData = Object.keys(thisUser.data[platform].user_groups);
            }

          }

          let thisUsersGroups = {};
          if (isIterable(thisUsersGroupsData)) {
            let gi = 0;
            for (const groupTag of thisUsersGroupsData) {
              let thisGroup = await getUserGroupData(groupTag, platform);

              if (thisGroup.group_label !== undefined && thisGroup.group_label !== null) {
                thisUsersGroups[gi] = {
                  group_id: thisGroup.group_id,
                  group_label: thisGroup.group_label
                };
                gi++
              }
            }
          }
          thisUsersGroups = Object.values(thisUsersGroups);


          let thisUsersTags = {};
          if (isIterable(thisUsersTagsData)) {
            let ti = 0;
            for (const tagId of thisUsersTagsData) {
              let thisTag = await getUserTagData(tagId, platform);

              if (thisTag.tag_name !== undefined && thisTag.tag_name !== null) {
                thisUsersTags[ti] = {
                  tag_id: thisTag.tag_id,
                  tag_name: thisTag.tag_name
                }
                ti++
              }
            }
          }


          let status = "Locked";
          if (thisUser.banned === 0) {
            status = "Active";

            if (thisUser.data[platform].invite_token_open !== undefined) {
              if (thisUser.data[platform].invite_token_open === 1) {
                status = "Pending";
              }
            }
          }

          let lastLocked = 0;
          if (thisUser.data.time_banned !== undefined) {
            lastLocked = thisUser.data.time_banned;
          }

          let thisExpandedData = {};
          if (thisUser.data[platform] !== undefined) {
            if (thisUser.data[platform].user_groups !== undefined) {
              thisExpandedData = thisUser.data[platform].user_meta;
            }
          }

          thisExpandedData['last_attempt'] = thisUser.last_attempt;
          thisExpandedData['id'] = thisUser.user_id;


          if (thisUser.banned === 1) {
            thisExpandedData['banned_at'] = thisUser.data.time_banned;
          }


          let avatarID = "default";
          if (thisUser.data[platform] !== undefined) {
            if (thisUser.data[platform].user_meta !== undefined) {
              if (thisUser.data[platform].user_meta.avatar !== undefined) {
                avatarID = thisUser.data[platform].user_meta.avatar;
              }
            }
          }


          let fullName = "";
          if (thisUser.data[platform] !== undefined) {
            if (thisUser.data[platform].user_meta !== undefined) {

              if (thisUser.data[platform].user_meta.first_name !== undefined) {
                fullName = thisUser.data[platform].user_meta.first_name;
              }
              if (thisUser.data[platform].user_meta.surname !== undefined) {
                fullName = fullName + " " + thisUser.data[platform].user_meta.surname;
              }
            }
          }

          usersData[i] = {
            image_name: [
              avatarID,
              fullName,
            ],
            email: thisUser.email,
            tags: thisUsersTags,
            groups: thisUsersGroups,
            status: status,
            last_locked:lastLocked,
            expandData: [thisExpandedData]
          };

          i++;

        }
        
        return usersData;

      } else {
        return false;
      }

    }

  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
    return null;
  }
}
