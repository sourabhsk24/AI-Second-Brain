async function sendMessage() {

    const input = document.getElementById("user-input");
    const message = input.value;

    const chatBox = document.getElementById("chat-box");

    // Show user message
    chatBox.innerHTML += `
        <p><b>You:</b> ${message}</p>
    `;

    try {

        const response = await fetch(
            "http://127.0.0.1:5000/chat",
            {
                method: "POST",

                mode: "cors",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    message: message
                })
            }
        );

        const data = await response.json();

        // Show AI response
        chatBox.innerHTML += `
            <p><b>AI:</b> ${data.answer}</p>
        `;

    } catch(error) {

        chatBox.innerHTML += `
            <p style="color:red;">
                Error connecting backend
            </p>
        `;

        console.log(error);
    }

    input.value = "";

    chatBox.scrollTop = chatBox.scrollHeight;
}