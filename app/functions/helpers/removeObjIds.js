//################################################################
//############### REMOVE ALL ARRAYS WITH KEY "_ID" ###############
//################################################################

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export function removeObjIds(obj) {
  if (Array.isArray(obj)) {
      return obj.map(removeObjIds);
  } else if (typeof obj === 'object' && obj !== null) {
      let newObj = {};
      for (let key in obj) {
          if (key !== '_id') {
              newObj[key] = removeObjIds(obj[key]);
          }
      }
      return newObj;
  } else {
      return obj;
  }
}
export default removeObjIds;