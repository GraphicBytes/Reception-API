//###################################################
//############### GET USER GROUP LIST ###############
//###################################################

////////////////////////////////
////// DATA MODEL IMPORTS //////
//////////////////////////////// 
import { userGroupsModel } from '../models/userGroupsModel.js'; 

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function getUserGroup(platform, groupID) {
  try { 

    return await doFunction();

    async function doFunction() {

      const userGroupData = await userGroupsModel.find({ platform: platform, group_tag: groupID, disabled: 0 });
 
      return userGroupData;

    }

  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
    return null;
  }
}