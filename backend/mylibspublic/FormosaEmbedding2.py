"""Wrapper Embedding model APIs."""

import json
from typing import List

import requests
from langchain.embeddings.base import Embeddings
from pydantic import BaseModel


class CustomEmbeddingModel(BaseModel, Embeddings):
    base_url: str = "http://localhost:12345"
    api_key: str = ""
    model: str = ""

    def get_embeddings(self, payload):
        endpoint_url = f"{self.base_url}/models/embeddings"
        embeddings = []
        headers = {
            "Content-type": "application/json",
            "accept": "application/json",
            "X-API-KEY": self.api_key,
            "X-API-HOST": "afs-inference",
        }
        response = requests.post(endpoint_url, headers=headers, data=payload)
        body = response.json()
        datas = body["data"]
        for data in datas:
            embeddings.append(data["embedding"])

        return embeddings

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        payload = json.dumps({"model": self.model, "inputs": texts})
        return self.get_embeddings(payload)

    def embed_query(self, text: str) -> List[List[float]]:
        payload = json.dumps({"model": self.model, "inputs": [text]})
        emb = self.get_embeddings(payload)
        return emb[0]
