//#########################################################
//############### HAS NUMBER CHECK FUNCTION ###############
//#########################################################

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export function hasNumberCheck(string) {

  if (/\d/.test(string)) {
    return true;
  } else {
    return false;
  }

}
 