# -*- coding: utf-8 -*-
"""
Created on Sun Sep 17 06:53:57 2023

@author: TAOINFO2
"""
import dotenv
import os
dotenv.load_dotenv(dotenv.find_dotenv())

from mylibs.FormosaEmbedding import FormosaEmbedding
from mylibs.FormosaFoundationModel import FormosaFoundationModel

os.environ['ENDPOINT_EMBEDDING']='https://203-145-216-185.ccs.twcc.ai:57163//embeddings/api/embeddings'
os.environ['API_KEY_EMBEDDING']='60d5b8d3-c685-477c-bc70-a545b3d580cc'

#os.environ['ENDPOINT_FFM']='https://ffm-trial06.twcc.ai/text-generation/api/models/generate'

os.environ['ENDPOINT_FFM']='https://203-145-216-185.ccs.twcc.ai:56726/text-generation/api'
#os.environ['API_KEY_FFM']='7e3cfb93-931e-461f-98fb-5588a92ad887'
os.environ['API_KEY_FFM']='85930f55-69b1-4cc2-8c94-c123a6e6b192'
#os.environ['EMBEDDING_ENDPOINT']='https://203-145-216-185.ccs.twcc.ai:57163'
#os.environ['EMBEDDING_API_KEY']='60d5b8d3-c685-477c-bc70-a545b3d580cc'
def get_ffm():
    return FormosaFoundationModel(
        endpoint_url = os.getenv('ENDPOINT_FFM'),
        max_new_tokens = 1024,
        temperature = 0.01,
        top_k = 50,
        top_p = 1.,
        frequence_penalty = 1.1,
        ffm_api_key = os.getenv('API_KEY_FFM'),
        model= "ffm-llama2-70b-chat" # "FFM-176B-latest" # AFS Cloud FFM-176B-latest
        # model= "tws-ffm-176b-0509-2000" # for ffm.twcc.ai
    )

def get_embed():
    print(os.getenv('ENDPOINT_EMBEDDING'))
    print(os.getenv('API_KEY_EMBEDDING'))
    return FormosaEmbedding(endpoint_url=os.getenv('ENDPOINT_EMBEDDING'), 
                            api_key=os.getenv('API_KEY_EMBEDDING')
                            )

