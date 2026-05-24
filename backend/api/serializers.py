from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Group, GroupMember, Expense, ExpenseSplit, Settlement, SettlementConfirmation, ActivityLog, Notification, Contact

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'phone_number', 'upi_id', 'upi_number', 'preferred_upi_app', 'qr_code_url', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        personal_group = Group.objects.create(
            name="Personal Tracking",
            description="Track your personal expenses here.",
            created_by=user
        )
        GroupMember.objects.create(user=user, group=personal_group)
        return user

class GroupMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = GroupMember
        fields = ('id', 'user', 'joined_at')

class ContactSerializer(serializers.ModelSerializer):
    contact_user = UserSerializer(read_only=True)
    contact_user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='contact_user', write_only=True
    )

    class Meta:
        model = Contact
        fields = ('id', 'contact_user', 'contact_user_id', 'added_at')

class GroupSerializer(serializers.ModelSerializer):
    members = GroupMemberSerializer(many=True, read_only=True)
    
    class Meta:
        model = Group
        fields = ('id', 'name', 'description', 'avatar_url', 'created_at', 'updated_at', 'created_by', 'members')
        read_only_fields = ('created_by',)

class ExpenseSplitSerializer(serializers.ModelSerializer):
    user_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='user', write_only=True)
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = ExpenseSplit
        fields = ('id', 'user', 'user_id', 'amount_owed', 'amount_paid', 'split_type')

class ExpenseSerializer(serializers.ModelSerializer):
    splits = ExpenseSplitSerializer(many=True)
    creator = UserSerializer(read_only=True)
    paid_by = UserSerializer(read_only=True)
    paid_by_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='paid_by', write_only=True, required=False)
    
    class Meta:
        model = Expense
        fields = ('id', 'title', 'description', 'amount', 'category', 'creator', 'paid_by', 'paid_by_id', 'is_approved', 'group', 'notes', 'created_at', 'updated_at', 'splits')
        read_only_fields = ('creator', 'is_approved')

    def create(self, validated_data):
        splits_data = validated_data.pop('splits')
        
        user = self.context['request'].user
        paid_by = validated_data.get('paid_by')
        category = validated_data.get('category')
        
        if paid_by and paid_by != user and category != 'Settlement':
            validated_data['is_approved'] = False
        else:
            validated_data['is_approved'] = True
            
        expense = Expense.objects.create(**validated_data)
        
        for split_data in splits_data:
            ExpenseSplit.objects.create(expense=expense, **split_data)
        return expense

class SettlementConfirmationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SettlementConfirmation
        fields = ('id', 'is_confirmed', 'ip_address', 'created_at', 'confirmed_at')
        read_only_fields = ('is_confirmed', 'ip_address', 'created_at', 'confirmed_at')

class SettlementSerializer(serializers.ModelSerializer):
    payer = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    payer_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='payer', write_only=True)
    receiver_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='receiver', write_only=True)
    confirmation = SettlementConfirmationSerializer(read_only=True)

    class Meta:
        model = Settlement
        fields = ('id', 'payer', 'receiver', 'payer_id', 'receiver_id', 'amount', 'group', 'status', 'token', 'created_at', 'confirmation')
        read_only_fields = ('status', 'token')

class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
