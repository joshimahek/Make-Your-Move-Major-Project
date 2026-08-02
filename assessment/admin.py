"""Admin registration for assessment models."""

from django.contrib import admin
from .models import (
    AssessmentSession, ActivityResponse, DomainScore,
    ThinkingStyle, ValidationResponse, DeepDiveChat,
)


class ActivityResponseInline(admin.TabularInline):
    model = ActivityResponse
    extra = 0
    readonly_fields = ['activity_number', 'response_data', 'behavioral_signals', 'duration_ms']


class DomainScoreInline(admin.StackedInline):
    model = DomainScore
    extra = 0


class ThinkingStyleInline(admin.TabularInline):
    model = ThinkingStyle
    extra = 0


class ValidationResponseInline(admin.TabularInline):
    model = ValidationResponse
    extra = 0


class DeepDiveChatInline(admin.TabularInline):
    model = DeepDiveChat
    extra = 0
    readonly_fields = ['domain', 'status', 'ai_turn_count', 'user_turn_count']


@admin.register(AssessmentSession)
class AssessmentSessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'current_stage', 'current_activity', 'year_of_study', 'created_at']
    list_filter = ['current_stage', 'year_of_study', 'prior_experience', 'goal']
    search_fields = ['id', 'user__email', 'user__first_name']
    inlines = [ActivityResponseInline, DomainScoreInline, ThinkingStyleInline, ValidationResponseInline, DeepDiveChatInline]
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(ActivityResponse)
class ActivityResponseAdmin(admin.ModelAdmin):
    list_display = ['session', 'activity_number', 'duration_ms', 'started_at']
    list_filter = ['activity_number']


@admin.register(DomainScore)
class DomainScoreAdmin(admin.ModelAdmin):
    list_display = [
        'session', 'backend', 'frontend', 'devops',
        'data_eng', 'ai_ml', 'cybersecurity', 'product_eng',
    ]


@admin.register(ThinkingStyle)
class ThinkingStyleAdmin(admin.ModelAdmin):
    list_display = ['session', 'style_key', 'confidence', 'rank']
    list_filter = ['style_key']


@admin.register(ValidationResponse)
class ValidationResponseAdmin(admin.ModelAdmin):
    list_display = ['session', 'domain', 'engagement_level', 'duration_ms']
    list_filter = ['domain', 'engagement_level']
