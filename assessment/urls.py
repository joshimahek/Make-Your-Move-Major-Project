"""URL routing for the assessment API."""

from django.urls import path
from . import views

app_name = 'assessment'

urlpatterns = [
    # Session management
    path('session/start/', views.start_session, name='start-session'),
    path('session/', views.get_session, name='get-session'),
    path('session/reset/', views.reset_session, name='reset-session'),

    # Context intake
    path('session/context/', views.submit_context, name='submit-context'),

    # Pre-assessment activities
    path('activity/<int:activity_number>/submit/', views.submit_activity, name='submit-activity'),

    # Thinking styles
    path('thinking-styles/', views.get_thinking_styles, name='thinking-styles'),

    # Validation tasks
    path('validation/<str:domain>/submit/', views.submit_validation, name='submit-validation'),

    # Results
    path('results/', views.get_results, name='results'),

    # Roadmap
    path('roadmap/<str:domain>/', views.get_roadmap, name='roadmap'),
]
