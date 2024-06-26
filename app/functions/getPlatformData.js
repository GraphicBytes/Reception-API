//##########################################################
//############### GET PLATFORM DATA FUNCTION ###############
//########################################################## 

////////////////////////////////
////// DATA MODEL IMPORTS //////
////////////////////////////////
import { platformsModel } from '../models/platformsModel.js'; 

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function getPlatformData(platform) { 

  try { 

    return await doFunction();

    async function doFunction() {

      const obj = await platformsModel.findOne({ platform: platform });
      if (obj) {  
        return obj.data;
      } else {
        if (process.env.NODE_ENV === "development") {
          console.log("no platform data")
        }    
        return false;
      }
    }

  } catch (error) {

    if (process.env.NODE_ENV === "development") {
      error.log(error)
    }    

    return false;
  }
}
