/**
 * Created by XadillaX on 2014/6/18.
 */
var spidex = require("spidex");
var fs = require("fs");
var url = "http://imglf1.ph.126.net/KuujV5AfBGkckJGOt8VAuQ==/6608698201631550874.jpg";

spidex.get(url, function(html, status) {
    fs.writeFile("test.jpg", html, {
        encoding    : "binary"
    }, function(err) {
        console.log(err);
    })
}, "binary");
