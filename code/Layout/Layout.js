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
// $Revision$
// $LastChangedBy$
// $LastChangedDate$
// $URL$
//

Layout.getModes = defineConstants(Layout, "default", "shared");

this.handleMetadata("title");
this.handleMetadata("description");
this.handleMetadata("origin");
this.handleMetadata("originator");
this.handleMetadata("originated");

Layout.prototype.constructor = function(site) {
   this.site = site;
   this.creator = session.user;
   this.created = new Date;
   this.mode = Layout.DEFAULT;
   this.touch();
   return this;
};

Layout.prototype.getPermission = function(action) {
   if (!res.handlers.site.getPermission("main")) {
      return false;
   }
   switch (action) {
      case ".":
      case "main":
      case "export":
      case "images":
      case "import":
      case "reset":
      case "skins":
      return true;
   }
   return false;
};

Layout.prototype.main_action = function() {
   res.debug(this.skins.getSkin("Site", "values"));
   if (req.postParams.save) {
      try {
         this.update(req.postParams);
         res.message = gettext("Successfully updated the layout {0}.", 
               this.title);
         res.redirect(this.href());
      } catch (ex) {
         res.message = ex;
         app.log(ex);
      }
   }
   res.data.title = gettext("Layout of site {0}", res.handlers.site.title);
   res.data.body = this.renderSkinAsString("Layout#main");
   res.handlers.site.renderSkin("page");
   return;
};

Layout.prototype.getFormOptions = function(name) {
   switch (name) {
      case "mode":
      return Layout.getModes();
      case "parent":
      return this.getParentOptions();
   }
};

Layout.prototype.update = function(data) {
   var skin = this.skins.getSkin("Site", "values");
   if (!skin) {
      skin = new Skin("Site", "values");
      this.skins.add(skin);
   }
   res.push();
   for (var key in data) {
      if (key.startsWith("value_")) {
         var value = data[key];
         key = key.substr(6);
         res.write("<% value ");
         res.write(quote(key));
         res.write(" ");
         res.write(quote(value));
         res.write(" %>\n");
      }
   }
   res.write("\n");
   skin.setSource(res.pop());
   this.description = data.description;
   this.mode= data.mode;
   this.touch();
   return;
};

Layout.remove = function() {
   Skins.remove.call(this.skins);
   this.getFile().removeDirectory();
   Images.remove.call(this.images);
   return;
};

Layout.prototype.reset_action = function() {
   Skins.remove.call(this.skins);
   this.getFile().removeDirectory();
   return res.redirect(this.href());
};

Layout.prototype.export_action = function() {
   var zip = new helma.Zip();
   for each (var fpath in res.skinpath) {
      zip.add(new helma.File(fpath), "layout");
   }
   var file, prototype;
   var dir = new helma.File(app.dir);
   for each (var fpath in dir.listRecursive(/\.skin$/)) {
      prototype = fpath.split("/").splice(-2)[0];
      file = new helma.File(fpath);
      try {
         zip.add(file, "layout/" + prototype);
      } catch (ex) {
         app.log(ex);
      }
   }
   var data = new HopObject;
   data.images = new HopObject;
   this.images.forEach(function() {
      var keys = ["name", "width", "height", "description", "contentLength", 
            "thumbnailName", "thumbnailWidth", "thumbnailHeight"];
      var image = new HopObject;
      for each (var key in keys) {
         image[key] = this[key];
         data.images.add(image);
      }
   });
   data.origin = this.origin || this.site.href();
   data.originator = this.originator || session.user.name;
   data.originated = this.originated || new Date;
   var xml = new java.lang.String(Xml.writeToString(data));
   zip.addData(xml.getBytes("UTF-8"), "data.xml");
   zip.close();

   res.contentType = "application/zip";
   res.setHeader("Content-Disposition", 
         "attachment; filename=" + this.site.name + "-layout.zip");
   res.writeBinary(zip.getData());
   return;
};

Layout.prototype.import_action = function() {
   var data = req.postParams;
   if (data.submit) {
      // Create destination directory if it does not exist
      var destination = this.getFile();
      if (!destination.exists()) {
         destination.makeDirectory();
      }
      // Extract imported layout to temporary directory
      var temp = new helma.File(destination, "../import.temp");
      var file = data.upload.writeToFile(new helma.File(destination, ".."));
      var zip = new helma.Zip(file);
      zip.extractAll(temp);
      (new helma.File(file)).remove();
      // Backup the current layout if necessary
      if (destination.list().length > 0) {
         var timestamp = (new Date).format("yyyyMMdd-HHmmss");
         zip = new helma.Zip();
         zip.add(destination);
         zip.save(this.getFile("../layout-" + timestamp + ".zip"));
         zip.close();
      }
      // Clear database from obsolete data
      Images.remove.call(this.images);
      Skins.remove.call(this.skins);
      res.commit();
      // Replace the current layout with the imported one
      var layout = new helma.File(temp, "layout");
      layout.renameTo(destination);
      // Update database with imported data
      layout = this;
      var data = Xml.read(new helma.File(temp, "data.xml"));
      this.origin = data.origin;
      this.originator = data.originator;
      this.originated = data.originated;
      data.images.forEach(function() {
         layout.images.add(new Image(this));
      });
      res.redirect(this.href());
      return;
   }
   res.data.title = gettext("Import layout");
   res.data.body = this.renderSkinAsString("Layout#import");
   res.handlers.site.renderSkin("page");
   return;
};

Layout.prototype.image_macro = function(param, name, mode) {
   name || (name = param.name);
   if (!name) {
      return;
   }
   var image = this.getImage(name, param.fallback);
   if (!image) {
      return;
   }

   mode || (mode = param.as);
   var action = param.linkto;
   delete(param.name);
   delete(param.as);
   delete(param.linkto);

   switch (mode) {
      case "url" :
      return image.getUrl();
      case "thumbnail" :
      action || (action = image.getUrl());
      return image.thumbnail_macro(param);
   }
   image.render_macro(param);
   return;
};

Layout.prototype.getImage = function(name, fallback) {
   var layout = this;
   while (layout) {
      if (layout.images.get(name)) {
         return layout.images.get(name);
      }
      if (fallback && layout.images.get(fallback)) {
         return layout.images.get(fallback);
      }
      layout = layout.parent;
   }
   return null;
};

Layout.prototype.getFile = function(name) {
   name || (name = String.EMPTY);
   return this.site.getStaticFile("layout/" + name);
};

Layout.prototype.getSkinPath = function() {
   if (!this.site) {
      return null;
   }
   var skinPath = [this.getFile().toString()];
   this.parent && (skinPath.push(this.parent.getFile().toString()));
   return skinPath;
};

Layout.prototype.getTitle = function() {
   return "Layout";
};

Layout.prototype.values_macro = function() {
   res.push();
   var skin = new Skin("Site", "values");
   skin.render();
   res.pop();
   for (var key in res.meta.values) {
      this.renderSkin("Layout#value", {
         key: key.capitalize(), 
         value: res.meta.values[key]
      });
   }
   return;
};
