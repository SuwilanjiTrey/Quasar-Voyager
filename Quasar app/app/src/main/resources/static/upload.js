// Function to upload video file
function uploadVideo(formData) {
    console.log("Video Form Data:", formData); // Log the form data before sending the request
    alert('File uploaded successfully.');
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/upload', true);
    xhr.onload = function() {
        if (xhr.status === 200) {
            console.log(xhr.responseText);
        } else {
            console.error('Video upload failed');
        }
    };
    xhr.send(formData);
}

// Event listener for video form submission
document.getElementById('videoForm').addEventListener('submit', function(event) {
    event.preventDefault();
    console.log("Video form submitted"); // Log to check if event listener is triggered
    
    const formData = new FormData();
    const fileInput = document.getElementById('videoInput');
    const file = fileInput.files[0];
    formData.append('video', file);
    uploadVideo(formData);
});

/// Function to upload text file
function uploadText(formData) {
    console.log("Text Form Data:", formData); // Log the form data before sending the request
    
    const url = '/upload'; // Adjust the path based on the location of the upload endpoint

    fetch(url, {
        method: 'POST',
        body: formData,
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text();
    })
    .then(data => {
        console.log('Success:', data);
        alert('File uploaded successfully.');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error uploading file.');
    });
}

// Event listener for text form submission
document.getElementById('textForm').addEventListener('submit', function(event) {
    event.preventDefault();

    // Get file name and content
    const textFileNameElement = document.getElementById('textFileName');
    const textInputElement = document.getElementById('textInput');
    const fileNameWithExtension = textFileNameElement.value.trim() + '.txt';
    const textContent = textInputElement.value.trim();

    if (!fileNameWithExtension) {
        alert('Please enter a file name for the text file.');
        return;
    }

    if (!textContent) {
        alert('Please enter some text.');
        return;
    }

    // Create Blob object from text content
    const blob = new Blob([textContent], { type: 'text/plain' });

    // Create FormData object to send to server
    const formData = new FormData();
    formData.append('text', blob, fileNameWithExtension);

    // Upload text to server
    uploadText(formData);
});

// Function to fetch the list of videos from the server
// Function to fetch the list of videos from the server
function fetchVideos() {
    fetch('/videos')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log(data); // Handle your videos list here
    })
    .catch(error => {
        console.error('Error fetching videos:', error);
    });
} // Closing brace for fetchVideos function was missing

// Function to play the selected video
function playVideo(videoName) {
    const videoPlayer = document.getElementById('videoPlayer');
    videoPlayer.src = `/uploads/videos/${videoName}`;
    videoPlayer.play();
}

// Fetch videos when the page loads
window.addEventListener('load', fetchVideos);
