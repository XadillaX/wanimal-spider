/**
 * Created by XadillaX on 2014/6/18.
 */
var spidex = require("spidex");
var path = require("path");
var fs = require("fs");

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

    spidex.get(url, function(html, status) {
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
    }, "binary").on("error", function(err) {
        console.log("× 抓取图片 " + year + month + " [" + filename + "] 失败：" + err.message);

        // 重新push
        task.task.queue.push(task.task, get);

        task.task.queue.taskDone(task, true);
    });
}

exports.get = get;