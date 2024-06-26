# CLOUD RECEPTION API #

**VERSION**
1.0.0 alpha

**AUTHORS**

  - Darren Morley

**CONTRIBUTING DEVELOPERS**

  - n/a

## ABOUT

Reception is a REST-ful API/Microservice.

Reception is responsible for handling the following areas of functionality

- Session
- Authentication
- Account Management
- User group management
- Activity Tracking

## DEPLOYMENT

This API is launched via Docker containerization using a `docker-compose.yml` file. Environment files are used to separate deployment environments. The main ENV files and CLI commands are:

*note: Please use the "tools.sh" shell script instead of these commands, see below*

`docker-compose --env-file ./env/dev.env up`

`docker-compose --env-file ./env/stage.env up`

`docker-compose --env-file ./env/production.env up`

## TOOLS SCRIPT

**This repo contains a shell script to help manage this repo and docker container**

`sh tools.sh`

This shell script will give you 12 options

`1. Cancel/Close`

`2. Pull changes`

This option will pull the latest updates for the current git branch

`3. Start/Reboot docker container with dev.env`

This will boot up the API in development mode for beta testing

`4. Start/Reboot docker container with stage.env`

This will boot up the API in staging mode for alpha testing

`5. Start/Reboot docker container with production.env`

This will boot up the API in production mode

`6. View console log output`

This will show the live docker logs output, useful for debugging but are disabled in production mode.

`7. Git push changes to current branch`

This will push changes to the current branch while also offering an option to leave comment.

`8. Git merge Main to Staging`

This will merge the current Main branch into Staging when ready for Alpha testing

`9. Git merge Staging to Production`

This will merge the current Staging branch into Production

`10. Checkout Main branch`

This will switch to the Main branch

`11. Checkout Staging branch`

This will switch to the Staging branch

`12. Checkout Production branch`

This will switch to the Production branch

## MAIN REPO BRANCHES

This API follows a development -> staging -> production flow focused on the following git repo branches

**Main**

Latest beta testing build *(All development work should be done on this branch, or forked and re-merged with this branch before moving onto staging.)* 

**Staging**

Latest alpha testing build

**Production**

Latest production build

## DOCKER STACK

`Node.js FROM node:20.11.1-slim`

`MongoDB FROM mongo:7.0.5`

`mongo-express FROM mongo-express:1.0.2-20`

## NODE.JS DEPENDENCIES

`express ^4.16.4`

`mongoose ^5.4.10`

`bcrypt ^5.1.0`

`multer ^1.4.5-lts.1`

`cookie-parser ^1.4.6`

`cors ^2.8.5`

`axios ^1.4.0`

## SCALE EXPECTATIONS

### OPTIMAL PERFORMANCE

For optimal performance the API is intended to launch as a cluster, ideally 1 cluster fork per CPU thread.

### Short Term/Early Lifespan

Expecting:

- Data Storage Needs - **Light**
- CPU Needs - **Light**
- Memory Needs - **Light**
- hosting solution needed - **Shared hosting via docker.**

Minimum requirements:

- 2 CPU THREADS
- 4 GB RAM
- 40 GB SSD-SPEED STORAGE 

### Long Term/Heavy Load

For long term or high traffic usage, this API will require dedicated hosting resources. 

- *Data Storage Needs* - **Light,** The main consumption of DATA will be for database storage, which even under long term and heavy load is expected to remain in the Gigabytes or low Terabytes.
- *CPU Needs* -  **Moderate,** CPU demands are expected to grow under high traffic load. If high traffic is the reason for moving to dedicated resources, increasing CPU threads will help significantly.
- *Memory Needs* -  **Heavy,**, System Memory consumption will grow in parallel to the database size, if system memory consumption is the reason for moving to dedicated resources, increasing RAM will help significantly.

Minimum requirements:

- 8+ CPU THREADS
- 64+ GB RAM
- 256+ GB SSD-SPEED STORAGE 

