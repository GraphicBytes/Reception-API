//##############################################################
//############### USER NAME TAKEN CHECK FUNCTION ###############
//##############################################################

////////////////////////////////
////// DATA MODEL IMPORTS //////
//////////////////////////////// 
import { displayNamesModel } from '../models/displayNamesModel.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function isDisplayNameNameTaken(platform, displayName) {
  return new Promise((resolve) => {

    let lowerCaseDisplayName = displayName.toLowerCase();

    displayNamesModel.findOne({ platform: platform, display_name: lowerCaseDisplayName }, function (err, obj) {
      if (obj) {
        resolve(true);
        return null;
      } else {
        resolve(false);
        return null;
      }
    });

  });
} 