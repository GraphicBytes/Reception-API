//###############################################
//############### USER DATA MODEL ###############
//###############################################

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
const usersModelSchema = new Schema({
  user_id: {
    type: String,
    index: true,
    unique: true,
    required: [true, ''],
    validate: {
      validator: function (value) {
        return value.trim() !== '';
      },
      message: ''
    },
    trim: true
  },
  email: {
    type: String,
    index: true,
    required: true,
    validate: {
      validator: function (v) {
        return v.trim().length > 0;
      },
      message: props => 'Email address cannot be empty'
    },
    match: [/^([\w-\.]+@([\w-]+\.)+[\w-]+)?$/, 'Please fill a valid email address']
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
  super_admin: {
    type: Number,
    required: [true, ''],
    validate: {
      validator: function (value) {
        return !isNaN(value) && isFinite(value);
      },
      message: ''
    },
    default: 0
  },
  login_fail: {
    type: Number,
    index: true,
    required: [true, ''],
    validate: {
      validator: function (value) {
        return !isNaN(value) && isFinite(value);
      },
      message: ''
    },
    default: 0
  },
  last_attempt: {
    type: Number,
    index: true,
    required: [true, ''],
    validate: {
      validator: function (value) {
        return !isNaN(value) && isFinite(value);
      },
      message: ''
    },
    default: 0
  },
  banned: {
    type: Number,
    required: [true, ''],
    validate: {
      validator: function (value) {
        return !isNaN(value) && isFinite(value);
      },
      message: ''
    },
    default: 0
  },
  hidden: {
    type: Number,
    index: true,
    required: [true, ''],
    validate: {
      validator: function (value) {
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
const usersModel = mongoose.model('users', usersModelSchema);

export { usersModel };