//############################################################
//############### Get user IP address Function ###############
//############################################################

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export function theUserIP(req) {

  let userIP = "";

  //check for cloudflare headers
  if (typeof req.headers['cf-connecting-ip'] !== 'undefined') {

    userIP = req.headers['cf-connecting-ip'];

  // else check for nginix proxy forwarded ip
  } else if (typeof req.headers['x-forwarded-for'] !== 'undefined') {

    userIP = req.headers['x-forwarded-for'];

  // else check and use x-real-ip fallback
  } else if (typeof req.headers['x-real-ip'] !== 'undefined') {

    userIP = req.headers['x-real-ip'];

  } 

  return userIP;

}