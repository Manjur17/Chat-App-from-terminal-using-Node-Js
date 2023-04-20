const CommandLineUI = require("./CommandLineUI");
const SocketCommunicator = require("./SocketCommunicator");


class MainClient {

    constructor() {
        this.ui = new CommandLineUI(this);
        this.socketCommunicator = new SocketCommunicator(this);

        this.state = 'unregistered';
        setTimeout(() => {
            this.ui.displayMessage("Enter your name:");
            this.ui.startAcceptingInput();

        }, 200);

        this.connectedClients = []; //store all connected clients on client side
        this.senderName = '';
        this.receiverName = '';
        this.newReceiverName = '';
    }

    async handleUserInput(input) {

        if (this.state === 'unregistered') {
            this.senderName = input;
            this.sendRegisterMessage(input);

        }
        else if (this.state === 'connected') {
            //console.log(input);

            if (input === '!close') {
                this.sendCloseMessage();

            } else if (input.startsWith('!chat')) {

                this.receiverName = input.substring(6);

                if (this.connectedClients.includes(this.receiverName)) {

                    this.startChattingMessage(this.receiverName, input);

                } else {
                    this.ui.displayMessage(`User ${this.receiverName} not found`);
                }

            } else {
                this.ui.displayMessage("Enter a valid command");
            }

        } else if (this.state === 'chatting') {

            if (input == '!yes') {
                this.ui.displayMessage('chat ended');
                this.sendChatMessages(this.receiverName, `${this.senderName} left the conversation :)`);
                this.sendChatMessages(this.newReceiverName, `lets chat ${this.newReceiverName}`);
                this.receiverName = this.newReceiverName;

            } else if (input == '!no') {
                this.sendChatMessages(this.newReceiverName, `${this.senderName} is busy.`);

            } else if (input == '!stop') {
                this.ui.displayMessage('chat ended');
                this.state = 'connected';
                this.sendChatMessages(this.receiverName, `${this.senderName} left the conversation :)`);
            } else {
                this.sendChatMessages(this.receiverName, input);
            }
        }

    }

    //handle data from server
    async handleData(data) {

        const notification = data.notify;
        const clientsArray = data.clientsArray;

        if (notification !== undefined && clientsArray !== undefined) {
            this.ui.displayMessage(notification);

            clientsArray.forEach(client => {
                this.connectedClients.push(client);
            });
            this.ui.displayMessage(clientsArray);
        }

        if (this.state == "sendRegistered") {

            if (notification == 'username already exist') {
                this.state = 'unregistered';
                this.ui.displayMessage(notification);
                this.ui.displayMessage("Enter your name again:");
                return;
            }

            //iterate over each client and add the clients to connected clients array


            this.state = 'connected'; //registered to server

        } else if (this.state == "connected") {

            const notifyMsg = notification.substring(0, 13);
            const chatterName = notification.substring(16);
            this.receiverName = chatterName;

            if (notifyMsg == 'wants to chat') {
                this.startChattingMessage(chatterName, `lets chat ${chatterName}`);
                this.ui.displayMessage(notification);
                this.state = 'chatting';
                return;
            }

        } else if (this.state == 'waiting') {

            // if (notification == undefined) {
            //     console.log('okay');
            //     return;
            // }
            const senderChatName = data.sender;
            const receiverChatName = data.receiver;
            const chatMessage = data.msgData;


            if (chatMessage == `lets chat ${receiverChatName}`) {
                this.state = 'chatting'
                this.ui.displayMessage(chatMessage);
                return;
            } else if (chatMessage == `${senderChatName} is busy.`) {
                this.state = 'connected';
                this.ui.displayMessage(`${senderChatName} doesnot want to chat!!!`);
                return;
            }

            const notifyMsg = notification.substring(0, 9);

            if (notifyMsg !== 'lets chat') {
                this.state = 'connected';
                this.ui.displayMessage(`${senderChatName} doesnot want to chat!!!`);
                return;
            }

            this.state = 'chatting'
            this.ui.displayMessage(notification);
            return;

        } else if (this.state == 'chatting') {
            const senderChatName = data.sender;
            const chatMessage = data.msgData;

            if (chatMessage == `${senderChatName} left the conversation :)`) {
                this.ui.displayMessage(chatMessage);
                this.state = 'connected';
                //console.log(this.state);
                return;
            }


            if (notification == `wants to chat : ${senderChatName}`) {
                const str = notification + ", Please enter 1) !yes 2) !no ";
                this.ui.displayMessage(str);
                this.newReceiverName = senderChatName;
                return;
            }

            if (senderChatName !== undefined && chatMessage !== undefined) {
                this.ui.displayMessage(`${senderChatName} : ${chatMessage}`);
            }

            return;
        }

    }

    sendRegisterMessage(input) {

        let message = JSON.stringify({
            action: "register",
            username: input
        });

        this.socketCommunicator.sendMesaage(message);
        this.state = 'sendRegistered';
    }

    startChattingMessage(receiverUsername, input) {

        let message = JSON.stringify({
            action: "startChat",
            receiver: receiverUsername,
            text: input
        });

        this.socketCommunicator.sendMesaage(message);
        this.state = 'waiting'; //critical
    }

    sendChatMessages(receiverUsername, input) {
        // console.log(receiverUsername,input);

        let message = JSON.stringify({
            action: "sendMessage",
            receiver: receiverUsername,
            text: input
        });

        this.socketCommunicator.sendMesaage(message);

    }


    sendCloseMessage() {

        let message = JSON.stringify({
            action: "quit",
        });

        this.socketCommunicator.sendMesaage(message);
        this.state = 'closed';
        this.ui.displayMessage('closing connection...');
        this.socketCommunicator.close();
    }
}

module.exports = MainClient;