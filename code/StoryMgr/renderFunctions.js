/**
 * check if a story is online or offline
 * and render the listitem view accordingly
 * @param Object story object to render
 */
function renderManagerView(story) {
   var sp = {story: story.renderSkinAsString("listitem")};
   if (story.online == 0)
      return this.renderSkinAsString("offlinestory", sp);
   return this.renderSkinAsString("onlinestory", sp);
}