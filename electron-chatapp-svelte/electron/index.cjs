const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const {join} = require("path");
const path = require('path');
fs = require('fs');
const notifier = require('node-notifier');


let mainWindow;


const net = require('node:net'); 
const { WriteStream } = require('node:fs');

const HOST = "192.168.1.99"
const HOST_PORT = 8969


var client;
var win;
let currentlyReading = false
let sizeLeft;
let currentMsg;
let seqRecv;


global.listToCall = {0 : handleBrdcstMsgs}

global.fileDownLoadStreams = {}

//global.listToCall = {0: func(data){
  //handleBrdcstMsgs(data)
  //console.log(data.toString())
//}}

app.on("ready", () => {
  main()
});

function main() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    show:false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "./preload.js")
    }
  })

  mainWindow.loadFile(join(__dirname, "../public/index.html"))
  mainWindow.on("ready-to-show", mainWindow.show)
  mainWindow.webContents.openDevTools()

  startHandlers()

  client = new net.Socket();
  client.connect(HOST_PORT, HOST, function (){
    console.log("socket connected");
    //client.write("i am connected");
  })
  client.on('data', function(data) {
    recvDataFunc(data)
});
  client.on('error', (err)=>{
    console.log(err)
    process.exit(1)
  })
}

function startHandlers(){
  ipcMain.on('synchronous-message', (event, args) => {
    setTimeout(()=> {event.returnValue = "hey! this has returned!"}, 1000)
  })
  ipcMain.on("loginSync", (event, args) => {
    sendAndReserve(Buffer.from(SocketMsgBuilder.LoginMSG(args.username, args.password), 'utf8'), (data) => {console.log(data.toString()); event.returnValue = data.toString()})
  })

  ipcMain.on('usernameSync', (event, args)=>{
    sendAndReserve(Buffer.from(SocketMsgBuilder.tokenToUsernameMSG(args)), (data)=>{event.returnValue = data.toString()})
  })

  ipcMain.on('no-resp-channel', (_, msg) => {
    sendNORESP(msg)
  })

  ipcMain.handle('promiseMsg', async (_, msg) => {
    //console.log(`msg is ${msg}`)
    var resolver;
    var prom = new Promise((resolve, reject) => resolver=resolve)
    sendAndReserve(Buffer.from(msg), (data)=> resolver(data.toString()))
    return await prom
  })

  ipcMain.on('notify', (_, msg) => {
    //TODO: IMPLEMENT THE TITLE, AND MAKE THE ICON ACTUALLY THE CHAT APP'S ICON
    notifier.notify(msg)
  })

  ipcMain.handle('getFilePath', async (_,__) => {
    var resolver;
    var prom = new Promise((resolve, reject) => resolver=resolve)
    dialog.showOpenDialog({properties : ['openFile']}).then((resp)=>{
      if (!resp.canceled){
        resolver(resp.filePaths)
      }
      else{
        resolver('')
      }
    })
    /*
    dialog({type : 'open-file'}).then((path)=>{resolver(path)}).catch((err)=>{
      resolver('')
    })
    */
    return await prom
  })

  ipcMain.handle('sendFilePath', async (_, path) => {
    path = path[0]
    var resolver;
    var file_name;
    var prom = new Promise((resolve, _) => resolver=resolve)
    if (path.length == 0)
      resolver({"status" : "error", "error-data" : "empty path"})
    msg_undecoded = {"type" : "create", "create-args" : {"type" : "file", "file_b64" : ""}}
    sendAndReserve(Buffer.from(JSON.stringify(msg_undecoded)), (data) => {
      file_name = JSON.parse(data.toString())["create-data"] //TODO: IMPLEMENT SENDING AN EMPTY FILE B64 TO GET A FILE NAME, AND THEN IMEPLEMENT DOWNLOADING THE FILE IN CHUNKS
      const readStream = fs.createReadStream(path)
      readStream.on('data', chunk => {
        //console.log(chunk)
        //console.log("file chunk")
        msg_undecoded = {"type" : "create", "create-args" : {"type" : "file", "file_b64" : chunk.toString('base64'), "file_name" : (file_name == undefined) ? undefined : file_name}}
        sendAndReserve(Buffer.from(JSON.stringify(msg_undecoded)), (data)=>{
          if (file_name == undefined)
          {
            //console.log(data.toString())
            //console.log(JSON.parse(data.toString()))
            file_name = JSON.parse(data.toString())["create-data"]
          }
            
        }) 
      })
      readStream.on('end', ()=>{
        //console.log("finisehd sending")
        //console.log(file_name.split('/')[file_name.split('/').length - 1])
        //console.log('--------------------------\n------------------------\n---------------')
        resolver(file_name)
      })
    })
    return prom
  })

  ipcMain.handle('downLoadFileName', async (_, args)=> {
    let file_saving_name = args[0]
    let file_extension = file_saving_name.split('.')[file_saving_name.split('.').length - 1]
    let file_split = file_saving_name.split('.')
    file_split.pop()
    console.log(path.join(__dirname, `../${file_split.join('.')}`))
    let file_download_name = args[1]
    let msg_unencoded = {"type" : "fetch-chunks", "fetch-args" : {"type" : "file", "file_hash" : file_download_name}}
    let real_saving_name = dialog.showSaveDialog({title : "Select where to save file", filters:[
      {
        name : file_extension,
        extensions : [file_extension]
      }
    ] ,defaultPath : path.join(__dirname, `../${file_split.join('.')}`), buttonLabel: 'Save'}).then((file => {
      if (!file.canceled){
        console.log(file.filePath.toString())
        //console.log(file.filePath.toString())
        global.fileDownLoadStreams[file_download_name] = fs.createWriteStream(file.filePath.toString())
        sendNORESP(JSON.stringify(msg_unencoded))
      }
    }))
  })
}


