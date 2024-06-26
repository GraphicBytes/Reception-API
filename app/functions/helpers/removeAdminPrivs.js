//#############################################################################
//############### REMOVE ALL ARRAYS WITH KEY "admin_privileges" ###############
//#############################################################################

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export function removeAdminPrivs(obj) {
  if (Array.isArray(obj)) {
    return obj.map(removeAdminPrivs);
  } else if (typeof obj === 'object' && obj !== null) {
    let newObj = {};
    for (let key in obj) {
      if (key !== 'admin_privileges') {
        newObj[key] = removeAdminPrivs(obj[key]);
      }
    }
    return newObj;
  } else {
    return obj;
  }
}
export default removeAdminPrivs;