import os
import json
import requests
from PIL import Image
import io
from typing import List, Tuple, Optional

# LangChain imports
from langchain_community.llms import Ollama
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain.output_parsers import PydanticOutputParser

# Pydantic models
from pydantic import BaseModel, Field

# Database imports
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, Boolean, DateTime, Date, func
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Pydantic models
class ReceiptItem(BaseModel):
    item_name: str = Field(description="The name of the item.")
    quantity: int = Field(description="The number of units purchased.")
    price: float = Field(description="The price of a single unit.")

class ReceiptData(BaseModel):
    items: List[ReceiptItem] = Field(description="List of items from the receipt")

# Database models
Base = declarative_base()

class UserDB(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class ReceiptItemDB(Base):
    __tablename__ = 'receipt_items'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    receipt_id = Column(String)  # Optional receipt identifier
    item_name = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    total_amount = Column(Float)  # Computed column: quantity * price
    category = Column(String)  # Optional item category
    store_name = Column(String)  # Optional store information
    purchase_date = Column(Date)  # Optional purchase date
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

def get_or_create_user(session, username: str) -> int:
    user = session.query(UserDB).filter(UserDB.username == username).one_or_none()
    if user is None:
        user = UserDB(username=username)
        session.add(user)
        session.commit()
        session.refresh(user)
    return user.id

def ocr_space_api(image_bytes: bytes, filename: str = "image.jpg", api_key: str = "K82415501488957", lang: str = "eng") -> str:
    """Perform OCR on image bytes using OCR.space API"""
    url_api = "https://api.ocr.space/parse/image"
    
    payload = {
        'apikey': api_key,
        'language': lang,
        'isOverlayRequired': False
    }
    
    files = {'filename': (filename, image_bytes, 'image/jpeg')}
    
    try:
        response = requests.post(url_api, files=files, data=payload)
        result = json.loads(response.content.decode())
        
        if result['OCRExitCode'] == 1:
            return result['ParsedResults'][0]["ParsedText"]
        else:
            return f"OCR failed with error: {result.get('ErrorMessage', 'Unknown error')}"
    except Exception as e:
        return f"Error during OCR: {str(e)}"

def extract_structured_data(ocr_text: str) -> ReceiptData:
    """Extract structured data from OCR text using LangChain"""
    try:
        llm = Ollama(model="llama3")
        parser = PydanticOutputParser(pydantic_object=ReceiptData)
        
        extraction_prompt = PromptTemplate(
            template="""You are an expert at extracting structured data from receipts.

Given the following receipt text, extract a list of all items with their quantity and price.

CRITICAL: You must respond with a JSON object that has this EXACT structure:
{{
    "items": [
        {{"item_name": "item name", "quantity": number, "price": number}},
        {{"item_name": "item name", "quantity": number, "price": number}}
    ]
}}

The response must be wrapped in an "items" array, not just a list of items.

Receipt Text:
{receipt_text}

Remember: Return ONLY the JSON with the "items" wrapper, no additional text.""",
            input_variables=['receipt_text'],
        )
        
        extraction_chain = LLMChain(prompt=extraction_prompt, llm=llm)
        json_output = extraction_chain.run(receipt_text=ocr_text)
        
        # Try to parse with the parser first
        try:
            return parser.parse(json_output)
        except Exception as parse_error:
            # Fallback: try to handle common LLM output formats
            if isinstance(json_output, str):
                # Try to extract JSON from the string
                import re
                json_match = re.search(r'\{.*\}', json_output, re.DOTALL)
                if json_match:
                    try:
                        data = json.loads(json_match.group())
                        if 'items' in data:
                            return ReceiptData(items=data['items'])
                        else:
                            # Assume it's a list of items directly
                            return ReceiptData(items=data)
                    except:
                        pass
                
                # Try to find just the items array
                json_match = re.search(r'\[.*\]', json_output, re.DOTALL)
                if json_match:
                    try:
                        items_list = json.loads(json_match.group())
                        return ReceiptData(items=items_list)
                    except:
                        pass
            
            # If all else fails, return empty data
            return ReceiptData(items=[])
            
    except Exception as e:
        # Return empty data if LangChain isn't available or fails
        return ReceiptData(items=[])

def process_receipt_image(image_bytes: bytes, filename: str) -> Tuple[str, ReceiptData]:
    """Process receipt image - perform OCR and extract structured data"""
    # Perform OCR
    ocr_text = ocr_space_api(image_bytes, filename)
    
    # Extract structured data
    structured_data = extract_structured_data(ocr_text)
    
    return ocr_text, structured_data

def save_data_to_db(items: List[ReceiptItem], db_uri: Optional[str] = None, user_id: Optional[int] = None, username: Optional[str] = None, receipt_id: Optional[str] = None, store_name: Optional[str] = None, purchase_date: Optional[str] = None) -> Tuple[bool, str]:
    """Save extracted data to database scoping rows to a specific user.

    Either provide user_id directly, or provide a username to be resolved/created.
    Additional metadata can be provided for enhanced tracking.
    """
    if db_uri is None:
        db_uri = os.getenv('DATABASE_URL', 'postgresql://shikhar:shikhar@localhost/receipt_db')

    try:
        engine = create_engine(db_uri)
        Base.metadata.create_all(engine)

        Session = sessionmaker(bind=engine)
        session = Session()

        # Resolve user
        if user_id is None:
            if not username:
                session.close()
                return False, "user_id or username must be provided to save items"
            user_id = get_or_create_user(session, username)

        # Convert purchase_date string to Date object if provided
        purchase_date_obj = None
        if purchase_date:
            try:
                from datetime import datetime
                purchase_date_obj = datetime.strptime(purchase_date, '%Y-%m-%d').date()
            except ValueError:
                # If date parsing fails, continue without it
                pass

        for item in items:
            # Calculate total amount
            total_amount = item.quantity * item.price
            
            new_item = ReceiptItemDB(
                user_id=user_id,
                receipt_id=receipt_id,
                item_name=item.item_name,
                quantity=item.quantity,
                price=item.price,
                total_amount=total_amount,
                store_name=store_name,
                purchase_date=purchase_date_obj
            )
            session.add(new_item)

        session.commit()
        session.close()
        return True, f"Successfully stored {len(items)} items for user_id={user_id}!"
    except Exception as e:
        return False, f"Error storing data: {str(e)}"
