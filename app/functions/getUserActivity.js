//###############################################################
//############### GET USER ACTIVITY DATA FUNCTION ###############
//###############################################################

////////////////////////////////
////// DATA MODEL IMPORTS //////
//////////////////////////////// 
import { activityLogModel } from '../models/activityLogModel.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function getUserActivity(platform, userID) {
  return new Promise((resolve) => { 

    let i = 0;
    let usersLog = {};

    activityLogModel.find({ user_id: userID, platform: platform }, function (err, obj) {        

      if (obj) {

        for (const thisLog of obj) {

          usersLog[i] = {
            date_action: thisLog.log_time,
            action:  thisLog.log_event,
          }
          i++;
        }
       
        const orderedData = {};
        const orderedKeys = Object.keys(usersLog).sort((a, b) => b - a);
        orderedKeys.forEach(key => {
          orderedData[key] = usersLog[key];
        });

        const ordereDataClean = Object.values(usersLog)

        resolve(ordereDataClean);
        return null;

      } else {
        resolve(thisLog);
        return null;
      }
    });

  });
} 