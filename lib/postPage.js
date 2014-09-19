/**
 * Created by XadillaX on 2014/6/18.
 */
var async = require("async");
var spidex = require("spidex");
var imgGetter = require("./imgGetter");

function parsePost(html, task) {
    var object = {};
    var regExp1 = /(\d+)-(\d+)-(\d+)<\/a> <span class="hotcount">/;
    var date = regExp1.exec(html);
    if(!date || date.length !== 4) {
        console.log("× 文章 [" + task.task.url + "] 日期获取失败.");
        object.year = 1970;
        object.month = 1;
        object.day = 1;
    } else {
        object.year = parseInt(date[1]);
        object.month = parseInt(date[2]);
        object.day = parseInt(date[3]);
    }

    object.list = [];

    // 获取图片内容区域
    var contentRegExp = /<div id="main">([\s\S]*)<div class="txt">/;
    var contentResult = contentRegExp.exec(html);
    if(!contentResult || contentResult.length !== 2) {
        console.log("× 文章 [" + task.task.url + "] 内容解析失败.");
        return object;
    }

    html = contentResult[1];
    var imgRegExp1 = /<img src="(.*?)"/g;
    var imgRegExp2 = /<img src="(.*?)"/;
    var imgResult = html.match(imgRegExp1);
    if(!imgResult || !imgResult.length) return object;

    for(var i = 0; i < imgResult.length; i++) {
        var temp = imgRegExp2.exec(imgResult[i]);
        if(temp.length !== 2) continue;
        object.list.push(temp[1]);
    }

    return object;
}

function get(task) {
    async.waterfall([
        function(callback) {
            spidex.get(task.task.url, function(html, status) {
                //console.log(status);
                if(status !== 200) {
                    callback(new Error("服务器返回错误的状态码。"));
                    return;
                }

                callback(null, html);
            }, "utf8").on("error", callback);
        },

        function(html, callback) {
            var object = parsePost(html, task);

            callback(null, object);
        }
    ], function(err, object) {
        if(err) {
            console.log("× 文章 [" + task.task.url + " ] 抓取错误：" + err.message);

            // 重新push
            task.task.queue.push(task.task, get);

            task.task.queue.taskDone(task, true);
            return;
        }

        console.log("√ 抓取了 [{year}-{month}-{day}] 的文章 {count} 张图片地址.".assign({
            year        : object.year,
            month       : object.month,
            day         : object.day,
            count       : object.list.length
        }));

        for(var i = 0; i < object.list.length; i++) {
            task.task.queue.push({
                year    : object.year,
                month   : object.month,
                url     : object.list[i],
                queue   : task.task.queue
            }, imgGetter.get);
        }

        task.task.queue.taskDone(task, true);
    });
}

exports.get = get;
