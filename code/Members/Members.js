//
// The Antville Project
// http://code.google.com/p/antville
//
// Copyright 2001-2007 by The Antville People
//
// Licensed under the Apache License, Version 2.0 (the ``License'');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an ``AS IS'' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// $Revision:3329 $
// $LastChangedBy:piefke3000 $
// $LastChangedDate:2007-09-14 15:18:09 +0200 (Fri, 14 Sep 2007) $
// $URL$
//

Members.prototype.getPermission = function(action) {
   if (!this._parent.getPermission("main")) {
      return false;
   }
   switch (action) {
      case "login":
      case "logout":
      case "register":
      case "reset":
      case "salt.js":
      return true;
      case ".":
      case "main":
      case "owners":
      case "managers":
      case "contributors":
      case "subscribers":
      case "add":
      return User.require(User.PRIVILEGED) ||
            Membership.require(Membership.OWNER);
      case "edit":
      case "privileges":
      case "subscriptions":
      case "updated":
      return Membership.require(Membership.SUBSCRIBER);
   }
   return false;
};

Members.prototype.link_macro = function(param, action, text) {
   switch (action) {
      case "login":
      if (req.action === action) {
         return;
      }
   }
   return HopObject.prototype.link_macro.apply(this, arguments);
};

Members.prototype.main_action = function() {
   res.data.title = gettext("Members of {0}", this._parent.title);
   res.data.list = renderList(this, "Membership#members", 
         10, req.queryParams.page);
   res.data.pager = renderPageNavigation(this, this.href(req.action), 
         10, req.queryParams.page);
   res.data.body = this.renderSkinAsString("Members#main");
   res.handlers.site.renderSkin("page");
   return;
};

Members.prototype.register_action = function() {
   if (req.postParams.register) {      
      try {
         var title = res.handlers.site.title;
         var user = User.register(req.postParams);
         var membership = new Membership(user);
         this.add(membership);
         membership.notify(req.action, user.email, 
               gettext('Welcome to "{0}"!', title));
         var url = session.data.referrer || this._parent.href();
         delete session.data.referrer;
         res.message = gettext('Welcome to "{0}", {1}. Have fun!',
               title, user.name);
         res.redirect(url);
      } catch (ex) {
         app.log(ex);
         res.message = ex;
      }
   }

   session.data.token = User.getSalt();
   res.data.action = this.href(req.action);
   res.data.title = gettext("Register");
   res.data.body = this.renderSkinAsString("Members#register");
   this._parent.renderSkin("page");
   return;
};

Members.prototype.reset_action = function() {
   if (req.postParams.reset) {
      try {
         if (!req.postParams.name || !req.postParams.email) {
            throw Error(gettext("Please enter username and e-mail of the desired account."));
         }
         var user = User.getByName(req.postParams.name);
         if (!user || user.email !== req.postParams.email) {
            throw Error(gettext("Username and e-mail do not match."))
         }
         var password = jala.util.createPassword(25, 2);
         user.hash = (password + user.salt).md5()
         sendMail(root.email, user.email, 
               gettext("Your login at {0}", this._parent.title), 
               user.renderSkinAsString("Messages#reset", 
               {password: password}));
         res.message = "A new password is sent to the account's e-mail address.";
         res.redirect(this._parent.href());
      } catch(ex) {
         app.log(ex);
         res.message = ex;
      }
   }
   res.data.action = this.href(req.action);
   res.data.title = gettext("Reset password");
   res.data.body = this.renderSkinAsString("Members#reset");
   this._parent.renderSkin("page");
   return;
};

Members.prototype.login_action = function() {
   if (req.postParams.login) {
      try {
         var user = User.login(req.postParams);
         var url = session.data.referrer || this._parent.href();
         delete session.data.referrer;
         res.message = gettext('Welcome to "{0}", {1}. Have fun!',
               res.handlers.site.getTitle(), user.name);
         res.redirect(url);
      } catch (ex) {
         res.message = ex;
         app.log(ex);
      }
   }

   if (!session.data.referrer) {
      session.data.referrer = req.data.http_referer;
   }
   session.data.token = User.getSalt();
   res.data.action = this.href(req.action);
   res.data.title = gettext("Login");
   res.data.body = this.renderSkinAsString("Members#login");
   this._parent.renderSkin("page");
   return;
};

