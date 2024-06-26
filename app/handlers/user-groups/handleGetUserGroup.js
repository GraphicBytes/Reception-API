//###################################################
//############### GET USER GROUP DATA ###############
//###################################################

////////////////////////////
////// CONFIG IMPORTS //////
////////////////////////////
import { sysMsg } from '../../config/systemMessages.js';

////////////////////////////
////// CONFIG IMPORTS //////
////////////////////////////
import { defaultPermissions } from '../../config/defaultPermissions.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { requestUserCheck } from '../../functions/requestUserCheck.js';
import { getUser } from '../../functions/getUser.js';
import { getUserPrivileges } from '../../functions/getUserPrivileges.js';
import { getUserGroup } from '../../functions/getUserGroup.js';
import { getUserGroups } from '../../functions/getUserGroups.js';
import { getPlatformData } from '../../functions/getPlatformData.js';

//////////////////////////////////////
////// RESULT SENDING FUNCTIONS //////
//////////////////////////////////////
import { resSendOk } from '../../functions/resSend/resSendOk.js';

//////////////////////////////
////// HELPER FUNCTIONS //////
//////////////////////////////
import { isNullOrEmpty } from '../../functions/helpers/isNullOrEmpty.js';

//////////////////////////////////////////
////// MALICIOUS ACTIVITY FUNCTIONS //////
//////////////////////////////////////////
import { logMalicious } from '../../functions/malicious/logMalicious.js';

///////////////////////////////////////
////// IN-LINE SUPPORT FUNCTIONS //////
///////////////////////////////////////
function setAllValuesToOne(obj) {
  for (const key in obj) {
    if (key === 'super_admin') {
      continue;
    }

    if (typeof obj[key] === 'object') {
      setAllValuesToOne(obj[key]);
    } else {
      obj[key] = 1;
    }
  }
}