## MAIN REST-FUL API RESPONSE ###

Every request made to the server, good or bad, will return a JSON object. Every request will contain 2 core child objects alongside the individual  handler return data.

`qry: 1:0 `

**0:** request failed

**1:** request accepted

`msg:{} `

*msg* will return as an empty object unless the backend needs to communicate an error or warning to the front end. Which will be structured as follows

`{ (int)code : (string)"message", (int)code : (string)"message", (int)code : (string)"message" }`

Error and Warning codes are detailed per api end-point bellow.

## END POINTS AND USAGE ###

### SYSTEM END POINTS

**PW import**

`GET /badpw-import/:fileId/`

This is a tool used on fresh installs of Reception to import the 100 .txt files containing the database of bad passwords. To use this end-point, launch the docker container in development mode with `sh docker-dev.sh`.

While in development mode, visiting each 100 urls from `/badpw-import/1/` to `/badpw-import/100/` will begin the mass import of tends of thousands of bad passwords.Please note, each time you visit one of the urls to import, you will be sending a CPU thread into 100% utilization and the database server will begin to occupy a very large amount of RAM.

If you hit too many of these in quick succession, the server will lock up. This tool is only intended for use by a developer deploying a fresh install of this API. If there is already a DB with the complete import, use the import/export tools for the DB instead.

**The reason we do this break down instead of one huge import, is due to our VPS servers not having the system memory required to handle that kind of request.**

### AUTH & SESSION MANAGEMENT

**get session & CSRF token**

`GET /get-session/:fromPlatform/ RETURNS json`

*ERRORS*:

`0: unknown error`

`1: Missing or invalid platform id`

`2: Suspected malicious user, request blocked`

`3: Unable to create CSRF token`

`56: Missing cookie data`

**Login & Admin login**

`POST /login/:fromPlatform/`

`POST /admin-login/:fromPlatform/`

*FORM DATA*:

`email(string)`

`password(string)`

`csrf(string)`

*ERRORS*:

`0: unknown error`

`1: Missing or invalid platform id`

`2: Suspected malicious user, request blocked`

`4: Missing or invalid form data`

`5: Invalid or expired csrf token`

`6: Invalid login`

`7: User account not part of request platform`

`8: account locked`

`9: Request blocked due to flooding limits`

`10: User is banned or has made too many login requests`

`11: User account not found`

`12: submitted password too short`

`56: Missing cookie data`

**Login 2FA Submit**

`POST /2fa/:fromPlatform/ RETURNS json`

*FORM DATA*:

`twofacode(string)`

`transittoken(string)` *returned from Pigeon Hole API response*

`csrf(string)`

`rememberme(1:0)`

*ERRORS*:

`0: unknown error`

`1: Missing or invalid platform id`

`2: Suspected malicious user, request blocked`

`4: Missing or invalid form data`

`5: Invalid or expired csrf token`

`15: Invalid 2fa code`

`16: Invalid or expired 2fa token`

`17: 2fa token failed to decrypt`

`56: Missing cookie data`

**User Auth Token Check**

`POST /check-cookie/:fromPlatform/ RETURNS json`

*FORM DATA*:

`token(string)` *Deprecated (20.04.24), now handled via cookie*

*ERRORS*:

`0: unknown error`

`1: Missing or invalid platform id`

`2: Suspected malicious user, request blocked`

`4: Missing or invalid form data`

`18: Invalid or expired auth token`

`56: Missing cookie data`

**Full logout**

`POST /full-logout/:fromPlatform/ RETURNS json`

*FORM DATA*:

`token(string)` *Deprecated (20.04.24), now handled via cookie*

`csrf(string)`

*ERRORS*:

`0: unknown error`

`1: Missing or invalid platform id`
 
`4: Missing or invalid form data` 

`11: User account not found`

`56: Missing cookie data`

### PW RESET

**Password Reset Request**

`POST /pw-reset-request/:fromPlatform/ RETURNS json` 

