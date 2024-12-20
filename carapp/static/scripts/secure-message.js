import { SignalProtocolStore, SignalProtocolAddress, KeyHelper, SessionBuilder, SessionCipher } from 'libsignal-protocol';

(async function () {
    const messageContainer = document.getElementById('messageContainer');
    const sendMessageBtn = document.getElementById('sendMessage');
    const messageInput = document.getElementById('messageInput');

    // Mock Key Storage
    const store = new SignalProtocolStore();

    // Generate identity keys for the user
    const userKeyPair = await KeyHelper.generateIdentityKeyPair();
    const registrationId = await KeyHelper.generateRegistrationId();
    store.put('identityKey', userKeyPair);
    store.put('registrationId', registrationId);

    // Generate recipient's public keys
    const recipientKeyPair = await KeyHelper.generateIdentityKeyPair();
    const recipientAddress = new SignalProtocolAddress('recipient', 1);

    store.put('identityKey', recipientKeyPair);

    // Build a secure session
    const sessionBuilder = new SessionBuilder(store, recipientAddress);
    const preKey = {
        identityKey: recipientKeyPair.pubKey,
        registrationId: registrationId,
        preKeyId: 1,
        signedPreKey: {
            keyId: 1,
            publicKey: recipientKeyPair.pubKey,
        },
    };
    await sessionBuilder.processPreKey(preKey);

    // Encrypt and display a message
    async function sendSecureMessage() {
        const message = messageInput.value.trim();
        if (!message) return;

        const cipher = new SessionCipher(store, recipientAddress);
        const encryptedMessage = await cipher.encrypt(Buffer.from(message));

        const encryptedText = JSON.stringify(encryptedMessage);
        displayMessage(`Encrypted: ${encryptedText}`);

        // Simulate decryption
        const decryptedMessage = await cipher.decryptPreKeyWhisperMessage(
            encryptedMessage.body,
            'binary'
        );
        displayMessage(`Decrypted: ${new TextDecoder().decode(decryptedMessage)}`);
    }

    // Display message in the UI
    function displayMessage(text) {
        const messageEl = document.createElement('p');
        messageEl.textContent = text;
        messageContainer.appendChild(messageEl);
    }

    // Handle send button click
    sendMessageBtn.addEventListener('click', sendSecureMessage);
})();
