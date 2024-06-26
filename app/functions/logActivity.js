//######################################################
//###############  LOG ACTIVITY FUNCTION ###############
//######################################################

////////////////////////////////
////// DATA MODEL IMPORTS //////
////////////////////////////////
import { activityLogModel } from '../models/activityLogModel.js';
import { systemLogModel } from '../models/systemLogModel.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { theUserIP } from './helpers/theUserIP.js';
import { theEpochTime } from './helpers/theEpochTime.js';
import { theUserAgent } from './helpers/theUserAgent.js';

///////////////////////////////////////
////// IN-LINE SUPPORT FUNCTIONS //////
///////////////////////////////////////
const capitalizeFirstWord = (sentence) => {
  if (!sentence) return sentence;
  return sentence.charAt(0).toUpperCase() + sentence.slice(1).toLowerCase();
};

/////////////////////////////
////// THESE FUNCTIONS //////
/////////////////////////////
export async function logActivity(req, userID, platform, logMessage) {
  return new Promise((resolve) => {

    const userIP = theUserIP(req);
    const requestTime = theEpochTime();
    const userAgent = theUserAgent(req);

    const cleanLogMsg = capitalizeFirstWord(logMessage);

    activityLogModel.create({
      user_id: userID,
      platform: platform,
      user_ip: userIP,
      user_agent: userAgent,
      log_event: cleanLogMsg,
      log_time: requestTime
    });

    systemLogModel.create({
      user_id: userID,
      platform: platform,
      user_ip: userIP,
      user_agent: userAgent,
      log_event: cleanLogMsg,
      log_time: requestTime
    });


    resolve(true);
    return null;

  });
}

export async function logSystemActivity(req, userID, platform, logMessage) {
  return new Promise((resolve) => {

    const userIP = theUserIP(req);
    const requestTime = theEpochTime();
    const userAgent = theUserAgent(req);

    const cleanLogMsg = capitalizeFirstWord(logMessage);

    systemLogModel.create({
      user_id: userID,
      platform: platform,
      user_ip: userIP,
      user_agent: userAgent,
      log_event: cleanLogMsg,
      log_time: requestTime
    });

    resolve(true);
    return null;

  });
}