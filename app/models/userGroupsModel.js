//#################################################
//############### USER GROUPS MODEL ###############
//#################################################

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
const userGroupsModelSchema = new Schema({
  group_tag: {
    type: String,
    index: true,
    required: [true, ''],
    validate: {
      validator: function (value) {
        return value.trim() !== '';
      },
      message: ''
    },
    trim: true
  },
  group_name: {
    type: String,
    index: true,
    required: [true, ''],
    validate: {
      validator: function (value) {
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
      validator: function (value) {
        return value.trim() !== '';
      },
      message: ''
    },
    trim: true
  },
  parent: {
    type: String,
    index: true,
    required: [true, ''],
    validate: {
      validator: function (value) {
        return value.trim() !== '';
      },
      message: ''
    },
    trim: true
  },
  disabled: {
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
  },
  data: { 
    type: Object,
    default: {}
   },
});

//////////////////////////
////// Model Export //////
//////////////////////////
const userGroupsModel = mongoose.model('user_groups', userGroupsModelSchema);

export { userGroupsModel };