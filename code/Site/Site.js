// The Antville Project
// http://code.google.com/p/antville
//
// Copyright 2001–2014 by the Workers of Antville.
//
// Licensed under the Apache License, Version 2.0 (the ``License'');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an ``AS IS'' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileOverview Defines the Site prototype.
 */

markgettext('Site');
markgettext('site');

this.handleMetadata('archiveMode');
this.handleMetadata('callbackMode');
this.handleMetadata('callbackUrl');
this.handleMetadata('closed');
this.handleMetadata('commentMode');
this.handleMetadata('configured');
this.handleMetadata('deleted');
this.handleMetadata('export_id');
this.handleMetadata('import_id');
this.handleMetadata('job');
this.handleMetadata('locale');
this.handleMetadata('notificationMode');
this.handleMetadata('notified');
this.handleMetadata('pageSize');
this.handleMetadata('pageMode');
this.handleMetadata('spamfilter');
this.handleMetadata('tagline');
this.handleMetadata('timeZone');
this.handleMetadata('title');

/**
 * @function
 * @returns {String[]}
 * @see defineConstants
 */
Site.getStatus = defineConstants(Site, markgettext('Blocked'),
    markgettext('Regular'), markgettext('Trusted'));
/**
 * @function
 * @returns {String[]}
 * @see defineConstants
 */
Site.getModes = defineConstants(Site, markgettext('Deleted'),
    markgettext('Closed'), markgettext('Restricted'),
    markgettext('Public'), markgettext('Open'));
/**
 * @function
 * @returns {String[]}
 * @see defineConstants
 */
Site.getPageModes = defineConstants(Site, markgettext('days') /* ,
    markgettext('stories') */ );
/**
 * @function
 * @returns {String[]}
 * @see defineConstants
 */
Site.getCommentModes = defineConstants(Site, markgettext('disabled'),
    markgettext('enabled'));
/**
 * @function
 * @returns {String[]}
 * @see defineConstants
 */
Site.getArchiveModes = defineConstants(Site, markgettext('closed'),
    markgettext('public'));
/**
 * @function
 * @returns {String[]}
 * @see defineConstants
 */
Site.getNotificationModes = defineConstants(Site, markgettext('Nobody'),
    markgettext('Owner'), markgettext('Manager'), markgettext('Contributor'),
    markgettext('Subscriber'));
/**
 * @function
 * @returns {String[]}
 * @see defineConstants
 */
Site.getCallbackModes = defineConstants(Site, markgettext('disabled'),
    markgettext('enabled'));

/**
 * @param {String} name A unique identifier also used in the URL of a site
 * @param {String} title An arbitrary string branding a site
 * @param {User} user
 */
Site.add = function(data, user) {
  HopObject.confirmConstructor(Site);

  var now = new Date;
  var user = user || session.user || {};
  var site = new Site;

  if (!data.name) {
    throw Error(gettext('Please enter a name for your new site.'));
  }

  if (data.name.length > 30) {
    throw Error(gettext('The chosen name is too long. Please enter a shorter one.'));
  }

  var name = stripTags(decodeURIComponent(data.name));
  if (name !== data.name || /[^\u00a0-\uffff\w\-]/.test(data.name)) {
    // We check if name can be used in vhost environment by allowing all Unicode characters
    // but only ASCII letters A—z, digits 0—9, the underscore “_” and the hyphen “-”.
    throw Error(gettext('Please avoid special characters or HTML code in the name field.'));
  } else if (name !== root.getAccessName(name)) {
    throw Error(gettext('There already is a site with this name.'));
  }

  site.name = java.net.IDN.toASCII.constructor === Function ?
      java.net.IDN.toASCII(name, java.net.IDN.ALLOW_UNASSIGNED) : name;
  site.title = data.title || name;

  site.map({
    created: now,
    creator: user,
    modified: now,
    modifier: user,
    status: user.status === User.PRIVILEGED ? Site.TRUSTED : user.status,
    mode: Site.CLOSED,
    commentMode: Site.ENABLED,
    archiveMode: Site.PUBLIC
  });

  site.update(site);
  Layout.add(site);
  root.add(site);
  return site;
}

/**
 *
 * @param {Site} site
 */
