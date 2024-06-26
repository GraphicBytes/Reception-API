//############################################################
//############### VALID EMAIL PATTERN FUNCTION ###############
//############################################################

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export function isValidEmail(email) {
  const emailRegex = /\S+@\S+\.\S+/;
  return emailRegex.test(email);
}