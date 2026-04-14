"""Admin registration for assessment models."""

from django.contrib import admin
from .models import (
    AssessmentSession, ActivityResponse, DomainScore,
    ThinkingStyle, ValidationResponse,
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


@admin.register(AssessmentSession)
class AssessmentSessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'current_stage', 'current_activity', 'year_of_study', 'created_at']
    list_filter = ['current_stage', 'year_of_study', 'prior_experience', 'goal']
    search_fields = ['id']
    inlines = [ActivityResponseInline, DomainScoreInline, ThinkingStyleInline, ValidationResponseInline]
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
