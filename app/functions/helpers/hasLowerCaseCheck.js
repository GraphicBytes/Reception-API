//############################################################
//############### HAS LOWERCASE CHECK FUNCTION ###############
//############################################################

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export function hasLowerCaseCheck(string) {

  if (/[a-z]/.test(string)) {
    return true;
  } else {
    return false;
  }

} 