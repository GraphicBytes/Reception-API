//#######################################################
//############### TRIGGER FILE PROCESSING ###############
//#######################################################

/////////////////////////////////////
////// NODE & NPM DEPENDENCIES //////
/////////////////////////////////////
import axios from 'axios';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { encrypt } from '../crypt/encrypt.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function triggerFileProcessing(platform, fileID, userGroup) {

  return new Promise((resolve) => {

    try {

      const loadingDockURL = "https://" + process.env.DEFAULT_LOADINGDOCK_URL + "/process-file/";
      const networkPassPhrase = encrypt(process.env.NETWORK_SUPER_USER_PASSPHRASE, process.env.NETWORK_PRIMARY_ENCRYPTION_KEY);

      let postData = {
        networkPassPhrase: networkPassPhrase,
        filePlatform: platform,
        fileID: fileID,
        fileUserGroup: userGroup,
        bePublic:1
      }; 

      const axiosInstance = axios.create({
        withCredentials: true,
        credentials: 'include',
      });

      axiosInstance.post(loadingDockURL, postData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...axiosInstance.defaults.headers.common,
        },
      })
        .then(response => {

          if (response.data.qry === 1) {

            resolve(true);
            return null;

          } else {

            resolve(false);
            return null;

          }

        })
        .catch(error => {

          console.error('Error:', error);

          resolve(false);
          return null;

        });

    } catch (error) {

      if (process.env.NODE_ENV === "development") {
        console.error(error);
      }

      resolve(false);
      return null;
    }

  });

} 