Site.remove = function() {
  if (this.constructor === Site || this === root) {
    HopObject.remove.call(this.stories);
    HopObject.remove.call(this.images);
    HopObject.remove.call(this.files);
    HopObject.remove.call(this.polls);
    HopObject.remove.call(this.entries);
    HopObject.remove.call(this.members, {force: true});
    // The root site needs some special treatment (it will not be removed)
    if (this === root) {
      Membership.add(root.users.get(0), Membership.OWNER, this);
      Layout.remove.call(this.layout);
      this.layout.reset();
      this.getStaticFile('images').removeDirectory();
      this.getStaticFile('files').removeDirectory();
    } else {
      Layout.remove.call(this.layout, {force: true});
      this.getStaticFile().removeDirectory();
      this.deleteMetadata();
      this.remove();
    }
  }
  return;
}

/**
 *
 * @param {String} name
 * @returns {Site}
 */
Site.getByName = function(name) {
  return root.get(name);
}

/**
 *
 * @param {String} mode
 * @returns {Boolean}
 */
Site.require = function(mode) {
  var modes = [Site.CLOSED, Site.RESTRICTED, Site.PUBLIC, Site.OPEN];
  return modes.indexOf(res.handlers.site.mode) >= modes.indexOf(mode);
}

/**
 * A Site object is the basic container of Antville.
 * @name Site
 * @constructor
 * @property {Tag[]} $tags
 * @property {Archive} archive
 * @property {String} archiveMode The way the archive of a site is displayed
 * @property {String} commentMode The way comments of a site are displayed
 * @property {Date} created The date and time of site creation
 * @property {User} creator A reference to a user who created a site
 * @property {Date} deleted
 * @property {String} export_id
 * @property {Files} files
 * @property {Tags} galleries
 * @property {Images} images
 * @property {String} import_id
 * @property {String} job
 * @property {Layout} layout
 * @property {String} locale The place and language settings of a site
 * @property {Members} members
 * @property {Metadata} metadata
 * @property {String} mode The access level of a site
 * @property {Date} modified The date and time when a site was last modified
 * @property {User} modifier A reference to a user who modified a site
 * @property {String} notificationMode The way notifications are sent from a site
 * @property {Date} notified The date and time of the last notification sent to
 * the owners of a site
 * @property {String} pageMode The way stories of a site are displayed
 * @property {Number} pageSize The amount of stories to be displayed simultaneously
 * @property {Polls} polls
 * @property {String} status The trust level of a site
 * @property {Stories} stories
 * @property {String} tagline An arbitrary text describing a site
 * @property {Tags} tags
 * @property {String} timeZone The time and date settings of a site
 * @extends HopObject
 */
Site.prototype.constructor = function() {
  HopObject.confirmConstructor(this);
  return this;
}

/**
 *
 * @param {String} action
 * @returns {Boolean}
 */
Site.prototype.getPermission = function(action) {
  switch (action) {
    case 'backup.js':
    case 'main.js':
    case 'main.css':
    case 'error':
    case 'notfound':
    case 'robots.txt':
    case 'search.xml':
    case 'user.js':
    return true;

    case '.':
    case 'main':
    case 'comments.xml':
    case 'rss.xml':
    case 'rss.xsl':
    case 'search':
    case 'stories.xml':
    return Site.require(Site.PUBLIC) ||
        (Site.require(Site.RESTRICTED) &&
        Membership.require(Membership.CONTRIBUTOR)) ||
        ((Site.require(Site.DELETED) || Site.require(Site.CLOSED)) &&
        Membership.require(Membership.OWNER)) ||
        User.require(User.PRIVILEGED);

    case 'edit':
    case 'export':
    case 'referrers':
    return Membership.require(Membership.OWNER) ||
        User.require(User.PRIVILEGED);

    case 'subscribe':
    return Site.require(Site.PUBLIC) &&
        User.require(User.REGULAR) &&
        !Membership.require(Membership.SUBSCRIBER);

    case 'unsubscribe':
    if (User.require(User.REGULAR)) {
      var membership = Membership.getByName(session.user.name, this);
      return membership && !membership.require(Membership.OWNER);
    }

    case 'import':
    return User.require(User.PRIVILEGED);
  }

  return Feature.getPermission.apply(this, arguments);
}

Site.prototype.main_action = function() {
  res.data.body = this.renderSkinAsString(this.mode === Site.DELETED ?
      '$Site#deleted' : 'Site#main');
  res.data.title = this.getTitle();
  this.renderSkin('Site#page');
  this.log();
  return;
}

