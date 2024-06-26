//###########################################
//############### HANDLE TEST ###############
//###########################################

//////////////////////////////////////
////// RESULT SENDING FUNCTIONS //////
//////////////////////////////////////
import { resSendOk } from '../../functions/resSend/resSendOk.js';

//////////////////////////
////// THIS HANDLER //////
//////////////////////////
async function handleTest(app, req, res) {

  let outputResult = {
    "status": 0,
    "qry": 0,
    "msg":{}
  };
  let msg = {}
  
  try {
  

    resSendOk(req, res, outputResult, msg);

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

export default handleTest;