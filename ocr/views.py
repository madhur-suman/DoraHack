import os
import requests
import json
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from langchain.llms import Ollama
from langchain.prompts import PromptTemplate
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List
import uuid

class ReceiptItem(BaseModel):
    item_name: str = Field(description="Name of the item")
    quantity: int = Field(description="Quantity of the item")
    price: float = Field(description="Price per unit")

class ReceiptData(BaseModel):
    items: List[ReceiptItem] = Field(description="List of items from the receipt")
    store_name: str = Field(description="Name of the store")
    total_amount: float = Field(description="Total amount of the receipt")
    purchase_date: str = Field(description="Date of purchase")

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def process_receipt(request):
    """Process a receipt image and extract structured data"""
    if 'image' not in request.FILES:
        return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    image_file = request.FILES['image']
    
    # Save image to media directory
    file_name = f"receipts/{uuid.uuid4()}_{image_file.name}"
    path = default_storage.save(file_name, ContentFile(image_file.read()))
    
    try:
        # Extract text using OCR.space API
        ocr_text = extract_text_from_image(image_file)
        
        if not ocr_text:
            return Response({'error': 'Could not extract text from image'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Extract structured data using LangChain
        structured_data = extract_structured_data(ocr_text)
        
        return Response({
            'ocr_text': ocr_text,
            'structured_data': structured_data,
            'image_path': path
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def extract_text_from_image(image_file):
    """Extract text from image using OCR.space API"""
    api_key = os.environ.get('OCR_API_KEY', 'K81724188988957')
    url = 'https://api.ocr.space/parse/image'
    
    files = {'image': image_file}
    data = {
        'apikey': api_key,
        'language': 'eng',
        'isOverlayRequired': False,
        'filetype': 'png',
        'detectOrientation': True,
    }
    
    response = requests.post(url, files=files, data=data)
    result = response.json()
    
    if result.get('IsErroredOnProcessing'):
        raise Exception(f"OCR Error: {result.get('ErrorMessage')}")
    
    parsed_results = result.get('ParsedResults', [])
    if parsed_results:
        return parsed_results[0].get('ParsedText', '')
    
    return ''

def extract_structured_data(ocr_text):
    """Extract structured data from OCR text using LangChain"""
    try:
        llm = Ollama(base_url=settings.OLLAMA_BASE_URL, model="llama2")
        
        parser = PydanticOutputParser(pydantic_object=ReceiptData)
        
        prompt = PromptTemplate(
            template="""Extract structured data from this receipt text. 
            Return only the items, store name, total amount, and purchase date.
            
            Receipt text:
            {ocr_text}
            
            {format_instructions}
            """,
            input_variables=["ocr_text"],
            partial_variables={"format_instructions": parser.get_format_instructions()}
        )
        
        _input = prompt.format_prompt(ocr_text=ocr_text)
        output = llm(_input.to_string())
        
        return parser.parse(output)
        
    except Exception as e:
        # Fallback: return basic structure
        return {
            'items': [],
            'store_name': 'Unknown Store',
            'total_amount': 0.0,
            'purchase_date': 'Unknown'
        }




