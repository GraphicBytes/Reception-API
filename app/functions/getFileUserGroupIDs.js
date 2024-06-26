//####################################################################
//############### GET FILE ACCESS USER GROUPS FUNCTION ###############
//####################################################################

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { getUserGroupData } from './getUserGroupData.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function getFileUserGroupIDs(userGroups, platform, isAdmin = false) {
  try {

    let fileAccessGroups = {};
    let i = 0;

    for (let groupTag in userGroups) {

      let thisGroupData = await getUserGroupData(groupTag, platform);

      if (thisGroupData) { 

        let canViewImages = 0;
        let isSuperAdmin = 0;

        if (thisGroupData.privileges !== undefined) {
          if (thisGroupData.privileges.warehouse !== undefined) {
            if (thisGroupData.privileges.warehouse.view_files !== undefined) {
              canViewImages = thisGroupData.privileges.warehouse.view_files;
            }
          }
        }        
        
        if (thisGroupData.privileges !== undefined) {
          if (thisGroupData.privileges.warehouse !== undefined) {
            if (thisGroupData.privileges.warehouse.view_files !== undefined) {
              isSuperAdmin = thisGroupData.privileges.settings.super_admin;
            }
          }
        }

        if (
          canViewImages === 1
          || canViewImages === "1"
          || isSuperAdmin === 1
          || isSuperAdmin === "1"
        ) {

          fileAccessGroups[i] = groupTag;

          i++;

        } 

      }
    }
 

    return fileAccessGroups;


  } catch (error) {

    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }

    return null;
  }
} 