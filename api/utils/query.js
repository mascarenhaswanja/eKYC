const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

const orgNumber = process.argv[2];
const userName = process.argv[3];

async function main() {
    try {
        // load the network configuration
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', `org${orgNumber}.example.com`, `connection-org${orgNumber}.json`);
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), '../wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get(userName);
        if (!identity) {
            console.log(`An identity for the user "${userName}" does not exist in the wallet`);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('eKYC');

        const fields = ['name', 'address'];
        // const fields = [];

        // Evaluate the specified transaction.
        const result = await contract.evaluateTransaction('getClientData', 'CLIENT0', fields);
        // const result = await contract.evaluateTransaction('queryAllData');
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        // const result2 = await contract.evaluateTransaction('getClientDataByFI', 'FI0', 'CLIENT0', fields);
        // console.log(`Transaction has been evaluated, result is: ${result2.toString()}`);

        // Disconnect from the gateway.
        gateway.disconnect();

    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        process.exit(1);
    }
}

main();
