from setuptools import setup, find_packages

setup(
    name="mylibspublic",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        "langchain",
        "requests",
        "python-dotenv",
        "pydantic"
    ]
) 