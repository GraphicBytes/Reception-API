//##########################################################
//############### GET USER TAG DATA FUNCTION ###############
//##########################################################

////////////////////////////////
////// DATA MODEL IMPORTS //////
//////////////////////////////// 
import { userTagsModel } from '../models/userTagsModel.js';

/////////////////////////////
////// THESE FUNCTIONS //////
/////////////////////////////
export async function getUserTagData(userTag, platform) {

  return new Promise((resolve) => {

    userTagsModel.findOne({ tag_id: userTag, platform: platform }, function (err, obj) {
      if (obj) {
        resolve(obj);
        return null;
      } else {
        resolve(false);
        return null;
      }
    });

  });
}

export async function getUserTagDataByName(tagName, platform) {

  return new Promise((resolve) => {

    userTagsModel.findOne({ tag_name: tagName, platform: platform }, function (err, obj) {
      if (obj) {
        resolve(obj);
        return null;

      } else {
        resolve(false);
        return null;
      }
    });

  });
} 