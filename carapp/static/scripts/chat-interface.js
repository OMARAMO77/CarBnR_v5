const HOST = 'https://omar.eromo.tech';
const userId = getParameterByName('userId');
let ciphertext, iv, encryptedKey;
const limit = 10;

async function generateKeys(user_id) {
    try {
        const response = await fetch(`${HOST}/api/v1/generate-keys/${user_id}`, {
            method: 'GET'
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`Error: ${errorData.error}`);
            if (errorData.public_key) {
                console.log('Existing Public Key:', errorData.public_key);
            }
            return;
        }
        const data = await response.json();
        console.log(data.message);
        console.log('Public Key:', data.public_key);
    } catch (error) {
        console.error('Error generating keys:', error.message);
    }
}

async function sendMessage(sender, recipient, message) {
    try {
        const exchangeResponse = await fetch(`${HOST}/api/v1/exchange-key`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sender, recipient })
        });

        if (!exchangeResponse.ok) {
            const errorText = await exchangeResponse.text();
            console.error('Exchange key failed:', errorText);
            throw new Error('Failed to exchange key: ' + errorText);
        }

        const exchangeData = await exchangeResponse.json();
        const { encrypted_key } = exchangeData;
        console.log('Encrypted Key:', encrypted_key);

        // Step 2: Encrypt the message
        const encryptionResponse = await fetch(`${HOST}/api/v1/send-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sender, recipient, message })
        });

        if (!encryptionResponse.ok) {
            const errorData = await encryptionResponse.text();
            console.error('Encrypt message failed:', errorData);
            throw new Error(errorData.error || 'Failed to encrypt the message');
        }

        const { ciphertext, iv } = await encryptionResponse.json();
        console.log('Message Encrypted:', ciphertext, iv);

        // Step 3: Store the encrypted message on the server
        const storageResponse = await sendMessageToServer(sender, recipient, ciphertext, iv, encrypted_key);
        if (!storageResponse.ok) {
            throw new Error('Failed to store the message on the server');
        }
        console.log('Message sent successfully!');
    } catch (error) {
        console.error('Error sending message:', error.message);
        alert('Failed to send message: ' + error.message);
    }
}
async function sendMessageToServer(sender, recipient, ciphertext, iv, encryptedKey) {
    try {
        const response = await fetch(`${HOST}/api/v1/store-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sender,
                recipient,
                ciphertext,
                iv,
                encrypted_key: encryptedKey
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Store message failed:', errorData);
            return errorData
        }
        console.log('Message stored successfully!');
        return response
    } catch (error) {
        console.error('Error storing message:', error.message);
    }
}

