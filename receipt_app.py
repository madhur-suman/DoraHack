import streamlit as st
import os
import tempfile
import json
import requests
from PIL import Image
import io
import base64

# LangChain imports
from langchain_community.llms import Ollama
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain.output_parsers import PydanticOutputParser
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits.sql.base import create_sql_agent
from langchain.agents.agent_types import AgentType

# Pydantic models
from pydantic import BaseModel, Field
from typing import List

# Database imports
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, text, func, Boolean, DateTime, Date
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Page configuration
st.set_page_config(
    page_title="Receipt OCR Handler",
    page_icon="🧾",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
    .main-header {
        font-size: 3rem;
        font-weight: bold;
        background: linear-gradient(90deg, #1f77b4, #ff7f0e);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-align: center;
        margin-bottom: 2rem;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
    }
    .user-welcome {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1rem;
        border-radius: 15px;
        text-align: center;
        margin-bottom: 1rem;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    .upload-section {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
        padding: 2rem;
        border-radius: 15px;
        margin: 1rem 0;
        box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    }
    .result-section {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        color: white;
        padding: 1.5rem;
        border-radius: 15px;
        margin: 1rem 0;
        box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    }
    .query-section {
        background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        color: white;
        padding: 1.5rem;
        border-radius: 15px;
        margin: 1rem 0;
        box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    }
    .stats-card {
        background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        color: white;
        padding: 1rem;
        border-radius: 10px;
        text-align: center;
        margin: 0.5rem 0;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    .stButton > button {
        width: 100%;
        margin: 0.5rem 0;
        border-radius: 25px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
        transition: all 0.3s ease;
    }
    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }
    .sidebar-content {
        background: rgba(255,255,255,0.1);
        padding: 1rem;
        border-radius: 10px;
        margin: 0.5rem 0;
    }
    .file-uploader {
        border: 2px dashed #ffffff;
        border-radius: 10px;
        padding: 2rem;
        text-align: center;
        background: rgba(255,255,255,0.1);
    }
    .metric-card {
        background: rgba(255,255,255,0.2);
        padding: 1rem;
        border-radius: 10px;
        text-align: center;
        margin: 0.5rem 0;
    }
    .success-message {
        background: rgba(76, 175, 80, 0.9);
        color: white;
        padding: 1rem;
        border-radius: 10px;
        margin: 1rem 0;
    }
    .error-message {
        background: rgba(244, 67, 54, 0.9);
        color: white;
        padding: 1rem;
        border-radius: 10px;
        margin: 1rem 0;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'ocr_text' not in st.session_state:
    st.session_state.ocr_text = ""
if 'extracted_data' not in st.session_state:
    st.session_state.extracted_data = None
if 'db_uri' not in st.session_state:
    st.session_state.db_uri = os.getenv('DATABASE_URL', "postgresql://shikhar:shikhar@localhost/receipt_db")
if 'username' not in st.session_state:
    st.session_state.username = os.getenv('APP_USERNAME', 'alice')
if 'show_manual_entry' not in st.session_state:
    st.session_state.show_manual_entry = False

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

# OCR function
def ocr_space_file(uploaded_file, api_key="K82415501488957", lang="eng"):
    """Perform OCR on uploaded file using OCR.space API"""
    url_api = "https://api.ocr.space/parse/image"
    
    # Convert uploaded file to bytes
    file_bytes = uploaded_file.getvalue()
    
    payload = {
        'apikey': api_key,
        'language': lang,
        'isOverlayRequired': False
    }
    
    files = {'filename': (uploaded_file.name, file_bytes, 'image/jpeg')}
    
    try:
        response = requests.post(url_api, files=files, data=payload)
        result = json.loads(response.content.decode())
        
        if result['OCRExitCode'] == 1:
            return result['ParsedResults'][0]["ParsedText"]
        else:
            return f"OCR failed with error: {result['ErrorMessage']}"
    except Exception as e:
        return f"Error during OCR: {str(e)}"

# Database functions
def save_data_to_db(structured_data: List[ReceiptItem], db_uri: str, username: str, receipt_id: str = None, store_name: str = None, purchase_date: str = None):
    """Save extracted data to database for a specific user with enhanced metadata"""
    try:
        engine = create_engine(db_uri)
        Base.metadata.create_all(engine)
        
        Session = sessionmaker(bind=engine)
        session = Session()
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

        for item in structured_data:
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
        return True, f"Successfully stored {len(structured_data)} items for user '{username}'!"
    except Exception as e:
        return False, f"Error storing data: {str(e)}"

# LangChain setup
@st.cache_resource
def setup_langchain():
    """Setup LangChain components"""
    try:
        # Use containerized Ollama service
        ollama_base_url = os.getenv('OLLAMA_BASE_URL', 'http://host.docker.internal:11434')
        llm = Ollama(model="llama3.2:1b", base_url=ollama_base_url)
        
        # Parser
        parser = PydanticOutputParser(pydantic_object=ReceiptData)
        
        # Extraction prompt with better error handling
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
        
        # Reasoning prompt with better structure
        reasoning_prompt = PromptTemplate(
            template="""You are an expert consumer advisor. Analyze the purchase data and provide recommendations.

Purchase Data:
{purchase_data}

User's Question:
{user_query}

Provide a clear, helpful recommendation based on the data. Focus on value, quality, and practical advice.""",
            input_variables=["purchase_data", "user_query"]
        )
        
        extraction_chain = LLMChain(prompt=extraction_prompt, llm=llm)
        reasoning_chain = LLMChain(prompt=reasoning_prompt, llm=llm)
        
        return llm, parser, extraction_chain, reasoning_chain
    except Exception as e:
        st.error(f"Error setting up LangChain: {str(e)}")
        return None, None, None, None


# Query handler (Revised)
def user_query_handler(user_query: str, db_uri: str, llm, reasoning_chain, username: str):
    """Handle user queries using SQL agent or reasoning chain"""
    try:
        # Step 1: Determine if the query is factual or subjective
        # Use a more explicit prompt for better classification
        is_factual = "Factual"  # Default to Factual
        try:
            llm_response = llm.invoke(f"""Analyze this query and respond with ONLY ONE of the following: 'Factual' or 'Subjective'.
            
            Query: {user_query}
            
            'Factual' for queries about specific data (e.g., "what's the total revenue").
            'Subjective' for queries that ask for opinions or advice (e.g., "is it a good idea to buy Bata?").
            
            Response:""")
            
            llm_response_clean = llm_response.strip().lower()

            if "subjective" in llm_response_clean:
                is_factual = "Subjective"
        except Exception as e:
            # If the LLM call fails, assume it's a subjective question
            is_factual = "Subjective"

        # Step 2: Route the query based on the classification
        if is_factual == "Factual":
            # Handle Factual Queries using SQL agent
            # Create/replace a filtered view limited to current user
            engine = create_engine(db_uri)
            with engine.begin() as conn:
                # Ensure user exists and get id
                Session = sessionmaker(bind=engine)
                s = Session()
                current_user_id = get_or_create_user(s, username)
                s.close()
                # Create a view restricted to the current user
                conn.execute(text(f"CREATE OR REPLACE VIEW user_receipt_items AS SELECT id, item_name, quantity, price, created_at FROM receipt_items WHERE user_id = {current_user_id}"))

            # Limit agent to the filtered view only
            db = SQLDatabase.from_uri(db_uri, include_tables=["user_receipt_items"], sample_rows_in_table_info=2)
            sql_agent = create_sql_agent(
                llm=llm,
                db=db,
                agent_type=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
                verbose=False,
                handle_parsing_errors=True
            )
            try:
                # Nudge the agent to use only the filtered view
                response = sql_agent.run(f"You must use ONLY the 'user_receipt_items' table. Question: {user_query}")
                return f"**Factual Query Response:**\n{response}"
            except Exception as e:
                return f"**SQL Query Error:**\n{str(e)}\n\nTry rephrasing your question to be more specific about the data you want."
        else:
            # Handle Subjective Queries using reasoning_chain
            try:
                # Manually get all items data without the agent
                engine = create_engine(db_uri)
                Session = sessionmaker(bind=engine)
                session = Session()
                user_id = get_or_create_user(session, username)
                all_items = session.query(ReceiptItemDB).filter(ReceiptItemDB.user_id == user_id).all()
                session.close()

                # Format the data for the LLM
                purchase_data_string = "\n".join([
                    f"Item Name: {item.item_name}, Quantity: {item.quantity}, Price: {item.price}" for item in all_items
                ])

                # Run the reasoning chain directly
                recommendation = reasoning_chain.run(purchase_data=purchase_data_string, user_query=user_query)
                return f"**Recommendation:**\n{recommendation}"
            except Exception as e:
                return f"**Reasoning Error:**\n{str(e)}\n\nTry asking a factual question instead."
    
    except Exception as e:
        return f"Error processing query: {str(e)}"

# Main app
def main():
    st.markdown('<h1 class="main-header">🧾 Receipt OCR Handler</h1>', unsafe_allow_html=True)
    
    # Sidebar configuration
    with st.sidebar:
        st.header("⚙️ Configuration")
        st.session_state.db_uri = st.text_input(
            "Database URI",
            value=st.session_state.db_uri,
            help="PostgreSQL connection string"
        )
        st.session_state.username = st.text_input(
            "Username",
            value=st.session_state.username,
            help="Each user sees and saves only their own data"
        )
        
        st.header("📊 Database Status")
        try:
            engine = create_engine(st.session_state.db_uri)
            Base.metadata.create_all(engine)
            st.success("✅ Database connected")
            
            # Show table info
            Session = sessionmaker(bind=engine)
            session = Session()
            uid = get_or_create_user(session, st.session_state.username)
            count = session.query(ReceiptItemDB).filter(ReceiptItemDB.user_id == uid).count()
            st.info(f"📈 Your items in database: {count}")
            session.close()
            
        except Exception as e:
            st.error(f"❌ Database connection failed: {str(e)}")
    
    # Main content area
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.markdown('<div class="upload-section">', unsafe_allow_html=True)
        st.header("📤 Upload Receipt Image")
        
        uploaded_file = st.file_uploader(
            "Choose an image file",
            type=['png', 'jpg', 'jpeg'],
            help="Upload a receipt image to extract data"
        )
        
        if uploaded_file is not None:
            # Display uploaded image
            image = Image.open(uploaded_file)
            st.image(image, caption="Uploaded Receipt", use_column_width=True)
            
            # OCR button
            if st.button("🔍 Extract Text (OCR)", type="primary"):
                with st.spinner("Performing OCR..."):
                    st.session_state.ocr_text = ocr_space_file(uploaded_file)
                    st.success("OCR completed!")
        
        st.markdown('</div>', unsafe_allow_html=True)
    
    with col2:
        st.markdown('<div class="result-section">', unsafe_allow_html=True)
        st.header("📝 Extracted Text")
        
        if st.session_state.ocr_text:
            st.text_area("OCR Result", st.session_state.ocr_text, height=200)
            
            # Extract structured data button
            if st.button("🏗️ Extract Structured Data", type="secondary"):
                with st.spinner("Extracting structured data..."):
                    llm, parser, extraction_chain, reasoning_chain = setup_langchain()
                    
                    if extraction_chain and parser:
                        try:
                            json_output = extraction_chain.run(receipt_text=st.session_state.ocr_text)
                            
                            # Try to parse with the parser first
                            try:
                                st.session_state.extracted_data = parser.parse(json_output)
                                st.success("Data extraction completed!")
                            except Exception as parse_error:
                                # Fallback: try to handle the case where LLM returns a list directly
                                st.warning("Standard parsing failed, attempting fallback parsing...")
                                
                                # Debug: show what we got
                                with st.expander("🔍 Debug: LLM Output"):
                                    st.code(f"Type: {type(json_output)}")
                                    st.code(f"Content: {json_output}")
                                
                                # Check if the output is a list of items (common LLM mistake)
                                if isinstance(json_output, str):
                                    # Try to extract JSON from the string
                                    import re
                                    json_match = re.search(r'\[.*\]', json_output)
                                    if json_match:
                                        try:
                                            import json as json_lib
                                            items_list = json_lib.loads(json_match.group())
                                            # Create ReceiptData manually
                                            st.session_state.extracted_data = ReceiptData(items=items_list)
                                            st.success("Data extraction completed using fallback parsing!")
                                        except:
                                            raise parse_error
                                    else:
                                        raise parse_error
                                elif isinstance(json_output, list):
                                    # LLM returned a list directly, wrap it
                                    st.session_state.extracted_data = ReceiptData(items=json_output)
                                    st.success("Data extraction completed using fallback parsing!")
                                else:
                                    raise parse_error
                                    
                        except Exception as e:
                            st.error(f"Error extracting data: {str(e)}")
                            st.info("💡 Tip: Try uploading a clearer image or manually editing the OCR text")
                            
                            # Add manual data entry option
                            if st.button("📝 Enter Data Manually"):
                                st.session_state.show_manual_entry = True
                    else:
                        st.error("LangChain setup failed")
            
            # Manual data entry interface
            if st.session_state.show_manual_entry:
                st.subheader("📝 Manual Data Entry")
                st.info("Enter the receipt items manually if OCR extraction failed")
                
                # Simple form for manual entry
                with st.form("manual_entry_form"):
                    item_name = st.text_input("Item Name")
                    quantity = st.number_input("Quantity", min_value=1, value=1)
                    price = st.number_input("Price (₹)", min_value=0.0, value=0.0, step=0.01)
                    
                    if st.form_submit_button("Add Item"):
                        if item_name and price > 0:
                            # Create a simple ReceiptItem manually
                            from pydantic import create_model
                            SimpleItem = create_model('SimpleItem', item_name=str, quantity=int, price=float)
                            new_item = SimpleItem(item_name=item_name, quantity=quantity, price=price)
                            
                            # Initialize extracted_data if it doesn't exist
                            if not st.session_state.extracted_data:
                                SimpleReceiptData = create_model('SimpleReceiptData', items=List[SimpleItem])
                                st.session_state.extracted_data = SimpleReceiptData(items=[new_item])
                            else:
                                # Add to existing data
                                st.session_state.extracted_data.items.append(new_item)
                            
                            st.success(f"Added: {item_name} - Qty: {quantity} - Price: ₹{price}")
                            st.rerun()
                        else:
                            st.error("Please fill in all fields correctly")
                
                if st.button("✅ Done with Manual Entry"):
                    st.session_state.show_manual_entry = False
                    st.rerun()
        
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Display extracted data
    if st.session_state.extracted_data:
        st.markdown('<div class="result-section">', unsafe_allow_html=True)
        st.header("📊 Extracted Data")
        
        # Create a DataFrame-like display
        data = []
        for item in st.session_state.extracted_data.items:
            data.append({
                "Item Name": item.item_name,
                "Quantity": item.quantity,
                "Price": f"₹{item.price:.2f}"
            })
        
        st.table(data)
        
        # Save to database button
        if st.button("💾 Save to Database", type="primary"):
            with st.spinner("Saving to database..."):
                success, message = save_data_to_db(
                    st.session_state.extracted_data.items,
                    st.session_state.db_uri,
                    st.session_state.username
                )
                if success:
                    st.success(message)
                else:
                    st.error(message)
        
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Query section
    st.markdown('<div class="query-section">', unsafe_allow_html=True)
    st.header("❓ Ask Questions")
    
    # Example queries
    st.subheader("💡 Example Queries:")
    col1, col2, col3 = st.columns(3)
    with col1:
        if st.button("Which item was sold the most?"):
            st.session_state.example_query = "Which item was sold the most?"
    with col2:
        if st.button("What's the total revenue?"):
            st.session_state.example_query = "What's the total revenue?"
    with col3:
        if st.button("Recommend best deals"):
            st.session_state.example_query = "Recommend which items I should buy and which to avoid"
    
    # Custom query input
    user_query = st.text_input(
        "Or ask your own question:",
        value=st.session_state.get('example_query', ''),
        placeholder="e.g., Which item was sold the least?"
    )
    
    if user_query and st.button("🔍 Get Answer", type="primary"):
        with st.spinner("Processing query..."):
            llm, parser, extraction_chain, reasoning_chain = setup_langchain()
            
            if llm and reasoning_chain:
                response = user_query_handler(
                    user_query,
                    st.session_state.db_uri,
                    llm,
                    reasoning_chain,
                    st.session_state.username
                )
                st.markdown("### Answer:")
                st.write(response)
            else:
                st.error("LangChain setup failed")
    
    st.markdown('</div>', unsafe_allow_html=True)

if __name__ == "__main__":
    main()
    