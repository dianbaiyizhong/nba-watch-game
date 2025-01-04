const {menubar} = require("menubar");
const {readJsonFileSync} = require("./util/FileUtil");
const {app, BrowserWindow, ipcRenderer, ipcMain, contextBridge} = require('electron');
const path = require("path");

// const sqlite3 = require('sqlite3').verbose();
// const dbPath = path.join(__dirname, 'app.db');
// // 打开数据库连接
// const db = new sqlite3.Database(dbPath);


// 监听来自渲染进程的消息
ipcMain.on('confirmStarTeam', (event, arg) => {
    console.log('Received from renderer:', arg);


    // 发送响应给渲染进程
    event.reply('message-from-main', {message: 'Response from main process'});
});

ipcMain.on('exit', (event, arg) => {
    app.quit()
});


const axios = require('axios');

async function httpRequest(url) {
    try {
        // GET 请求
        return await axios.get(url);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}


const mb = menubar({
    browserWindow: {
        transparent: false,
        width: 350,
        height: 300,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true, // 推荐开启
            nodeIntegration: false // 推荐关闭
        }
    },
    index: "file://" + path.join(__dirname, 'web', 'dist', 'index.html'),
    icon: "./build/16x16.png",
    alwaysOnTop: true,
    showOnRightClick: true
});

let playTime = 30;
let gameTimer = null;
let currentIndex = 0;
let logoJson = null
const {JSDOM} = require('jsdom')

let gameInfo = []
let starTeam = '勇士'
let enableLive = false
mb.on("ready", () => {


    // // 创建表
    // db.run("CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY, name TEXT)");
    // // 插入数据
    // const stmt = db.prepare("INSERT INTO items (name) VALUES (?)");
    // stmt.run("Item 1");
    // stmt.finalize();
    // // 查询数据
    // db.each("SELECT id, name FROM items", (err, row) => {
    //     console.log(row.id + ": " + row.name);
    // });
    // 读取json
    logoJson = readJsonFileSync(path.join(__dirname, "resources", "logo.json"))


    startApp()


});


function startApp() {


    if (gameTimer != null) {
        clearInterval(gameTimer)
    }

    resetLogo()

    if (enableLive) {
        getNbaInfo()
        gameTimer = setInterval(getNbaInfo, 10000);
    } else {
        gameTimer = setInterval(function () {
            playLogo(logoJson[currentIndex])
            if (currentIndex >= 29) {
                currentIndex = 0
            } else {
                currentIndex = currentIndex + 1
            }
        }, 10000);
    }
}

function getNbaInfo() {
    console.info("start look game")
    httpRequest('https://nba.hupu.com/').then(resp => {

        const dom = new JSDOM(resp.data);
        const document = dom.window.document;
        const containers = document.getElementsByClassName('MainSchedule-list-item');
        // 清空
        gameInfo = []
        for (let i = 0; i < containers.length; i++) {
            let spans = containers[i].querySelectorAll('span')
            gameInfo.push({
                "guestTeamName": spans[0].textContent,
                "guestScore": spans[1].textContent,
                "homeTeamName": spans[5].textContent,
                "homeScore": spans[3].textContent,
            })
        }

        // 匹配关注球队
        let starInfo = gameInfo.find(item => item.guestTeamName === starTeam || item.homeTeamName === starTeam);

        playGame(starInfo)

    })
}

function resetLogo() {
    let file = path.join(__dirname, "images", "nba_logo.png");
    mb.tray.setImage(file)
}


let gameFlag = null

function playGame(starInfo) {

    if (!starInfo) {
        // 没有比赛

        return;
    }
    let homeTeam = logoJson.find(item => item['teamNameZh'] === starInfo.homeTeamName)
    let guestTeam = logoJson.find(item => item['teamNameZh'] === starInfo.guestTeamName)

    if (gameFlag == null) {
        gameFlag = starInfo
        playScore(starInfo)
        return;
    }
    if (gameFlag.homeScore < starInfo.homeScore) {
        playLogo(homeTeam)
        playScore(starInfo)
        gameFlag = starInfo
        return
    }
    if (gameFlag.guestScore < starInfo.guestScore) {
        gameFlag = starInfo
        playLogo(guestTeam)
        playScore(starInfo)
    }

}

function playScore(starInfo) {
    let guestShortName = logoJson.find(item => item['teamNameZh'] === starInfo['guestTeamName'])['shortName'];
    let homeShortName = logoJson.find(item => item['teamNameZh'] === starInfo['homeTeamName'])['shortName'];

    mb.tray.setTitle(guestShortName + " " + starInfo['guestScore'] + "   " + homeShortName + " " + starInfo['homeScore'])
}

function playLogo(teamInfo) {
    let finalI = teamInfo['espnAnimSize']
    for (let i = 1; i <= finalI; i++) {
        let file = path.join(__dirname, "nba", teamInfo['teamName'],
            teamInfo['teamName'] + "_" + `${i}`.padStart(3, "0") + ".png");
        setTimeout(() => mb.tray.setImage(file), playTime * (i));
    }
    setTimeout(() => resetLogo(), playTime * (finalI + 1));

}

