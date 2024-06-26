//###########################################################
//############### GET USER CORE DATA FUNCTION ###############
//########################################################### 

////////////////////////////////
////// DATA MODEL IMPORTS //////
////////////////////////////////
import { usersModel } from '../models/usersModel.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function getUser(email, platform) {

  return new Promise((resolve) => {
 
    
    usersModel.findOne({ email: email, platform: platform, hidden: 0 }, function (err, obj) {

      if (obj) {

        let userData = {
          "userID": obj.user_id,
          "userEmail": obj.email,
          "userBanned": obj.banned,
          "hidden": 0,
          "userLoginFail": obj.login_fail,
          "lastAttempt": obj.last_attempt,
          "userData": obj.data
        }
 
        resolve(userData);
        return null;

      } else {
        resolve(false);
        return null;
      }
    });

  });
}


export async function getUsers(platform) {

  return new Promise((resolve) => { 

    usersModel.find({ platform: platform, hidden: 0 }, function (err, obj) {

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