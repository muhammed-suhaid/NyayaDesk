import os
import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).parent / "api" / ".env"
load_dotenv(dotenv_path=env_path)
api_key = os.environ.get("GOOGLE_API_KEY")

print(f"Testing key: {api_key}")

if not api_key:
    print("No API key found!")
    exit(1)

try:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-flash-latest")
    response = model.generate_content("Hello, this is a test.")
    print("Response text:")
    print(response.text)
except Exception as e:
    print(f"Error testing API key: {str(e)}")