*FORM DATA*:

`email(string)`

`csrf(string)`

*ERRORS*:

`0: unknown error`

`1: Missing or invalid platform id`

`2: Suspected malicious user, request blocked`

`4: Missing or invalid form data`

`5: Invalid or expired csrf token`

`7: User account not part of request platform`

`9: Request blocked due to flooding limits`

`10: User is banned or has made too many login requests`

`11: User account not found`

`56: Missing cookie data`

**Password Reset 2FA**

`POST /pw-reset-2fa/:fromPlatform/ RETURNS json` 

*FORM DATA*:

`twofacode(string)`

`csrf(string)`

`transittoken(string)` *returned from Pigeon Hole API response*

*ERRORS*:

`0: unknown error`

`1: Missing or invalid platform id`

`2: Suspected malicious user, request blocked`

`4: Missing or invalid form data`

`5: Invalid or expired csrf token`

`15: Invalid 2fa code`

`16: Invalid or expired 2fa token`

`17: 2fa token failed to decrypt`

`56: Missing cookie data`

**Password Reset New Password Submit**

`POST /pw-reset-submit-new/:fromPlatform/ RETURNS json` 

*FORM DATA*:

`transittoken(string)` *returned from Pigeon Hole API response*

`csrf(string)`

`pwa(string)`

`pwb(string)`

*ERRORS*:

`0: unknown error`

`1: Missing or invalid platform id`

`2: Suspected malicious user, request blocked`

`4: Missing or invalid form data`

`5: Invalid or expired csrf token`

`16: Invalid or expired 2fa token`

`45: Invalid cookie string`

`46: Passwords don't match`

`49: tried to use insecure password`

`56: Missing cookie data`

### AUTH TOKENS

**get super user token**

`POST /get-su-token/:fromPlatform/ RETURNS json` 

*FORM DATA*:

`token(string)` *Deprecated (20.04.24), now handled via cookie*

`csrf(string)`

`log_activity(1:0)` *optional - logs the request with a custom message to the activity log*

`log_data(string)` *optional - The message when custom activity log entry is set to 1*

*ERRORS*:

`0: unknown error`

`1: Missing or invalid platform id` 

`4: Missing or invalid form data`

`11: User account not found`

`30: Error committing message to user's activity log`

`56: Missing cookie data`

**get admin token**

`POST /get-admin-token/:fromPlatform/ RETURNS json` 

*FORM DATA*:

`token(string)` *Deprecated (20.04.24), now handled via cookie*

`csrf(string)`

`log_activity(1:0)` *optional - logs the request with a custom message to the activity log*

`log_data(string)` *optional - The message when custom activity log entry is set to 1*

*ERRORS*:

`0: unknown error`

`1: Missing or invalid platform id` 

`4: Missing or invalid form data`

`11: User account not found`

`30: Error committing message to user's activity log`

`56: Missing cookie data`

**get user token**

`POST /get-user-token/:fromPlatform/ RETURNS json`  

*FORM DATA*:

`token(string)` *Deprecated (20.04.24), now handled via cookie*

`csrf(string)`

`log_activity(1:0)` *optional - logs the request with a custom message to the activity log*

`log_data(string)` *optional - The message when custom activity log entry is set to 1*

*ERRORS*:

`0: unknown error`

`1: Missing or invalid platform id` 

`4: Missing or invalid form data`

`11: User account not found`

`30: Error committing message to user's activity log`

`56: Missing cookie data`

**get file access token**

`POST /get-file-access-token/:fromPlatform/ RETURNS json`  

*FORM DATA*:

`token(string)` *Deprecated (20.04.24), now handled via cookie*

`csrf(string)`

*ERRORS*:

`0: unknown error`

`1: Missing or invalid platform id` 

`4: Missing or invalid form data`

`11: User account not found`

`56: Missing cookie data`

### USER DATA

**update user profile data**

`POST /update-user-data/:fromPlatform/ RETURNS json`  

