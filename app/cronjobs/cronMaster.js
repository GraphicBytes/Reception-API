//#########################################
//############### CRON JOBS ###############
//#########################################

////////////////////////////////
////// DATA MODEL IMPORTS //////
////////////////////////////////
import { apiDataModel } from '../models/apiDataModel.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { theEpochTime } from '../functions/helpers/theEpochTime.js';

//////////////////////////////
////// CRON JOB IMPORTS //////
//////////////////////////////
import maliciousIpsCleanup from './jobs/maliciousIpsCleanup.js';
import maliciousUserAgentsCleanup from './jobs/maliciousUserAgentsCleanup.js';
import diluteFailedLoginAttempts from './jobs/diluteFailedLoginAttempts.js';

///////////////////////////
////// CRON FUNCTION //////
///////////////////////////
export async function cronTasks() {

  let requestTime = theEpochTime();

  //// MALICIOUS IP CLEAN UP ////
  maliciousIpsCleanup();

  //// MALICIOUS USER AGENTS CLEAN UP ////
  maliciousUserAgentsCleanup();

  //// FAILED LOGIN ATTEMPTS CLEAN UP ////
  diluteFailedLoginAttempts();

  //// UPDATE LAST CRON TIME ////
  let filter = { meta_key: "last_cron" };
  let update = { $set: { meta_value: requestTime, } };
  let opts = { upsert: true };
  apiDataModel.collection.updateOne(filter, update, opts);

}
