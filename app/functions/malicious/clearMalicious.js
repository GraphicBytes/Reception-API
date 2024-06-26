//########################################################
//############### CKEAR MALICIOUS ACTIVITY ###############
//######################################################## 

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
import { theUserAgent } from '../helpers/theUserAgent.js'; 

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function clearMalicious(req) {
  return new Promise((resolve) => {

    let userIP = theUserIP(req);
    let userAgent = theUserAgent(req);

    let toHash = userAgent + userIP;
    let userAgentHash = sha256(toHash); 

    let filter = { ip: userIP };
    maliciousIpsModel.collection.deleteOne(filter);

    let filter2 = { agent_hash: userAgentHash };
    maliciousUserAgentsModel.collection.deleteOne(filter2);
 
    resolve(true);
    return null;

  });
}