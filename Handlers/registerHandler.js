
function registerHandler(socket, message) {
    let username = message.username.trim();

    if(username.length == 0){
        let msg = JSON.stringify({
            notify: `Please, enter a username to register`,
            clientsArray: []
        })

        socket.write(msg);

    }else if (!clients.has(socket) && isNotSameUserName(username)) {
        clients.set(socket, username); //add to map
        //send message to all users and send all username to all users, //arr[] ->json string
        let arr = [];

        clients.forEach((value, key) => {
            arr.push(value); //username
        })


        let msg = JSON.stringify({
            notify: `${username} is connected`,
            clientsArray : arr 
        })

        clients.forEach((value, socket) => {
            // if (value !== username) {
            //     socket.write(`${username} is connected`);
            // }
            socket.write(msg);
        })

    } else {
        let msg = JSON.stringify({
            notify: `username already exist`,
            clientsArray: []
        })

        socket.write(msg);
    }

}

function isNotSameUserName(username) {
    for (let [key, value] of clients) {
        if (value === username) {
            return false;
        }
    }

    return true;
}

module.exports = registerHandler;