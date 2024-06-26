//############################################
//############### DEFAULT PAGE ###############
//############################################

////////////////////////////
////// CONFIG IMPORTS //////
////////////////////////////
import { sysMsg } from '../config/systemMessages.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { resSendNotFound } from '../functions/resSend/resSendNotFound.js';
import { logMalicious } from '../functions/malicious/logMalicious.js';
 
//////////////////////////
////// THIS HANDLER //////
//////////////////////////
export async function handleGetDefault(app, req, res) {

  let outputResult = {
    "status": 0,
    "qry": 0,
    "msg":{}
  };
  let msg = {}
  
  try {

    //no one should be trying to access blank domain
    if (process.env.NODE_ENV !== "development") {
      logMalicious(req, "USER HIT DEFAULT PAGE");
    }    
    resSendNotFound(req, res, outputResult, msg);

    return null;

  } catch (error) {

    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }

    msg[0] = sysMsg[0];
    resSendOk(req, res, outputResult, msg);
    
    return null;
  }
}

export default handleGetDefault;