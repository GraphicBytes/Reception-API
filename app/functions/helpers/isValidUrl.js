//#####################################################
//############### IS VAILD URL FUNCTION ###############
//#####################################################

/////////////////////////////////////
////// NODE & NPM DEPENDENCIES //////
/////////////////////////////////////
import http from 'http';
import https from 'https';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function isValidUrl(url) {

  const urlRegex = /^https?:\/\/(?:www\.)?[a-z0-9\-\.]{3,}\.[a-z]{2,}(?:\/[^#\s]*)?(?:#[\w\-]+)?$/i;
  if (!urlRegex.test(url)) {
     return false;
  }
  
  const protocol = url.startsWith('https') ? https : http;

  return new Promise((resolve) => {
    const options = {
      timeout: 2000 
    };
    const req = protocol.get(url, options, (res) => {

      resolve(
        res.statusCode === 200
        || res.statusCode === 201
        || res.statusCode === 202
        || res.statusCode === 203
        || res.statusCode === 204
        || res.statusCode === 205
        || res.statusCode === 206
        || res.statusCode === 207
        || res.statusCode === 208
        || res.statusCode === 226
        || res.statusCode === 300
        || res.statusCode === 301
        || res.statusCode === 302
        || res.statusCode === 303
        || res.statusCode === 304
        || res.statusCode === 305
        || res.statusCode === 306
        || res.statusCode === 307
        || res.statusCode === 308
      );
      return null;
    });
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
      return null;
    });
    req.on('error', () => {
      resolve(false);
      return null;
    });
  });
}