//###################################################
//############### GET USER GROUP LIST ###############
//################################################### 

////////////////////////////////
////// DATA MODEL IMPORTS //////
//////////////////////////////// 
import { userGroupsModel } from '../models/userGroupsModel.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { countUsersInGroup } from './helpers/countUsersInGroup.js'; 

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function getUserGroups(platform, parentGroup = null) {
  try {  
 
    return await doFunction();

    async function doFunction() {

      const userGroups = {}

      let parent;
      if (parentGroup === null) {
        parent = "0";
      } else {
        parent = parentGroup;
      }

      let groups = await userGroupsModel.find({ platform: platform, parent: parent, disabled: 0 });

      if (!groups || groups.length === 0) return null;

      for (const parentItem of groups) {

        let parentGroup = parentItem.toObject();

        const subGroups = await userGroupsModel.find({ platform: platform, parent: parentGroup.group_tag, disabled: 0 });

        if (subGroups && subGroups.length > 0) {

          parentGroup.subGroups = {}

          for (const childItem of subGroups) {

            let childGroup = childItem.toObject();

            const subSubGroups = await userGroupsModel.find({ platform: platform, parent: childGroup.group_tag, disabled: 0 });

            if (subSubGroups && subSubGroups.length > 0) {

              childGroup.subGroups = {}

              for (const infantItem of subSubGroups) {

                let infantGroup = infantItem.toObject();

                const babyGroups = await userGroupsModel.find({ platform: platform, parent: infantGroup.group_tag, disabled: 0 });

                if (babyGroups && babyGroups.length > 0) {

                  infantGroup.subGroups = {}

                  for (const babyItem of babyGroups) {

                    let babyGroup = babyItem.toObject();

                    infantGroup.subGroups[babyGroup.group_tag] = babyGroup;

                  }

                }

                childGroup.subGroups[infantGroup.group_tag] = infantGroup;

              }

            }

            parentGroup.subGroups[childGroup.group_tag] = childGroup;

          }

        }

        userGroups[parentGroup.group_tag] = parentGroup;
      }
      
      return userGroups;

    }

  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
    return null;
  }
}





export async function getAllUserGroups(platform) {
  try {
    
    return await doFunction();

    async function doFunction() {

      const userGroups = []

      const groups = await userGroupsModel.find(
        {
          platform: platform,
          $or: [
            { parent: "0" },
            { parent: 0 }
          ],
          disabled: 0
        }
      );

      if (!groups || groups.length === 0) return null;

      let arrayID = 0;

      for (const parentItem of groups) {

        let parentGroup = parentItem.toObject();

        let totalUsers = 0;

        let thisGroup = {}
        let thisGroupGroupUserCount = await countUsersInGroup(platform, parentGroup.group_tag);
        totalUsers = totalUsers + thisGroupGroupUserCount;

        //console.log( parentGroup.group_tag + " " + thisGroupGroupUserCount);

        thisGroup.group = parentGroup.data.group_label;
        thisGroup.id = parentGroup.group_tag;
        thisGroup.members = thisGroupGroupUserCount;
        thisGroup.created = parentGroup.data.created;
        thisGroup.description = parentGroup.data.description ? parentGroup.data.description : "";

        const subGroups = await userGroupsModel.find({ platform: platform, parent: parentGroup.group_tag, disabled: 0 });

        if (subGroups && subGroups.length > 0) {

          thisGroup.expandData = {}

          for (const childItem of subGroups) {

            let childGroup = childItem.toObject();
            let thisChildGroupGroupUserCount = await countUsersInGroup(platform, childGroup.group_tag);
            totalUsers = totalUsers + thisChildGroupGroupUserCount; 
            
            thisGroup.expandData[childGroup.group_tag] = {
              subGroup: childGroup.data.group_label,
              id: childGroup.group_tag,
              members: thisChildGroupGroupUserCount,
              created: childGroup.data.created,
              description: childGroup.data.description ? childGroup.data.description : "",              
              permissions: childGroup.data.privileges ? childGroup.data.privileges : {},
            }

            //console.log(thisGroup)


            const subSubGroups = await userGroupsModel.find({ platform: platform, parent: childGroup.group_tag, disabled: 0 });

            if (subSubGroups && subSubGroups.length > 0) {

              let thisInfant = {}

              for (const infantItem of subSubGroups) {

                let thisInfantGroupGroupUserCount = await countUsersInGroup(platform, infantItem.group_tag);
                totalUsers = totalUsers + thisInfantGroupGroupUserCount;

                thisChildGroupGroupUserCount = thisChildGroupGroupUserCount + thisInfantGroupGroupUserCount;

                thisInfant[infantItem.group_tag] = {
                  subGroup: infantItem.data.group_label,
                  id: infantItem.group_tag,
                  members: thisInfantGroupGroupUserCount,
                  created: infantItem.data.created,
                  description: infantItem.data.description ? infantItem.data.description : "",
                  permissions: infantItem.data.privileges ? infantItem.data.privileges : {},
                };

              }

              let thisInfantClean = Object.values(thisInfant);

              thisGroup.expandData[childGroup.group_tag].subsubGroups = thisInfantClean;
            }

            thisGroup.expandData[childGroup.group_tag].members = thisChildGroupGroupUserCount;

          }

        }

        thisGroup.members = totalUsers;


        let thisExpanded = thisGroup.expandData;
        if (thisExpanded !== undefined) {

          let thisExpandedClean = Object.values(thisExpanded);
          thisGroup.expandData = thisExpandedClean;
        }


        if (thisGroup.expandData === undefined) {
          thisGroup.expandData = []
        }

        //delete thisGroup.expandData;

        userGroups[arrayID] = thisGroup;
        arrayID++
      }
      
      return userGroups;

    }

  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
    return null;
  }
} 