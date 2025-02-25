# Deactivate current environment
deactivate

# Remove the virtual environment
rm -rf .venv

# Create new virtual environment
python3 -m venv .venv

# Activate it
source .venv/bin/activate

# Install packages fresh
python3 -m pip install gradio python-dotenv requests google-cloud-texttospeech
