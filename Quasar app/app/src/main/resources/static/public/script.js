document.addEventListener('DOMContentLoaded', function () {
    const videoPlayer = document.getElementById('videoPlayer');
    const videoThumbnails = document.getElementById('videoThumbnails');
    const transcriptSection = document.getElementById('transcript');

    fetch('/videos')
        .then(response => response.json())
        .then(videos => {
            console.log("Fetched videos:", videos);  // Debugging: Log the fetched videos
            videos.forEach(video => {
                console.log("Video details:", video);  // Debugging: Log each video's details
                const videoWrapper = document.createElement('div');
                videoWrapper.classList.add('videoWrapper');

                const videoElement = document.createElement('video');
                videoElement.src = video.url;
                videoElement.controls = true;
                videoElement.classList.add('thumbnailVideo');
                videoElement.onclick = (event) => {
                    event.preventDefault();
                    videoPlayer.src = video.url;
                    videoPlayer.play();
                };
                videoWrapper.appendChild(videoElement);

                const thumbnailImg = document.createElement('img');
                thumbnailImg.src = video.thumbnailUrl;
                thumbnailImg.style.width = '120px';
                thumbnailImg.style.height = 'auto';
                videoWrapper.appendChild(thumbnailImg);

                // Create delete button
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.onclick = () => {
                    console.log("Deleting video with URL:", video.url);  // Debugging: Log the URL
                    deleteVideo(video.url, videoWrapper);
                };
                videoWrapper.appendChild(deleteButton);

                videoThumbnails.appendChild(videoWrapper);
            });
        });

    // Function to delete a video
    function deleteVideo(videoUrl, videoWrapper) {
        // Extract filename from URL
        const fileName = videoUrl.substring(videoUrl.lastIndexOf('/') + 1);
        
        if (!fileName) {
            console.error('Filename is undefined or null');
            return;
        }

        fetch(`http://localhost:8080/uploads/videos/${fileName}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                videoWrapper.remove();
                console.log('Video deleted successfully');
            } else {
                console.error('Error deleting video');
            }
        })
        .catch(error => {
            console.error('Error deleting video:', error);
        });
    }

    // Update transcript section as the video plays
    videoPlayer.addEventListener('timeupdate', function() {
        const currentTime = videoPlayer.currentTime;
        fetchTranscript(currentTime)
            .then(transcript => {
                transcriptSection.textContent = transcript;
            })
            .catch(error => {
                console.error('Error fetching transcript:', error);
            });
    });

    // Function to fetch transcript based on current time
    function fetchTranscript(currentTime) {
        return new Promise((resolve) => {
            const dummyTranscript = `Transcript for current time ${currentTime}`;
            resolve(dummyTranscript);
        });
    }
});



// Function to upload video file
function uploadVideo(formData) {
    console.log("Video Form Data:", formData);
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:8080/upload', true);
    xhr.onload = function() {
        if (xhr.status === 200) {
            console.log(xhr.responseText);
            alert('File uploaded successfully.');
        } else {
            console.error('Video upload failed');
        }
    };
    xhr.send(formData);
}

// Event listener for video form submission
document.getElementById('videoForm').addEventListener('submit', function(event) {
    event.preventDefault();
    console.log("Video form submitted");
    
    const formData = new FormData();
    const fileInput = document.getElementById('videoInput');
    const file = fileInput.files[0];
    formData.append('video', file);
    uploadVideo(formData);
    
});

// Function to upload text file
function uploadText(formData) {
    console.log("Text Form Data:", formData);

    const url = 'http://localhost:8080/upload';

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

    const blob = new Blob([textContent], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('text', blob, fileNameWithExtension);

    uploadText(formData);
});

// Function to toggle the display of section content
function toggleSection(sectionId) {
    const sectionContent = document.getElementById(sectionId);
    if (sectionContent) {
        sectionContent.style.display = sectionContent.style.display === 'block' ? 'none' : 'block';
    }
}
