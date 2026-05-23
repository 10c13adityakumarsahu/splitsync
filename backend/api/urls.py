from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, UserProfileView, UserSearchView, GroupViewSet, ExpenseViewSet, SettlementViewSet, ContactViewSet

router = DefaultRouter()
router.register(r'groups', GroupViewSet, basename='group')
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'settlements', SettlementViewSet, basename='settlement')
router.register(r'contacts', ContactViewSet, basename='contact')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('users/profile/', UserProfileView.as_view(), name='user_profile'),
    path('users/search/', UserSearchView.as_view(), name='user_search'),
    path('', include(router.urls)),
]
