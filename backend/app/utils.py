import openai
import os

openai.api_key = os.getenv("OPENAI_API_KEY")

def query_gpt(message: str):
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": message}],
    )
    return response["choices"][0]["message"]["content"]
