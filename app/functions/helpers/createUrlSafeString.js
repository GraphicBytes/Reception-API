//######################################################
//############### CREATE SAFE URL STRING ###############
//######################################################

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export function createUrlSafeString(input) {

  let urlSafe = input
    .replace(/[^\w\s-]/gi, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/_+/g, '-')       // Optionally, replace underscores with hyphens
    .toLowerCase();            // Convert to lower case

  return urlSafe;
}

