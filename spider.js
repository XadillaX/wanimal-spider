/**
 * Created by XadillaX on 2014/6/18.
 */
var Scarlet = require("scarlet-task");
var scarlet = new Scarlet(10);

var indexPage = require("./lib/indexPage");

var url = "http://wanimal.lofter.com/?page=1";
scarlet.push({
    url     : url,
    page    : 1,
    queue   : scarlet
}, indexPage.get);
