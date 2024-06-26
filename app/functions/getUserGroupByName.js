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
export async function getUserGroupByName(platform, groupName) {
  try {
 
    return await doFunction();

    async function doFunction() {

      const userGroupData = await userGroupsModel.find({ platform: platform, group_name: groupName, disabled: 0 });
 
      return userGroupData;

    }

  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
    return null;
  }
}