from fastapi import FastAPI
from langchain.prompts import ChatPromptTemplate
# from langchain_groq import ChatGroq
from langchain_community.llms import HuggingFaceEndpoint 
from langchain.chains import LLMChain
from langserve import add_routes
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

# groq_api_key = os.getenv("GROQ_API_KEY")

app = FastAPI(
    title="Langchain Server",
    version="1.0",
    description="a simple api server"
)

model = HuggingFaceEndpoint(
    repo_id="mistralai/Mistral-7B-Instruct-v0.1",
    huggingfacehub_api_token=os.getenv("HUGGINGFACEHUB_API_TOKEN")
)

add_routes(
    app,
    model,
    path="/"
)

prompt1 = ChatPromptTemplate.from_template("Write an essay about {topic} in 200 words.")
prompt2 = ChatPromptTemplate.from_template("Write a poem about {topic} ")

essay_chain = LLMChain(llm=model, prompt=prompt1)
poem_chain = LLMChain(llm=model, prompt=prompt2)

# Add routes
add_routes(app, essay_chain, path="/essay")
add_routes(app, poem_chain, path="/poem")

if __name__ == '__main__':
    uvicorn.run(app,host='127.0.0.1', port=8000)