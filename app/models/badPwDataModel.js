//########################################################
//############### BAD PASSWORDS DATA MODEL ###############
//########################################################

/////////////////////////////////////
////// NODE & NPM DEPENDENCIES //////
/////////////////////////////////////
import mongoose from 'mongoose';

/////////////////////////////////
////// Connect to Mongoose //////
/////////////////////////////////
mongoose.connect(
  "mongodb://" + process.env.DB_USER + ":" + process.env.DB_PASSWORD + "@mongodb:27017/" + process.env.DB_DATABASE + "?authSource=admin",
  {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 2000,
  },
  (err) => {
    if (err) {
      console.error('FAILED TO CONNECT TO MONGODB');
    } else {
      //console.log('CONNECTED TO MONGODB');
    }
  }
);

/////////////////////////////
////// Mongoose Schema //////
/////////////////////////////
const Schema = mongoose.Schema;
const badPwDataModelSchema = new Schema({
  bad_pw: {
    type: String,
    index: true,
    unique: true,
    required: [true, ''],
    validate: {
      validator: function(value) {
        return value.trim() !== '';
      },
      message: ''
    },
    trim: true
  }
}); 

//////////////////////////
////// Model Export //////
//////////////////////////
const badPwDataModel = mongoose.model('badpws', badPwDataModelSchema);

////////////////////////////
////// FindOne Export //////
////////////////////////////
async function badPwDataFindOne(queryObj) {
  try {
    
    const obj = await badPwDataModel.findOne(queryObj)
    return obj;

  } catch (err) {

    console.error('QUERY FAILED', err);
    return undefined;
    
  }
}

/////////////////////////
////// Find Export //////
/////////////////////////
async function badPwDataFind(queryObj) {
  try {
    
    const obj = await badPwDataModel.find(queryObj)
    return obj;

  } catch (err) {

    console.error('QUERY FAILED', err);
    return undefined;
    
  }
}

//######################################
//############### EXPORT ###############
//######################################
export { badPwDataModel, badPwDataFindOne, badPwDataFind };


