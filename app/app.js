//#####################################################
//#####################################################
//#############                           #############
//#############       RECEPTION API       #############
//#############                           #############
//#####################################################
//#####################################################

//#################################
//##########   IMPORTS   ########## 
//#################################

/////////////////////////////////////
////// NODE & NPM DEPENDENCIES //////
/////////////////////////////////////
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

/////////////////////////////
////// HANDLER IMPORTS //////
/////////////////////////////
// DEFAULT
import handleGetDefault from './handlers/handleGetDefault.js'; 
// SYSTEM
import handleBadPwImport from './handlers/system/handleBadPwImport.js';
import handleTest from './handlers/system/handleTest.js';
// TOKENS
import handleGetSessionToken from './handlers/tokens/handleGetSessionToken.js';
import handleCheckCookie from './handlers/tokens/handleCheckCookie.js';
import handleGetAdminToken from './handlers/tokens/handleGetAdminToken.js';
import handleGetFileAccessToken from './handlers/tokens/handleGetFileAccessToken.js';
// LOGIN
import handleLogin from './handlers/login/handleLogin.js';
import handleTwoFA from './handlers/login/handleTwoFA.js';
import handleFullLogout from './handlers/login/handleFullLogout.js';
import handleSingleLogout from './handlers/login/handleSingleLogout.js';
// PW RESET
import handlePwResetRequest from './handlers/pw-reset/handlePwResetRequest.js';
import handlePwResetTwoFa from './handlers/pw-reset/handlePwResetTwoFa.js';
import handlePwResetNewPwSubmit from './handlers/pw-reset/handlePwResetNewPwSubmit.js';
// USER DATA
import handleGetUserTableData from './handlers/users/handleGetUserTableData.js'; 
import handleGetUsersDetails from './handlers/users/handleGetUsersDetails.js';
import handleUpdateUser from './handlers/users/handleUpdateUser.js';
import handleUpdateUserMeta from './handlers/users/handleUpdateUserMeta.js';
import handleGetUserTagOptions from './handlers/users/handleGetUserTagOptions.js';
import handleGetUserActivityLog from './handlers/users/handleGetUserActivityLog.js';
import handleGetRecentlyUsed from './handlers/users/handleGetRecentlyUsed.js';
// USER GROUPS
import handleGetUserGroups from './handlers/user-groups/handleGetUserGroups.js';
import handleGetUserGroup from './handlers/user-groups/handleGetUserGroup.js';
import handleEditUserGroup from './handlers/user-groups/handleEditUserGroup.js';
// USER TAGS
import handleGetUserTags from './handlers/user-tags/handleGetUserTags.js';
import handleUpdateTag from './handlers/user-tags/handleUpdateTag.js';
// USER INVITE
import handleCreateNewUser from './handlers/user-invite/handleCreateNewUser.js';
import handleUserInviteTwoFa from './handlers/user-invite/handleUserInviteTwoFa.js';
import handleResendUserInvite from './handlers/user-invite/handleResendUserInvite.js'; 

//#####################################
//##########   EXPRESS APP   ##########
//#####################################

/////////////////////////
////// EXPRESS APP //////
/////////////////////////
const app = express();
app.disable('x-powered-by');
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.json());
const corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,POST',
  preflightContinue: true,
  optionsSuccessStatus: 204,
  exposedHeaders: ['Location'],
  allowedHeaders: ['Content-Type']
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '50000mb' }));
app.use((req, res, next) => {
  app.locals.session_id = null;
  next();
});

////////////////////
////// MULTER //////
////////////////////
const upload = multer();

//########################################
//##########   REQUEST ROUTER   ##########
//########################################

////////////////////
////// SYSTEM //////
////////////////////

// PW import
app.get('/bad-pw-import', (req, res) => {
  handleBadPwImport(req, res);  
});

// TEST FILE
app.get('/test', (req, res) => {
  handleTest(app, req, res);  
});

///////////////////////////////
////// TOKENS & SESSIONS //////
///////////////////////////////

// get session & CSRF token
app.get('/get-session/:fromPlatform/', (req, res) => {
  handleGetSessionToken(app, req, res);  
});

// User Auth Token Check
app.post('/check-cookie/:fromPlatform/', upload.none(), (req, res) => {
  handleCheckCookie(app, req, res, 0);  
});

// get super user token
app.post('/get-su-token/:fromPlatform/', upload.none(), (req, res) => {
  handleGetAdminToken(app, req, res);  
});

// get admin token
app.post('/get-admin-token/:fromPlatform/', upload.none(), (req, res) => {
  handleGetAdminToken(app, req, res);  
});

