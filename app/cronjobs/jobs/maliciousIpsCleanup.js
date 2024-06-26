//#####################################################
//############### MALICIOUS IP CLEAN UP ###############
//#####################################################

////////////////////////////
////// CONFIG IMPORTS //////
//////////////////////////// 
import limits from '../../config/limits.js';
import { maliciousDiluteRate } from '../../config/options.js';

////////////////////////////////
////// DATA MODEL IMPORTS //////
//////////////////////////////// 
import { maliciousIpsModel } from '../../models/maliciousIpsModel.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { theEpochTime } from '../../functions/helpers/theEpochTime.js';

///////////////////////////
////// THIS CRON JOB //////
///////////////////////////
function maliciousIpsCleanup() {

  let currentTime = theEpochTime();
  let targetTime = currentTime - limits.maliciousActivityDiluteTimeout;

  maliciousIpsModel.find({ last_attempt: { $lt: targetTime } }).exec()
    .then(docs => {
      for (let doc of docs) {

        if (doc.attempts > 1) {
          let updateAttemptsValue = doc.attempts - maliciousDiluteRate;

          if (updateAttemptsValue < 0) {
            updateAttemptsValue = 0;
          }

          let filter = { ip: doc.ip };
          let update = { $set: { attempts: updateAttemptsValue, } };
          let opts = { upsert: true };
          maliciousIpsModel.collection.updateOne(filter, update, opts);
        } else {
          maliciousIpsModel.deleteOne({ ip: doc.ip }, function () { });
        }

      }
    });

  return { "Malicious IP's Cleaned": "done" };

}

export default maliciousIpsCleanup;