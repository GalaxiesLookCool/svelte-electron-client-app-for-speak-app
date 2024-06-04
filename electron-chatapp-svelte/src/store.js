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

const temporaryUserData = {"Email" : "user@org.org" ,"Name" : "User name", "Last-Seen" : "Never", "PFP" : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdjYGBg+A8AAQQBAHAgZQsAAAAASUVORK5CYII="}



export const addMessage = function(newMsgObj) {
    //UNUSED
    msgs.update((oldArr) => {[...oldArr, newMsgObj]})
}

function changeLatestMsg(group_id, msg_object){
    //function that given group_id : int, msg_object : Object, changes the last msg for a specific group in the store, and sorts them. returns nothing
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
    //function that sorts all the groups in the group store based on the timesent of their last message
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
        return 0
    }))
}

export async function markAllMsgsRead(){
    //function that loops through all msgs in the store, and sends a read_Receipt request for each one if the user hasnt already read it.
    let all_msgs = get(msgs)
    all_msgs.forEach((msg) => {
        if (msg.read_receipts[get(id)] == 0){
            read_receipt(msg["msgid"], get(current_group))
        }
    })
}

export const sortMsgs = function sortMsgs(){
    //function that sorts all the msgs in the msgs store/list by its time_sent
    msgs.set(get(msgs).toSorted((a, b) => {
        if (parseInt(a.timesent) > parseInt(b.timesent))
            return 1
        if (parseInt(a.timesent) < parseInt(b.timesent))
            return -1
        return 0
    }))
}

export const addUser = function addUser(uid){
    //UNUSED. REPLACED BY GET_USER_DATA
    if (get(users)[uid] != undefined){
        return
    }
    var msgDict = {"type" : "GETUSERDATA", "WANTEDID" : uid, "token" : get(token)}
    window.api.promiseMsg(JSON.stringify(msgDict)).then((resp) => {
        resp = JSON.parse(resp)
        if (resp["success"] == "0"){
            return
        }
        _addUser(uid ,resp["user"])
    })
    _addUser(uid, {"Name" : "N/A", "Last-Seen" : "N/A", "PFP" : defaultimage})
}

export const _addUser = function _addUser(uid, userDict){
    //sets in store all old users + new user. uid : int, userDict : dict
    var tempDict = get(users)
    tempDict[uid] = userDict
    tempDict[uid]["id"] = uid
    users.set(tempDict)
}

export const addUsersOfGroup = function (usersArr){
    //function that given an array of users (array of ints) for each one runs get_user_data. UNUSED
    for (let i=0;i<usersArr.length;i++){
        addUser(usersArr[i])
    }
}

export async function clear_msgs(){
    //function that clears all msgs in store
    msgs.set([])
}

