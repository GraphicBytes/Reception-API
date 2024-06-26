//##############################################################
//############### APPEND COOKIES INTO ONE HEADER ###############
//##############################################################

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export function appendUniqueCookie(res, cookieId, cookieString, domain, ttl=1209600) {
  const existingCookies = res.getHeader('Set-Cookie') || [];
  
  //const cookieFullString = `${cookieId}=${cookieString}; HttpOnly; SameSite=None; max-age=${ttl}; Partitioned; Secure; Domain=${domain}; path=/`;

  // added to expire on browser sessions instead, left old code incase reverting back to specific ttl is required
  const cookieFullString = `${cookieId}=${cookieString}; HttpOnly; SameSite=None; max-age=${ttl}; Partitioned; Secure; Domain=${domain}; path=/`;


  // Check if the cookie is already set
  if (Array.isArray(existingCookies)) {
    const isCookieSet = existingCookies.some(cookie => cookie.startsWith(cookieId + '='));
    if (!isCookieSet) {
      res.setHeader('Set-Cookie', cookieFullString);
    }
  } else {
    // If only one cookie is set and is not an array
    if (!existingCookies.startsWith(cookieId + '=')) {
      res.append('Set-Cookie', cookieFullString);
    }
  }
}

export default appendUniqueCookie;