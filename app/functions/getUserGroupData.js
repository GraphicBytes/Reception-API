//############################################################
//############### GET USER GROUP DATA FUNCTION ###############
//############################################################ 

////////////////////////////////
////// DATA MODEL IMPORTS //////
//////////////////////////////// 
import { userGroupsModel } from '../models/userGroupsModel.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function getUserGroupData(groupTag, platform) {
  try {
 
    return await doFunction();

    async function doFunction() {

      const obj = await userGroupsModel.findOne({ group_tag: groupTag, platform: platform, disabled: 0 });

      if (obj) {

        let thisResolve = obj.data;
        thisResolve.group_id = obj.group_tag;
        thisResolve.parent = obj.parent;
        
        return thisResolve;

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