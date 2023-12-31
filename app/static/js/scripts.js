document.addEventListener('DOMContentLoaded', function () {
    const promptForm = document.getElementById('prompt-form');
    const resultElement = document.getElementById('result');
    const skeletonScreen = document.getElementById('skeleton-screen');
    const spinner = document.querySelector('.spinner');
    const submitButton = document.querySelector('.circle-btn');
    const promptTextArea = document.getElementById('prompt');

    function updateSubmitButtonColor() {
        if (promptTextArea.value.trim() !== '') {
            submitButton.style.backgroundColor = '#6f42c1'; // Active color
        } else {
            submitButton.style.backgroundColor = '#b3b3b3'; // Muted color
        }
    }

    // Initialize the submit button color
    updateSubmitButtonColor();

    // Listen for input in the text area
    promptTextArea.addEventListener('input', updateSubmitButtonColor);

    function displayResult(result) {
        resultElement.innerHTML = result;
    }

    function displayError(error, element) {
        element.innerHTML = `<div class="alert alert-danger" role="alert">${error}</div>`;
    }

    function toggleSpinner(visible) {
        spinner.style.display = visible ? 'flex' : 'none';
        skeletonScreen.classList.toggle('d-none', !visible);
    }

    function fetchWithTimeout(resource, options, timeout = 60000) {
        return Promise.race([
            fetch(resource, options),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Request timed out")), timeout)
            ),
        ]);
    }

    async function fetchData(prompt) {
        const formData = new FormData(promptForm);

        try {
            const response = await fetchWithTimeout("/get_completion", {
                method: "POST",
                body: formData,
            }, 180000);

            if (response.ok) {
                const data = await response.json();
                console.log("Data received: " + JSON.stringify(data));
                return data;
            } else {
                console.error("Error occurred while fetching data", response.statusText);
                return { success: false, error: "An error occurred while fetching data. Please try again later." };
            }
        } catch (error) {
            console.error("Error occurred while fetching data", error);
            return {
                success: false,
                error: "An error occurred while fetching data. Please try again later.",
            };
        }
    }

    async function handleFormSubmit(event) {
        event.preventDefault();
        toggleSpinner(true);

        const prompt = promptForm.elements["prompt"].value;

        try {
            const result = await fetchData(prompt);

            if (result.success) {
                displayResult(`<h3>Model: Due Diligence</h3><h5 class="text-lightgrey">Company: ${prompt}</h5><pre class="text-white">${result.response}</pre>`);
            } else {
                displayError(result.error, resultElement);
            }
        } catch (error) {
            displayError("An error occurred while processing the request. Please try again later.", resultElement);
        }

        toggleSpinner(false);
    }

    function handlePromptInput(event) {
        const promptInput = event.target;
        promptInput.style.height = 'auto';
        promptInput.style.height = (promptInput.scrollHeight) + 'px';
    }

    promptForm.addEventListener('submit', handleFormSubmit);

    // Attach the input event listener to the #prompt textarea
    if (promptTextArea) {
        promptTextArea.addEventListener('input', handlePromptInput);
    }
});