// get user token
app.post('/get-user-token/:fromPlatform/', upload.none(), (req, res) => {
  handleGetAdminToken(app, req, res);  
});

// get file access token
app.post('/get-file-access-token/:fromPlatform/', upload.none(), (req, res) => {
  handleGetFileAccessToken(app, req, res);  
});

///////////////////
////// LOGIN //////
///////////////////

// login
app.post('/login/:fromPlatform/', upload.none(), (req, res) => {
  handleLogin(app, req, res, 0);  
});

// Admin login
app.post('/admin-login/:fromPlatform/', upload.none(), (req, res) => {
  handleLogin(app, req, res, 1);  
});

// 2FA Submit
app.post('/2fa/:fromPlatform/', upload.none(), (req, res) => {
  handleTwoFA(app, req, res);  
});

// Full logout
app.post('/full-logout/:fromPlatform/', upload.none(), (req, res) => {
  handleFullLogout(app, req, res);  
});

// Single logout
app.get('/logout/:fromPlatform/', upload.none(), (req, res) => {
  handleSingleLogout(app, req, res);  
});

//////////////////////
////// PW RESET //////
//////////////////////

// Password Reset Request
app.post('/pw-reset-request/:fromPlatform/', upload.none(), (req, res) => {
  handlePwResetRequest(app, req, res);  
});

// Password Reset 2FA
app.post('/pw-reset-2fa/:fromPlatform/', upload.none(), (req, res) => {
  handlePwResetTwoFa(app, req, res);  
});

// Password Reset New Password Submit
app.post('/pw-reset-submit-new/:fromPlatform/', upload.none(), (req, res) => {
  handlePwResetNewPwSubmit(app, req, res);  
});

///////////////////////
////// USER DATA //////
///////////////////////

// get user table data
app.post('/get-user-table-data/:fromPlatform/', upload.none(), (req, res) => {
  handleGetUserTableData(app, req, res); 
});

// get user details
app.post('/get-user-details/:fromPlatform/:id/', upload.none(), (req, res) => {
  handleGetUsersDetails(app, req, res); 
});

// handle Update User
app.post('/update-user-details/:fromPlatform/:id/', upload.none(), (req, res) => {
  handleUpdateUser(app, req, res); 
});

// update user meta
app.post('/update-user-meta/:fromPlatform/', upload.none(), (req, res) => {
  handleUpdateUserMeta(app, req, res); 
});

// get user tags options
app.post('/get-user-tag-options/:fromPlatform/', upload.none(), (req, res) => {
  handleGetUserTagOptions(app, req, res); 
});

// get user activity log
app.post('/get-user-activity-log/:fromPlatform/:id/', upload.none(), (req, res) => {
  handleGetUserActivityLog(app, req, res); 
});

// get recently used sections data
app.post('/get-recently-used-data/:fromPlatform/', upload.none(), (req, res) => {
  handleGetRecentlyUsed(app, req, res); 
});

/////////////////////////
////// USER GROUPS //////
/////////////////////////

// get user groups
app.post('/get-user-groups/:fromPlatform/', upload.none(), (req, res) => {
  handleGetUserGroups(app, req, res); 
});

// get individual user group
app.post('/get-user-group/:fromPlatform/:id/', upload.none(), (req, res) => {
  handleGetUserGroup(app, req, res); 
});

// edit user group data
app.post('/update-user-group/:fromPlatform/:id/', upload.none(), (req, res) => {
  handleEditUserGroup(app, req, res); 
});

///////////////////////
////// USER TAGS //////
///////////////////////

// get user tags
app.post('/get-user-tags/:fromPlatform/', upload.none(), (req, res) => {
  handleGetUserTags(app, req, res); 
});

// Update tag data
app.post('/update-tag/:fromPlatform/', upload.none(), (req, res) => {
  handleUpdateTag(app, req, res); 
});

/////////////////////////
////// USER INVITE //////
/////////////////////////

// Create new user
app.post('/create-new-user/:fromPlatform/', upload.none(), (req, res) => {
  handleCreateNewUser(app, req, res); 
}); 

// User invite 2fa
app.post('/user-invite-2fa/:fromPlatform/', upload.none(), (req, res) => {
  handleUserInviteTwoFa(app, req, res); 
});

// Resend invite email
app.post('/resend-invite/:fromPlatform/:userid/', upload.none(), (req, res) => {
  handleResendUserInvite(app, req, res); 
});

/////////////////
////// END //////
/////////////////

////// 404 //////
app.use((req, res) => {
  handleGetDefault(app, req, res);
});

export default app; 