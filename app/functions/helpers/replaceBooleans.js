
//#########################################################
//############### replace Booleans function ###############
//#########################################################

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export function replaceBooleans(obj) {
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        // Recursion for nested objects
        replaceBooleans(obj[key]);
      } else if (typeof obj[key] === 'boolean') {
        // Replace the boolean with a number
        obj[key] = obj[key] ? 1 : 0;
      }
    }
  }
  return obj;
}