function sendMsgSock(sock, msg, seq=0){
  //(`sending ${msg}`)
  if (typeof msg === 'string' || msg instanceof String) //msg is string - needs to be encoded
    msg = Buffer.from(msg, 'utf8')
  //console.log(msg)
  let buf = Buffer.allocUnsafe(4);
  buf.writeInt32BE(seq);
  //console.log("printing seq in binary")
  //console.log(buf)
  //console.log(buf.readInt32BE())
  msg = Buffer.concat([buf, msg])
  bufv2 = Buffer.allocUnsafe(4)
  bufv2.writeInt32BE(Buffer.byteLength(msg))
  msg = Buffer.concat([bufv2 ,msg])
  sock.write(msg)
}

function recvDataFunc(data) {
  if (currentlyReading == false){
    size = data.slice(0,4).readInt32BE()
    data = data.slice(4)
    seqRecv = data.slice(0,4).readInt32BE()
    //console.log(`size is ${size} and seq is ${seqRecv}`)
    if (Buffer.byteLength(data) == size) // message is exactly the size - full content + seq (=size) + 4 (because of size). just need to call func now
    {
      //console.log(global.listToCall)
      let functorun = global.listToCall[seqRecv]
      //console.log(functorun)
      //console.log(`should call now ${seqRecv}`)
      functorun(data.slice(4)) //pass to function everything after the 4 bytes of seq and size
      if (seqRecv != 0)
        delete global.listToCall[seqRecv]
      //if (seqRecv != 0)
        //global.listToCall = arrayRemoveSeq(global.listToCall, seqRecv) 
    }
    else if (Buffer.byteLength(data) < size) //data is shorter than the full msg
    {
      currentMsg = data.slice(4)
      sizeLeft = size - Buffer.byteLength(data)
      currentlyReading = true
    }
    else if (Buffer.byteLength(data) > size) //data is BIGGER tahn needed
    {
      let functorun = global.listToCall[seqRecv]
      //console.log(functorun)
      functorun(data.slice(4, size))
      if (seqRecv != 0)
        delete global.listToCall[seqRecv]
      //objectInArr = global.listToCall.find(obj => obj.seq === seqRecv)
      //objectInArr.func(data.slice(4, size))
      //if (seqRecv != 0)
        //global.listToCall = arrayRemoveSeq(global.listToCall, seqRecv)
      recvDataFunc(data.slice(size))
    }
  }
  else { //currently reading is true
    size = Buffer.byteLength(data)
    if (size == sizeLeft){ //exactly the full message left
      //objectInArr = global.listToCall.find(obj => obj.seq === seqRecv)
      //objectInArr.func(Buffer.concat([currentMsg, data]))
      let functocall = global.listToCall[seqRecv]
      functocall(Buffer.concat([currentMsg, data]))
      if (seqRecv != 0)
        delete global.listToCall[seqRecv]
      currentlyReading = false
    }
    else if (size < sizeLeft) //still isnt full message
    {
      currentMsg = Buffer.concat([currentMsg, data])
      sizeLeft = sizeLeft - size
    }
    else if (size > sizeLeft) //more than the full message
    {
      currentMsg = Buffer.concat([currentMsg, data.slice(0,sizeLeft)])
      //console.log(global.listToCall)
      let functocall = global.listToCall[seqRecv]
      functocall(currentMsg)
      if (seqRecv != 0)
        delete global.listToCall[seqRecv]
      //objectInArr = global.listToCall.find(obj => obj.seq === seqRecv)
      //objectInArr.func(currentMsg)
      //if (seqRecv != 0)
        //global.listToCall = arrayRemoveSeq(global.listToCall, seqRecv)
      currentlyReading = false
      recvDataFunc(data.slice(sizeLeft))
    }
  }
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}


