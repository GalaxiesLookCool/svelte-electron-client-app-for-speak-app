<script>
    import {msgs, groups, token, users, addUser, sortGroups, addUsersOfGroup, sortMsgs, fetch_groups, fetch_msgs, send_message, server_update, current_group, clear_msgs } from './store.js'
    let activeGroup = null;
    import Sidebar from './Sidebar.svelte'
    import MsgsHolder from './MsgsHolder.svelte';
    import { get } from 'svelte/store';
    let clearMsgsForm;
    let scrollToBott;

    //$: console.log($groups)

    window.api.serverUpdate(server_update)


    fetch_groups()

    const changeChat = (newChatID) => {
        activeGroup = newChatID
        clearMsgsForm()
        clear_msgs()
        var tempGroups = get(groups)
        current_group.set(newChatID)
        console.log(`should change to ${newChatID}`)
        for (var i = 0; i < get(groups).length; i++){
            if (tempGroups[i]["id"] == newChatID){
                console.log(`found group - ${get(groups)[i]["name"]}`)
                tempGroups[i]["selected"] = true 
                fetch_msgs(newChatID).then((resp) => {
                    if (resp.status == "error"){
                        window.api.notify(resp.error_msg)
                        //alert(resp.error_msg)
                    }
                    else {
                        scrollToBott()
                    }
                })
                /*
                window.api.promiseMsg(JSON.stringify({"type" : "FETCHMSGSFROMCLIENT", "token" : $token, "CHATID" : newChatID, "AMOUNT" : "20", "LATEST" : "0"})).then((resp) => {
                    resp = JSON.parse(resp)
                    if (resp["success"] == "0"){
                        alert("failure to load msgs")
                        return
                    }
                    if (activeGroup == resp["CHATID"]){
                        msgs.set(resp["msgs"]) //add the messages of this chat into our store
                        sortMsgs()
                        scrollToBott()
                    } 
                        
                })
                */
            }
            else {
                tempGroups[i]["selected"] = false
            }
        }
        groups.set(tempGroups)
        msgs.set([])
    }

    function newGroup(_,data) {
        console.log("in new group func")
        groups.set([...get(groups), {"name" : data["CHATNAME"], "id" : data["CHATID"], "membersDict" : data["memberstatus"], "picture" : data["picture"], "selected" : false, "unread" : 0}])
        sortGroups()
    }

    function sendMessage(textContent, messageAttachmentsArray){
        if (textContent.length == 0 && messageAttachmentsArray.length == 0){
            return;
        }
        /*
        var msgDict = {"type" : "NEWMSGFROMCLIENT", "TIMESENT" : Date.now(), "MSGTYPE" : "NORMALMSG", "TEXTCONTENT" : textContent, "CHATID" : activeGroup, "token" : $token, "ATTACHMENTS" : messageAttachmentsArray}
        window.api.promiseMsg(JSON.stringify(msgDict)).then((resp) => {
            if (JSON.parse(resp)["success"] == "0")
                alert(JSON.parse(resp)["errorMsg"])
        })
        */
        send_message(textContent, activeGroup, messageAttachmentsArray).then((resp) => {
            if (resp["status"] == "error"){
                window.api.notify("failed to send error")
                //alert("failed to send error")
            }
            scrollToBott()
        })
        clearMsgsForm()
    }

    function newMsg(_, data) {
        console.log(data)
        if (activeGroup == data["CHATID"]){
            var tempMsgDict = {"textcontent" : data["textcontent"] , "msgid" : data["msgid"], "CHATID" : data["CHATID"], "senderid" : data["senderid"], "usersReadStatus" : data["usersReadStatus"], "timeSent" : data["timeSent"], "attachments" : data["attachments"], "msgtype" : data["msgtype"]}
            msgs.set([...get(msgs), tempMsgDict])
            sortMsgs()
            scrollToBott()
        }
        for (var i = 0; i < $groups.length; i++){
            if ($groups[i].id == data["CHATID"])
                $groups[i]["latestMsg"] = {"time" : data["timeSent"], "content" : data["textcontent"]}
        }
        sortGroups()
    }

    window.api.customNewGroup(newGroup)
    window.api.msgCB(newMsg)
</script>

<div class="flex h-screen text-gray-800 antialiased">
    <div class="flex h-full w-full flex-row overflow-x-hidden">
        <Sidebar groupsProp={$groups} changeChat={changeChat} users={$users}></Sidebar>
        <MsgsHolder changeChat={changeChat} activeGroup={activeGroup} bind:clearForm={clearMsgsForm} bind:scrollToBottom={scrollToBott} msgs={$msgs} sendMessage={sendMessage} users={$users} isActive={activeGroup == null ? false : true}></MsgsHolder>
    </div>
</div>

<!--<div class="flex h-full flex-auto flex-col p-6">-->