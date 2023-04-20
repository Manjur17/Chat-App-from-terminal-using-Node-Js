
function startChatHandler(socket, message) { //close connection
    let sender = clients.get(socket);
    let receiver = message.receiver;
    let text = message.text;
    let receiverSocket = null;
    let msg = '';

    if (text != `lets chat ${receiver}`) {
        // text = undefined;

        msg = JSON.stringify({
            notify: `wants to chat : ${sender}`,
            sender : sender,
            receiver : receiver
        })

    } else {
        msg = JSON.stringify({
            notify: `lets chat : ${receiver}`,
            sender: sender,
            receiver: receiver
        })
    }

    for (var [key, value] of clients) {
        if (value === receiver) {
            receiverSocket = key;
            break;
        }
    }

    receiverSocket.write(msg);

}



module.exports = startChatHandler;