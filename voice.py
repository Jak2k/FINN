import torch
from TTS.api import TTS
import argparse

# Create an argument parser
parser = argparse.ArgumentParser(description="Script description")

# Add an argument for the file path
parser.add_argument("file_path", type=str, help="Path to the txt file")

# Parse the command line arguments
args = parser.parse_args()

# Access the file path argument
file_path = args.file_path

# Read the text from the file
with open(file_path, "r") as file:
    text = file.read()

# Get device
device = "cuda" if torch.cuda.is_available() else "cpu"

# List available 🐸TTS models
print(TTS().list_models())

# Init TTS
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)

# Run TTS
# ❗ Since this model is multi-lingual voice cloning model, we must set the target speaker_wav and language
# Text to speech to a file
tts.tts_to_file(text=text, speaker_wav="./voice_sample.wav", language="en", file_path=file_path.replace(".txt", ".wav").replace("voice", "audio"))