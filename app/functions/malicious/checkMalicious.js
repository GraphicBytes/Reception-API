//########################################################
//############### CHECK MALICIOUS ACTIVITY ###############
//######################################################## 

////////////////////////////////
////// DATA MODEL IMPORTS //////
////////////////////////////////
import { maliciousIpsModel } from '../../models/maliciousIpsModel.js';
import { maliciousUserAgentsModel } from '../../models/maliciousUserAgentsModel.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
import { sha256 } from '../crypt/sha256.js';
import { theUserIP } from '../helpers/theUserIP.js';
import { theUserAgent } from '../helpers/theUserAgent.js'; 

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function checkMalicious(req, platformData) {

  let userIP = theUserIP(req);
  let userAgent = theUserAgent(req);
  let toHash = userAgent + userIP;
  let userAgentHash = sha256(toHash); 

  try {

    return await doFunction();

    async function doFunction() {

      if (userIP !== null || userIP !== "") {

        maliciousIpsModel.findOne({ ip: userIP }, function (err, obj) {

          if (obj) {

            var ipEvents = obj.attempts;
            if (ipEvents > parseInt(platformData.user_ip_block_threshold)) {

              return true;

            } else {

              maliciousUserAgentsModel.findOne({ agent_hash: userAgentHash }, function (err, obj) {

                if (obj) {
                  var agentEvents = obj.attempts;
                  if (agentEvents > parseInt(platformData.user_agent_block_threshold)) {

                    return true;

                  } else {
                    return false;
                  }
                } else {
                  return false;
                }
              });

            }
          } else {

            maliciousUserAgentsModel.findOne({ agent_hash: userAgentHash }, function (err, obj) {

              if (obj) {
                var agentEvents = obj.attempts;
                if (agentEvents > parseInt(platformData.user_agent_block_threshold)) {

                  return true;

                } else {
                  return false;
                }
              } else {
                return false;
              }
            });

          }
        });


      } else {

        return false;
      }
    }

  } catch (error) {

    if (process.env.NODE_ENV === "development") {
      error.log(error)
    }

    return false;
  }
}