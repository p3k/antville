Members.prototype.sendpwd_action = function() {
   res.data.title = gettext("Recover your password");
   res.data.body = gettext("Due to security reasons user passwords are not " +
         "stored in the Antville database any longer. Thus, your password " +
         "cannot be sent to you, either. Please use the password reset option.");
   this._parent.renderSkin("page");
   return;
};

Members.prototype.subscribelink_macro = function(param) {
   if (this._parent.online && res.data.memberlevel == null) {
      Html.link({href: this._parent.href("subscribe")},
            param.text ? param.text : getMessage("Members.signUp"));
   }
   return;
};

Members.prototype.subscriptionslink_macro = function(param) {
   if (session.user.size()) {
      Html.link({href: this.href("updated")},
            param.text ? param.text : getMessage("Members.subscriptions"));
   }
   return;
};

Members.prototype.membership_macro = function(param) {
   res.write(res.handlers.membership.FIXME);
   return;
};
