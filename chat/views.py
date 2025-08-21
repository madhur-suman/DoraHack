import os
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from langchain.llms import Ollama
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from receipts.models import ReceiptItem
from django.db.models import Sum, Count, Avg
from datetime import datetime, timedelta

@api_view(['POST'])
def chat_query(request):
    """Handle natural language queries about receipt data"""
    query = request.data.get('query', '').strip()
    user = request.user
    
    if not query:
        return Response({'error': 'Query is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Get user's receipt data
        user_items = ReceiptItem.objects.filter(user=user)
        
        # Create context from user's data
        context = create_data_context(user_items)
        
        # Generate response using LangChain
        response = generate_chat_response(query, context)
        
        return Response({
            'query': query,
            'response': response,
            'context': context
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def create_data_context(user_items):
    """Create context string from user's receipt data"""
    if not user_items.exists():
        return "No receipt data available."
    
    # Basic statistics
    total_items = user_items.count()
    total_spent = user_items.aggregate(total=Sum('total_amount'))['total'] or 0
    avg_price = user_items.aggregate(avg=Avg('price'))['avg'] or 0
    
    # Recent items
    recent_items = user_items.order_by('-created_at')[:10]
    recent_items_text = "\n".join([
        f"- {item.item_name}: {item.quantity}x ${item.price} (${item.total_amount})"
        for item in recent_items
    ])
    
    # Categories
    categories = user_items.values('category').annotate(
        count=Count('id'),
        total=Sum('total_amount')
    ).order_by('-total')[:5]
    
    categories_text = "\n".join([
        f"- {cat['category'] or 'Uncategorized'}: {cat['count']} items, ${cat['total']}"
        for cat in categories
    ])
    
    # Stores
    stores = user_items.values('store_name').annotate(
        count=Count('id'),
        total=Sum('total_amount')
    ).order_by('-total')[:5]
    
    stores_text = "\n".join([
        f"- {store['store_name'] or 'Unknown Store'}: {store['count']} items, ${store['total']}"
        for store in stores
    ])
    
    context = f"""
    Receipt Data Summary:
    - Total items: {total_items}
    - Total spent: ${total_spent:.2f}
    - Average item price: ${avg_price:.2f}
    
    Recent Items:
    {recent_items_text}
    
    Top Categories:
    {categories_text}
    
    Top Stores:
    {stores_text}
    """
    
    return context

def generate_chat_response(query, context):
    """Generate response using LangChain and Ollama"""
    try:
        llm = Ollama(base_url=settings.OLLAMA_BASE_URL, model="llama2")
        
        prompt = PromptTemplate(
            input_variables=["query", "context"],
            template="""
            You are a helpful assistant that answers questions about receipt and purchase data.
            Use the following context to answer the user's question:
            
            Context:
            {context}
            
            User Question: {query}
            
            Please provide a helpful and accurate response based on the data available.
            If the data doesn't contain information needed to answer the question, say so clearly.
            """
        )
        
        chain = LLMChain(llm=llm, prompt=prompt)
        response = chain.run(query=query, context=context)
        
        return response.strip()
        
    except Exception as e:
        return f"Sorry, I encountered an error while processing your query: {str(e)}"

@api_view(['GET'])
def get_quick_insights(request):
    """Get quick insights about user's spending patterns"""
    user = request.user
    user_items = ReceiptItem.objects.filter(user=user)
    
    if not user_items.exists():
        return Response({'message': 'No data available for insights'})
    
    # Calculate insights
    total_spent = user_items.aggregate(total=Sum('total_amount'))['total'] or 0
    total_items = user_items.count()
    
    # This month's spending
    this_month = datetime.now().replace(day=1)
    this_month_spending = user_items.filter(
        created_at__gte=this_month
    ).aggregate(total=Sum('total_amount'))['total'] or 0
    
    # Top category
    top_category = user_items.values('category').annotate(
        total=Sum('total_amount')
    ).order_by('-total').first()
    
    # Top store
    top_store = user_items.values('store_name').annotate(
        total=Sum('total_amount')
    ).order_by('-total').first()
    
    insights = {
        'total_spent': total_spent,
        'total_items': total_items,
        'this_month_spending': this_month_spending,
        'top_category': top_category['category'] if top_category else None,
        'top_store': top_store['store_name'] if top_store else None,
        'avg_item_price': user_items.aggregate(avg=Avg('price'))['avg'] or 0,
    }
    
    return Response(insights)



