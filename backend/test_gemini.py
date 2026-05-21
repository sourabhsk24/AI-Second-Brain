from google import genai

client = genai.Client(api_key="AIzaSyAjlESzNSSMkAD5gqLaxTFdNcWU0f1ZR3g")

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Explain AI in simple words"
)

print(response.text)

