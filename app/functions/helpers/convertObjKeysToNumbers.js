//###########################################################################
//############### Convert string obj keys to numbers function ###############
//###########################################################################

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
async function convertObjKeysToNumbers(obj) {
  let newObj = {};
  for (const key in obj) {    
    let newKey = parseInt(key);
    newObj[newKey] = obj[key];
  }
  return newObj;
}

module.exports = convertObjKeysToNumbers;