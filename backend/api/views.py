from rest_framework import viewsets, status, generics, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Group, GroupMember, Expense, Settlement, SettlementConfirmation, Contact, ExpenseSplit
from .serializers import (
    UserSerializer, GroupSerializer, ExpenseSerializer, 
    SettlementSerializer, GroupMemberSerializer, ContactSerializer
)

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

class UserSearchView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        query = request.query_params.get('query') or request.query_params.get('email')
        if not query:
            return Response({'error': 'Search query is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from django.db.models import Q
            target_user = User.objects.get(Q(email__iexact=query) | Q(phone_number__iexact=query))
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except User.MultipleObjectsReturned:
            # Handle edge case where multiple match
            target_user = User.objects.filter(Q(email__iexact=query) | Q(phone_number__iexact=query)).first()
        
        if target_user == request.user:
            return Response({'error': 'You cannot search for yourself'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if they share a group
        shares_group = Group.objects.filter(members__user=request.user).filter(members__user=target_user).exists()
        
        # Mask UPI ID if they don't share a group
        upi_id = target_user.upi_id
        if upi_id and not shares_group:
            parts = upi_id.split('@')
            if len(parts) == 2:
                name, domain = parts
                masked_name = name[0] + '*' * (len(name) - 2) + name[-1] if len(name) > 2 else name[0] + '*'
                upi_id = f"{masked_name}@{domain}"
            else:
                upi_id = "*** masked ***"
                
        return Response({
            'id': target_user.id,
            'email': target_user.email,
            'first_name': target_user.first_name,
            'last_name': target_user.last_name,
            'upi_id': upi_id,
            'shares_group': shares_group
        })

class GroupViewSet(viewsets.ModelViewSet):
    serializer_class = GroupSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Group.objects.filter(members__user=self.request.user)

    def perform_create(self, serializer):
        group = serializer.save(created_by=self.request.user)
        GroupMember.objects.create(user=self.request.user, group=group)

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        group = self.get_object()
        if group.members.count() >= 15:
            return Response({'error': 'Group limit of 15 members reached'}, status=status.HTTP_400_BAD_REQUEST)
        user_id = request.data.get('user_id')
        try:
            user = User.objects.get(id=user_id)
            GroupMember.objects.get_or_create(user=user, group=group)
            return Response({'status': 'member added'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'])
    def member_balance(self, request, pk=None):
        group = self.get_object()
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
        splits = ExpenseSplit.objects.filter(expense__group=group, user=target_user)
        total_paid = sum([s.amount_paid for s in splits])
        total_owed = sum([s.amount_owed for s in splits])
        net_balance = total_paid - total_owed
        
        return Response({'balance': net_balance})

    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        group = self.get_object()
        user_id = request.data.get('user_id')
        confirm_transfer = request.data.get('confirm_transfer', False)
        
        try:
            target_user = User.objects.get(id=user_id)
            membership = GroupMember.objects.get(user=target_user, group=group)
        except (User.DoesNotExist, GroupMember.DoesNotExist):
            return Response({'error': 'User is not in the group'}, status=status.HTTP_404_NOT_FOUND)
            
        splits = ExpenseSplit.objects.filter(expense__group=group, user=target_user)
        total_paid = sum([s.amount_paid for s in splits])
        total_owed = sum([s.amount_owed for s in splits])
        net_balance = total_paid - total_owed
        
        if net_balance != 0 and not confirm_transfer:
            return Response({
                'error': 'User has an unsettled balance.',
                'balance': net_balance,
                'requires_confirmation': True
            }, status=status.HTTP_400_BAD_REQUEST)
            
        if net_balance != 0 and confirm_transfer:
            Expense.objects.filter(group=group, paid_by=target_user).update(paid_by=request.user)
            for split in splits:
                deleter_split = ExpenseSplit.objects.filter(expense=split.expense, user=request.user).first()
                if deleter_split:
                    deleter_split.amount_owed += split.amount_owed
                    deleter_split.amount_paid += split.amount_paid
                    deleter_split.save()
                    split.delete()
                else:
                    split.user = request.user
                    split.save()
                    
        membership.delete()
        return Response({'status': 'member removed'})

class ContactViewSet(viewsets.ModelViewSet):
    serializer_class = ContactSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Contact.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Avoid duplicate contacts
        contact_user_id = self.request.data.get('contact_user_id')
        if Contact.objects.filter(user=self.request.user, contact_user_id=contact_user_id).exists():
            pass # already added
        else:
            serializer.save(user=self.request.user)

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 15
    page_size_query_param = 'page_size'
    max_page_size = 100

class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = StandardResultsSetPagination

    def paginate_queryset(self, queryset):
        if self.request.query_params.get('all') == 'true':
            return None
        return super().paginate_queryset(queryset)

    def get_queryset(self):
        return Expense.objects.filter(group__members__user=self.request.user).distinct()

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        expense = self.get_object()
        if expense.paid_by != request.user:
            return Response({'error': 'Only the person who paid can approve this expense'}, status=status.HTTP_403_FORBIDDEN)
        
        expense.is_approved = True
        expense.save()
        return Response({'status': 'Expense approved'})

    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        expense = self.get_object()
        if expense.creator != request.user:
            return Response({'error': 'Only the creator can decline this expense'}, status=status.HTTP_403_FORBIDDEN)
        
        expense.is_approved = False
        expense.save()
        return Response({'status': 'Expense declined'})

    def destroy(self, request, *args, **kwargs):
        expense = self.get_object()
        if expense.creator != request.user:
            return Response({'error': 'Only the creator can delete this expense'}, status=status.HTTP_403_FORBIDDEN)
        
        self.perform_destroy(expense)
        return Response(status=status.HTTP_204_NO_CONTENT)

class SettlementViewSet(viewsets.ModelViewSet):
    serializer_class = SettlementSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Settlement.objects.filter(payer=self.request.user) | Settlement.objects.filter(receiver=self.request.user)

    def perform_create(self, serializer):
        settlement = serializer.save()
        SettlementConfirmation.objects.create(settlement=settlement)

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny], url_path='public/(?P<token>[^/.]+)')
    def public_link(self, request, token=None):
        try:
            settlement = Settlement.objects.get(token=token)
            serializer = self.get_serializer(settlement)
            return Response(serializer.data)
        except Settlement.DoesNotExist:
            return Response({'error': 'Invalid link'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny], url_path='public/(?P<token>[^/.]+)/confirm_payment')
    def confirm_payment(self, request, token=None):
        try:
            settlement = Settlement.objects.get(token=token)
            if settlement.status != 'PENDING':
                return Response({'error': 'Settlement is not pending'}, status=status.HTTP_400_BAD_REQUEST)
            
            confirmation = settlement.confirmation
            confirmation.is_confirmed = True
            confirmation.ip_address = request.META.get('REMOTE_ADDR')
            confirmation.confirmed_at = timezone.now()
            confirmation.save()
            return Response({'status': 'Payment confirmation requested'})
        except Settlement.DoesNotExist:
            return Response({'error': 'Invalid link'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def lock(self, request, pk=None):
        from django.db import transaction
        settlement = self.get_object()
        if request.user != settlement.receiver:
            return Response({'error': 'Only the receiver can lock the settlement'}, status=status.HTTP_403_FORBIDDEN)
        
        if settlement.status == 'LOCKED':
            return Response({'error': 'Settlement is already locked'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not settlement.confirmation.is_confirmed:
            return Response({'error': 'Payment must be confirmed before locking'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            settlement.status = 'LOCKED'
            settlement.save()
            
            # Logic to update actual balances
            # We decrease the amount_owed by the payer in their ExpenseSplits in the group
            splits = ExpenseSplit.objects.filter(expense__group=settlement.group, user=settlement.payer, amount_owed__gt=0).order_by('amount_owed')
            remaining_settlement = settlement.amount
            
            for split in splits:
                if remaining_settlement <= 0:
                    break
                unpaid_owed = split.amount_owed - split.amount_paid
                if unpaid_owed > 0:
                    deduction = min(unpaid_owed, remaining_settlement)
                    split.amount_paid += deduction
                    split.save()
                    remaining_settlement -= deduction

        return Response({'status': 'Settlement locked'})
