import { writable } from 'svelte/store';
import { get } from "svelte/store";
import defaultimage from './defaultimage.js'

import sha256 from 'crypto-js/sha256';
import { group_outros } from 'svelte/internal';

export const msgs = writable([]) //MSGS FORMAT WILL BE time_sent, chat_id, msg_type, users_read_timestamp, text_content, attachments, msg_id
export const groups = writable([])
export const token = writable("")
export const current_group = writable(0)
export const id = writable("")
export const users = writable({})
export const global_styling_font_family = writable('font-family: "Work Sans", sans-serif;font-optical-sizing: auto;font-weight: <weight>;font-style: normal;')
export const colors_family = ({
    primary_color_class : "#6200EE",
    secondary_color_class : "#03DAC6",
    success_color_class : "#00FF00",
    info_color_class : "", 
})


export const addMessage = function(newMsgObj) {
    msgs.update((oldArr) => {[...oldArr, newMsgObj]})
}

function changeLatestMsg(group_id, msg_object){
    console.log(get(groups))
    var temp_groups = get(groups)
    for (var i = 0; i < temp_groups.length; i++){
        if (temp_groups[i].id == group_id){
            temp_groups[i].latest_msg = msg_object
        }
    }
    groups.set(temp_groups)
    sortGroups()
}

export const sortGroups = function sortGroups(){
    groups.set(get(groups).toSorted((a, b) => {
        if (a.latest_msg == undefined){
            if (b.latest_msg == undefined)
                return 0
            return 1
        }
        if (b.latest_msg == undefined)
            return -1
        if (parseInt(a.latest_msg.timesent) > parseInt(b.latest_msg.timesent))
            return 1
        if (parseInt(a.latest_msg.timesent) < parseInt(b.latest_msg.timesent))
            return -1
        console.log(a)
        console.log(b)
        return 0
    }))
}

export async function markAllMsgsRead(){
    console.log("marking msg read")
    let all_msgs = get(msgs)
    all_msgs.forEach((msg) => {
        //console.log(msg)
        //console.log(get(id))
        if (msg.read_receipts[get(id)] == 0){
            console.log(msg)
            read_receipt(msg["msgid"], get(current_group))
        }
    })
}

export const sortMsgs = function sortMsgs(){
    msgs.set(get(msgs).toSorted((a, b) => {
        if (parseInt(a.timesent) > parseInt(b.timesent))
            return 1
        if (parseInt(a.timesent) < parseInt(b.timesent))
            return -1
        return 0
    }))
}

export const addUser = function addUser(uid){
    if (get(users)[uid] != undefined){
        return
    }
    var msgDict = {"type" : "GETUSERDATA", "WANTEDID" : uid, "token" : get(token)}
    window.api.promiseMsg(JSON.stringify(msgDict)).then((resp) => {
        resp = JSON.parse(resp)
        if (resp["success"] == "0"){
            console.log("Failed to retrieve user data.")
            return
        }
        console.log(resp)
        _addUser(uid ,resp["user"])
    })
    _addUser(uid, {"Name" : "N/A", "Last-Seen" : "N/A", "PFP" : defaultimage})
}

export const _addUser = function _addUser(uid, userDict){
    var tempDict = get(users)
    tempDict[uid] = userDict
    tempDict[uid]["id"] = uid
    users.set(tempDict)
}

export const addUsersOfGroup = function (usersArr){
    for (let i=0;i<usersArr.length;i++){
        addUser(usersArr[i])
    }
}

export async function clear_msgs(){
    msgs.set([])
}

