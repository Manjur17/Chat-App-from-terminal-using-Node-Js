const net = require('net');

class SocketCommunicator {
    constructor(networkListener) {
        this.networkListener = networkListener;
        this.client = new net.Socket();
        this.connect();
    }

    connect() {
        // connect to the server

        this.client.connect(4000, 'localhost', () => {
            console.log('Connected to the server');
        });

        this.client.on('data', (data) => {
            this.dataHandler(data);
        })
    }

    sendMesaage(message) {
        this.client.write(message);
    }

    dataHandler(data) {
        this.networkListener.handleData(JSON.parse(data));
    }

    close() {
        this.client.destroy();
        this.client = null;
        console.log('connection closed successfully');
    }
}

module.exports = SocketCommunicator;