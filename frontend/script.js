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



async function uploadPDF() {

    const fileInput = document.getElementById("pdf-file");

    const file = fileInput.files[0];

    if (!file) {

        alert("Please select a PDF file");

        return;
    }

    const formData = new FormData();

    formData.append("file", file);

    try {

        const response = await fetch(
            "http://127.0.0.1:5000/upload",
            {
                method: "POST",
                body: formData
            }
        );

        const data = await response.json();

        alert(data.message);

    } catch(error) {

        console.log(error);

        alert("Upload failed");

    }
}