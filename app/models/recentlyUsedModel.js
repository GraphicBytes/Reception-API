//########################################################
//############### RECENTLY USED DATA MODEL ###############
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
const recentlyUsedModelSchema = new Schema({
  user_id: {
    type: String,
    index: true,
    required: [true, ''],
    validate: {
      validator: function(value) {
        return value.trim() !== '';
      },
      message: ''
    },
    trim: true
  },
  platform: {
    type: String,
    index: true,
    required: [true, ''],
    validate: {
      validator: function(value) {
        return value.trim() !== '';
      },
      message: ''
    },
    trim: true
  },
  log_event: { 
    type: Object,
    default: {}
   },
  log_time: {
    type: Number,
    index: true,
    required: [true, ''],
    validate: {
      validator: function(value) {
        return !isNaN(value) && isFinite(value);
      },
      message: ''
    },
    default: 0
  }
});

//////////////////////////
////// Model Export //////
//////////////////////////
const recentlyUsedModel = mongoose.model('recently_used_datas', recentlyUsedModelSchema);

export { recentlyUsedModel };