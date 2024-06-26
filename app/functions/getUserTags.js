//##################################################
//############### GET USER TAGS LIST ###############
//##################################################

////////////////////////////////
////// DATA MODEL IMPORTS //////
//////////////////////////////// 
import { userTagsModel } from '../models/userTagsModel.js'; 

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function getUserTags(platform) {
  
  return await doFunction();

  async function doFunction() {

    try {

      const tags = await userTagsModel.find({ platform: platform })

      if (tags) { 
        return tags;

      } else {
        return false;
      }

    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(error);
      }
      return false;
    }
  }
} 