Members.prototype.logout_action = function() {
   if (session.user) {
     res.message = gettext("Good bye, {0}! Lookin' forward to seeing you again!", 
           session.user.name);
     session.logout();
     delete session.data.referrer;
     res.setCookie(User.COOKIE, String.EMPTY);
     res.setCookie(User.HASHCOOKIE, String.EMPTY);
   }
   res.redirect(this._parent.href());
   return;
};

Members.prototype.edit_action = function() {
   if (req.postParams.save) {
      try {
         session.user.update(req.postParams);
         res.message = gettext("The changes were saved successfully.");
         res.redirect(this._parent.href());
      } catch (err) {
         res.message = err.toString();
      }
   }

   session.data.token = User.getSalt();
   session.data.salt = session.user.salt; // FIXME
   res.data.title = gettext("Profile of user {0}", session.user.name);
   res.data.body = session.user.renderSkinAsString("User#edit");
   this._parent.renderSkin("page");
   return;
};

Members.prototype.salt_js_action = function() {
   var user;
   if (user = User.getByName(req.queryParams.user)) {
      res.write((user.salt || String.EMPTY).toSource());
   }
   return;
};

Members.prototype.owners_action = function() {
   res.data.title = gettext("Owners of {0}", this._parent.title);
   res.data.list = renderList(this.owners, 
         "Membership#members", 10, req.queryParams.page);
   res.data.pager = renderPageNavigation(this.owners, 
         this.href(req.action), 10, req.queryParams.page);
   res.data.body = this.renderSkinAsString("Members#main");
   res.handlers.site.renderSkin("page");
   return;
};

Members.prototype.managers_action = function() {
   res.data.title = gettext("Managers of {0}", this._parent.title);
   res.data.list = renderList(this.managers, 
         "Membership#members", 10, req.queryParams.page); 
   res.data.pager = renderPageNavigation(this.managers, 
         this.href(req.action), 10, req.queryParams.page);
   res.data.body = this.renderSkinAsString("Members#main");
   res.handlers.site.renderSkin("page");
   return;
};

Members.prototype.contributors_action = function() {
   res.data.title = gettext("Contributors of {0}", this._parent.title);
   res.data.list = renderList(this.contributors, 
         "Membership#members", 10, req.queryParams.page);
   res.data.pager = renderPageNavigation(this.contributors, 
         this.href(req.action), 10, req.data.page);
   res.data.body = this.renderSkinAsString("Members#main");
   res.handlers.site.renderSkin("page");
   return;
};

Members.prototype.subscribers_action = function() {
   res.data.title = gettext("Subscribers of {0}", this._parent.title);
   res.data.list = renderList(this.subscribers, 
         "Membership#members", 10, req.queryParams.page);
   res.data.pager = renderPageNavigation(this.subscribers, 
         this.href(req.action), 10, req.queryParams.page);
   res.data.body = this.renderSkinAsString("Members#main");
   res.handlers.site.renderSkin("page");
   return;
};

Members.prototype.updated_action = function() {
   res.data.title = gettext("Updated sites for user {0}", session.user.name);
   res.data.list = session.user.renderSkinAsString("User#sites");
   res.data.body = session.user.renderSkinAsString("User#subscriptions");
   res.handlers.site.renderSkin("page");
   return;
};

Members.prototype.privileges_action = function() {
   res.data.title = gettext("Memberships of user {0}", session.user.name);
   res.data.list = renderList(session.user.memberships, 
         "Membership#subscriptions");
   res.data.body = session.user.renderSkinAsString("User#subscriptions");
   res.handlers.site.renderSkin("page");
   return;
};

Members.prototype.subscriptions_action = function() {
   res.data.title = gettext("Subscriptions of user {0}", session.user.name);
   res.data.list = renderList(session.user.subscriptions, 
         "Membership#subscriptions");
   res.data.body = session.user.renderSkinAsString("User#subscriptions");
   res.handlers.site.renderSkin("page");
   return;
};

