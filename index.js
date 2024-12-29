const {menubar} = require("menubar");
const {getCpuInfo} = require("./util/CpuUtil.js");
const {readJsonFileSync} = require("./util/FileUtil");

const path = require("path");


const schedule = require('node-schedule');

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
        transparent: true,
        width: 350,
        height: 550,
    },
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
let starTeam = '76人'
let enableLive = false
mb.on("ready", () => {

    // 读取json
    logoJson = readJsonFileSync(path.join(__dirname, "resources", "logo.json"))


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


});

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
    mb.tray.setTitle(starInfo['guestTeamName'] + " " + starInfo['guestScore'] + "   " + starInfo['homeTeamName'] + " " + starInfo['homeScore'])
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

