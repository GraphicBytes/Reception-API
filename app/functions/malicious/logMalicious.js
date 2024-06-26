//######################################################
//############### LOG MALICIOUS ACTIVITY ###############
//###################################################### 

////////////////////////////////
////// DATA MODEL IMPORTS //////
////////////////////////////////
import { maliciousIpsModel } from '../../models/maliciousIpsModel.js';
import { maliciousUserAgentsModel } from '../../models/maliciousUserAgentsModel.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { sha256 } from '../crypt/sha256.js';
import { theUserIP } from '../helpers/theUserIP.js';
import { theEpochTime } from '../helpers/theEpochTime.js';
import { theUserAgent } from '../helpers/theUserAgent.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function logMalicious(req, message) {

  if (process.env.NODE_ENV === "development") {
    console.log("MALICIOUS ACTIVITY LOGGED: " + message)
  }

  let userIP = theUserIP(req);
  let requestTime = theEpochTime();
  let userAgent = theUserAgent(req);

  let toHash = userAgent + userIP;
  let userAgentHash = sha256(toHash);

  if (userIP !== null || userIP !== "") {
    await maliciousIpsModel.findOne({ ip: userIP }, function (err, obj) {
      if (obj) {
        var eventsUpdateValue = obj.attempts + 1;
        let filter = { ip: userIP };
        let update = {
          $set: {
            attempts: eventsUpdateValue,
            last_attempt: requestTime
          }
        };
        let opts = { upsert: true };
        maliciousIpsModel.collection.updateOne(filter, update, opts);
      } else {
        maliciousIpsModel.create({
          ip: userIP,
          attempts: 1,
          last_attempt: requestTime,
        });
      }
    });

    await maliciousUserAgentsModel.findOne({ agent_hash: userAgentHash }, function (err, obj) {
      if (obj) {
        var eventsUpdateValue = obj.attempts + 1;
        let filter = { agent_hash: userAgentHash };
        let update = {
          $set: {
            attempts: eventsUpdateValue,
            last_attempt: requestTime
          }
        };
        let opts = { upsert: true };
        maliciousUserAgentsModel.collection.updateOne(filter, update, opts);
      } else {
        maliciousUserAgentsModel.create({
          agent_hash: userAgentHash,
          user_agent: userAgent,
          agent_ip: userIP,
          attempts: 1,
          last_attempt: requestTime
        });
      }
    });
  }
  
  return true;

}

