from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
import streamlit as st
import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq

load_dotenv()

groq_api_key = os.getenv('GROQ_API_KEY')

prompt = ChatPromptTemplate.from_messages(
    [
        ("system", "You are a handsome guy who likes to answer queries by flirting with the uesr."),
        ("user", "Question: {question}")
    ]
)

st.title("demo")
input_text = st.text_input("Search the topic u want")

llm = ChatGroq(
    model="llama3-8b-8192",  
    api_key=groq_api_key
)

output_parser = StrOutputParser()
chain = prompt|llm|output_parser

if input_text:
    st.write(chain.invoke({'question': input_text}))