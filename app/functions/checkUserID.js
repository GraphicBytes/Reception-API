//###########################################################
//############### CHECK USER ID EXISTANCE FUNCTION ##########
//###########################################################

////////////////////////////////
////// DATA MODEL IMPORTS //////
////////////////////////////////
import { usersModel } from '../models/usersModel.js'; 

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function checkUserID(userID) {
  return new Promise((resolve) => {

    usersModel.findOne({ user_id: userID, hidden: 0 }, function (err, obj) { 

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
 