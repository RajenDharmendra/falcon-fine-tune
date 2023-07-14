document.addEventListener('DOMContentLoaded', function () {
    const modalityForm = document.getElementById('modality-form');
    const promptForm = document.getElementById('prompt-form');
    const modalities = document.getElementById('modalities');
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

    function activateModalityButton(button) {
        const activeButton = modalities.querySelector('.btn.active');
        if (activeButton) {
            activeButton.classList.remove('active');
        }
        button.classList.add('active');
    }

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

    async function fetchData(modality, prompt) {
        const formData = new FormData(promptForm);
        formData.append("modality", modalityForm.elements["modality"].value);

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
        const modality = modalityForm.elements["modality"].value;
    
        try {
            const result = await fetchData(modality, prompt);
    
            if (result.success) {
                displayResult(`<h3>Model: ${modality}</h3><h5 class="text-lightgrey">Company: ${prompt}</h5><pre class="text-white">${result.response}</pre>`);
            } else {
                displayError(result.error, resultElement);
            }
        } catch (error) {
            displayError("An error occurred while processing the request. Please try again later.", resultElement);
        }
    
        toggleSpinner(false);
    }    

    function handleModalityButtonClick(event) {
        const button = event.target;
        const modalityValue = button.dataset.value;
        modalityForm.elements["modality"].value = modalityValue;
        activateModalityButton(button);
    }

    function handlePromptInput(event) {
        const promptInput = event.target;
        promptInput.style.height = 'auto';
        promptInput.style.height = (promptInput.scrollHeight) + 'px';
    }

    modalities.addEventListener('click', function (event) {
        if (event.target.tagName === 'BUTTON') {
            handleModalityButtonClick(event);
        }
    });

    promptForm.addEventListener('submit', handleFormSubmit);

    // Attach the input event listener to the #prompt textarea
    if (promptTextArea) {
        promptTextArea.addEventListener('input', handlePromptInput);
    }
});
