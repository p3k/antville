/**
 * macro counts
 */

function sysmgr_count_macro(param) {
   if (!param || !param.what)
      return;
   // this macro is allowed just for sysadmins
   if (!session.user.sysadmin)
      return;
   switch (param.what) {
      case "stories" :
         return this.stories.size();
      case "comments" :
         return this.comments.size();
      case "images" :
         return this.images.size();
      case "files" :
         this.files.size();
   }
   return;
}

/**
 * function renders the statusflags for this user
 */

function sysmgr_statusflags_macro(param) {
   // this macro is allowed just for sysadmins
   if (!session.user.sysadmin)
      return;
   if (this.trusted)
      res.write("<span class=\"flagDark\" style=\"background-color:#009900;\">TRUSTED</span>");
   if (this.sysadmin)
      res.write("<span class=\"flagDark\" style=\"background-color:#006600;\">SYSADMIN</span>");
   if (this.blocked)
      res.write("<span class=\"flagDark\" style=\"background-color:#000000;\">BLOCKED</span>");
}

/**
 * function renders an edit-link
 */

function sysmgr_editlink_macro(param) {
   // this macro is allowed just for sysadmins
   if (!session.user.sysadmin || req.data.edit == this.name || session.user == this)
      return;
   param.linkto = "users";
   param.urlparam = "item=" + this.name + "&action=edit";
   if (req.data.page)
      param.urlparam += "&page=" + req.data.page;
   param.anchor = this.name;
   Html.openTag("a", root.manage.createLinkParam(param));
   res.write(param.text ? param.text : "edit");
   Html.closeTag("a");
}

/**
 * macro renders the username as plain text
 */

function sysmgr_username_macro(param) {
   res.write(this.name);
}

/**
 * macro renders the timestamp of registration
 */

function sysmgr_registered_macro(param) {
   // this macro is allowed just for sysadmins
   if (!session.user.sysadmin)
      return;
   fmt=param.format ? param.format : "dd.MM.yyyy HH:mm";
   res.write(this.registered.format(fmt));
}

/**
 * macro renders the timestamp of last visit
 */

function sysmgr_lastvisit_macro(param) {
   // this macro is allowed just for sysadmins
   if (!session.user.sysadmin)
      return;
   if (this.lastvisit) {
      fmt=param.format ? param.format : "dd.MM.yyyy HH:mm";
      res.write(this.lastvisit.format(fmt));
   }
}

/**
 * macro renders the trust-state of this user
 */

function sysmgr_trusted_macro(param) {
   // this macro is allowed just for sysadmins
   if (!session.user.sysadmin)
      return;
   if (param.as == "editor") {
      var options = ["no", "yes"];
      Html.dropDown({name: "trusted"}, options, this.trusted);
   } else
      res.write(this.trusted ? "yes" : "no");
}

/**
 * macro renders the block-state of this user
 */

function sysmgr_blocked_macro(param) {
   // this macro is allowed just for sysadmins
   if (!session.user.sysadmin)
      return;
   if (param.as == "editor") {
      var options = ["no", "yes"];
      Html.dropDown({name: "blocked"}, options, this.blocked);
   } else
      res.write(this.blocked ? "yes" : "no");
}

/**
 * macro renders the sysadmin-state of this user
 */

function sysmgr_sysadmin_macro(param) {
   // this macro is allowed just for sysadmins
   if (!session.user.sysadmin)
      return;
   if (param.as == "editor") {
      var options = ["no", "yes"];
      Html.dropDown({name: "sysadmin"}, options, this.sysadmin);
   } else
      res.write(this.sysadmin ? "yes" : "no");
}