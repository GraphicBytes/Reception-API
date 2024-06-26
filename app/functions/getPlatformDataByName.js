//##################################################################
//############### GET PLATFORM DATA BY NAME FUNCTION ###############
//##################################################################

////////////////////////////////
////// DATA MODEL IMPORTS //////
////////////////////////////////
import { userGroupsModel } from '../models/userGroupsModel.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function getPlatformDataByName(platform, groupName) {

  return new Promise((resolve) => {

    userGroupsModel.findOne({ group_name: groupName, platform: platform, disabled: 0 }, function (err, obj) {

      if (obj) {

        let thisReturn = obj.data
        thisReturn._id = obj._id;
        thisReturn.group_tag = obj.group_tag;

        resolve(obj.data);
        return null;

      } else {
        resolve(false);
        return null;
      }
    });
  });
}