*FORM DATA*:

`token(string)` *Deprecated (20.04.24), now handled via cookie*

`csrf(string)`

`new_value(string)`

`field_to_update(string)`

*ERRORS*:

`0: unknown error`

`1: Missing or invalid platform id` 

`4: Missing or invalid form data`

`11: User account not found`

`13: permission denied`

`38: invalid instagram url`

`39: invalid youtube url`

`40: invalid X url`

`41: invalid Facebook url`

`42: Text area maximum characters warning`

`44: Text area invalid data warning`

`47: Invalid Url`

`48: User Deleted`

`53: Permission to delete user denied`

`56: Missing cookie data`

**get user table data**

`POST /get-user-table-data/:fromPlatform/ RETURNS json`  

*FORM DATA*:

`token(string)` *Deprecated (20.04.24), now handled via cookie*

`csrf(string)`

*ERRORS*:

`0: unknown error`

`1: Missing or invalid platform id` 

`4: Missing or invalid form data`

`11: User account not found`

`13: permission denied`

`56: Missing cookie data`

**get user details**

`POST /get-user-details/:fromPlatform/:id/ RETURNS json`  

*FORM DATA*:

`token(string)` *Deprecated (20.04.24), now handled via cookie*

`csrf(string)`

*ERRORS*:

`0: unknown error`

`1: Missing or invalid platform id` 

`4: Missing or invalid form data`

`11: User account not found`

`13: permission denied`

`14: no user ID set`

`56: Missing cookie data`

**handle Update User**

`POST /update-user-details/:fromPlatform/:id/ RETURNS json`  

*FORM DATA*:

`token(string)` *Deprecated (20.04.24), now handled via cookie*

`csrf(string)`

*ERRORS*:

`0: unknown error`

`1: Missing or invalid platform id` 

`4: Missing or invalid form data`

`11: User account not found`

`13: permission denied`

`14: no user ID set`

`20: First Name cannot contain special characters`

`21: First Name cannot be empty`

`22: Surname cannot contain special characters`

`23: Surname cannot be empty`

`24: Invalid Email`

`25: Email already in use`

`26: Invalid phone number format`

`27: User must be in at least one user group`

`28: Incomplete/invalid user data`

`29: Error saving new avatar`

`31: Error trying to backup user data`

`52: No user status set, must equal 'active' or 'locked'`

`56: Missing cookie data`

**get user tags options**

`POST /get-user-tag-options/:fromPlatform/ RETURNS json` 

*FORM DATA*:

`token(string)` *Deprecated (20.04.24), now handled via cookie*

`csrf(string)`

*ERRORS*:

`0: unknown error`

`1: Missing or invalid platform id` 

`4: Missing or invalid form data`

`11: User account not found`

`13: permission denied`

`56: Missing cookie data`

**get user groups**

`POST /get-user-groups/:fromPlatform/ RETURNS json`  

*FORM DATA*:

`token(string)` *Deprecated (20.04.24), now handled via cookie*

`csrf(string)`

*ERRORS*:

`0: unknown error`

`1: Missing or invalid platform id` 

`4: Missing or invalid form data`

`11: User account not found`

`13: permission denied`

`56: Missing cookie data`

**get single user group**

`POST /get-user-group/:fromPlatform/:id/ RETURNS json` 

*FORM DATA*:

`token(string)` *Deprecated (20.04.24), now handled via cookie*

`csrf(string)`

*ERRORS*:

`0: unknown error`

`1: Missing or invalid platform id` 

`4: Missing or invalid form data`

`11: User account not found`

`13: permission denied`

`56: Missing cookie data`

**get user activity log**

`POST /get-user-activity-log/:fromPlatform/:id/ RETURNS json`

*FORM DATA*:

`token(string)` *Deprecated (20.04.24), now handled via cookie*

`csrf(string)` 

*ERRORS*:

`0: unknown error`

`1: Missing or invalid platform id` 

`4: Missing or invalid form data`