export async function fetch_msgs(group_id, lower_bound = null, upper_bound = null){
    console.log(`upper bound is ${upper_bound} and lower bound is ${lower_bound}`)
    let message_not_encoded = {"type" : "fetch", "fetch-args" : {"type" : "msgs", "lower_bound" : lower_bound? lower_bound.toString() : "0", "upper_bound" : upper_bound ? upper_bound.toString() : "0", "token" : get(token), "target_group" : group_id}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    let result_decoded = JSON.parse(result)
    console.log(result_decoded)
    if (result_decoded.success == "0"){
        return {"status" : "error", "error_msg" : result_decoded["error-data"]}
    }
    let new_msgs = []
    let current_msgs = get(msgs)
    let is_exist = false
    for (let i = 0; i < current_msgs.length; i++){
        is_exist = false
        for (let k = 0; k < new_msgs.length; k++){
            if (new_msgs[k].msgid == current_msgs[i].msgid){
                is_exist = true
            }
        }
        if (!is_exist)
            new_msgs.push(current_msgs[i])
    }
    current_msgs = result_decoded["fetch-data"]
    for (let i = 0; i < current_msgs.length; i++){
        is_exist = false
        for (let k = 0; k < new_msgs.length; k++){
            if (new_msgs[k].msgid == current_msgs[i].msgid){
                is_exist = true
            }
        }
        if (!is_exist)
            new_msgs.push(current_msgs[i])
    }
    msgs.set(new_msgs)
    sortMsgs()
    markAllMsgsRead()
    return {"status" : "success"}
}

export async function get_user_data(user_id){
    let message_not_encoded = {"type" : "fetch", "fetch-args" : {"type" : "user", "target_id" : user_id}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    let result_decoded = JSON.parse(result)
    if (result_decoded.success == "0")
        return
    _addUser(user_id, {"Name" : result_decoded["fetch-data"].username, "Last-Seen" : result_decoded["fetch-data"]["Last-Seen"], "PFP" : result_decoded["fetch-data"].picture})
    console.log(result_decoded)
}

export async function fetch_groups(){
    let message_not_encoded = {"type" : "fetch", "fetch-args" : {"type" : "groups", "token" : get(token)}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    let result_decoded = JSON.parse(result)
    if (result_decoded.success == "0"){
        window.api.notify("failed to fetch groups: "+result_decoded["error-data"])
        return
    }
    console.log("result of fetch groups:")
    console.log(result_decoded)
    groups.set(result_decoded["fetch-data"])
    console.log(get(groups))
    sortGroups()
    get(groups).forEach((group, index) => {
        group.members.forEach((member_id) => {
            get_user_data(member_id)
        })
    })
}

export async function try_login(email, password){
    let message_not_encoded = {"type" : "login" , "login-args" : {"email" : email, "password" : password}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    let result_decoded = JSON.parse(result)
    if (result_decoded.success == "0"){
        return {"status" : "error", "error_msg" : result_decoded["error-data"]}
    }
    console.log(result_decoded["fetch-data"])
    if (typeof result_decoded["fetch-data"].token !== 'string')
        return {"status" : "interim", "interim_data" : result_decoded["fetch-data"].token}
    token.set(result_decoded["fetch-data"].token)
    id.set(result_decoded["fetch-data"].id)
    return {"status" : "success"}
}

export async function try_register(email, username, password, image=null){
    let message_not_encoded = {"type" : "create", "create-args" : {"type" : "user", "email" : email, "username" : username, "password" : password, "picture" : image}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    let result_decoded = JSON.parse(result)
    console.log(result_decoded)
    if (result_decoded.success == "0"){
        return {"status" : "error", "error_msg" : result_decoded["error-data"]}
    }
    else {
        if (result_decoded["create-data"].need == undefined)
            return {"status" : "success"}
        console.log(result_decoded)
        return {"status" : "needmore", "need" : result_decoded["create-data"].need, "need_data" : result_decoded["create-data"]}
    }
}

export async function try_verify_login(id_param, verification_code, tok){
    let message_not_encoded = {"type" : "login", "login-args" : {"2fa-token" : tok, "2fa-code" : verification_code, "id" : id_param}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    let result_decoded = JSON.parse(result)
    if (result_decoded.success == "0")
        return {"status" : "error", "error_msg" : result_decoded["error-data"]}
    token.set(result_decoded["fetch-data"].token)
    id.set(result_decoded["fetch-data"].id)
    console.log(result)
    return {"status" : "success"}
}

export async function try_verify_registery(id, verification_code, tok){
    let message_not_encoded = {"type" : "update", "update-args" : {"type" : "user-2fa", "id" : id, "2fa-code" : verification_code, "2fa-token" : tok}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    let result_decoded = JSON.parse(result)
    console.log(result_decoded)
    if (result_decoded.success == "1")
        return {"status" : "success"}
    return {"status" : "failure"}
}

export function get_resp(msg_string){
    return JSON.parse(msg_string)
}

export async function send_message(text_content, group_id, attachments){
    let message_not_encoded = {"type" : "create", "create-args" : {"type" : "msg" , "msg_content" : text_content, "token" : get(token), "group_id" : group_id, "attachments" : attachments, "msg_type" : "text", "time_sent" :  Date.now()}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    let result_decoded = JSON.parse(result)
    if (result_decoded.success == "0"){
        console.log(result_decoded["error-data"])
        return {"status" : "error", "error_msg" : result_decoded["error-data"]}
    }
    console.log("new msg")
    console.log(result_decoded)
    return {"status" : "success"}
}

export async function server_update(event, data){
    if (data["type"] != "server-update"){
        return
    }
    if (data["update-data"] == undefined)
        return
    if (data["update-data"]["type"] == undefined)
        return
    console.log(data)
    switch (data["update-data"]["type"]){
        case "new-msg":
            if (data["update-data"]["msg-data"] == undefined)
                return
            data["update-data"]["msg-data"].forEach((msg, _) => {
                changeLatestMsg(data["update-data"]["group_id"], msg)
                if ( data["update-data"]["group_id"] != get(current_group))
                    return
                msgs.set([...get(msgs), msg])
                console.log(get(msgs))
            })
            sortMsgs();
            markAllMsgsRead();
            break;
        case "new-group":
            groups.set([...get(groups) ,data["update-data"]["group-data"]])
            data["update-data"]["group-data"].members.forEach((uid, _) => {
                if (get(users)[uid] != undefined)
                    return
                get_user_data(uid)
            })
            sortGroups()
            break;
        case "msg-read_receipt":
            let read_receipt_data = data["update-data"]
            if (read_receipt_data["group_id"] != get(current_group))
                return
            let temp_msgs = get(msgs)
            temp_msgs.forEach((msg) => {
                if (msg.msgid == read_receipt_data.msg_id){
                    msg.read_receipts[read_receipt_data.user_read] = read_receipt_data.time_read
                }
            })
            msgs.set(temp_msgs)
            break;
        case "msg-delete":
            let delete_data = data["update-data"]
            if (delete_data["group_id"] != get(current_group))
                return
            let temp_msgs_delete = get(msgs)
            temp_msgs_delete.forEach((msg, index) => {
                if (msg.msgid == delete_data.msg_id){
                    temp_msgs_delete[index].type= "deleted"
                    temp_msgs_delete[index]["textcontent"] = "This message was deleted"
                    temp_msgs_delete[index]["attachments"] = []
                }
            })
            msgs.set(temp_msgs_delete)
            break;
        case "msg-edit":
            let update_data = data["update-data"]
            if (update_data["group_id"] != get(current_group))
                return
            let temp_msgs_update = get(msgs)
            temp_msgs_update.forEach((msg, index) => {
                if (msg.msgid == update_data.msg_id){
                    temp_msgs_update[index].textcontent = update_data.new_text
                    temp_msgs_update[index].lastedited = update_data.edit_time
                }
            })
            msgs.set(temp_msgs_update)
            break;
        case "user-added":
            groups.set([...get(groups).filter(group => group.id != data["update-data"]["group_id"]) ,data["update-data"]["group-data"]])
            data["update-data"]["group-data"].members.forEach((uid, _) => {
                if (get(users)[uid] != undefined)
                    return
                get_user_data(uid)
            })
            sortGroups()
            break;
        default:
            console.log(data)

    }
}


export async function get_users_on(){
    let message_not_encoded = {"type" : "fetch", "fetch-args" : {"type" : "users"}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    console.log(result)
    let result_decoded = JSON.parse(result)
    console.log(result_decoded)
    if (result_decoded.success == "1")
    {
        delete result_decoded["fetch-data"][get(id)]
        console.log(Object.entries(result_decoded["fetch-data"]))
        return { "status" : "success", "success_data" : result_decoded["fetch-data"]}
    }
    return {"status" : "error", "error_msg" : "failure in db"}
}

export async function get_all_users(em_filter){
    let message_not_encoded = {"type" : "fetch", "fetch-args" : {"type" : "users_filtered_email", "email_filter" : em_filter? em_filter : ""}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    let result_decoded = JSON.parse(result)
    console.log(result_decoded)
    if (result_decoded.success == "1")
        return {"status" : "success", "success_data" : result_decoded["fetch-data"]}
    return {"status" : "failure"}
}

export async function create_personal_chat(other_id){
    let message_not_encoded = {"type" : "create", "create-args" : {"type" : "group", "token" : get(token), "group_type" : "2", "other_id" : other_id}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    let result_decoded = JSON.parse(result)
    console.log(result_decoded)
    if (result_decoded.success == "1")
        return {"status" : "success", "success_data" : result_decoded["create-data"]}
    return {"status" : "failure"}
}

export async function create_group(group_name, group_members, group_image = ""){
    let message_not_encoded = {"type" : "create", "create-args" : {"type" : "group" , "token" : get(token), "group_type" : "1", "group_participants": group_members, "group_name" : group_name, "group_picture" : group_image}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    let result_decoded = JSON.parse(result)
    console.log(result_decoded)
    if (result_decoded.success == "1")
        return {"status" : "success"}
    return {"status" : "error", "error_msg" : result_decoded["error-data"]}
}

async function read_receipt(message_id, group_id){
    let message_not_encoded = {"type" : "update", "update-args" : { "type" : "msg-read_receipt", "msg_id" : message_id, "group_id" : group_id, "token" : get(token), "time_read" : Date.now()}}
    console.log(message_not_encoded)
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    let result_decoded = JSON.parse(result)
    console.log(result_decoded)

}

export async function send_file(file_object){
    var fr = new FileReader();
    //fr.addEventListener('load', async (event) => {
      //  const res = event.target.result.replace(/^data:.+;base64,/, '');
        //let message_not_encoded = {"type" : "create", "create-args" : {"type" : "file", "file_hash" : sha256(res).toString(), "file_b64" : res}}
        //let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
        //console.log(result)
    //})
    //TODO: SEPERATE THE FILE SENDING INTO CHUNKS. ALSO TEST OFFLOADING THE HASHING TO THE SERVER
    var newProm = new Promise((resolve, reject) => {
        fr.onload = async (event) => {
            console.log("file finished reading")
            const res = event.target.result.replace(/^data:.+;base64,/, '');
            let message_not_encoded = {"type" : "create", "create-args" : {"type" : "file","file_b64" : res}}
            let result = JSON.parse(await window.api.promiseMsg(JSON.stringify(message_not_encoded)))
            console.log("file finished sending")
            console.log(result)
            if (result.success == "1"){
                console.log("success")
                resolve({"status" : "success", "success_data" : {"file_hash" : result["create-data"]}})
            }
            else{
                resolve({"status" : "error"})
            }
            
        }
    })
    fr.readAsDataURL(file_object)
    console.log("started reading file")

    return newProm
}

export async function download_file(file_hash, file_name){
    let message_not_encoded = {"type" : "fetch", "fetch-args" : {"type" : "file", "file_hash" : file_hash}}
    console.log("Starting to send")
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    console.log("recieved")
    let result_decoded = JSON.parse(result)
    console.log("parsed")
    if (result_decoded.success == "1"){
        //const blob = await (await fetch(result_decoded["fetch-data"]["file_data"])).blob();
        //var file = new Blob([result_decoded["fetch-data"]["file_data"]]);
        var a = document.createElement('a')
        //a.href = URL.createObjectURL(blob)
        console.log("a created")
        a.href = result_decoded["fetch-data"]["file_data"]
        console.log("a saved")
        a.download = file_name
        a.click()
        console.log("a clicked")
        return {"status" : "success"}
    }
}

export async function download_image(image_b64){
    var a =document.createElement('a')
    a.href = image_b64
    a.download = crypto.randomUUID()
    a.click()
}

export function get_group_by_id(group_id) {
    //console.log("target id is ")
    //console.log(group_id)
    for (let grp of get(groups)){
        if (grp.id == group_id){
            //console.log("found group smatch")
            //console.log(grp)
            return grp
        }
    }
}

export async function delete_msg(msg_id, group_id){
    let message_not_encoded = {"type" : "update", "update-args" : {"type" : "msg-delete", "msg_id" : msg_id, "token" : get(token), "group_id" : group_id}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    console.log(result)
}

export async function edit_msg(msg_id, group_id, new_msg_text){
    console.log(`new msg text is ${new_msg_text}`)
    let message_not_encoded = {"type" : "update", "update-args" : {"type" : "msg-edit", "msg_id" : msg_id, "token" : get(token), "group_id" : group_id, "new_msg_textcontent" : new_msg_text}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    console.log(result)
    return
}

export async function send_user_update(new_image, new_name){
    let message_not_encoded = {"type" : "update", "update-args" : {"type" : "user-info-public", "new_name" : new_name, "new_image_b64" : new_image, "token" : get(token)}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    console.log(result)
    return
    //TODO: IMPLEMENT THIS
}

export async function start_call(group_id){
    console.log("trying to start call")
    let message_not_encoded = {"type" : "create", "create-args" : {"type" : "voice-call","group_id" : group_id, "token" : get(token)}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    console.log("got message result")
    console.log(result)
    fetch_group(group_id)
    console.log("SHOULD RUN PYTHON VOIP RIGHT NOW!")
    let pure_data = JSON.parse(result)
    console.log(pure_data)
    if (pure_data["success"] == 1){
        var callid = pure_data["create-data"]
    }
    else {
        let groups_data = get(groups)
        for (let i = 0; i < groups_data.length; i++){
            if (groups_data[i].id == group_id){
                var callid = groups_data[i].activecall["call_id"]
            }
        }
    }
    console.log("callid is ")
    console.log(callid)
    console.log("SHOULD RUN PYTHON VOIP RIGHT NOW!")
    window.api.runPythonVoip(get(token), get(id), callid)

}

//TODO: ADD THE USER FILTERING
export async function fetch_group(group_id){
    let message_not_encoded = {"type" : "fetch", "fetch-args" : {"type" : "groups", "token" : get(token), "target_group" : group_id}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    let result_decoded = JSON.parse(result)
    if (result_decoded.success == "0"){
        window.api.notify("failed to fetch groups: "+result_decoded["error-data"])
        return
    }
    console.log("logging fetch groups result")
    console.log(result_decoded)
    let current_groups = get(groups)
    for (let i = 0; i < current_groups.length; i++){
        if (current_groups[i].id == group_id){
            current_groups[i] = result_decoded["fetch-data"][0]
            if (get(current_group) == group_id){
                current_groups[i]["selected"] = true
            }
        }
    }
    groups.set(current_groups)
    console.log(get(groups))
    sortGroups()
    get(groups).forEach((group, index) => {
        group.members.forEach((member_id) => {
            get_user_data(member_id)
        })
    })
}

export async function add_user_to_group(user_id, group_id){
    console.log("new user id is")
    console.log(user_id)
    console.log("will try to add user to group right now")
    let message_unencoded = {"type" : "update", "update-args" : {"type" : "user-add-group", "new_user_id" : user_id, "token" : get(token), "group_id" : group_id}}
    let answer_undecoded = await window.api.promiseMsg(JSON.stringify(message_unencoded))
    let answer_decoded = JSON.parse(answer_undecoded)
    console.log(answer_decoded)
    return
}