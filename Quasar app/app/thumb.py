import os
import cv2
from PIL import Image

def generate_thumbnail(video_path, thumbnail_path, frame_index=0, thumbnail_size=(120, 90)):
    # Open the video file
    cap = cv2.VideoCapture(video_path)

    # Set frame position
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_index)

    # Read the frame
    ret, frame = cap.read()

    # Release the video capture object
    cap.release()

    if ret:
        # Convert frame to RGB (Pillow uses RGB format)
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Resize the frame to thumbnail size
        thumbnail = Image.fromarray(frame_rgb).resize(thumbnail_size)

        # Save the thumbnail
        thumbnail.save(thumbnail_path)
        print(f'Thumbnail generated: {thumbnail_path}')
    else:
        print('Error reading frame from video')

def generate_thumbnails_for_videos(videos_dir, thumbnails_dir):
    # List all files in the videos directory
    video_files = os.listdir(videos_dir)

    # Filter out only video files
    video_files = [file for file in video_files if file.endswith('.mp4')]

    # Loop through each video file
    for video_file in video_files:
        video_path = os.path.join(videos_dir, video_file)
        thumbnail_name = f"thumbnail_{os.path.splitext(video_file)[0]}.png"
        thumbnail_path = os.path.join(thumbnails_dir, thumbnail_name)

        # Generate thumbnail for the video
        generate_thumbnail(video_path, thumbnail_path)

# Example usage
videos_dir = r'uploads\videos'
thumbnails_dir = r'src\main\resources\static\public\thumbnails'

generate_thumbnails_for_videos(videos_dir, thumbnails_dir)
