//############################################################
//############### DILUTE FAILED LOGIN ATTEMPTS ###############
//############################################################

////////////////////////////
////// CONFIG IMPORTS //////
//////////////////////////// 
import limits from '../../config/limits.js';
import { failedLoginDiluteRate } from '../../config/options.js';

////////////////////////////////
////// DATA MODEL IMPORTS //////
//////////////////////////////// 
import { usersModel } from '../../models/usersModel.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { theEpochTime } from '../../functions/helpers/theEpochTime.js';

///////////////////////////
////// THIS CRON JOB //////
///////////////////////////
function diluteFailedLoginAttempts() {

  let currentTime = theEpochTime();
  let targetTime = currentTime - limits.accountDiluteTimeout;

  usersModel.find({ login_fail: { $gt: 0 }, last_attempt: { $lt: targetTime } }).exec()
    .then(docs => {
      for (let doc of docs) {

        if (doc.login_fail > 1) {
          let updateAttemptsValue = doc.login_fail - failedLoginDiluteRate;

          if (updateAttemptsValue < 0) {
            updateAttemptsValue = 0;
          }

          let filter = { user_id: doc.user_id };
          let update = { $set: { login_fail: updateAttemptsValue, } };
          let opts = { upsert: true };
          usersModel.collection.updateOne(filter, update, opts);
        }

      }
    });

  return { "Failed Login Attempts Diluted": "done" };

}

export default diluteFailedLoginAttempts;