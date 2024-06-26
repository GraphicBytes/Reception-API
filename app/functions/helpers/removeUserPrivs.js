//#############################################################################
//############### REMOVE ALL ARRAYS WITH KEY "user_privileges" ###############
//#############################################################################

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export function removeUserPrivs(obj) {
  if (Array.isArray(obj)) {
    return obj.map(removeUserPrivs);
  } else if (typeof obj === 'object' && obj !== null) {
    let newObj = {};
    for (let key in obj) {
      if (key !== 'user_privileges') {
        newObj[key] = removeUserPrivs(obj[key]);
      }
    }
    return newObj;
  } else {
    return obj;
  }
}
export default removeUserPrivs;