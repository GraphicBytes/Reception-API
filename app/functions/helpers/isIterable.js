//##########################################################
//############### IS ITERABLE CHECK FUNCTION ###############
//##########################################################

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export function isIterable(obj) {
  // checks for null and undefined
  if (obj == null) {
    return false;
  }
  return typeof obj[Symbol.iterator] === 'function';
}