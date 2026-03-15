import os
import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).parent / "api" / ".env"
load_dotenv(dotenv_path=env_path)
api_key = os.environ.get("GOOGLE_API_KEY")

if not api_key:
    print("No API key found!")
    exit(1)

try:
    genai.configure(api_key=api_key)
    print("Available models:")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
except Exception as e:
    print(f"Error: {str(e)}")
