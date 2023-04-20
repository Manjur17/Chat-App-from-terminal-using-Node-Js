const readline = require('readline');


class CommandLineUI {
    
    constructor(uiListener) {
        this.uiListener = uiListener;
    }

    displayMessage(message) {
        console.log(message)
    }

    startAcceptingInput() {

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        // create the readline interface to read user input
        rl.on('line', (input) => {
            this.uiListener.handleUserInput(input);
        });

        
    }

    // async getInputCommand(message){
    //     console.log(message);

    //     const data = null;

    //     const rl = readline.createInterface({
    //         input: process.stdin,
    //         output: process.stdout
    //     });

    //     // create the readline interface to read user input
    //     rl.on('line', (input) => {
    //         data = input;
    //     });

    //     return data;
    // }
}

module.exports = CommandLineUI