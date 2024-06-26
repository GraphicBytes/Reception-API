//####################################################
//############### GET BASE DOMAIN NAME ###############
//####################################################

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export function getBaseDomain(host) {
  const parts = host.split('.');
  if (parts.length > 2) {
    return '.' + parts.slice(-2).join('.');
  }
  return '.' + host;
}

export default getBaseDomain;