//############################################################
//############### HAS UPPERCASE CHECK FUNCTION ###############
//############################################################

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export function hasUpperCaseCheck(string) {

  if (/[A-Z]/.test(string)) {
    return true;
  } else {
    return false;
  }

} 