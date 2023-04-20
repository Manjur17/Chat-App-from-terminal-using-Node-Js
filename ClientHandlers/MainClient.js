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

        }, 100);

        this.connectedClients = []; //store all connected clients on client side
        this.senderName = '';
        this.receiverName = '';
        this.newReceiverName = [];
        this.messageQueue = new Map();
    }

    handleUserInput(input) {

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

                if (this.receiverName === this.senderName) {
                    const msg = 'You cannot chat with yourself !! Please enter different user to chat';
                    this.ui.displayMessage(msg);

                } else if (this.connectedClients.includes(this.receiverName)) {

                    this.startChattingMessage(this.receiverName, input);

                } else {
                    this.ui.displayMessage(`User ${this.receiverName} not found`);
                }

            } else if (input == '!displayMessages') {
                this.displayAllMessages();
            } else {
                this.ui.displayMessage("Enter a valid command");
            }



        } else if (this.state === 'chatting') {


            // if (input == '!stop') {
            //     this.ui.displayMessage('chat ended');
            //     this.state = 'connected';
            //     this.sendChatMessages(this.receiverName, `${this.senderName} left the conversation :)`);
            // } 
            
            if (input == '!displayMessages') {
                this.displayAllMessages();
            } else if (input.startsWith('!chat')) {

                this.receiverName = input.substring(6);
                if (this.connectedClients.includes(this.receiverName)) {
                    this.startChattingMessage(this.receiverName, input);

                } else {
                    this.ui.displayMessage(`User ${this.receiverName} not found`);
                }

            } else if (input === '!close') {
                this.sendCloseMessage();

            } else {
                let inputMsg = input.trim();
                if(inputMsg.length == 0){
                    this.ui.displayMessage('please enter some message to send');
                    return;
                }
                this.sendChatMessages(this.receiverName, inputMsg);
            }

        }

    }

    //handle data from server
    handleData(data) {

        const notification = data.notify;
        const clientsArray = data.clientsArray;

        if ((notification !== undefined && clientsArray !== undefined) && clientsArray.length > 0) {

            if (notification.endsWith('disconnected')) {
                const closedClient = data.closedClient;
                
                if(this.receiverName === closedClient){
                    this.state = 'connected';
                }
            }

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
            if (notification == 'Please, enter a username to register'){
                this.state = 'unregistered';
                this.ui.displayMessage(notification);
                
                return;
            }

            this.state = 'connected'; //registered to server

        } else if (this.state == "connected") {

            const notifyMsg = notification.substring(0, 13);
            const chatterName = notification.substring(16);
            this.receiverName = chatterName;


            if (notifyMsg == 'wants to chat') {
                this.startChattingMessage(chatterName, `lets chat ${chatterName}`);
                this.ui.displayMessage(notification);
                this.state = 'chatting';

            }

            return;

        } else if (this.state == 'waiting') {

            // if (notification == undefined) {
            //     console.log('okay');
            //    // return;
            // }
            const senderChatName = data.sender;
            const chatMessage = data.msgData;

            if (chatMessage === 'okay') {
                this.state = 'chatting'
                //console.log('working');
                return;
            }

            const notifyMsg = notification.substring(0, 9);

            if (notifyMsg !== 'lets chat') {
                this.state = 'connected';
                // console.log('working');
                this.ui.displayMessage(`${senderChatName} doesnot want to chat!!!`);
                return;
            }

            this.state = 'chatting'
            this.ui.displayMessage(notification);
            return;

        } else if (this.state == 'chatting') {
            const senderChatName = data.sender;
            const chatMessage = data.msgData;


            if (notification == `wants to chat : ${senderChatName}`) {
                // const str = `${senderChatName} is back to chat`;
                // this.ui.displayMessage(str);
                this.sendChatMessages(senderChatName, 'okay');
                this.newReceiverName.push(senderChatName);
                return;
            }

            if (senderChatName !== this.receiverName && !this.newReceiverName.includes(senderChatName) && chatMessage !== undefined) {
                //  const str = `${senderChatName} joined the chat`;
                // this.ui.displayMessage(str);
                this.newReceiverName.push(senderChatName);
                
            }

            if (senderChatName !== this.receiverName && this.newReceiverName.includes(senderChatName)) {
                const str = `Message received from ${senderChatName}`;
                this.ui.displayMessage(str);

                if (this.messageQueue.size == 0 || this.messageQueue.get(senderChatName) == undefined) {

                    this.messageQueue.set(senderChatName, [chatMessage]);

                    //console.log('working object');
                } else {

                    const messageInArray = this.messageQueue.get(senderChatName);
                    messageInArray.push(chatMessage);
                    this.messageQueue.set(senderChatName, messageInArray);

                    //console.log('working object');
                }


                return;
            }

            if (senderChatName !== undefined && chatMessage !== undefined) {
                this.ui.displayMessage(`>> ${senderChatName} : ${chatMessage}`);
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

    displayAllMessages() {
        if(this.messageQueue.size == 0){
            this.ui.displayMessage('Nothing to display. No messages received.');
            return;
        }

        this.messageQueue.forEach((value, key) => {
            let sender = `Message from ${key} :- `;
            this.ui.displayMessage(sender);
            let arr = value;
            for (const x of arr) {
                this.ui.displayMessage(`   ${x}`);
            }
        })

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