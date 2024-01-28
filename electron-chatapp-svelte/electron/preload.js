const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Invoke Methods

    sendSyncApi : (apiName, ...args) => ipcRenderer.sendSync(apiName, ...args),

    msgCB : (callback) => ipcRenderer.on('newMsg', (event, data) => { //this is an event handler for when node emits a newmsg event
      callback(event, data)
    }),

    customNewGroup : (callback) => ipcRenderer.on('newGroup', (event,data) => {
      callback(event, data)
    }),

    getPromiseCustom : (args) => ipcRenderer.sendSync('createPromise', args),

    sendNORESP: (msg) => {ipcRenderer.send('no-resp-channel', msg)},

    promiseMsg: (msg) => {return ipcRenderer.invoke('promiseMsg', msg)},

    serverUpdate: (callback) => ipcRenderer.on("server-update", (event, data) => callback(event,data)),

    SendFileInChunks: (filename) => {return ipcRenderer.invoke('sendFileChunks', filename)},

    notify: (msg) => {ipcRenderer.send('notify', msg)},

    getFullPath: ()=>{return ipcRenderer.invoke('getFilePath')},

    sendFilePath: (path) => {return ipcRenderer.invoke('sendFilePath', path)},

    downLoadFileName: (name) => {return ipcRenderer.invoke('downLoadFileName', name)}

    // Send Methods

  });