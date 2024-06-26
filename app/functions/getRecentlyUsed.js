//##########################################################
//############### GET RECENTLY USED FUNCTION ###############
//##########################################################

////////////////////////////////
////// DATA MODEL IMPORTS //////
////////////////////////////////
import { recentlyUsedModel } from '../models/recentlyUsedModel.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function getRecentlyUsed(platform, userID) {
  return new Promise((resolve) => { 

    let i = 0;
    let recentlyUsedLog = {};

    recentlyUsedModel.find({ user_id: userID, platform: platform })
    .sort({ log_time: -1 }) // for descending order, 1 for ascending order
    .exec(function(err, obj) {

      if (obj) {

        for (const thisLog of obj) {

          recentlyUsedLog[i] = {
            date_action: thisLog.log_time,
            action:  thisLog.log_event,
          }
          i++;
        }
       
        const orderedData = {};
        const orderedKeys = Object.keys(recentlyUsedLog).sort((a, b) => b - a);
        orderedKeys.forEach(key => {
          orderedData[key] = recentlyUsedLog[key];
        });

        const ordereDataClean = Object.values(recentlyUsedLog)

        resolve(ordereDataClean);
        return null;

      } else {
        resolve(thisLog);
        return null;
      }
    });

  });
} 