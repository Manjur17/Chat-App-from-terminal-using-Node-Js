
function quitHandler(socket, message) { //close connection
    let username = clients.get(socket);
    clients.delete(socket);

    //send message to all users
    let arr = [];

    clients.forEach((value, key) => {
        arr.push(value); //username
    })


    let msg = JSON.stringify({
        notify: `${username} is disconnected`,
        clientsArray: arr,
        closedClient : username
    })

    clients.forEach((value, socket) => {
        socket.write(msg);
    })

}

module.exports = quitHandler;