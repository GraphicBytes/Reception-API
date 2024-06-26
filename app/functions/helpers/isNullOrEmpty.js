//############################################################
//############### Null or Empty Check Function ###############
//############################################################

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export function isNullOrEmpty(value) {

  if (value === null || typeof value === 'undefined' || value === 'undefined') {
    return true;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return true;
  }
  return false;
}