function getSeq(){
  num = getRandomInt(10000)
  //console.log(`first num is ${num}`)
  //while (global.listToCall.some(obj => obj.seq == num )){
  while (global.listToCall.hasOwnProperty(num)){
    num = getRandomInt(10000)
  }
  //console.log(`num returned is ${num}`)
  return num
}



class SocketMsgBuilder {

  static LoginMSG(username, password) {
    return JSON.stringify({"type" : "login", "uname" : username, "pswd" : password})
  }

  static tokenToUsernameMSG(token){
    return JSON.stringify({"type" : "TOKENTOUNAME" , "token" : token})
  }

  static getGroups(token) {
    return JSON.stringify({"type" : "GETCHATS", "token" : token})
  }

  static newMsg(token, content, chatid){
    var currentTime = (new Date().toUTCString())
    return JSON.stringify({"type" : "NEWMSG", "token" : token, "chatid" : chatid, "senttime" : currentTime, "content" : content})
  }
}

function arrayRemoveSeq(arr, seqNum) { 
  
  return arr.filter(function (arrvar) { 
      return arrvar.seq != seqNum; 
  }); 

} 

function handleBrdcstMsgs(data) {
  data = data.toString()
  var msgDecoded = JSON.parse(data)
  //console.log(msgDecoded)
  //console.log(msgDecoded)
  if (msgDecoded["type"] == "server-update"){
    mainWindow.webContents.send('server-update', msgDecoded)
  }
  else if (msgDecoded["type"] == "fetch-chunks-server"){
    //console.log(msgDecoded)
    msgDecoded["chunks"].forEach((chunk, _)=>{
      if (chunk.type == "file"){
        if (chunk.is_end == true){
          global.fileDownLoadStreams[chunk.file_hash].end()
          delete global.fileDownLoadStreams[chunk.file_hash]
          return
        }
        //console.log(global.fileDownLoadStreams)
        //console.log(chunk["file_hash"])
        global.fileDownLoadStreams[chunk["file_hash"]].write(Buffer.from(chunk.file_data, 'base64'))
      }
    })
  }
}


function sendAndGetPromise(msg) {
  var seqNum = getSeq()
  var resolver;
  var prom = new Promise((resolve, reject) => {
    resolver=resolve
  })
  global.listToCall.push({seq: seqNum, func: function(data){
    resolver(data);
  }})
  sendMsgSock(client, msg, seqNum)
  return prom
}

function sendNORESP(msg){
  seqNum = 0
  sendMsgSock(client, msg, seqNum)
}


function sendAndReserve(msg, handler){
  seqNum = getSeq()
  //console.log(`seq is ${seqNum}`)
  global.listToCall[seqNum] = handler
  //global.listToCall.push({seq: seqNum, func: function(data){
    //handler(data);
  //}})
  //console.log(global.listToCall)
  sendMsgSock(client, msg, seqNum)
}

//TODO: ADD TRY EXCEPT TO READING FILE no need to
//TODO: PREVENT MAKING A GROUP WITH NO PARTICIPANTS done
//TODO: PUT THE IMAGE PLACEHOLDER AND GROUP TEXT IN THE SAME PLACE IN CREATING GROUP DIV done
//TODO: AND MAKE THE CREATING GROUP DIV BIGGER done
//TODO: CHANGE BUTTON TO CREATE ROOM (FROM CREATE) done
//TODO: CHANGE THE PLUS BUTTON TO https://thumbs.dreamstime.com/b/design-can-be-used-as-logo-icon-complement-to-group-chat-124906811.jpg