Site.prototype.edit_action = function() {
  if (req.postParams.save) {
    try {
      this.update(req.postParams);
      res.message = gettext('The changes were saved successfully.');
      res.redirect(this.href(req.action));
    } catch (ex) {
      res.message = ex;
      app.log(ex);
    }
  }

  res.data.action = this.href(req.action);
  res.data.title = gettext('Site Preferences');
  res.data.body = this.renderSkinAsString('$Site#edit');
  this.renderSkin('Site#page');
  return;
}

/**
 *
 * @param {String} name
 * @returns {Object}
 */
Site.prototype.getFormOptions = function(name) {
  switch (name) {
    case 'archiveMode':
    return Site.getArchiveModes();
    case 'commentMode':
    return Site.getCommentModes();
    case 'locale':
    return getLocales(this.getLocale());
    case 'layout':
    return this.getLayouts();
    case 'mode':
    return Site.getModes();
    case 'notificationMode':
    return Site.getNotificationModes();
    case 'pageMode':
    return Site.getPageModes();
    case 'status':
    return Site.getStatus();
    case 'timeZone':
    return getTimeZones(this.getLocale());
    case 'callbackMode':
    return Site.getCallbackModes();
    default:
    return HopObject.prototype.getFormOptions.apply(this, arguments);
  }
}

/**
 *
 * @param {Object} data
 */
Site.prototype.update = function(data) {
  if (this.mode !== Site.DELETED && data.mode === Site.DELETED) {
    this.deleted = new Date;
  } else if (this.job && this.mode === Site.DELETED && data.mode !== Site.DELETED) {
    var job = new Admin.Job(this.job);
    job.remove();
    this.job = null;
  }

  this.map({
    title: stripTags(data.title) || this.name,
    tagline: data.tagline || '',
    mode: data.mode || Site.CLOSED,
    callbackUrl: data.callbackUrl || this.callbackUrl || '',
    callbackMode: data.callbackMode || Site.DISABLED,
    pageMode: data.pageMode || Site.DAYS,
    pageSize: parseInt(data.pageSize, 10) || 3,
    commentMode: data.commentMode || Site.DISABLED,
    archiveMode: data.archiveMode || Site.CLOSED,
    notificationMode: data.notificationMode || Site.NOBODY,
    timeZone: data.timeZone || root.getTimeZone().getID(),
    locale: data.locale || root.getLocale().toString(),
    spamfilter: data.spamfilter || ''
  });

  this.configured = new Date;
  this.modifier = session.user;
  this.clearCache();
  return;
}

Site.prototype.main_css_action = function() {
  res.contentType = 'text/css';
  res.dependsOn(String(Root.VERSION));
  res.dependsOn(this.layout.modified);
  HopObject.confirmConstructor(Skin);
  res.dependsOn((new Skin('Site', 'stylesheet')).getStaticFile().lastModified());
  res.digest();
  res.push();
  root.renderSkin('$Root#stylesheet');
  this.renderSkin('Site#stylesheet');
  var lessCss = res.pop();
  try {
    lessParser.parse(lessCss, function(error, tree) {
      if (error) {
        res.writeln('/** ');
        res.writeln(error.toSource())
        res.writeln('**/');
        res.writeln(lessCss);
        return;
      }
      res.writeln(tree.toCSS());
    });
  } catch (ex) {
    res.writeln('/** ');
    res.writeln(ex.toSource());
    res.writeln('**/');
    res.writeln(lessCss);
  }
  return;
}

Site.prototype.main_js_action = function() {
  res.contentType = 'text/javascript';
  res.dependsOn(String(Root.VERSION));
  res.digest();
  this.renderSkin('$Site#include', {href: root.getStaticUrl('bower_components/jquery/jquery.min.js')});
  this.renderSkin('$Site#include', {href: root.getStaticUrl('bower_components/jquery.cookie/jquery.cookie.js')});
  this.renderSkin('$Site#include', {href: root.getStaticUrl('antville.js?v=' + Root.VERSION)});
  this.renderSkin('$Site#include', {href: this.href('user.js')});
  return;
}

Site.prototype.user_js_action = function() {
  res.contentType = 'text/javascript';
  HopObject.confirmConstructor(Skin);
  res.dependsOn((new Skin('Site', 'javascript')).getStaticFile().lastModified());
  res.digest();
  this.renderSkin('Site#javascript');
  return;
}

