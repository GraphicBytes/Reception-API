//################################################
//############### FULL USER LOGOUT ###############
//################################################ 

////////////////////////////
////// CONFIG IMPORTS //////
////////////////////////////
import { sysMsg } from '../../config/systemMessages.js'; 

//////////////////////////////////////
////// RESULT SENDING FUNCTIONS //////
//////////////////////////////////////
import { resSendOk } from '../../functions/resSend/resSendOk.js'; 

//////////////////////////////
////// HELPER FUNCTIONS //////
////////////////////////////// 
import { getBaseDomain } from '../../functions/helpers/getBaseDomain.js'; 

///////////////////////////////////////
////// IN-LINE SUPPORT FUNCTIONS //////
///////////////////////////////////////
function deleteCookie(res, cookieId, domain) {
  const cookieDeletionString = `${cookieId}=; HttpOnly; SameSite=None; max-age=0; Partitioned; Secure; Domain=${domain}; path=/`;
  res.append('Set-Cookie', cookieDeletionString);
}

//////////////////////////
////// THIS HANDLER //////
//////////////////////////
async function handleSingleLogout(app, req, res) {

  let outputResult = { 
    "qry": 0,
    "msg":{}
  };
  let msg = {}

  try {

    //##########################
    //##### SUBMITTED DATA #####
    //########################## 

    //////////////////////
    ////// CHECK PLATFORM //////
    //////////////////////
    const platform = req.params.fromPlatform; 

    //##########################
    //##### HANDLE REQUEST #####
    //########################## 
    
    const domain = getBaseDomain(req.headers.host);
    const authCookieId = platform.toUpperCase() + 'AUTH';

    res.clearCookie(authCookieId);
    deleteCookie(res, authCookieId, domain);
   
    outputResult['qry'] = 1;
 
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

export default handleSingleLogout;