`11: User account not found`

`13: permission denied`

`56: Missing cookie data`

**get user groups**

`POST /get-user-tags/:fromPlatform/ RETURNS json` 

*FORM DATA*:

`token(string)` *Deprecated (20.04.24), now handled via cookie*

`csrf(string)` 

*ERRORS*:

`0: unknown error`

`1: Missing or invalid platform id` 

`4: Missing or invalid form data`

`11: User account not found`

`13: permission denied`

`56: Missing cookie data`

**Update tag data**

`POST /update-tag/:fromPlatform/ RETURNS json`

*FORM DATA*:

`token(string)` *Deprecated (20.04.24), now handled via cookie*

`csrf(string)` 

`submit_type(0:1:2)` *0:new tag, 1: Update tag, 2:delete tag*

`tag_id(string)` 

`tag(string)` 

`description(string)` 

*ERRORS*:

`0: unknown error`

`1: Missing or invalid platform id` 

`4: Missing or invalid form data`

`11: User account not found`

`13: permission denied`

`31: Error trying to backup user data`

`37: Tag name already exists`

`54: Permission to delete user tag denied`

`56: Missing cookie data`

**update user group data**

`POST /update-user-group/:fromPlatform/:id/ RETURNS json` 

*FORM DATA*:

`token(string)` *Deprecated (20.04.24), now handled via cookie*

`csrf(string)` 

`submit_type(0:1:2)` *0:n/a, 1: n/a, 2:delete group*

`newData(json)` 

*ERRORS*:

`0: unknown error`

`1: Missing or invalid platform id` 

`4: Missing or invalid form data`

`11: User account not found`

`13: permission denied`

`31: Error trying to backup user data`

`32: Group name must be set`

`33: Group name already exists`

`34: Group must have header or parent`

`35: error saving group to database`

`36: Cannot delete a system default group`

`55: Permission to delete user group denied`

`56: Missing cookie data`

**update user details**

`POST /update-user-meta/:fromPlatform/ RETURNS json` 

*FORM DATA*:

`token(string)` *Deprecated (20.04.24), now handled via cookie*

`csrf(string)` 

`auth_state(json)` 

*ERRORS*:

`0: unknown error`

`1: Missing or invalid platform id` 

`4: Missing or invalid form data`

`11: User account not found`

`31: Error trying to backup user data`

`56: Missing cookie data`

**get recently used sections data**

`POST /get-recently-used-data/:fromPlatform/ RETURNS json` 

*FORM DATA*:

`token(string)` *Deprecated (20.04.24), now handled via cookie*

`csrf(string)` 

*ERRORS*:

`0: unknown error`

`1: Missing or invalid platform id` 

`4: Missing or invalid form data`

`11: User account not found`

`13: permission denied`

`56: Missing cookie data`

### USER INVITE

**Create new user**

`POST /create-new-user/:fromPlatform/ RETURNS json` 

*FORM DATA*:

`token(string)` *Deprecated (20.04.24), now handled via cookie*

`csrf(string)` 

`newData(json)` 

`save(1:0)` *1: save, 0: don't save

*ERRORS*:

`0: unknown error`

`1: Missing or invalid platform id` 

`4: Missing or invalid form data`

`11: User account not found`

`13: permission denied`

`20: First Name cannot contain special characters`

`21: First Name cannot be empty`

`22: Surname cannot contain special characters`

`23: Surname cannot be empty`

`24: Invalid Email`

`25: Email already in use`

`26: Invalid phone number format`

`27: User must be in at least one user group`

`28: Incomplete/invalid user data`

`29: Error saving new avatar`

`51: Error saving new avatar`

`56: Missing cookie data`

**User invite 2fa**

`POST /user-invite-2fa/:fromPlatform/ RETURNS json`

*FORM DATA*:

`token(string)` *NOT DEPRECATED*

`csrf(string)` 

`csrf(twofacode)` 

*ERRORS*:

`0: unknown error`