Site.prototype.backup_js_action = function() {
  if (req.isPost()) {
    var data = session.data.backup = {};
    for (var key in req.postParams) {
      data[key] = req.postParams[key];
    }
  } else {
    res.contentType = 'text/javascript';
    res.write(JSON.stringify(session.data.backup || {}));
    session.data.backup = null;
  }
  return;
}

Site.prototype.rss_xml_action = function() {
  res.contentType = 'application/rss+xml';
  res.dependsOn(this.modified);
  res.digest();
  res.write(this.getXml(this.stories.union));
  return;
}

Site.prototype.stories_xml_action = function() {
  res.contentType = 'application/rss+xml';
  res.dependsOn(this.modified);
  res.digest();
  res.write(this.getXml(this.stories.recent));
  return;
}

Site.prototype.comments_xml_action = function() {
  res.contentType = 'application/rss+xml';
  res.dependsOn(this.modified);
  res.digest();
  res.write(this.getXml(this.stories.comments));
  return;
}

Site.prototype.search_xml_action = function() {
  res.contentType = 'application/opensearchdescription+xml';
  this.renderSkin('$Site#opensearchdescription');
  return;
}

/**
 *
 * @param {Story[]} collection
 */
Site.prototype.getXml = function(collection) {
  collection || (collection = this.stories.recent);
  var now = new Date;
  var feed = new rome.SyndFeedImpl();
  feed.setFeedType('rss_2.0');
  feed.setLink(this.href());
  feed.setTitle(this.title);
  feed.setDescription(this.tagline || String.EMPTY);
  feed.setLanguage(this.locale.replace('_', '-'));
  feed.setPublishedDate(now);

  /*
  var feedInfo = new rome.FeedInformationImpl();
  var feedModules = new java.util.ArrayList();
  feedModules.add(feedInfo);
  feed.setModules(feedModules);
  //feedInfo.setImage(new java.net.URL(this.getProperty('imageUrl')));
  feedInfo.setSubtitle(this.tagline);
  feedInfo.setSummary(this.description);
  feedInfo.setAuthor(this.creator.name);
  feedInfo.setOwnerName(this.creator.name);
  //feedInfo.setOwnerEmailAddress(this.getProperty('email'));
  */

  var entry, entryInfo, entryModules;
  var enclosure, enclosures, keywords;
  var entries = new java.util.ArrayList();
  var description;

  var list = collection.constructor === Array ?
      collection : collection.list(0, 25);
  for each (var item in list) {
    entry = new rome.SyndEntryImpl();
    entry.setTitle(item.title || formatDate(item.created, 'date'));
    entry.setLink(item.href());
    entry.setAuthor(item.creator.name);
    entry.setPublishedDate(item.created);
    if (item.text) {
      description = new rome.SyndContentImpl();
      //description.setType('text/plain');
      // FIXME: Work-around for org.jdom.IllegalDataException caused by some ASCII control characters
      description.setValue(item.renderSkinAsString('Story#rss').replace(/[\x00-\x1f^\x0a^\x0d]/g, function(c) {
        return '&#' + c.charCodeAt(0) + ';';
      }));
      entry.setDescription(description);
    }
    entries.add(entry);

    /*
    entryInfo = new rome.EntryInformationImpl();
    entryModules = new java.util.ArrayList();
    entryModules.add(entryInfo);
    entry.setModules(entryModules);

    enclosure = new rome.SyndEnclosureImpl();
    enclosure.setUrl(episode.getProperty('fileUrl'));
    enclosure.setType(episode.getProperty('contentType'));
    enclosure.setLength(episode.getProperty('filesize') || 0);
    enclosures = new java.util.ArrayList();
    enclosures.add(enclosure);
    entry.setEnclosures(enclosures);

    entryInfo.setAuthor(entry.getAuthor());
    entryInfo.setBlock(false);
    entryInfo.setDuration(new rome.Duration(episode.getProperty('length') || 0));
    entryInfo.setExplicit(false);
    entryInfo.setKeywords(episode.getProperty('keywords'));
    entryInfo.setSubtitle(episode.getProperty('subtitle'));
    entryInfo.setSummary(episode.getProperty('description'));
    */
  }
  feed.setEntries(entries);

  var output = new rome.SyndFeedOutput();
  //output.output(feed, res.servletResponse.writer); return;
  var xml = output.outputString(feed);
  // FIXME: Ugly hack for adding PubSubHubbub and rssCloud elements to XML
  xml = xml.replace('<rss', '<rss xmlns:atom="http://www.w3.org/2005/Atom"');
  xml = xml.replace('<channel>', '<channel>\n   <cloud domain="rpc.rsscloud.org" port="5337" path="/rsscloud/pleaseNotify" registerProcedure="" protocol="http-post" />');
  xml = xml.replace('<channel>', '<channel>\n   <atom:link rel="hub" href="' + getProperty("parss.hub") + '"/>');
  return xml; //injectXslDeclaration(xml);
}

