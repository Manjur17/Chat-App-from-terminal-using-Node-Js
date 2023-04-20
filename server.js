const net = require('net');

global.clients = new Map(); // global hashmap store all clients

const handlers = new Map(); // hashmap to store all actions and functions
//const currentState = null; //state on server side

const fs = require('fs');
const path = require('path');

const fullPath = path.join(__dirname, 'Handlers'); //current directory
//console.log(fullPath); //server/Hanlders
const files = fs.readdirSync(fullPath); //array of files

//dynamically adding handlers to map 
try {
    files.forEach((file) => {
        //console.log(file)
        let fileNameWithoutExtension = file.substring(0, file.length - 3);
        //console.log(fileNameWithoutExtension);

        let handler = require('./Handlers/' + fileNameWithoutExtension);

        let actionName = file.substring(0, file.length - 10);

        //console.log(actionName);
        handlers.set(actionName, handler); //[quit, quitHandler]
    }
    )
}
catch (error) { console.log(error) }


const server = net.createServer();

server.on("connection", (socket) => {

    socket.on('data', (data) => {
        let message = JSON.parse(data);
        let action = message.action; //action from message

        if (handlers.has(action)) {
            //registerHanlder(socket,message);
            handlers.get(action)(socket, message); //call the function
        } else {
            socket.write(`Wrong action !!! Cannot be performed`);
        }
    })
})


server.listen(4000, () => {
    console.log(`Server is listening :)`);
});

