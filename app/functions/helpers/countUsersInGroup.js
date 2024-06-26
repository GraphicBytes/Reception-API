//#############################################################
//############### Count Users Inside User Group ###############
//#############################################################

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { getUsers } from '../getUser.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function countUsersInGroup(platform, groupTag) {


  const allUsers = await getUsers(platform);

  if (!allUsers) {
    return 0;
  }

  let count = 0;

  for (const user of allUsers) {

    if (user.data[platform] !== undefined) {

      if (user.data[platform].user_groups !== undefined) {

        const groupKeys = Object.keys(user.data[platform].user_groups)
        for (const group of groupKeys) {

          if (group === groupTag) {
            count++
          }

        }

      }
    }
  }

  return count;




} 