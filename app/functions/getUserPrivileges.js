//#################################################################
//############### GET USER PRIVILEGES DATA FUNCTION ###############
//#################################################################

////////////////////////////
////// CONFIG IMPORTS //////
//////////////////////////// 
import { defaultPermissions } from '../config/defaultPermissions.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { getUserGroupData } from './getUserGroupData.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function getUserPrivileges(userGroups, platform, isAdmin = false) {
  try {

    const defaultPerms = JSON.parse(JSON.stringify(defaultPermissions));
 
    let privileges = defaultPerms.privileges;
    let individualPrivileges = {};

    for (let groupTag in userGroups) {

      let thisGroupData = await getUserGroupData(groupTag, platform);

      if (thisGroupData) {
        
        let groupID = thisGroupData.group_id;
        let groupParent = thisGroupData.parent;
        let groupName = thisGroupData.group_name;
        let groupPrivileges = thisGroupData.privileges;
        let adminGroupPrivileges = thisGroupData.privileges;

        individualPrivileges[groupID] = {} 
        individualPrivileges[groupID] = JSON.parse(JSON.stringify(defaultPerms.privileges));

        individualPrivileges[groupID].parent = groupParent;

        for (let privKey in groupPrivileges) {

          if (typeof individualPrivileges[groupID][privKey] !== 'undefined') { 
            individualPrivileges[groupID][privKey] = JSON.parse(JSON.stringify(defaultPerms.privileges[privKey]));
          }

          let thisModulePermsList = groupPrivileges[privKey];

          for (let permissionKey in thisModulePermsList) {


            if(typeof privileges[privKey] !== 'undefined') {
              if (typeof privileges[privKey][permissionKey] === 'undefined') {
                
                privileges[privKey][permissionKey] = thisModulePermsList[permissionKey];
                individualPrivileges[groupID][privKey][permissionKey] = thisModulePermsList[permissionKey];

              } else {

                if (individualPrivileges[groupID][privKey][permissionKey] === 0) {
                  privileges[privKey][permissionKey] = thisModulePermsList[permissionKey];
                  individualPrivileges[groupID][privKey][permissionKey] = thisModulePermsList[permissionKey];
                }

              }
            }
          }
        }


        if (isAdmin) {

          for (let privKey in adminGroupPrivileges) {

            if (typeof privileges[privKey] === 'undefined') {
              privileges[privKey] = {}
            }


            if (adminGroupPrivileges[privKey].super_admin === 1) {

              privileges[privKey]["super_admin"] = 1;
              individualPrivileges[groupID][privKey]["super_admin"] = 1;
              
            }

            let thisModulePermsList = privileges[privKey];

            for (let permissionKey in thisModulePermsList) {

              if (typeof privileges[privKey][permissionKey] === 'undefined') {

                privileges[privKey][permissionKey] = thisModulePermsList[permissionKey];
                individualPrivileges[groupID][privKey][permissionKey] = thisModulePermsList[permissionKey];

              } else {

                if (privileges[privKey][permissionKey] === 0) {
                  privileges[privKey][permissionKey] = thisModulePermsList[permissionKey];
                  individualPrivileges[groupID][privKey][permissionKey] = thisModulePermsList[permissionKey];
                }

              }
            }

          }
        }

      }
    }


    return { privileges, individualPrivileges };

  } catch (error) {

    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }

    return null;
  }
} 