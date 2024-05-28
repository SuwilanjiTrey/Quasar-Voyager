const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');  // Import CORS package

const app = express();
const PORT = 3000;

// Directories for videos and thumbnails
const videosDir = path.join(__dirname, 'uploads/videos');
const thumbnailsDir = path.join(__dirname, 'src/main/resources/static/public/thumbnails');
const booksDir = path.join(__dirname, 'uploads/books');
const notesDir = path.join(__dirname, 'uploads/texts');
// Assuming fonts are located in `uploads/fonts`
const fontsDir = path.join(__dirname, 'src/main/resources/static/Fonts');
app.use('/fonts', express.static(fontsDir));

app.use('/videos', express.static(path.join(__dirname, 'uploads/videos')));
app.use('/thumbnails', express.static(path.join(__dirname, 'src/main/resources/static/public/thumbnails')));

app.use('/notes', express.static(path.join(__dirname, 'uploads/texts')));

// Use CORS to allow all cross-origin requests
app.use(cors());

// Serve static files from 'public'
app.use(express.static('src/main/resources/static/public'));

app.use('/thumbnails', express.static(thumbnailsDir));  
app.use('/books', express.static(booksDir));


app.get('/books', (req, res) => {
    fs.readdir(booksDir, (err, files) => {
        if (err) {
            console.error("Error reading books directory:", err);
            return res.status(500).send('Error reading books directory.');
        }
        const books = files.map(file => ({
            name: file,
            url: `/books/${encodeURIComponent(file)}`
        }));
        res.json(books);
    });
});



app.get('/notes', (req, res) => {
    fs.readdir(notesDir, (err, files) => {
        if (err) {
            console.error("Error reading notes directory:", err);
            return res.status(500).send('Error reading notes directory.');
        }
        const notes = files.map(file => ({
            name: file,
            url: `/notes/${encodeURIComponent(file)}`
        }));
        res.json(notes);
    });
});

// Serve the note files
app.get('/notes/:filename', (req, res) => {
    const filePath = path.join(notesDir, req.params.filename);
    res.sendFile(filePath, err => {
        if (err) {
            console.error("Error sending file:", err);
            res.status(404).send('File not found.');
        }
    });
});


// Route to list videos and their thumbnails
app.get('/videos', (req, res) => {
    fs.readdir(videosDir, (err, files) => {
        if (err) {
            console.error("Error reading video directory:", err);
            return res.status(500).send('Error reading video directory.');
        }

        // Filter video files, assuming MP4 format
        const videos = files.filter(file => file.endsWith('.mp4')).map(file => {
            const baseName = path.basename(file, '.mp4');
            const encodedFileName = encodeURIComponent(file);
            const encodedBaseName = encodeURIComponent(baseName);
            const thumbnailUrl = `/thumbnails/${encodedBaseName}_thumbnail.png`; // Ensure thumbnail filenames are URL-encoded
            return {
                name: file,
                url: `/videos/${encodedFileName}`, // Ensure video filenames are URL-encoded
                thumbnailUrl: thumbnailUrl
            };
        });

        console.log("Video data sent:", videos);
        res.json(videos);
    });
});

// Route to delete a video
app.delete('/uploads/videos/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    if (!fileName) {
        return res.status(400).send('Invalid file name');
    }

    const filePath = path.join(videosDir, fileName);
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error("Error deleting video file:", err);
            return res.status(404).send('Failed to delete video or video not found');
        }

        console.log(`Deleted video file: ${fileName}`);
        res.status(200).send('Video deleted successfully');
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
