"""DRF serializers for the assessment API."""

from rest_framework import serializers
from .models import (
    AssessmentSession, ActivityResponse, DomainScore,
    ThinkingStyle, ValidationResponse,
)


class AssessmentSessionSerializer(serializers.ModelSerializer):
    activities_completed = serializers.SerializerMethodField()
    completed_activity_numbers = serializers.SerializerMethodField()

    class Meta:
        model = AssessmentSession
        fields = [
            'id', 'current_stage', 'current_activity',
            'year_of_study', 'prior_experience', 'goal',
            'activities_completed', 'completed_activity_numbers',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_activities_completed(self, obj):
        return obj.activity_responses.count()

    def get_completed_activity_numbers(self, obj):
        return list(
            obj.activity_responses.values_list('activity_number', flat=True)
        )


class ContextIntakeSerializer(serializers.Serializer):
    """Validates the 3 context intake questions."""
    year_of_study = serializers.ChoiceField(choices=[
        ('year_1', 'Year 1'),
        ('year_2', 'Year 2'),
        ('year_3', 'Year 3'),
        ('year_4_plus', 'Year 4+'),
        ('professional', 'Professional'),
    ])
    prior_experience = serializers.ChoiceField(choices=[
        ('never', 'Never'),
        ('dabbled', 'Dabbled'),
        ('built_something', 'Built Something'),
    ])
    goal = serializers.ChoiceField(choices=[
        ('exploring', 'No Idea'),
        ('narrowing', 'Narrowing'),
        ('validating', 'Validating'),
    ])


class ActivitySubmissionSerializer(serializers.Serializer):
    """Validates activity response submissions."""
    activity_number = serializers.IntegerField(min_value=1, max_value=6)
    response_data = serializers.JSONField()
    behavioral_signals = serializers.JSONField(required=False, default=dict)
    duration_ms = serializers.IntegerField(min_value=0)


class ActivityResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityResponse
        fields = [
            'activity_number', 'response_data', 'behavioral_signals',
            'duration_ms', 'started_at',
        ]
        read_only_fields = ['started_at']


class DomainScoreSerializer(serializers.ModelSerializer):
    ranked_domains = serializers.SerializerMethodField()

    class Meta:
        model = DomainScore
        fields = [
            'backend', 'frontend', 'devops', 'data_eng',
            'ai_ml', 'cybersecurity', 'product_eng',
            'validation_applied', 'ranked_domains',
        ]

    def get_ranked_domains(self, obj):
        return obj.get_ranked_domains()


class ThinkingStyleSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='get_style_key_display', read_only=True)

    class Meta:
        model = ThinkingStyle
        fields = ['style_key', 'name', 'confidence', 'description', 'rank']


class ValidationSubmissionSerializer(serializers.Serializer):
    """Validates validation task submissions."""
    domain = serializers.ChoiceField(choices=[
        ('frontend_product', 'Frontend/Product'),
        ('backend_devops', 'Backend/DevOps'),
        ('data_ai', 'Data/AI'),
        ('cybersecurity', 'Cybersecurity'),
    ])
    task_type = serializers.CharField(max_length=50)
    response_data = serializers.JSONField()
    engagement_level = serializers.ChoiceField(choices=[
        ('strong', 'Strong'),
        ('good', 'Good'),
        ('partial', 'Partial'),
        ('low', 'Low'),
        ('skipped', 'Skipped'),
    ])
    duration_ms = serializers.IntegerField(min_value=0)


class ValidationResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = ValidationResponse
        fields = [
            'domain', 'task_type', 'response_data',
            'engagement_level', 'duration_ms', 'created_at',
        ]


class ResultsSerializer(serializers.Serializer):
    """Combined results: domain scores + thinking styles."""
    domain_scores = DomainScoreSerializer()
    thinking_styles = ThinkingStyleSerializer(many=True)
    session = AssessmentSessionSerializer()
