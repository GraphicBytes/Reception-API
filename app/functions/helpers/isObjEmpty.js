//##############################################################
//############### Is object empty Check Function ###############
//##############################################################

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export function isObjEmpty(obj) {
  // This checks if the object has any properties of its own.
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
}