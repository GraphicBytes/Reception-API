//#################################################################
//############### GET USER CORE DATA BY ID FUNCTION ###############
//#################################################################

////////////////////////////////
////// DATA MODEL IMPORTS //////
//////////////////////////////// 
import { usersModel } from '../models/usersModel.js'; 

/////////////////////////////
////// THESE FUNCTIONS ///////
/////////////////////////////
export async function getUserById(id, platform) {

  return new Promise((resolve) => {

    usersModel.findOne({ user_id: id, platform: platform, hidden: 0 }, function (err, obj) {

      if (obj) {

        let userData = {
          "userID": obj.user_id,
          "userEmail": obj.email,
          "userBanned": obj.banned,
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


export async function getUserByIdUnfiltered(id, platform) {

  return new Promise((resolve) => {

    usersModel.findOne({ user_id: id, platform: platform, hidden: 0 }, function (err, obj) {

      if (obj) {
        resolve(obj)
        return null;

      } else {
        resolve(false);
        return null;
      }
    });

  });
}
