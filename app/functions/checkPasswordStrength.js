//################################################################
//############### CHECK PASSWORD STRENGTH FUNCTION ###############
//################################################################

////////////////////////////////
////// DATA MODEL IMPORTS //////
////////////////////////////////
import { badPwDataModel } from '../models/badPwDataModel.js'; 

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { getPlatformData } from './getPlatformData.js';
import { hasUpperCaseCheck } from './helpers/hasUpperCaseCheck.js';
import { hasLowerCaseCheck } from './helpers/hasLowerCaseCheck.js';
import { hasNumberCheck } from './helpers/hasNumberCheck.js';
import { hasSpecialCheck } from './helpers/hasSpecialCheck.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function checkPasswordStrength(platform, password) {

  let platformData = await getPlatformData(platform);

  return new Promise((resolve) => {

    let pwLength = password.length;

    let minPwLength = parseInt(platformData.minimum_pw_length);
    let maxPwLength = parseInt(platformData.maximum_pw_length);
    let uppercaseNeeded = parseInt(platformData.pw_upper_case_needed);
    let lowercaseNeeded = parseInt(platformData.pw_lower_case_needed);
    let numberNeeded = parseInt(platformData.pw_number_needed);
    let specialCharNeeded = parseInt(platformData.pw_special_char_needed);
    let specialOrNumberNeeded = parseInt(platformData.pw_special_or_number_needed);
    let blacklistCheckNeeded = parseInt(platformData.pw_blacklist_check_needed);

    let hasUppercase = hasUpperCaseCheck(password);
    let hasLowercase = hasLowerCaseCheck(password);
    let hasNumber = hasNumberCheck(password);
    let hasSpecial = hasSpecialCheck(password);

    if (
      pwLength > minPwLength
      && pwLength < maxPwLength
      && ((uppercaseNeeded === 1 && hasUppercase) || uppercaseNeeded === 0)
      && ((lowercaseNeeded === 1 && hasLowercase) || lowercaseNeeded === 0)
      && ((numberNeeded === 1 && hasNumber) || numberNeeded === 0)
      && ((specialCharNeeded === 1 && hasSpecial) || specialCharNeeded === 0)      
      && ((specialOrNumberNeeded === 1 && (hasSpecial || hasNumber)) || specialOrNumberNeeded === 0)
    ) {

      if (blacklistCheckNeeded === 1) {

        badPwDataModel.findOne({ bad_pw: password }, function (err, obj) { 
          
          if (obj) {
            resolve(false);
            return null;
          } else {
            resolve(true);
            return null;
          }
        });
      
      } else {
        resolve(true);
        return null;
      }

    } else {
      resolve(false);
      return null;
    }
    
  });
} 