//////////////////////////
////// THIS HANDLER //////
//////////////////////////
async function handleGetUserGroup(app, req, res) {

  let outputResult = {
    "status": 0,
    "qry": 0, 
  };
  let msg = {}

  try {

    const defaultPerms = JSON.parse(JSON.stringify(defaultPermissions));

    //##########################
    //##### SUBMITTED DATA #####
    //##########################

    //////////////////////
    ////// CHECK SUBMITTED DATA //////
    //////////////////////
    if (
      isNullOrEmpty(req.body.csrf)
    ) {

      msg[4] = sysMsg[4];

      logMalicious(req, "4");
      resSendOk(req, res, outputResult, msg);
      return null;
    }

    let groupID = req.params.id;

    //#########################
    //##### CHECK REQUEST #####
    //#########################

    //////////////////////
    ////// CHECK PLATFORM //////
    //////////////////////
    let platform = req.params.fromPlatform;
    let platformData = await getPlatformData(platform);
    if (!platformData) {

      msg[1] = sysMsg[1];

      logMalicious(req, "1");
      resSendOk(req, res, outputResult, msg);
      return null;
    }

    //////////////////////
    ////// CHECK USER //////
    ////////////////////// 
    const tokenData = await requestUserCheck(app, req, res, platformData);

    //////////////////////
    ////// GET CURRENT USER DATA //////
    ////////////////////// 
    let userData = await getUser(tokenData.user_email, platform);
    if (!userData) {

      msg[18] = sysMsg[18];

      logMalicious(req, "18");
      resSendOk(req, res, outputResult, msg);
      return null;
    }

    //##########################
    //##### HANDLE REQUEST #####
    //########################## 

    let userGroups = userData.userData[platform].user_groups;

    let fullPrivileges = await getUserPrivileges(userGroups, platform, true);
    let privileges = fullPrivileges.privileges;

    if (
      (
        privileges.reception.view_user_groups === 1
      )
      || privileges.settings.super_admin === 1
    ) {

      let thisGroupData
      // get user groups
      const userGroupsData = await getUserGroup(platform, groupID);

      if (userGroupsData && userGroupsData.length > 0) {

        let defaultHeading = {};
        let defaultParent = {};
        let childGroups = {};
        let parentPermissions = {};
        let systemDefault = 0;

        let isHeader = false;

        if (userGroupsData[0].data.default_locked !== undefined) {
          if (userGroupsData[0].data.default_locked === 1) {
            systemDefault = 1;
          }
        }

        if (userGroupsData[0].parent === 0 || userGroupsData[0].parent === "0") {
          isHeader = true;
        } else {

          let parentUserGroup = await getUserGroup(platform, userGroupsData[0].parent);



          if (parentUserGroup[0].group_tag === 0 || parentUserGroup[0].group_tag === "0" || parentUserGroup[0].group_tag === "") {

            defaultHeading = {
              label: parentUserGroup[0].data.group_label,
              value: parentUserGroup[0].group_tag,
            };

            parentPermissions = defaultPerms;

            setAllValuesToOne(parentPermissions);

            childGroups = await getUserGroups(platform, parentUserGroup[0].group_tag);

          } else {

            let parentGroup = await getUserGroup(platform, parentUserGroup[0].group_tag);
            let headerGroup = await getUserGroup(platform, parentGroup[0].parent);
            childGroups = await getUserGroups(platform, groupID);


            if (headerGroup[0] !== undefined) {

              defaultHeading = {
                label: headerGroup[0].data.group_label,
                value: headerGroup[0].group_tag,
              };

              defaultParent = {
                label: parentUserGroup[0].data.group_label,
                value: parentUserGroup[0].group_tag,
              }

            } else {

              defaultHeading = {
                label: parentUserGroup[0].data.group_label,
                value: parentUserGroup[0].group_tag,
              };

              defaultParent = {}
            }

            

            parentPermissions = {
              archives: parentUserGroup[0].data.privileges.archives,
              comms: parentUserGroup[0].data.privileges.comms,
              loading_dock: parentUserGroup[0].data.privileges.loading_dock,
              reception: parentUserGroup[0].data.privileges.reception,
              settings: parentUserGroup[0].data.privileges.settings,
              warehouse: parentUserGroup[0].data.privileges.warehouse,
            }
          }

        }

        let parentSelectOptions = [];


        if (childGroups !== null) {

          childGroups = Object.values(childGroups);

          for (const thidChild of childGroups) {

            if (req.params.id !== thidChild.group_tag) {
              parentSelectOptions.push(
                {
                  label: thidChild.data.group_label,
                  value: thidChild.group_tag,
                }
              )
            }

          }
        }


        if (defaultHeading === defaultParent) {
          defaultParent = {}
        }

        let permissions = {}


        if (userGroupsData[0].data.privileges !== undefined
          && userGroupsData[0].data.privileges !== null
        ) {

          permissions = {

            settings: Object.assign({}, defaultPerms.privileges.settings, userGroupsData[0].data.privileges.settings),

            reception: Object.assign({}, defaultPerms.privileges.reception, userGroupsData[0].data.privileges.reception),

            archives: Object.assign({}, defaultPerms.privileges.archives, userGroupsData[0].data.privileges.archives),

            comms: Object.assign({}, defaultPerms.privileges.comms, userGroupsData[0].data.privileges.comms),

            loading_dock: Object.assign({}, defaultPerms.privileges.loading_dock, userGroupsData[0].data.privileges.loading_dock),

            warehouse: Object.assign({}, defaultPerms.privileges.warehouse, userGroupsData[0].data.privileges.warehouse),
          };

        } else {
          permissions = defaultPerms.privileges;
        };


        thisGroupData = {
          id: userGroupsData[0].group_tag,
          groupHeading: isHeader,
          groupName: userGroupsData[0].data.group_label,
          description: userGroupsData[0].data.description,
          headingID: defaultHeading.value,
          parentID: userGroupsData[0].parent,
          heading: userGroupsData[0].data.group_label,
          permissions: permissions,
          parentPermissions: parentPermissions,
          defaultHeading: defaultHeading,
          parentSelectOptions: parentSelectOptions,
          defaultParent: defaultParent,
          systemDefault: systemDefault
        };

      }

      outputResult['data'] = thisGroupData;
      outputResult['status'] = 1; 
      outputResult['qry'] = 1;

    } else {
      outputResult['status'] = 0;
      msg[13] = sysMsg[13];
    }

    resSendOk(req, res, outputResult, msg);

    return null;

  } catch (error) {

    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }

    msg[0] = sysMsg[0];
    resSendOk(req, res, outputResult, msg);

    return null;
  }
}

export default handleGetUserGroup;