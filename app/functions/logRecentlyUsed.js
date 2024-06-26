//######################################################
//###############  LOG ACTIVITY FUNCTION ###############
//######################################################

////////////////////////////////
////// DATA MODEL IMPORTS //////
////////////////////////////////
import {recentlyUsedModel} from '../models/recentlyUsedModel.js';
 
//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { theEpochTime } from './helpers/theEpochTime.js'; 

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function logRecentlyUsed(req, userID, platform, logData) {
  return new Promise((resolve) => {
 
    let requestTime = theEpochTime(); 

    recentlyUsedModel.create({
      user_id: userID,
      platform: platform,
      log_event: logData,
      log_time: requestTime
    });


    resolve(true);
    return null;

  });
}