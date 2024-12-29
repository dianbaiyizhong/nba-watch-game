const {resolve} = require("path");
const {readFileSync} = require("fs");
module.exports.readJsonFileSync = function (filePath) {
    try {
        // 确保路径是绝对路径
        const absolutePath = resolve(filePath);
        // 读取文件内容并解析为 JSON 对象
        const fileContent = readFileSync(absolutePath, 'utf8');
        return JSON.parse(fileContent);
    } catch (err) {
        console.error(`Error reading or parsing JSON file: ${err.message}`);
        throw err; // 或者返回 null 或默认值
    }
}