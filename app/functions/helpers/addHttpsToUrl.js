//######################################################################
//############### ADD OR CHANGE URL TO HTTPS:// FUNCTION ###############
//######################################################################

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export function addHttpsToUrl(url) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    // if the url doesn't have a protocol at all, assume it should use https
    url = 'https://' + url;
  } else if (url.startsWith('http://')) {
    // if the url is using the non-secure http protocol, replace it with https
    url = 'https://' + url.slice(7);
  }
  return url;
}
 