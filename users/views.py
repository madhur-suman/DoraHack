from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate, login, logout
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .serializers import UserSerializer, UserCreateSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if user:
                refresh = RefreshToken.for_user(user)
                data = UserSerializer(user).data
                data.update({
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                })
                return Response(data)
            else:
                return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def logout(self, request):
        return Response({'message': 'Logged out (client should discard JWT)'})
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        return Response(UserSerializer(request.user).data)

    # Civic Auth endpoints
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def civic_sync(self, request):
        """Sync Civic Auth user with backend"""
        try:
            civic_data = request.data
            civic_user_id = civic_data.get('id')
            email = civic_data.get('email')
            name = civic_data.get('name')
            auth_method = civic_data.get('authMethod', 'civic')
            wallet_address = civic_data.get('walletAddress')
            
            # Check if user exists by Civic ID or email
            user = None
            if civic_user_id:
                user = User.objects.filter(civic_user_id=civic_user_id).first()
            
            if not user and email:
                user = User.objects.filter(email=email).first()
            
            if not user:
                # Create new user
                username = f"civic_{civic_user_id}" if civic_user_id else f"civic_{email}"
                user = User.objects.create(
                    username=username,
                    email=email,
                    first_name=name.split()[0] if name else '',
                    last_name=' '.join(name.split()[1:]) if name and len(name.split()) > 1 else '',
                    civic_user_id=civic_user_id,
                    auth_method=auth_method,
                    wallet_address=wallet_address,
                    civic_metadata=civic_data
                )
            else:
                # Update existing user
                user.civic_user_id = civic_user_id
                user.auth_method = auth_method
                user.wallet_address = wallet_address
                user.civic_metadata = civic_data
                user.save()
            
            return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to sync Civic user: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def civic_logout(self, request):
        """Handle Civic Auth logout"""
        try:
            user = request.user
            if user.auth_method.startswith('civic'):
                # Clear Civic-specific data
                user.civic_metadata = {}
                user.save()
            
            return Response({'message': 'Civic logout successful'})
        except Exception as e:
            return Response(
                {'error': f'Failed to logout Civic user: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

