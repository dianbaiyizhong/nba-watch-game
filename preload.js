const {contextBridge, ipcRenderer} = require('electron');

// 定义一个受限的 API，允许渲染进程调用主进程的方法
contextBridge.exposeInMainWorld('electronAPI', {
    // 发送消息到主进程
    send: (channel, data) => {
        ipcRenderer.send(channel, data);
    },
    // 接收来自主进程的消息
    receive: (channel, func) => {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
    // 同步调用（如果需要）
    invoke: async (channel, data) => {
        return await ipcRenderer.invoke(channel, data);
    }
});