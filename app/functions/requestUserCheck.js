//#####################################################
//############### USER ON REQUEST CHECK ###############
//#####################################################

//////////////////////////////
////// FUNCTION IMPORTS //////
////////////////////////////// 
import { decrypt } from './crypt/decrypt.js';
import { logMalicious } from './malicious/logMalicious.js';
import { checkMalicious } from './malicious/checkMalicious.js';
import { checkCsrfToken } from './csrf/checkCsrfToken.js';
import { checkAuthToken } from './checkAuthToken.js'; 
import { isNullOrEmpty } from './helpers/isNullOrEmpty.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function requestUserCheck(app, req, res, platformData) {
  try {

    //////////////////////
    ////// CHECK AUTH COOKIE //////
    //////////////////////    
    let cookieId = platformData.platform_tag.toUpperCase() + 'AUTH';
    let token = req.cookies[cookieId];
    if (
      isNullOrEmpty(token)
    ) {
      return false;
    }

    const [isMalicious, validCsrf, authTokenValid, tokenDataRaw] = await Promise.all([
      checkMalicious(req, platformData),
      checkCsrfToken(app, req, res, platformData),
      checkAuthToken(app, req, res, req.params.fromPlatform, token, platformData),
      decrypt(token, process.env.NETWORK_PRIMARY_ENCRYPTION_KEY)
    ]);

    //////////////////////
    ////// CHECK MALICIOUS //////
    ////////////////////// 
    if (isMalicious) {
      logMalicious(req, "MALICIOUS USER TRYING RESET PW"); 
      return false;
    }

    //////////////////////
    ////// CHECK CSRF //////
    ////////////////////// 
    if (!validCsrf) {
      logMalicious(req, "INVALID CSRF TOKEN 12"); 
      return false;
    }

    //////////////////////
    ////// CHECK AUTH TOKEN //////
    ////////////////////// 
    if (!authTokenValid) {
      logMalicious(req, "INVALID AUTH TOKEN 12"); 
      return false;
    }

    //////////////////////
    ////// OPEN TOKEN //////
    ////////////////////// 
    if (!tokenDataRaw) {
      logMalicious(req, "INVALID TOKEN GET USER TABLE DATA REQUEST"); 
      return false;
    }

    return JSON.parse(tokenDataRaw);

  } catch (error) {

    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
    return false;
  }
}