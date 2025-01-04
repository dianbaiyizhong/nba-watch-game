const {menubar} = require("menubar");
const {readJsonFileSync} = require("./util/FileUtil");
const {app, BrowserWindow, ipcRenderer, ipcMain, contextBridge, dialog} = require('electron');
const path = require("path");
const fs = require('fs');
const dbFileName = 'nba.db';
const asarDbPath = path.join(__dirname, dbFileName);
const userDataPath = app.getPath('userData');
const localDbPath = path.join(userDataPath, dbFileName);

const knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: localDbPath,
    },
})


// 监听来自渲染进程的消息
ipcMain.on('confirmStarTeam', async (event, arg) => {
    console.log('Received from renderer:', arg);
    await knex('config').insert({
        type: 'starTeam',
        val: arg
    }).onConflict('type').merge()
    starTeam = arg
    // 发送响应给渲染进程
    event.reply('message-from-main', {message: 'Response from main process'});

    await startApp()
});

ipcMain.on('enableLive', async (event, arg) => {
    await knex('config').insert({
        type: 'enableLive',
        val: arg
    }).onConflict('type').merge()
    enableLive = arg
    await startApp()

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
        preloadWindow: true,
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

mb.on("ready", async () => {


    // 初始化数据库
    await setupDatabase()


    logoJson = readJsonFileSync(path.join(__dirname, "resources", "logo.json"))
    await startApp()
})


async function setupDatabase() {


    console.info("localDbPath:", localDbPath)
    console.info("asarDbPath:", asarDbPath)


    if (!fs.existsSync(localDbPath)) {
        // 确保用户数据目录存在
        if (!fs.existsSync(userDataPath)) {
            fs.mkdirSync(userDataPath, {recursive: true});
        }
        // 复制数据库文件到用户数据目录
        const readStream = fs.createReadStream(asarDbPath);
        const writeStream = fs.createWriteStream(localDbPath);


        writeStream.on('error', (err) => console.error('Failed to write to user data:', err));
        writeStream.on('finish', () => {

        });
        readStream.pipe(writeStream);
    }

    await knex.schema.createTableIfNotExists('config', (table) => {
        table.increments('id');
        table.string('type');
        table.string('val');
    })
}


mb.on("after-create-window", async () => {
    logoJson = readJsonFileSync(path.join(__dirname, "resources", "logo.json"))
    const teamNamesZh = logoJson.map(team => team['teamNameZh'])


    mb.window.webContents.send("receiveFromElectron", {
        "type": "teamInfo",
        "message": teamNamesZh
    })


    const selectedRows = await knex('config').select('*')

    enableLive = selectedRows.find(item => item.type === 'enableLive').val === '1'
    starTeam = selectedRows.find(item => item.type === 'starTeam').val

    mb.window.webContents.send("receiveFromElectron", {
        "type": "enableLive",
        "message": enableLive
    })

    mb.window.webContents.send("receiveFromElectron", {
        "type": "starTeam",
        "message": starTeam
    })

});


async function startApp() {
    gameFlag = null
    mb.tray.setTitle("")

    const selectedRows = await knex('config').select('*')

    enableLive = selectedRows.find(item => item.type === 'enableLive').val === '1'
    starTeam = selectedRows.find(item => item.type === 'starTeam').val


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
    let file = path.join(__dirname, "images", "24x24.png");
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