async function fetchMessageData(user1, user2, offset) {
    try {
        // Construct the API URL with query parameters
        const url = `${HOST}/api/v1/get-message-data?user1=${user1}&user2=${user2}&limit=${limit}&offset=${offset}`;
        
        // Fetch data from the API
        const response = await fetch(url);
        
        if (!response.ok) {
            // Handle non-OK responses
            const errorData = await response.json();
            console.error('Error fetching message data:', errorData);
            return { error: errorData }; // Return error object for further handling
        }
        
        // Parse response JSON
        const data = await response.json();
        
        console.log("Messages fetched successfully:", data.messages);
        return data.messages || []; // Ensure messages is always an array
    } catch (error) {
        // Catch and log unexpected errors
        console.error('Error fetching message data:', error.message);
        return { error: 'An unexpected error occurred' }; // Return generic error
    }
}
let displayedMessages = [];
async function fetchMessages(recipient, sender, offset, append = false) {
    if (!recipient) {
        alert("Recipient ID is required to fetch messages!");
        return;
    }

    try {
        const recipientMessages = await fetchMessageData(recipient, sender, offset);
        const messagesList = document.getElementById("messagesList");
        const chatBox = document.getElementById('chatBox');

        if (recipientMessages && recipientMessages.length > 0) {
            // Remove "no messages" placeholder if it exists
            const noMessages = document.getElementById("no-messages");
            if (noMessages) noMessages.remove();
            const uiMessage = document.getElementById("ui-message");
            if (uiMessage) uiMessage.remove();

            const fragment = document.createDocumentFragment();

            for (const { sender_id, plaintext, created_at } of recipientMessages) {
                const messageId = `${sender_id}-${created_at}`;

                // Only render messages not already displayed
                if (!displayedMessages.includes(messageId)) {
                    displayedMessages.push(messageId);

                    const timestamp = new Date(created_at).toLocaleString();
                    const isSent = sender_id !== sender; // Check if the message is sent by the user

                    // Create message element
                    const messageDiv = document.createElement("div");
                    messageDiv.className = `message ${isSent ? "sent" : "received"}`;
                    messageDiv.innerHTML = `
                        <div class="message-content">${plaintext}</div>
                        <div class="timestamp">${timestamp}</div>
                    `;
                    // Append to the fragment
                    fragment.appendChild(messageDiv);
                }
            }

            // Add messages to the DOM
            if (append) {
                // Insert older messages before the current content

                // Calculate the current scroll position relative to the height of the content
                const previousScrollHeight = chatBox.scrollHeight;

                // Insert older messages before the current content
                messagesList.prepend(fragment);

                // Adjust scrollTop to display the end of the new fragment
                const newScrollHeight = chatBox.scrollHeight;
                chatBox.scrollTop += newScrollHeight - previousScrollHeight;

            } else {
                // Add newer messages to the end
                messagesList.appendChild(fragment);
                chatBox.scrollTop = chatBox.scrollHeight; // Scroll to the newest message
            }

        } else if (!append && messagesList.children.length === 0) {
            hideEmptyChatState();
            // Show placeholder if no messages exist
            const noMessagesPlaceholder = `
                <div id="noMessagesPlaceholder" class="text-center my-5">
                   <i class="bi bi-chat-dots" style="font-size: 3rem; color: #adb5bd;"></i>
                   <p class="text-white mt-3">No messages yet. Start chatting!</p>
                </div>`;
            messagesList.innerHTML = noMessagesPlaceholder;
        }
        return recipientMessages.length;
    } catch (error) {
        console.error("Error fetching messages:", error.message);
    }
}
let lastRecipientEmail;
async function fetchContacts(user_id) {
    const refreshBtn = document.getElementById('refreshBtn');
    const loadMoreButton = document.getElementById('loadMoreButton');
    const messagesList = document.getElementById("messagesList");
    const loadingPlaceholder = document.getElementById("loadingContacts");
    const emailInputField = document.getElementById("recipientEmail");
    if (loadingPlaceholder) loadingPlaceholder.style.display = "block";
    let fragment;
    try {
        const response = await fetch(`${HOST}/api/v1/get-contacts?user_id=${user_id}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch contacts');
        }

        const data = await response.json();
        console.log("Contacts fetched successfully:", data.contacts);

        if (loadingPlaceholder) loadingPlaceholder.style.display = "none";
        // Render contacts
        const contactsList = document.getElementById("contactsList");
        contactsList.innerHTML = ""; // Clear existing list
        data.contacts.forEach(contact => {
            const contactLink = document.createElement("a");
            contactLink.href = "#";
            contactLink.innerHTML = `
                <div class="contact-info">
                    <strong>${contact.recipient_first_name} ${contact.recipient_last_name}</strong> <br>
                    <small>${contact.recipient_email}</small>
                </div>
            `;
            contactLink.className = "list-group-item list-group-item-action";
            contactLink.onclick = async () => {
                displayedMessages.splice(0, displayedMessages.length);
                messagesList.innerHTML = '';
                hideEmptyChatState();
                if (!emailInputField.hasAttribute("readonly")) {
                    emailInputField.setAttribute("readonly", true);
                    addContactBtn.textContent = "Add New Contact"; // Update button text
                }       
                document.getElementById("recipient").value = contact.recipient_id;
                document.getElementById("recipientEmail").value = contact.recipient_email;
                if (refreshBtn) refreshBtn.style.display = "none";
                if (loadMoreButton) loadMoreButton.style.display = "none";
                let msgNumber = await fetchMessages(userId, contact.recipient_id, offset = 0);
                if (msgNumber > limit - 1) {
                    if (loadMoreButton) loadMoreButton.style.display = "unset";
                } else {
                    if (loadMoreButton) loadMoreButton.style.display = "none";
                }
                if (refreshBtn) refreshBtn.style.display = "flex";
                lastRecipientEmail = contact.recipient_email
                console.log("lastRecipientEmail:", lastRecipientEmail);
                return lastRecipientEmail;
            };
            contactsList.appendChild(contactLink);
        });
    } catch (error) {
        console.error('Error fetching contacts:', error.message);
        const loadingFailurePlaceholder = `
            <div class="text-center my-3 text-danger">
                <i class="bi bi-exclamation-triangle" style="font-size: 2rem;"></i>
                <p>Failed to load contacts. Please try again.</p>
            </div>`;

        loadingPlaceholder.innerHTML = loadingFailurePlaceholder;
    }
}
function hideEmptyChatState() {
    const emptyChatState = document.getElementById('emptyChatState');
    if (emptyChatState) emptyChatState.style.display = "none";
}

async function getUserId(email) {
    if (!email) {
        alert("Please enter a valid email address.");
        return;
    }

    try {
        // Send a POST request to the server
        const response = await fetch(`${HOST}/api/v1/get-user-id`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: email }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to fetch user ID");
        }

        // Extract the userId from the response
        const data = await response.json();
        console.log("User ID fetched successfully:", data.userId);
        return data.userId
    } catch (error) {
        console.error("Error fetching user ID:", error.message);
        alert(`Error: ${error.message}`);
        return error.message
    }
}
function isValidEmail(email) {
    // Define a regular expression for validating email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Test the email against the regex
    return emailRegex.test(email);
}

window.onload = async () => {
    const sendButton = document.getElementById('sendButton');
    const refreshBtn = document.getElementById('refreshBtn');
    const loadMoreButton = document.getElementById('loadMoreButton');
    const addContactBtn = document.getElementById('addContactBtn');
    const messageInput = document.getElementById("messageInput");

    const toggleButtons = (disabled) => {
        sendButton.disabled = disabled;
        refreshBtn.disabled = disabled;
    };
    const toggleSidebarBtn = document.getElementById("toggleSidebarBtn");
    const sidebar = document.getElementById("sidebar");
    const mainContent = document.getElementById("mainContent");

    toggleSidebarBtn.addEventListener("click", () => {
        const isVisible = sidebar.classList.toggle("visible");
        mainContent.classList.toggle("shifted");
        toggleSidebarBtn.textContent = isVisible ? "Hide Contacts" : "Show Contacts";
    });
    const sender = userId;
    toggleButtons(true);
    await fetchContacts(userId);
    // Validate user on load
    try {
        if (!userId) throw new Error('User ID not found in URL.');
        const userResponse = await fetch(`${HOST}/api/v1/is-valid/${userId}`);
        if (!userResponse.ok) throw new Error('Unable to validate user ID.');
        const userData = await userResponse.json();
        if (userData.isValid !== "yes") throw new Error('Invalid user ID.');
    } catch (error) {
        alert(`Validation Error: ${error.message}`);
        return;
    }
    toggleButtons(false);
    refreshBtn.addEventListener("click", async () => {
        const recipient = document.getElementById("recipient").value.trim();
        if (recipient) {
            await fetchMessages(userId, recipient, offset = 0);
        } else {
            alert("Recipient is required!");
            return;
        }
    });
    addContactBtn.addEventListener("click", async () => {
        const emailInputField = document.getElementById("recipientEmail");
        const recipientInputField = document.getElementById("recipient");
        const messagesList = document.getElementById("messagesList");

        const emailInput = emailInputField.value.trim();
        const recipient = recipientInputField.value.trim();

        // Log values before clearing
        console.log("emailInput before clearing:", emailInput);
        console.log("recipient before clearing:", recipient);

        // Clear input fields and message list
        emailInputField.value = "";
        recipientInputField.value = "";
        messagesList.innerHTML = "";
        loadMoreButton.style.display = "none";
        if (emailInputField.hasAttribute("readonly")) {
            emailInputField.removeAttribute("readonly");
            emailInputField.focus(); // Automatically focus the input field
            addContactBtn.textContent = "Lock Email"; // Update button text
        } else {
            emailInputField.setAttribute("readonly", true);
            addContactBtn.textContent = "Add New Contact"; // Update button text
        }
    });
    let offset = 0; // Start from the latest messages
    loadMoreButton.addEventListener('click', async () => {
        loadMoreButton.disabled = true;
        console.log("offset loadMoreButton:", offset);
        const recipient = document.getElementById("recipient").value.trim();
        offset += limit;
        console.log("offset loadMoreButton:", offset);
        if (!recipient) {
            alert("Recipient is required!");
            return;
        }
        let msgNumber = await fetchMessages(userId, recipient, offset, true);
        if (msgNumber < limit) loadMoreButton.style.display = "none";
        loadMoreButton.disabled = false;
    });
    // Event handler for sending a message
    async function handleAction(event) {
        const fragment = document.createDocumentFragment();
        console.log("lastRecipientEmail:", lastRecipientEmail);
        const emailInputField = document.getElementById("recipientEmail").value.trim();
        if (!isValidEmail(emailInputField)) {
            alert("Please enter a valid email address.");
            return;
        }
        const messagesList = document.getElementById("messagesList");
        recipientId = await getUserId(emailInputField);
        if (recipientId === "User not found") return;
        document.getElementById("recipient").value = recipientId;
        console.log("recipientId:", recipientId);
        const chatBox = document.getElementById('chatBox');
        const message = messageInput.value.trim();
        const messageDiv = document.createElement("div");
        messageDiv.className = "message sent";
        messageDiv.id = "ui-message";
        if (!emailInputField || !message) {
            alert("Email and message are required!");
            return;
        }
        messageInput.value = "";
        messageDiv.innerHTML = `
            <div class="message-content">${message}</div>
        `;
        toggleButtons(true);

        messagesList.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            await Promise.all([generateKeys(sender), generateKeys(recipientId)]);
            await sendMessage(sender, recipientId, message);
        } catch (error) {
            alert(`Error sending message: ${error.message}`);
        }
        fetchMessages(userId, recipientId, offset = 0);
        await fetchContacts(userId);
        toggleButtons(false);

        // Append the sent message to the chat
        //const timestamp = new Date().toLocaleString();

    }
    //messageInput.addEventListener("keydown", handleAction);
    sendButton.addEventListener("click", handleAction);

    messageInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();  // Prevent form submission if inside a form
            handleAction();  // Trigger the action
        }
    });
};
//sendButton.addEventListener('click', async () => {
// Auto-refresh messages every 5 seconds
//setInterval(() => {
//    const recipient = document.getElementById("recipient").value;
//    if (recipient) {
//        fetchMessages(recipient);
//}, 5000);
