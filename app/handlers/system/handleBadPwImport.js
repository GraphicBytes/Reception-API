//#######################################################
//############### BAD PW TXT FILES IMPORT ###############
//#######################################################

/////////////////////////////////////
////// NODE & NPM DEPENDENCIES //////
///////////////////////////////////// 
import { promises as fs } from 'fs';

////////////////////////////
////// CONFIG IMPORTS //////
////////////////////////////
import { sysMsg } from '../../config/systemMessages.js';

////////////////////////////////
////// DATA MODEL IMPORTS //////
////////////////////////////////
import { badPwDataModel, badPwDataFindOne } from '../../models/badPwDataModel.js';

//////////////////////////////
////// HELPER FUNCTIONS //////
//////////////////////////////
import { isNullOrEmpty } from '../../functions/helpers/isNullOrEmpty.js'; 

//////////////////////////////////////
////// RESULT SENDING FUNCTIONS //////
//////////////////////////////////////
import { resSendOk } from '../../functions/resSend/resSendOk.js';

//////////////////////////
////// THIS HANDLER //////
//////////////////////////
async function handleBadPwImport(req, res) {

  let outputResult = {
    "status": 1,
    "qry": 1,      
    "msg":{}
  }
  let msg = {}  
  
  try {

    outputResult.qry = 1;
    resSendOk(req, res, outputResult);

    let count = 0;

    for (let fileId = 1; fileId <= 100; fileId++) {
      
      const filename = `./config/badpws/${fileId}.txt`;
  
      const data = await fs.readFile(filename, 'utf8');
      const lines = data.split('\n');
  
      for (const line of lines) {
        if (!isNullOrEmpty(line)) {
          const obj = await badPwDataFindOne({ bad_pw: line });
          if (obj) {
            console.log(`${fileId}/${count}`);
          } else {
            await badPwDataModel.create({
              bad_pw: line
            });
            console.log(`${fileId}/${count} ${line}`);
          }
          count++;
        }
      }

    }

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

export default handleBadPwImport;