Site.prototype.rss_xsl_action = function() {
  res.charset = 'UTF-8';
  res.contentType = 'text/xml';
  renderSkin('Global#xslStylesheet');
  return;
}

Site.prototype.referrers_action = function() {
  if (req.data.permanent && this.getPermission('edit'))  {
    var urls = req.data.permanent_array;
    res.push();
    res.write(this.getMetadata('spamfilter'));
    for (var i in urls) {
      res.write('\n');
      res.write(urls[i].replace(/\?/g, '\\\\?'));
    }
    this.setMetadata('spamfilter', res.pop());
    res.redirect(this.href(req.action));
    return;
  }
  res.data.action = this.href(req.action);
  res.data.title = gettext('Site Referrers');
  res.data.body = this.renderSkinAsString('$Site#referrers');
  this.renderSkin('Site#page');
  return;
}

Site.prototype.search_action = function() {
  var term = req.data.q && stripTags(decodeURIComponent(String(req.data.q)));
  if (!term) {
    res.message = gettext('Please enter a query in the search form.');
    res.data.body = this.renderSkinAsString('Site#search');
  } else {
    term = term.replace(/(?:\x22|\x27)/g, String.EMPTY); // Remove single and double ticks (aka false quotes)
    var sql = new Sql({quote: false});
    sql.retrieve(Sql.SEARCH, this._id, term, 50);
    res.push();
    var counter = 0;
    sql.traverse(function() {
      var content = Story.getById(this.id);
      if (!content.story || (content.story.status !== Story.CLOSED &&
          content.story.commentMode !== Story.CLOSED)) {
        content.renderSkin('Story#result');
        counter += 1;
      }
    });
    res.message = ngettext('Found {0} result.', 'Found {0} results.', counter);
    res.data.body = res.pop();
  }

  res.data.title = gettext('Search results');
  this.renderSkin('Site#page');
  return;
}

Site.prototype.subscribe_action = function() {
  try {
    Membership.add(session.user, Membership.SUBSCRIBER, this);
    res.message = gettext('Successfully subscribed to site {0}.',
        this.title);
  } catch (ex) {
    app.log(ex);
    res.message = ex.toString();
  }
  res.redirect(this.href());
  return;
}

Site.prototype.unsubscribe_action = function() {
  if (req.postParams.proceed) {
    try {
      Membership.remove.call(Membership.getByName(session.user.name));
      res.message = gettext('Successfully unsubscribed from site {0}.',
          this.title);
      res.redirect(User.getLocation() || this.href());
    } catch (ex) {
      app.log(ex)
      res.message = ex.toString();
    }
  }

  User.setLocation();
  res.data.title = gettext('Confirm Unsubscribe');
  res.data.body = this.renderSkinAsString('$HopObject#confirm', {
    text: gettext('You are about to unsubscribe from site {0}.', this.title)
  });
  this.renderSkin('Site#page');
  return;
}

Site.prototype.export_action = function() {
  var job = this.job && new Admin.Job(this.job);

  var data = req.postParams;
  if (data.submit === 'start') {
    try {
      if (!job) {
        this.job = Admin.queue(this, 'export');
        res.message = gettext('Site is scheduled for export.');
      } else {
        if (job.method !== 'export') {
          throw Error(gettext('There is already another job queued for this site: {0}',
              job.method));
        }
      }
    } catch (ex) {
      res.message = ex.toString();
      app.log(res.message);
    }
    res.redirect(this.href(req.action));
  } else if (data.submit === 'stop') {
    job && job.remove();
    this.job = null;
    res.redirect(this.href(req.action));
  }

  var param = {
    status: (job && job.method === 'export') ?
        gettext('A Blogger export file (.xml) will be created and available for download from here within 24 hours.') :
        null
  }
  res.handlers.file = File.getById(this.export_id) || {};
  res.data.body = this.renderSkinAsString('$Site#export', param);
  this.renderSkin('Site#page');
  return;
}