`1: Missing or invalid platform id` 

`2: Suspected malicious user, request blocked`

`4: Missing or invalid form data`

`5: Invalid or expired csrf token`

`7: User account not part of request platform`

`11: User account not found` 

`15: Invalid 2fa code`

`17: 2fa token failed to decrypt`

`19: Sign-up already completed`

`56: Missing cookie data`


**Resend invite email**

`POST /resend-invite/:fromPlatform/:userid/ RETURNS json`

*FORM DATA*:

`token(string)` *Deprecated (20.04.24), now handled via cookie*

`csrf(string)` 

*ERRORS*:

`0: unknown error`

`1: Missing or invalid platform id`

`4: Missing or invalid form data`

`11: User account not found`

`13: permission denied`

`14: no user ID set`

`50: User has already accepted their invitation`

### MESSAGE RESPONSE MASTER LIST

`0: unknown error`

`1: Missing or invalid platform id`

`2: Suspected malicious user, request blocked`

`3: Unable to create CSRF token`

`4: Missing or invalid form data`

`5: Invalid or expired csrf token`

`6: Invalid password`

`7: User account not part of request platform`

`8: account locked`

`9: Request blocked due to flooding limits`

`10: User is banned or has made too many login requests`

`11: User account not found`

`12: submitted password too short`

`13: permission denied`

`14: no user ID set`

`15: Invalid 2fa code`

`16: Invalid or expired 2fa token`

`17: 2fa token failed to decrypt`

`18: Invalid or expired auth token`

`19: Sign-up already completed`

`20: First Name cannot contain special characters`

`21: First Name cannot be empty`

`22: Surname cannot contain special characters`

`23: Surname cannot be empty`

`24: Invalid Email`

`25: Email already in use`

`26: Invalid phone number format`

`27: User must be in at least one user group`

`28: Incomplete/invalid user data`

`29: Error saving new avatar`

`30: Error committing message to user's activity log`

`31: Error trying to backup user data`

`32: Group name must be set`

`33: Group name already exists`

`34: Group must have header or parent`

`35: error saving group to database`

`36: Cannot delete a system default group`

`37: Tag name already exists`

`38: invalid instagram url`

`39: invalid youtube url`

`40: invalid X url`

`41: invalid Facebook url`

`42: Text area maximum characters warning`

`43: Text area minimum characters warning`

`44: Text area invalid data warning`

`45: Invalid cookie string`

`46: Passwords don't match`

`47: Invalid Url`

`48: User Deleted`

`49: tried to use insecure password`

`50: User has already accepted their invitation`

`51: No save instruction creating or editing user`

`52: No user status set, must equal 'active' or 'locked'`

`53: Permission to delete user denied`

`54: Permission to delete user tag denied`

`55: Permission to delete user group denied`

`56: Missing cookie data`

### DEFAULT PERMISSIONS OBJECT

`
{
  privileges: {
    settings: {
      view_home: 1,
      view_settings: 0,
      edit_settings: 0,
      super_admin: 0
    },
    reception: { 
      min_pw_length: 12,
      view_users: 0,
      edit_users: 0,
      create_user: 0,
      delete_user: 0,
      view_user_groups: 0,
      edit_user_groups: 0,
      delete_user_groups: 0,
      view_tags: 0,
      edit_tags: 0,
      delete_tags: 0,
    },
    archives: {
      create_forms: 0,
      view_forms: 0,
      edit_forms: 0,
      delete_forms: 0, 
      view_submissions: 0,
      edit_submissions: 0,
      delete_submissions: 0,      
    },
    comms: {
      moderate_comments: 0,
      post_comment: 1,
      view_comments: 1,
    },
    loading_dock: {
      change_settings: 0,
      change_limits: 0,
    },
    warehouse: {
      view_files: 1,
      edit_files: 0,
    }
  }
}
`

## Change Log

### v1.0.0
- Launch with core functionality for core user functions, auth, login, session management as to original spec agreed.
