
function sendMessageHandler(socket, message) {
    let sender = clients.get(socket);
    let receiver = message.receiver;
    
    let msg = JSON.stringify({
        sender : sender,
        receiver: receiver,
        msgData :  message.text
    });
   

    if (isReceiverConnected(receiver)) {
        //takeout socket object of receiver and send msg along with sender
        let receiverSocket = null;

        for (var [key, value] of clients) {
            if (value === receiver) {
                receiverSocket = key;
                break;
            }
        }
        receiverSocket.write(msg);

    } else {
        let msg = JSON.stringify({
            notify: `user not connected`
        })
        socket.write(msg);
    }
}

function isReceiverConnected(username) {
    for (var [key, value] of clients) {
        if (value === username) {
            return true;
        }
    }

    return false;
}

module.exports = sendMessageHandler;