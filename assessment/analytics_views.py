"""
Analytics API — aggregate metrics for the admin dashboard.

GET /api/analytics/  (admin-only)

Returns all key metrics computed from existing models,
no extra tables needed.
"""

from collections import Counter
from datetime import timedelta

from django.contrib.auth.models import User
from django.db.models import Avg, Count, F, Q
from django.utils import timezone

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from .models import (
    AssessmentSession, ActivityResponse, DomainScore,
    ThinkingStyle, ValidationResponse, DeepDiveChat,
)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_analytics(request):
    """Return aggregate analytics for the admin dashboard."""

    sessions = AssessmentSession.objects.all()
    total_sessions = sessions.count()
    total_users = User.objects.filter(is_staff=False).count()

    # ── 1. Completion Funnel ──
    stage_order = [
        'context_intake', 'pre_assessment', 'thinking_styles',
        'validation', 'results', 'completed',
    ]
    stage_counts = dict(
        sessions.values_list('current_stage')
        .annotate(count=Count('id'))
        .values_list('current_stage', 'count')
    )
    funnel = []
    cumulative = total_sessions
    for stage in stage_order:
        at_stage = stage_counts.get(stage, 0)
        funnel.append({
            'stage': stage,
            'count': cumulative,
            'dropped': total_sessions - cumulative,
        })
        cumulative -= at_stage

    # Completion rate
    completed_count = stage_counts.get('completed', 0) + stage_counts.get('results', 0)
    completion_rate = round((completed_count / total_sessions * 100), 1) if total_sessions else 0

    # ── 2. Domain Score Distribution ──
    domain_fields = [
        'backend', 'frontend', 'devops',
        'data_eng', 'ai_ml', 'cybersecurity', 'product_eng',
    ]
    domain_avgs = DomainScore.objects.aggregate(
        **{f'avg_{f}': Avg(f) for f in domain_fields}
    )
    domain_distribution = {
        field: round(domain_avgs.get(f'avg_{field}', 0) or 0, 2)
        for field in domain_fields
    }

    # ── 3. Top Domain per User ──
    top_domain_counter = Counter()
    for score in DomainScore.objects.all():
        scores_dict = score.as_dict()
        if scores_dict:
            top = max(scores_dict, key=scores_dict.get)
            top_domain_counter[top] += 1
    top_domains = [
        {'domain': domain, 'count': count}
        for domain, count in top_domain_counter.most_common()
    ]

    # ── 4. Thinking Style Distribution ──
    style_counts = dict(
        ThinkingStyle.objects.filter(rank__lte=3)
        .values_list('style_key')
        .annotate(count=Count('id'))
        .values_list('style_key', 'count')
    )
    thinking_styles = [
        {'style': style, 'count': count}
        for style, count in sorted(style_counts.items(), key=lambda x: x[1], reverse=True)
    ]

    # ── 5. Average Time per Activity ──
    activity_times = list(
        ActivityResponse.objects
        .values('activity_number')
        .annotate(avg_duration=Avg('duration_ms'))
        .order_by('activity_number')
    )
    for item in activity_times:
        item['avg_duration'] = round(item['avg_duration'] or 0, 0)

    # ── 6. Validation Engagement ──
    engagement_counts = dict(
        ValidationResponse.objects
        .values_list('engagement_level')
        .annotate(count=Count('id'))
        .values_list('engagement_level', 'count')
    )

    # ── 7. Deep-Dive Usage ──
    deep_dive_counts = dict(
        DeepDiveChat.objects
        .values_list('status')
        .annotate(count=Count('id'))
        .values_list('status', 'count')
    )

    # ── 8. User Demographics ──
    demographics = {
        'year_of_study': dict(
            sessions.exclude(year_of_study='')
            .values_list('year_of_study')
            .annotate(count=Count('id'))
            .values_list('year_of_study', 'count')
        ),
        'prior_experience': dict(
            sessions.exclude(prior_experience='')
            .values_list('prior_experience')
            .annotate(count=Count('id'))
            .values_list('prior_experience', 'count')
        ),
        'goal': dict(
            sessions.exclude(goal='')
            .values_list('goal')
            .annotate(count=Count('id'))
            .values_list('goal', 'count')
        ),
    }

    # ── 9. Sessions Over Time (last 30 days) ──
    thirty_days_ago = timezone.now() - timedelta(days=30)
    daily_sessions = list(
        sessions.filter(created_at__gte=thirty_days_ago)
        .extra(select={'date': 'DATE(created_at)'})
        .values('date')
        .annotate(count=Count('id'))
        .order_by('date')
    )
    # Convert date objects to strings
    for item in daily_sessions:
        item['date'] = str(item['date'])

    # ── 10. Average Total Time (sum of all activity durations per session) ──
    avg_total_time = (
        ActivityResponse.objects
        .values('session')
        .annotate(total_ms=Count('id', distinct=True))  # placeholder
    )
    # Better: sum all activity durations per session, then average
    from django.db.models import Sum
    session_totals = (
        ActivityResponse.objects
        .values('session')
        .annotate(total_duration=Sum('duration_ms'))
    )
    avg_total_duration_ms = 0
    if session_totals:
        durations = [s['total_duration'] or 0 for s in session_totals]
        avg_total_duration_ms = round(sum(durations) / len(durations), 0) if durations else 0

    return Response({
        'overview': {
            'total_users': total_users,
            'total_sessions': total_sessions,
            'completion_rate': completion_rate,
            'avg_total_duration_ms': avg_total_duration_ms,
        },
        'funnel': funnel,
        'domain_distribution': domain_distribution,
        'top_domains': top_domains,
        'thinking_styles': thinking_styles,
        'activity_times': activity_times,
        'engagement': engagement_counts,
        'deep_dive': deep_dive_counts,
        'demographics': demographics,
        'sessions_over_time': daily_sessions,
    })
