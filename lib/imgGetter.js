/**
 * Created by XadillaX on 2014/6/18.
 */
var spidex = require("spidex");
var path = require("path");
var fs = require("fs");
var URL = require("url");

var base = "fuli/";

function saveFile(year, month, filename, buf, callback) {
    // 先看看有没有year路径
    if(!fs.existsSync(base + year)) {
        fs.mkdirSync(base + year);
    }
    if(!fs.existsSync(base + year + "/" + month)) {
        fs.mkdirSync(base + year + "/" + month)
    }

    var fn = base + year + "/" + month + "/" + filename;

    fs.writeFile(fn, buf, { encoding: "binary" }, callback);
}

function get(task) {
    var year = task.task.year;
    var month = task.task.month;
    var url = task.task.url;
    var filename = path.basename(url);

    var host = URL.parse(url).hostname;
    spidex.get(url, {
        charset: "binary",
        header: {
            "accept": "image/webp,*/*;q=0.8",
            "accept-language": "zh-CN,zh;q=0.8,en-US;q=0.6,en;q=0.4,sv;q=0.2,zh-TW;q=0.2",
            "cache-control": "max-age=0",
            "connection": "keep-alive",
            "host": host,
            "referer": task.task.referer,
            "user-agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.115 Safari/537.36"
        }
    }, function(html, status) {
        if(status !== 200) {
            console.log("× 抓取图片 [" + filename + "] 失败：服务器返回错误状态码.");

            // 重新push
            task.task.queue.push(task.task, get);
            task.task.queue.taskDone(task);
            return;
        }

        // 如果文件存在就不写了
        if(fs.existsSync(base + year + "/" + month + "/" + filename)) {
            console.log("○ 图片 " + year + month + " [" + filename + "] 存在，不重复抓取。");
            task.task.queue.taskDone(task, true);
            return;
        }

        saveFile(year, month, filename, html, function(err) {
            if(err) {
                console.log("× 写入图片 " + year + month + " [" + filename + "] 失败：" + err.message);

                // 重新push
                task.task.queue.push(task.task, get);

                task.task.queue.taskDone(task, true);
                return;
            }

            console.log("√ 写入图片 " + year + month + " [" + filename + "] 成功.");
            task.task.queue.taskDone(task, true);
        });
    }).on("error", function(err) {
        console.log("× 抓取图片 " + year + month + " [" + filename + "] 失败：" + err.message);

        // 重新push
        task.task.queue.push(task.task, get);
        task.task.queue.taskDone(task, true);
    });
}

exports.get = get;