Site.prototype.import_action = function() {
  var job = this.job && new Admin.Job(this.job);
  var file = this.import_id && File.getById(this.import_id);

  var data = req.postParams;
  if (data.submit === 'start') {
    try {
      if (job) {
        if (job.method === 'import') {
          job.remove();
          this.job = null;
        } else if (job.method) {
          throw Error(gettext('There is already another job queued for this site: {0}',
              job.method));
        }
      }
      file && File.remove.call(file);
      data.file_origin = data.file.name;
      file = new File;
      file.site = this;
      file.update(data);
      this.files.add(file);
      file.creator = session.user;
      this.job = Admin.queue(this, 'import');
      this.import_id = file._id;
      res.message = gettext('Site is scheduled for import.');
      res.redirect(this.href(req.action));
    } catch (ex) {
      res.message = ex.toString();
      app.log(res.message);
    }
  } else if (data.submit === 'stop') {
    file && File.remove.call(file);
    job && job.remove();
    this.job = null;
    this.import_id = null;
    res.redirect(this.href(req.action));
  }

  res.handlers.file = File.getById(this.import_id) || {};
  res.data.body = this.renderSkinAsString('$Site#import');
  this.renderSkin('Site#page');
  return;
}

Site.prototype.robots_txt_action = function() {
  res.contentType = 'text/plain';
  this.renderSkin('Site#robots');
  return;
}

/**
 *
 * @param {String} name
 * @returns {HopObject}
 */
Site.prototype.getMacroHandler = function(name) {
  switch (name) {
    case 'archive':
    case 'files':
    case 'galleries':
    case 'images':
    case 'layout':
    case 'members':
    case 'polls':
    case 'stories':
    case 'tags':
    return this[name];
    default:
    return null;
  }
}

/**
 *
 */
Site.prototype.stories_macro = function() {
  if (this.stories.featured.size() < 1) {
    this.renderSkin('Site#welcome');
    if (session.user) {
      if (session.user === this.creator) {
        session.user.renderSkin('$User#welcome');
      }
      if (this === root && User.require(User.PRIVILEGED)) {
        this.admin.renderSkin('$Admin#welcome');
      }
    }
  } else {
    this.archive.renderSkin('Archive#main');
  }
  return;
}

/**
 *
 * @param {Object} param
 */
Site.prototype.calendar_macro = function(param) {
  if (this.archiveMode !== Site.PUBLIC) {
    return;
  }
  var calendar = new jala.Date.Calendar(this.archive);
  //calendar.setAccessNameFormat('yyyy/MM/dd');
  calendar.setHrefFormat('/yyyy/MM/dd/');
  calendar.setLocale(this.getLocale());
  calendar.setTimeZone(this.getTimeZone());
  calendar.render(this.archive.getDate());
  return;
}

/**
 *
 * @param {Object} param
 */
Site.prototype.age_macro = function(param) {
  res.write(Math.floor((new Date() - this.created) / Date.ONEDAY));
  return;
}

/**
 *
 * @param {Object} param
 * @param {String} name
 */
Site.prototype.static_macro = function(param, name, mode) {
  return this.getStaticUrl(name);
}

/**
 *
 */
Site.prototype.deleted_macro = function() {
  return new Date(this.deleted.getTime() + Date.ONEDAY *
      Admin.SITEREMOVALGRACEPERIOD);
}

/**
 *
 */
Site.prototype.referrers_macro = function() {
  var self = this;
  var sql = new Sql;
  sql.retrieve(Sql.REFERRERS, 'Site', this._id);
  sql.traverse(function() {
    if (this.requests && this.referrer) {
      this.text = encode(this.referrer.head(50));
      this.referrer = encode(this.referrer);
      self.renderSkin('$Site#referrer', this);
    }
  });
  return;
}

/**
 *
 */
Site.prototype.spamfilter_macro = function() {
  var str = this.getMetadata('spamfilter');
  if (!str) {
    return;
  }
  var items = str.replace(/\r/g, '').split('\n');
  for (var i in items) {
    res.write('"');
    res.write(items[i]);
    res.write('"');
    if (i < items.length-1) {
      res.write(',');
    }
  }
  return;
}

/**
 *
 */