Members.prototype.add_action = function() {
   if (req.postParams.term) {
      try {
         var result = this.search(req.postParams.term);
         if (result.length < 1) {
            res.message = gettext("Found no user matching the search input.");
         } else {
            if (result.length >= 100) {
               res.message = gettext("Found too many users, displaying the first {0} matches only.", 
                     result.length);
            } else {
               res.message = ngettext("Found one user matching the search input.",
                     "Found {0} users matching the search input.", 
                      result.length);
            }
            res.data.result = this.renderSkinAsString("Members#result", result);
         }
      } catch (ex) {
         res.message = ex;
         app.log(ex);
      }
   } else if (req.postParams.add) {
      try {
         res.handlers.sender = User.getMembership();
         var membership = this.addMembership(req.postParams);
         membership.notify(req.action, membership.creator.email,  
               gettext('Notification of membership change', root.title));
         res.message = gettext("Successfully added {0} to the list of members.", 
               req.postParams.name);
         res.redirect(membership.href("edit"));
      } catch (ex) {
         res.message = ex;
         app.log(ex);
      }
      res.redirect(this.href());
   } else {
      res.message = gettext("Enter a search term to display a list of matching users.");
   }
   res.data.action = this.href(req.action);
   res.data.title = gettext('Add member to {0}', this._parent.title);
   res.data.body = this.renderSkinAsString("Members#add");
   res.handlers.site.renderSkin("page");
   return;
};

Members.prototype.search = function(searchString) {
   var mode = "= '";
   if (searchString.contains("*")) {
      searchString = searchString.replace(/\*/g, "%");
      mode = "like '";
   }
   var dbConn = getDBConnection("antville");
   var query = "select name from user where name " + mode + searchString + 
         "' order by name asc";
   var rows = dbConn.executeRetrieval(query);
   var counter = 0, name;
   res.push();
   while (rows.next() && counter < 100) {
      name = rows.getColumnItem("name");
      // Continue if the user is already a member
      if (this.get(name)) {
         continue;
      };
      this.renderSkin("Members#resultItem", {name :name});
      counter += 1;
   }
   rows.release();
   return {
      result: res.pop(),
      length: counter
   };
};

Members.prototype.addMembership = function(data) {
   var user = root.users.get(data.name);
   if (!user) {
      throw Error(gettext("Sorry, your input did not match any registered user."));
   } else if (this.get(data.name)) {
      throw Error(gettext("This user is already a member of this site."));
   }
   var membership = new Membership(user);
   this.add(membership);
   return membership;
};

/* FIXME: obsolete?
Members.prototype.renderMemberlist = function() {
   var currLvl = null;
   res.push();
   for (var i=0;i<this.size();i++) {
      var m = this.get(i);
      if (m.level != currLvl) {
         this.renderSkin("membergroup", {group: getRole(m.level)});
         currLvl = m.level;
      }
      m.renderSkin("mgrlistitem");
   }
   return res.pop();
};
*/

Members.prototype.modSorua_action = function() {
   if (!app.data.modSorua) app.data.modSorua = new Array();
   var returnUrl = req.data["sorua-return-url"];
   var failUrl   = req.data["sorua-fail-url"];
   var userID    = req.data["sorua-user"];
   var action    = req.data["sorua-action"];
   if (action == "authenticate") {    // authenticate-action
      if (session.user && (userID == null || userID == "" || session.user.name == userID)) {
         // store returnUrl + timestamp + userID
         app.data.modSorua[returnUrl] = {time: new Date(), userID: session.user.name}; 
         res.redirect(returnUrl);
      } else if (failUrl) {
         res.redirect(failUrl);
      } else {
         session.data.modSorua = {returnUrl: returnUrl,
                                 userID: userID};
         res.redirect(this.href("modSoruaLoginForm"));
      }

   } else if (action == "verify") {
      // first remove outdated entries
      var now = new Date();
      var arr = new Array();
      for (var i in app.data.modSorua) {
         if (app.data.modSorua[i] && app.data.modSorua[i].time &&
            now.valueOf() - app.data.modSorua[i].time.valueOf() < 1000 * 60)
            arr[i] = app.data.modSorua[i];
      }
      app.data.modSorua = arr;
      // now check whether returnUrl has been used recently
      if (app.data.modSorua[returnUrl]) {
         res.status = 200;
         res.write("user:" + app.data.modSorua[returnUrl].userID);
         return;
      } else {
         res.status = 403;
         return;
      }

   } else { // handle wrong call of AuthURI
     res.redirect(root.href("main"));

   }   
};

Members.prototype.modSoruaLoginForm_action = function() {
   if (!session.data.modSorua || !session.data.modSorua.returnUrl) 
      res.redirect(root.href()); // should not happen anyways
   if (req.data.login) {
      try {
         res.message = this.evalLogin(req.data.name, req.data.password);
         var returnUrl = session.data.modSorua.returnUrl;
         app.data.modSorua[returnUrl] = {time: new Date(), userID: req.data.name};
         res.redirect(returnUrl);
      } catch (err) {
         res.message = err.toString();
      }      
   }
   res.data.action = this.href("modSoruaLoginForm");
   this.renderSkin("modSorua");
};
