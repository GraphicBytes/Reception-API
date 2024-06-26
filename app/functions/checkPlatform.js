//#######################################################
//############### PLATFORM CHECK FUNCTION ###############
//#######################################################

////////////////////////////////
////// DATA MODEL IMPORTS //////
////////////////////////////////
import { platformsModel } from '../models/platformsModel.js'; 

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
async function checkPlatform(platform) {

  return new Promise((resolve) => {

    platformsModel.findOne({ platform: platform }, function (err, obj) { 

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

module.exports = checkPlatform;