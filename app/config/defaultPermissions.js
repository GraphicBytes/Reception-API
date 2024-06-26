//###################################################
//############### DEFAULT PERMISSIONS ###############
//###################################################

const defaultPermissions = {
  privileges: {
    settings: {
      view_home: 1,
      view_settings: 0,
      edit_settings: 0,
      super_admin: 0
    },
    reception: { 
      min_pw_length: 15,
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

export { defaultPermissions };