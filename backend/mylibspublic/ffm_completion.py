import os
import sys
from dotenv import load_dotenv

# 添加父目錄到 Python 路徑
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from mylibspublic.FormosaFoundationModel2 import FormosaFoundationModel

print("Debug: Starting ffm_completion.py")

# 加載環境變量
load_dotenv()
print("Debug: Loaded environment variables")

def get_ffm_completion(
    user_prompt,
    system_message="You are a helpful assistant.",
    model=os.getenv("MODEL_NAME"),
    temperature=0.5,
    max_tokens=350,
):
    print("Debug: Entering get_ffm_completion function")
    
    # 從環境變量中獲取 API 密鑰和 URL
    API_KEY = os.getenv("API_KEY")
    API_URL = os.getenv("API_URL")
    API_HOST = os.getenv("API_HOST")

    # 添加調試信息
    print(f"Debug: API_KEY: {API_KEY[:5]}...{API_KEY[-5:] if API_KEY else None}")
    print(f"Debug: API_URL: {API_URL}")
    print(f"Debug: API_HOST: {API_HOST}")

    if not API_KEY or not API_URL or not API_HOST:
        raise ValueError("API_KEY, API_URL, or API_HOST is missing in the environment variables.")

    print("Debug: Creating FormosaFoundationModel instance")
    ffm = FormosaFoundationModel(
        base_url=API_URL,
        max_new_tokens=max_tokens,
        temperature=temperature,
        top_k=50,
        top_p=1.0,
        frequence_penalty=1.0,
        ffm_api_key=API_KEY,
        model=model,
    )

    # Combine system message and user prompt
    full_prompt = f"{system_message}\n\nHuman: {user_prompt}\n\nAssistant:"
    print(f"Debug: Full prompt: {full_prompt}")

    # Get the response from the model
    print("Debug: Calling FFM model")
    response = ffm(full_prompt)
    print(f"Debug: Received response: {response[:50]}...")  # 只打印前50個字符

    return response

# Example usage
if __name__ == "__main__":
    print("Debug: Running main block")
    user_prompt = "請問台灣最高的山是？"
    response = get_ffm_completion(user_prompt)
    print(f"Final response: {response}")