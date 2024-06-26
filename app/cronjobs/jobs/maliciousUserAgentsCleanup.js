//##############################################################
//############### MALICIOUS USER AGENTS CLEAN UP ###############
//##############################################################

////////////////////////////
////// CONFIG IMPORTS //////
//////////////////////////// 
import limits from '../../config/limits.js';
import { maliciousDiluteRate } from '../../config/options.js';

////////////////////////////////
////// DATA MODEL IMPORTS //////
//////////////////////////////// 
import { maliciousUserAgentsModel } from '../../models/maliciousUserAgentsModel.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { theEpochTime } from '../../functions/helpers/theEpochTime.js';

///////////////////////////
////// THIS CRON JOB //////
///////////////////////////
function maliciousUserAgentsCleanup() {

  let currentTime = theEpochTime();
  let targetTime = currentTime - limits.maliciousActivityDiluteTimeout;

  maliciousUserAgentsModel.find({ last_attempt: { $lt: targetTime } }).exec()
    .then(docs => {
      for (let doc of docs) {

        if (doc.attempts > 1) {
          let updateAttemptsValue = doc.attempts - maliciousDiluteRate;

          if (updateAttemptsValue < 0) {
            updateAttemptsValue = 0;
          }

          let filter = { agent_hash: doc.agent_hash };
          let update = { $set: { attempts: updateAttemptsValue, } };
          let opts = { upsert: true };
          maliciousUserAgentsModel.collection.updateOne(filter, update, opts);
        } else {
          maliciousUserAgentsModel.deleteOne({ agent_hash: doc.agent_hash }, function () { });
        }

      }
    });

  return { "Malicious User Agents's Cleaned": "done" };

}

export default maliciousUserAgentsCleanup;