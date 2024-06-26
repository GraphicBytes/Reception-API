//#################################################
//############### DEEP MERGE OBJECT ###############
//#################################################

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export function deepMerge(target, source) {
  // Make sure both target and source are proper objects
  if (typeof target !== 'object' || typeof source !== 'object') return false;

  // Iterate through all properties in the source object
  for (var prop in source) {
    if (!Object.prototype.hasOwnProperty.call(source, prop)) {
      continue;  // Skip properties from the prototype chain
    }

    // If the property is an object on both the target and the source,
    // we need to deep merge those objects
    if (Object.prototype.hasOwnProperty.call(target, prop) &&
      typeof target[prop] === 'object' &&
      typeof source[prop] === 'object') {
      deepMerge(target[prop], source[prop]);  // Recursively merge properties of objects
    } else {
      // Otherwise, we just overwrite the value in the target object
      target[prop] = source[prop];
    }
  }

  return target;
}