export async function fetch_msgs(group_id, lower_bound = null, upper_bound = null){
    //function that sends a request to fetch msgs in a specific chat, and set it in store. group_id, lower_bound, upper_bound : int
    let message_not_encoded = {"type" : "fetch", "fetch-args" : {"type" : "msgs", "lower_bound" : lower_bound? lower_bound.toString() : "0", "upper_bound" : upper_bound ? upper_bound.toString() : "0", "token" : get(token), "target_group" : group_id}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    let result_decoded = JSON.parse(result)
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
    //function that sends request to get the data of a specific user (user_id : int), and sets it in the store using a helper function
    let message_not_encoded = {"type" : "fetch", "fetch-args" : {"type" : "user", "target_id" : user_id}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    let result_decoded = JSON.parse(result)
    if (result_decoded.success == "0")
        return
    _addUser(user_id, {"Email" : result_decoded["fetch-data"].email ,"Name" : result_decoded["fetch-data"].username, "Last-Seen" : result_decoded["fetch-data"]["Last-Seen"], "PFP" : result_decoded["fetch-data"].picture})
}

export async function fetch_groups(){
    //function that sends request to fetch all groups of user, sets it in store.
    let message_not_encoded = {"type" : "fetch", "fetch-args" : {"type" : "groups", "token" : get(token)}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    let result_decoded = JSON.parse(result)
    if (result_decoded.success == "0"){
        window.api.notify("failed to fetch groups: "+result_decoded["error-data"])
        return
    }
    sortGroups()
    result_decoded["fetch-data"].forEach((group, index) => {
        group.members.forEach((member_id) => {
            _addUser(member_id, temporaryUserData)
            get_user_data(member_id)
        })
    })
    groups.set(result_decoded["fetch-data"])
}

export async function try_login(email, password){
    //function that sends the login requests, potenetialliy sets token and id in store, and returns status dict. email,password : str
    let message_not_encoded = {"type" : "login" , "login-args" : {"email" : email, "password" : password}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    let result_decoded = JSON.parse(result)
    if (result_decoded.success == "0"){
        return {"status" : "error", "error_msg" : result_decoded["error-data"]}
    }
    if (typeof result_decoded["fetch-data"].token !== 'string')
        return {"status" : "interim", "interim_data" : result_decoded["fetch-data"].token}
    token.set(result_decoded["fetch-data"].token)
    id.set(result_decoded["fetch-data"].id)
    return {"status" : "success"}
}

export async function try_register(email, username, password, image=null){
    //function that tries to register with the email and username and password. returns status dict. email, password, username, image : str
    let message_not_encoded = {"type" : "create", "create-args" : {"type" : "user", "email" : email, "username" : username, "password" : password, "picture" : image}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    let result_decoded = JSON.parse(result)
    if (result_decoded.success == "0"){
        return {"status" : "error", "error_msg" : result_decoded["error-data"]}
    }
    else {
        if (result_decoded["create-data"].need == undefined)
            return {"status" : "success"}
        return {"status" : "needmore", "need" : result_decoded["create-data"].need, "need_data" : result_decoded["create-data"]}
    }
}

export async function try_verify_login(id_param, verification_code, tok){
    //function that tries to do 2fa log-in. returns status success, and sets token and id in the store. id_param : int, verification_Code : str, tok : str
    let message_not_encoded = {"type" : "login", "login-args" : {"2fa-token" : tok, "2fa-code" : verification_code, "id" : id_param}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    let result_decoded = JSON.parse(result)
    if (result_decoded.success == "0")
        return {"status" : "error", "error_msg" : result_decoded["error-data"]}
    token.set(result_decoded["fetch-data"].token)
    id.set(result_decoded["fetch-data"].id)
    return {"status" : "success"}
}

export async function try_verify_registery(id, verification_code, tok){
    //function that tries to verify email when registering. returns status success id : int, verification_code : str, tok : str
    let message_not_encoded = {"type" : "update", "update-args" : {"type" : "user-2fa", "id" : id, "2fa-code" : verification_code, "2fa-token" : tok}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    let result_decoded = JSON.parse(result)
    if (result_decoded.success == "1")
        return {"status" : "success"}
    return {"status" : "failure"}
}

export function get_resp(msg_string){
    //function that does JSON.parse. msg_string : str
    return JSON.parse(msg_string)
}

export async function send_message(text_content, group_id, attachments = []){
    //function that sends the new message request. returns status success. text_content : str. group_id : int. attachments : List
    let message_not_encoded = {"type" : "create", "create-args" : {"type" : "msg" , "msg_content" : text_content, "token" : get(token), "group_id" : group_id, "attachments" : attachments, "msg_type" : "text", "time_sent" :  Date.now()}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    let result_decoded = JSON.parse(result)
    if (result_decoded.success == "0"){
        return {"status" : "error", "error_msg" : result_decoded["error-data"]}
    }
    return {"status" : "success"}
}

export async function server_update(event, data){
    //function handles any update from the server (Seq 0). data : Dict
    if (data["type"] != "server-update"){
        return
    }
    if (data["update-data"] == undefined)
        return
    if (data["update-data"]["type"] == undefined)
        return
    switch (data["update-data"]["type"]){
        case "new-msg":
            if (data["update-data"]["msg-data"] == undefined)
                return
            data["update-data"]["msg-data"].forEach((msg, _) => {
                changeLatestMsg(data["update-data"]["group_id"], msg)
                if ( data["update-data"]["group_id"] != get(current_group))
                    {
                        //window.api.notify(`You have a new unread message!`)
                        return
                    }
                msgs.set([...get(msgs), msg])
            })
            sortMsgs();
            markAllMsgsRead();
            break;
        case "new-group":
            groups.set([...get(groups) ,data["update-data"]["group-data"]])
            data["update-data"]["group-data"].members.forEach((uid, _) => {
                if (get(users)[uid] != undefined)
                    return
                _addUser(uid, temporaryUserData)
                get_user_data(uid)
            })
            sortGroups()
            window
            window.api.notify("You were added to a new chat!")
            break;
        case "msg-read_receipt":
            let read_receipt_data = data["update-data"]
            if (read_receipt_data["group_id"] != get(current_group))
                return
            let temp_msgs = get(msgs)
            temp_msgs.forEach((msg, index) => {
                if (msg.msgid == read_receipt_data.msg_id){
                    temp_msgs[index].read_receipts[read_receipt_data.user_read] = read_receipt_data.time_read
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
                _addUser(uid, temporaryUserData)
                get_user_data(uid)
            })
            sortGroups()
            break;
        default:

    }
}


export async function get_users_on(){
    //sends request to get all users on. returns status dict
    let message_not_encoded = {"type" : "fetch", "fetch-args" : {"type" : "users"}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    let result_decoded = JSON.parse(result)
    if (result_decoded.success == "1")
    {
        delete result_decoded["fetch-data"][get(id)]
        return { "status" : "success", "success_data" : result_decoded["fetch-data"]}
    }
    return {"status" : "error", "error_msg" : "failure in db"}
}

export async function get_all_users(em_filter){
    //sends a request to get all users with the email filter. returns status/answer dict. em_filter : string
    let message_not_encoded = {"type" : "fetch", "fetch-args" : {"type" : "users_filtered_email", "email_filter" : em_filter? em_filter : ""}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    let result_decoded = JSON.parse(result)
    if (result_decoded.success == "1")
        return {"status" : "success", "success_data" : result_decoded["fetch-data"]}
    return {"status" : "failure"}
}

export async function create_personal_chat(other_id){
    //sends a request to create a personal chat. other_id : integer. returns status Dict
    let message_not_encoded = {"type" : "create", "create-args" : {"type" : "group", "token" : get(token), "group_type" : "2", "other_id" : other_id}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    let result_decoded = JSON.parse(result)
    if (result_decoded.success == "1")
        return {"status" : "success", "success_data" : result_decoded["create-data"]}
    return {"status" : "failure"}
}

export async function create_group(group_name, group_members, group_image = ""){
    //sends to the server a request to create a group. group_name : string, group_members : List, group_image : string. returns status Dict
    let message_not_encoded = {"type" : "create", "create-args" : {"type" : "group" , "token" : get(token), "group_type" : "1", "group_participants": group_members, "group_name" : group_name, "group_picture" : group_image}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    let result_decoded = JSON.parse(result)
    if (result_decoded.success == "1")
        return {"status" : "success"}
    return {"status" : "error", "error_msg" : result_decoded["error-data"]}
}

async function read_receipt(message_id, group_id){
    //sends a request to mark a message as read. message_id : integer, group_id : integer
    let message_not_encoded = {"type" : "update", "update-args" : { "type" : "msg-read_receipt", "msg_id" : message_id, "group_id" : group_id, "token" : get(token), "time_read" : Date.now()}}
    if (group_id == get(current_group))
    {
        let temp_msgs = get(msgs)
        temp_msgs = get(msgs)
        temp_msgs.forEach((msg, index) => {
            if (msg.msgid == message_id){
                temp_msgs[index].read_receipts[get(id)] = message_not_encoded["update-args"]["time_read"]
            }
        })
        msgs.set(temp_msgs)
    }
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    let result_decoded = JSON.parse(result)

}

export async function send_file(file_object){
    //UNUSED. VERY VERY SLOW
    var fr = new FileReader();
    var newProm = new Promise((resolve, reject) => {
        fr.onload = async (event) => {
            const res = event.target.result.replace(/^data:.+;base64,/, '');
            let message_not_encoded = {"type" : "create", "create-args" : {"type" : "file","file_b64" : res}}
            let result = JSON.parse(await window.api.promiseMsg(JSON.stringify(message_not_encoded)))
            if (result.success == "1"){
                resolve({"status" : "success", "success_data" : {"file_hash" : result["create-data"]}})
            }
            else{
                resolve({"status" : "error"})
            }
            
        }
    })
    fr.readAsDataURL(file_object)

    return newProm
}

export async function download_file(file_hash, file_name){
    //sends a request to download a file where its hash is file_hash, and the suggested name to save is file_name.
    let message_not_encoded = {"type" : "fetch", "fetch-args" : {"type" : "file", "file_hash" : file_hash}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    let result_decoded = JSON.parse(result)
    if (result_decoded.success == "1"){
        //const blob = await (await fetch(result_decoded["fetch-data"]["file_data"])).blob();
        //var file = new Blob([result_decoded["fetch-data"]["file_data"]]);
        var a = document.createElement('a')
        //a.href = URL.createObjectURL(blob)
        a.href = result_decoded["fetch-data"]["file_data"]
        a.download = file_name
        a.click()
        return {"status" : "success"}
    }
}

export async function download_image(image_b64){
    //downloads an image where its source is the image_b64 : string.
    var a =document.createElement('a')
    a.href = image_b64
    a.download = crypto.randomUUID()
    a.click()
}

export function get_group_by_id(group_id) {
    //
    // Returns the group object with the given group_id, or null if not found
    //
    
    for (let grp of get(groups)){
        if (grp.id == group_id){
            return grp
        }
    }
}

export async function delete_msg(msg_id, group_id){
    //sends the request to delete a msg. msg_id : integer, group_id : integer. returns nothing
    let message_not_encoded = {"type" : "update", "update-args" : {"type" : "msg-delete", "msg_id" : msg_id, "token" : get(token), "group_id" : group_id}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
}

export async function edit_msg(msg_id, group_id, new_msg_text){
    //sends the edit message request. expects msg_id : integer, group_id : integer and new_msg_text : string. returns nothing
    let message_not_encoded = {"type" : "update", "update-args" : {"type" : "msg-edit", "msg_id" : msg_id, "token" : get(token), "group_id" : group_id, "new_msg_textcontent" : new_msg_text}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    return
}

export async function send_user_update(new_image, new_name){
    //function that sends the new user data. expects new_image : string, new_name string. returns nothing
    let message_not_encoded = {"type" : "update", "update-args" : {"type" : "user-info-public", "new_name" : new_name, "new_image_b64" : new_image, "token" : get(token)}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    return
}

export async function start_call(group_id){
   //UNUSED FUNCTION. SHOULD NOT BE USED
   let message_not_encoded = {"type" : "create", "create-args" : {"type" : "voice-call","group_id" : group_id, "token" : get(token)}}
   let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
   fetch_group(group_id)
   let pure_data = JSON.parse(result)
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
   window.api.runPythonVoip(get(token), get(id), callid)

}

//TODO: ADD THE USER FILTERING
export async function fetch_group(group_id){
    //function that fetches a group and sets its value in the store. expects group_id : integer and returns nothing
    let message_not_encoded = {"type" : "fetch", "fetch-args" : {"type" : "groups", "token" : get(token), "target_group" : group_id}}
    let result = await window.api.promiseMsg(JSON.stringify(message_not_encoded))
    let result_decoded = JSON.parse(result)
    if (result_decoded.success == "0"){
        window.api.notify("failed to fetch groups: "+result_decoded["error-data"])
        return
    }
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
    sortGroups()
    get(groups).forEach((group, index) => {
        group.members.forEach((member_id) => {
            _addUser(member_id, temporaryUserData)
            get_user_data(member_id)
        })
    })
}

export async function add_user_to_group(user_id, group_id){
    //function that adds a user to a group. expects user_id : integer and group_id : integer. returns nothing.
    let message_unencoded = {"type" : "update", "update-args" : {"type" : "user-add-group", "new_user_id" : user_id, "token" : get(token), "group_id" : group_id}}
    let answer_undecoded = await window.api.promiseMsg(JSON.stringify(message_unencoded))
    let answer_decoded = JSON.parse(answer_undecoded)
    return
}

// export async function get_current_group_id(){
//    return get(current_group)
// }

// window.get_current_group_id = get_current_group_id
// window.send_message = send_message
// window.create_group = create_group

// export async function test_mass_send(group_id, amount){
//    let message_not_encoded = {"type" : "create", "create-args" : {"type" : "msg" , "token" : get(token), "group_id" : group_id, "attachments" : [], "msg_type" : "text", "time_sent" :  Date.now()}}
//    window.api.spamMsg(message_not_encoded, amount)
// }

// window.test_mass_send = test_mass_send