Site.prototype.diskspace_macro = function() {
  var quota = this.getQuota();
  var usage = this.getDiskSpace(quota);
  res.write(usage > 0 ? formatNumber(usage, '#,###.#') : 0);
  res.write(' MB ' + (quota ? gettext('free') : gettext('used')));
  return;
}

/**
 * @returns {java.util.Locale}
 */
Site.prototype.getLocale = function() {
  var locale;
  if (locale = this.cache.locale) {
    return locale;
  } else if (this.locale) {
    var parts = this.locale.split('_');
    locale = new java.util.Locale(parts[0] || String.EMPTY,
        parts[1] || String.EMPTY, parts.splice(2).join('_'));
  } else {
    locale = java.util.Locale.getDefault();
  }
  return this.cache.locale = locale;
}

/**
 * @returns {java.util.TimeZone}
 */
Site.prototype.getTimeZone = function() {
  var timeZone;
  if (timeZone = this.cache.timeZone) {
    return timeZone;
  }
  if (this.timeZone) {
     timeZone = java.util.TimeZone.getTimeZone(this.timeZone);
  } else {
     timeZone = java.util.TimeZone.getDefault();
  }
  this.cache.timezone = timeZone;
  return timeZone;
}

/**
 * @returns {Number}
 */
Site.prototype.getQuota = function() {
  return this.status !== Site.TRUSTED ? root.quota : null;
}

/**
 * @param {Number} quota
 * @returns {float}
 */
Site.prototype.getDiskSpace = function(quota) {
  quota || (quota = this.getQuota());
  var dir = new java.io.File(this.getStaticFile());
  var size = Packages.org.apache.commons.io.FileUtils.sizeOfDirectory(dir);
  var factor = 1024 * 1024; // MB
  return (quota ? quota * factor - size : size) / factor;
}

/**
 *
 * @param {String} href
 */
Site.prototype.processHref = function(href) {
  var parts, domain,
      scheme = (req.servletRequest ? req.servletRequest.scheme : 'http') + '://';
  if (domain = getProperty('domain.' + this.name)) {
    parts = [scheme, domain, href];
  } else if (domain = getProperty('domain.*')) {
    parts = [scheme, this.name, '.', domain, href];
  } else {
    var mountpoint = app.appsProperties.mountpoint;
    (mountpoint === '/') && (mountpoint = ''); // Prevents double slashes
    parts = [scheme, req.data.http_host, mountpoint, href];
  }
  return parts.join('');
}

/**
 *
 * @param {String} type
 * @param {String} group
 * @returns {Tag[]}
 */
Site.prototype.getTags = function(type, group) {
  var handler;
  type = type.toLowerCase();
  switch (type) {
    case 'story':
    case 'tags':
    handler = this.stories;
    type = 'tags';
    break;
    case 'image':
    case 'galleries':
    handler = this.images;
    type = 'galleries';
    break;
  }
  switch (group) {
    case Tags.ALL:
    return handler[type];
    case Tags.OTHER:
    case Tags.ALPHABETICAL:
    return handler[group + type.titleize()];
    default:
    return handler['alphabetical' + type.titleize()].get(group);
  }
  return null;
}

/**
 *
 * @param {String} tail
 * @returns {helma.File}
 */
Site.prototype.getStaticFile = function(tail) {
  var fpath = this.name;
  tail && (fpath += '/' + tail);
  return new helma.File(app.appsProperties['static'], fpath);
}

/**
 *
 * @param {String} tail
 * @returns {String}
 */
Site.prototype.getStaticUrl = function(href) {
  href || (href = '');
  var scheme = (req.servletRequest ? req.servletRequest.scheme : 'http') + '://';
  var host = getProperty('domain.' + this.name);
  host || (host = getProperty('domain.*'));
  host || (host = req.data.http_host);
  return [scheme, host, app.appsProperties.staticMountpoint, '/', this.name, '/', href].join('');
}

/**
 *
 * @param {Object} ref
 */
Site.prototype.callback = function(ref) {
   if (this.callbackMode === Site.ENABLED && this.callbackUrl) {
    app.data.callbacks.push({
      site: this._id,
      handler: ref.constructor,
      id: ref._id
    });
  }
  return;
}

/**
 *
 * @param {String} name
 * @returns {String[]}
 */
Site.prototype.getAdminHeader = function(name) {
  switch (name) {
    case 'tags':
    case 'galleries':
    return ['#', 'Name', 'Items'];
  }
  return [];
}
