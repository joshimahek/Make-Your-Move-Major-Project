import uuid
from django.db import models


class AssessmentSession(models.Model):
    """Tracks a single user's assessment journey."""

    STAGE_CHOICES = [
        ('context_intake', 'Context Intake'),
        ('pre_assessment', 'Pre-Assessment'),
        ('thinking_styles', 'Thinking Styles'),
        ('validation', 'Validation'),
        ('results', 'Results'),
        ('completed', 'Completed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session_key = models.CharField(max_length=40, db_index=True, blank=True, null=True)
    current_stage = models.CharField(max_length=20, choices=STAGE_CHOICES, default='context_intake')
    current_activity = models.IntegerField(default=0)  # 0 = not started, 1-6 = activity number

    # Context Intake answers (Stage 1)
    year_of_study = models.CharField(max_length=20, blank=True, default='')
    prior_experience = models.CharField(max_length=20, blank=True, default='')
    goal = models.CharField(max_length=20, blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Session {self.id} - Stage: {self.current_stage}"


class ActivityResponse(models.Model):
    """Stores raw interaction data for each of the 6 pre-assessment activities."""

    session = models.ForeignKey(
        AssessmentSession,
        on_delete=models.CASCADE,
        related_name='activity_responses'
    )
    activity_number = models.IntegerField(
        choices=[(i, f'Activity {i}') for i in range(1, 7)]
    )

    # Raw behavioral data as JSON
    response_data = models.JSONField(default=dict, help_text="Raw interaction data: order, positions, selections")
    behavioral_signals = models.JSONField(default=dict, help_text="Extracted signals: timing, retries, patterns")

    # Timing
    started_at = models.DateTimeField(auto_now_add=True)
    duration_ms = models.IntegerField(default=0, help_text="Total time spent on activity in milliseconds")

    class Meta:
        unique_together = ['session', 'activity_number']
        ordering = ['activity_number']

    def __str__(self):
        return f"Session {self.session_id} - Activity {self.activity_number}"


class DomainScore(models.Model):
    """Per-session scores for all 7 software engineering domains."""

    session = models.OneToOneField(
        AssessmentSession,
        on_delete=models.CASCADE,
        related_name='domain_scores'
    )

    # Domain scores (start at 0, accumulate via scoring engine)
    backend = models.FloatField(default=0)
    frontend = models.FloatField(default=0)
    devops = models.FloatField(default=0)
    data_eng = models.FloatField(default=0)
    ai_ml = models.FloatField(default=0)
    cybersecurity = models.FloatField(default=0)
    product_eng = models.FloatField(default=0)

    # Whether validation multipliers have been applied
    validation_applied = models.BooleanField(default=False)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Scores for {self.session_id}"

    def as_dict(self):
        """Return scores as a dictionary."""
        return {
            'backend': self.backend,
            'frontend': self.frontend,
            'devops': self.devops,
            'data_eng': self.data_eng,
            'ai_ml': self.ai_ml,
            'cybersecurity': self.cybersecurity,
            'product_eng': self.product_eng,
        }

    def get_ranked_domains(self):
        """Return domains sorted by score descending."""
        scores = self.as_dict()
        total = sum(scores.values()) or 1
        ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return [
            {
                'domain': domain,
                'score': score,
                'percentage': round((score / total) * 100, 1),
            }
            for domain, score in ranked
        ]


class ThinkingStyle(models.Model):
    """Stores the 3-4 matched thinking styles for a session."""

    STYLE_CHOICES = [
        ('experience_shaper', 'The Experience Shaper'),
        ('problem_definer', 'The Problem Definer'),
        ('systems_thinker', 'The Systems Thinker'),
        ('reliability_keeper', 'The Reliability Keeper'),
        ('signal_seeker', 'The Signal Seeker'),
        ('hypothesis_tester', 'The Hypothesis Tester'),
        ('threat_anticipator', 'The Threat Anticipator'),
        ('trust_architect', 'The Trust Architect'),
    ]

    session = models.ForeignKey(
        AssessmentSession,
        on_delete=models.CASCADE,
        related_name='thinking_styles'
    )
    style_key = models.CharField(max_length=30, choices=STYLE_CHOICES)
    confidence = models.FloatField(default=0, help_text="0-1 confidence score")
    description = models.TextField(blank=True, default='', help_text="AI-generated explanation (placeholder)")
    rank = models.IntegerField(default=0, help_text="1 = top match")

    class Meta:
        unique_together = ['session', 'style_key']
        ordering = ['rank']

    def __str__(self):
        return f"{self.get_style_key_display()} (rank {self.rank})"


class ValidationResponse(models.Model):
    """Stores validation task responses and engagement level."""

    ENGAGEMENT_CHOICES = [
        ('strong', 'Strong Engagement'),
        ('good', 'Good Engagement'),
        ('partial', 'Partial/Mixed'),
        ('low', 'Low Engagement'),
        ('skipped', 'Skipped'),
    ]

    DOMAIN_CHOICES = [
        ('frontend_product', 'Frontend/Product'),
        ('backend_devops', 'Backend/DevOps'),
        ('data_ai', 'Data/AI'),
        ('cybersecurity', 'Cybersecurity'),
    ]

    session = models.ForeignKey(
        AssessmentSession,
        on_delete=models.CASCADE,
        related_name='validation_responses'
    )
    domain = models.CharField(max_length=20, choices=DOMAIN_CHOICES)
    task_type = models.CharField(max_length=50)
    response_data = models.JSONField(default=dict)
    engagement_level = models.CharField(max_length=10, choices=ENGAGEMENT_CHOICES, default='partial')
    duration_ms = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Validation {self.domain} - {self.session_id}"
