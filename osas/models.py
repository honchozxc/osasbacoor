import json
import string
from datetime import date

from django.contrib.auth.hashers import make_password
from django.contrib.auth.hashers import check_password
from django.core.exceptions import ValidationError
from django.core.files.storage import FileSystemStorage
from django.db.models import Count, F, Q
from django.utils import timezone
import random
from django.core.validators import MinLengthValidator, FileExtensionValidator, MinValueValidator, MaxValueValidator, \
    RegexValidator
from django.db import models, transaction
from django.contrib.auth.models import AbstractUser
from packaging.utils import _


class Course(models.Model):
    name = models.CharField(max_length=200)
    subtext = models.CharField(max_length=200, blank=True)
    logo = models.ImageField(upload_to='course_logos/', blank=True, null=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        try:
            old = Course.objects.get(id=self.id)
            if old.logo and old.logo != self.logo:
                old.logo.delete(save=False)
        except Course.DoesNotExist:
            pass
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.logo:
            self.logo.delete()
        super().delete(*args, **kwargs)


class CustomUser(AbstractUser):
    USER_TYPE_CHOICES = (
        (1, 'OSAS Staff'),
        (2, 'NSTP'),
        (3, 'Clinic'),
        (4, 'Alumni'),
        (5, 'Scholarship'),
        (6, 'Culture and Arts'),
        (7, 'Sports Development'),
        (8, 'Guidance Counseling'),
        (9, 'Student Welfare Services'),
        (10, 'Student Development Services'),
        (11, 'Misdeamenor'),
        (12, 'Admission'),
        (13, 'Job Placement'),
        (14, 'Student'),
        (15, 'Organization'),
    )

    OSAS_POSITION_CHOICES = (
        ('', 'Select Position (Optional)'),
        ('campus_admin', 'Campus Administrator'),
        ('osas_head', 'OSAS Head'),
        ('sws_head', 'Student Welfare Services Unit Head'),
        ('sds_head', 'Student Development Unit Head'),
        ('isps_head', 'Institutional Student Programs and Services Unit Head'),
        ('admission_head', 'Admission Head'),
        ('guidance_head', 'Guidance Head'),
        ('job_placement_head', 'Job Placement Head'),
        ('misdeamenor_head', 'Misdeamenor Head'),
        ('csg_president', 'CSG President'),
        ('sports_dev_head', 'Sports and Dev Head'),
        ('culture_arts_head', 'Culture and the Arts Dev Head'),
        ('nstp_head', 'NSTP Head'),
        ('scholarship_head', 'Scholarship Unit Head'),
    )

    GENDER_CHOICES = (
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
        ('N', 'Prefer not to say'),
    )

    # Common fields for all users
    user_type = models.PositiveSmallIntegerField(choices=USER_TYPE_CHOICES, null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True, default='default.png')
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    address = models.CharField(max_length=255, blank=True)

    # Position field only for OSAS staff
    osas_position = models.CharField(max_length=20, choices=OSAS_POSITION_CHOICES, blank=True, null=True)

    # Fields for students
    student_number = models.CharField(max_length=20, blank=True, null=True)
    course = models.ForeignKey('Course', on_delete=models.SET_NULL, null=True, blank=True)
    year_level = models.CharField(max_length=10, blank=True, null=True)
    section = models.CharField(max_length=10, blank=True, null=True)

    # Fields for OSAS units
    department = models.CharField(max_length=100, blank=True, null=True)

    # Verification documents
    id_photo = models.ImageField(upload_to='verification_ids/', null=True, blank=True)
    cor_photo = models.ImageField(upload_to='verification_cor/', null=True, blank=True,
                                  verbose_name="Certificate of Registration (COR)")

    # Other fields
    is_verified = models.BooleanField(default=False)
    date_modified = models.DateTimeField(auto_now=True)
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    archived_by = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL,
                                    related_name='archived_users')

    def __str__(self):
        return self.get_full_name() or self.username

    def get_full_name(self):
        full_name = f"{self.first_name} {self.last_name}"
        return full_name.strip() or self.username

    @property
    def is_organization(self):
        """Check if this user is an organization account"""
        return self.user_type == 15

    @property
    def organization(self):
        """Get the linked organization if this is an organization account"""
        if hasattr(self, 'organization_account'):
            return self.organization_account
        return None

    @property
    def is_student(self):
        return self.user_type == 14

    @property
    def is_osas_unit(self):
        return self.user_type in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]

    @property
    def position(self):
        """Get the appropriate position based on user type"""
        if self.is_osas_unit:
            return self.osas_position
        return None

    def get_position_display(self):
        """Returns a more readable version of the position"""
        if self.is_osas_unit and self.osas_position:
            return dict(self.OSAS_POSITION_CHOICES).get(self.osas_position, 'Staff Member')
        return 'Member'

    def save(self, *args, **kwargs):
        # Set superuser status for OSAS Staff
        if self.user_type == 1:
            self.is_superuser = True
        elif self.user_type != 1 and not self.is_superuser:
            self.is_superuser = False
        super().save(*args, **kwargs)


# ------------------------------------------------ SDS - Organization --------------------------------------------------
class Organization(models.Model):
    user_account = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='organization_account',
        null=True,
        blank=True
    )

    ORGANIZATION_TYPE_CHOICES = (
        ('student', 'Student Organization'),
        ('sociocultural', 'Sociocultural Organization'),
    )

    ORGANIZATION_STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('pending', 'Pending Registration'),
        ('expired', 'Expired'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    )

    ORGANIZATION_POSITION_CHOICES = (
        ('', 'Select Organization Position'),
        ('4th_year_board_director', '4th Year Board of Director'),
        ('4th_year_board_member', '4th Year Board Member'),
        ('4th_year_senator', '4th Year Senator'),
        ('1st_year_board_director', '1st Year Board of Director'),
        ('1st_year_board_member', '1st Year Board Member'),
        ('2nd_year_board_director', '2nd Year Board of Director'),
        ('2nd_year_board_member', '2nd Year Board Member'),
        ('2nd_year_chairperson', '2nd Year Chairperson'),
        ('2nd_year_senator', '2nd Year Senator'),
        ('3rd_year_board_director', '3rd Year Board of Director'),
        ('3rd_year_board_member', '3rd Year Board Member'),
        ('3rd_year_chairperson', '3rd Year Chairperson'),
        ('4th_year_chairperson', '4th Year Chairperson'),
        ('admin_custodian', 'Admin Custodian'),
        ('asst_business_manager', 'Assistant Business Manager'),
        ('asst_public_information_officer', 'Assistant Public Information Officer for all social media'),
        ('asst_public_relations_officer', 'Assistant Public Relations Officer'),
        ('asst_secretary', 'Asst. Secretary'),
        ('asst_treasurer', 'Asst. Treasurer'),
        ('assistant_coach', 'Assistant Coach'),
        ('assistant_secretary', 'Assistant Secretary'),
        ('associate_editor_external', 'Associate Editor - External'),
        ('associate_editor_internal', 'Associate Editor - Internal'),
        ('associate_secretary', 'Associate Secretary'),
        ('auditor', 'Auditor'),
        ('batch_representative', 'Batch Representative'),
        ('board_director', 'Board of Directors'),
        ('bookkeeper', 'Bookkeeper'),
        ('business_manager', 'Business Manager'),
        ('cartoonist', 'Cartoonist'),
        ('chairman_board', 'Chairman of the Board'),
        ('chairperson', 'Chairperson'),
        ('copy_editor', 'Copy Editor'),
        ('copy_editor_photojournalist', 'Copy Editor / Photojournalist'),
        ('corporate_society', 'Corporate Society'),
        ('creatives', 'Creatives'),
        ('creative_and_logistics', 'Creative And Logistics'),
        ('deputy_director_external_affairs', 'Deputy Director of External Affairs'),
        ('deputy_director_internal_affairs', 'Deputy Director of Internal Affairs'),
        ('deputy_director_multimedia_publications', 'Deputy Director of Multimedia Publications'),
        ('deputy_director_resource_assembly', 'Deputy Director of Resource Assembly'),
        ('deputy_director_resource_management', 'Deputy Director of Resource Management'),
        ('digital_media', 'Digital Media'),
        ('director_external_affairs', 'Director of External Affairs'),
        ('director_internal_affairs', 'Director of Internal Affairs'),
        ('director_multimedia_publications', 'Director of Multimedia Publications'),
        ('director_resource_assembly', 'Director of Resource Assembly'),
        ('director_resource_management', 'Director of Resource Management'),
        ('editor_in_chief', 'Editor-in-Chief'),
        ('editorial_manager', 'Editorial Manager'),
        ('english_1st_year_rep', 'English 1st Year Representative'),
        ('english_2nd_year_rep', 'English 2nd Year Representative'),
        ('english_3rd_year_rep', 'English 3rd Year Representative'),
        ('english_4th_year_rep', 'English 4th Year Representative'),
        ('events_management', 'Events Management'),
        ('executive_board_secretary', 'Executive Board Secretary'),
        ('executive_president', 'Executive President'),
        ('executive_secretary', 'Executive Secretary'),
        ('executive_vice_president', 'Executive Vice President'),
        ('executive_vice_president_external_affairs', 'Executive Vice President for External Affairs'),
        ('executive_vice_president_internal_affairs', 'Executive Vice President for Internal Affairs'),
        ('external_vice_president', 'External Vice President'),
        ('financial_director', 'Financial Director'),
        ('gad_representative', 'GAD Representative'),
        ('gender_development_representative', 'Gender and Development Representative'),
        ('gourmet_committee', 'Gourmet Committee'),
        ('head_multimedia_committee', 'Head Multimedia Committee'),
        ('head_photojournalist', 'Head Photojournalist'),
        ('head_sentinel', 'Head Sentinel'),
        ('head_stage_design', 'Head of Stage and Design'),
        ('internal_vice_president', 'Internal Vice President'),
        ('layout_graphic_artist', 'Layout and Graphic Artist'),
        ('legislative_secretary', 'Legislative Secretary'),
        ('logistics', 'Logistics'),
        ('math_1st_year_rep', 'Math 1st Year Representative'),
        ('math_2nd_year_rep', 'Math 2nd Year Representative'),
        ('math_3rd_year_rep', 'Math 3rd Year Representative'),
        ('math_4th_year_rep', 'Math 4th Year Representative'),
        ('member', 'Member'),
        ('multimedia_committee', 'Multimedia Committee'),
        ('multimedia_manager', 'Multimedia Manager'),
        ('news_presenter', 'News Presenter'),
        ('page_communication_officer', 'Page Communication Officer'),
        ('photojournalist', 'Photojournalist'),
        ('pod', 'POD'),
        ('president', 'President'),
        ('procurement_committee', 'Procurement Committee'),
        ('property_custodian', 'Property Custodian'),
        ('pro', 'PRO'),
        ('public_image_officer', 'Public Image Officer'),
        ('public_information_officer', 'Public Information Officer'),
        ('public_relations_officer', 'Public Relations Officer'),
        ('publication_officer', 'Publication Officer'),
        ('research_finance_committee', 'Research and Finance Committee'),
        ('secretariat', 'Secretariat'),
        ('secretary', 'Secretary'),
        ('senate_president', 'Senate President'),
        ('senator_academic_affairs', 'Senator for Academic Affairs'),
        ('senator_audit', 'Senator for Audit'),
        ('senator_constitutional_amendments', 'Senator for Constitutional and Amendments'),
        ('senator_creatives_publication', 'Senator for Creatives and Publication'),
        ('senator_finance_budgeting', 'Senator for Finance and Budgeting'),
        ('senator_gender_development', 'Senator on Gender and Development'),
        ('senator_sports_youth_development', 'Senator on Sports and Youth Development'),
        ('senator_student_rights_welfare', 'Senator for Student Rights and Welfare'),
        ('sentinel', 'Sentinel'),
        ('social_media_support', 'Social Media Support'),
        ('staff_administrative', 'Staff on Administrative'),
        ('staff_creative_content_development', 'Staff on Creative Content Development'),
        ('staff_creative_media_development', 'Staff on Creative Media Development'),
        ('staff_internal_rights_welfare', 'Staff on Internal Rights and Welfare'),
        ('staff_technical_operations_support', 'Staff on Technical Operations and Support'),
        ('stage_design_committee', 'Stage and Design Committee'),
        ('section_writer', 'Section Writer'),
        ('team_coach', 'Team Coach'),
        ('technical', 'Technical'),
        ('technical_committee', 'Technical Committee'),
        ('technical_support', 'Technical Support'),
        ('technical_support_committee', 'Technical and Support Committee'),
        ('treasurer', 'Treasurer'),
        ('vice_chairperson', 'Vice Chairperson'),
        ('vice_president', 'Vice President'),
        ('vice_president_external', 'Vice President for External Affairs'),
        ('vice_president_internal', 'Vice President for Internal Affairs'),
        ('vice_president_external_administration', 'Vice President for External Administration'),
        ('vice_president_external_operation', 'Vice President for External Operation'),
        ('vice_president_internal_affairs', 'Vice President for Internal Affairs'),
    )

    # Organization authentication fields
    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=128)
    email = models.EmailField(unique=True)
    last_login = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    # Organization Basic Information
    organization_name = models.CharField(max_length=255)
    organization_acronym = models.CharField(max_length=50)
    organization_description = models.TextField()
    organization_mission = models.TextField()
    organization_vision = models.TextField()
    organization_type = models.CharField(max_length=20, choices=ORGANIZATION_TYPE_CHOICES)
    organization_email = models.EmailField()

    # Organization Status and Dates
    _organization_status = models.CharField(
        max_length=20,
        choices=ORGANIZATION_STATUS_CHOICES,
        default='pending',
        db_column='organization_status'
    )
    organization_valid_from = models.DateField()
    organization_valid_until = models.DateField()

    # Adviser Information
    organization_adviser_name = models.CharField(max_length=255)
    organization_adviser_department = models.CharField(max_length=100)
    organization_adviser_email = models.EmailField()
    organization_adviser_phone = models.CharField(max_length=20)

    # Co-Adviser Information (Optional)
    organization_coadviser_name = models.CharField(max_length=255, blank=True, null=True, verbose_name="Co-Adviser Name")
    organization_coadviser_department = models.CharField(max_length=100, blank=True, null=True, verbose_name="Co-Adviser Department")
    organization_coadviser_email = models.EmailField(blank=True, null=True, verbose_name="Co-Adviser Email")
    organization_coadviser_phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Co-Adviser Phone")

    # Organization Documents
    organization_calendar_activities = models.FileField(
        upload_to='organizations/%Y/%m/school_year_%Y/calendar_activities/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx'])]
    )
    organization_logo = models.ImageField(
        upload_to='organizations/%Y/%m/school_year_%Y/logos/',
        blank=True,
        null=True
    )
    organization_adviser_cv = models.FileField(
        upload_to='organizations/%Y/%m/school_year_%Y/adviser_documents/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx'])]
    )
    organization_cog = models.FileField(
        upload_to='organizations/%Y/%m/school_year_%Y/certificates/',
        verbose_name="Certificate of Grades",
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx'])]
    )
    organization_group_picture = models.ImageField(
        upload_to='organizations/%Y/%m/school_year_%Y/group_photos/',
        blank=True,
        null=True
    )
    organization_cbl = models.FileField(
        upload_to='organizations/%Y/%m/school_year_%Y/constitution/',
        verbose_name="Constitution and By-Laws",
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx'])]
    )
    organization_list_members = models.FileField(
        upload_to='organizations/%Y/%m/school_year_%Y/member_lists/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx'])]
    )
    organization_acceptance_letter = models.FileField(
        upload_to='organizations/%Y/%m/school_year_%Y/acceptance_letters/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx'])]
    )
    organization_ar = models.FileField(
        upload_to='organizations/%Y/%m/school_year_%Y/accomplishment_reports/',
        verbose_name="Accomplishment Report",
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx'])]
    )
    organization_previous_calendar = models.FileField(
        upload_to='organizations/%Y/%m/school_year_%Y/previous_calendars/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx'])]
    )
    organization_financial_report = models.FileField(
        upload_to='organizations/%Y/%m/school_year_%Y/financial_reports/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx'])]
    )
    organization_coa = models.FileField(
        upload_to='organizations/%Y/%m/school_year_%Y/certificates/',
        verbose_name="Certificate of Assessment",
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx'])]
    )
    organization_member_biodata = models.FileField(
        upload_to='organizations/%Y/%m/school_year_%Y/member_biodata/',
        verbose_name="Biodata/CV of Members",
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx'])]
    )
    organization_good_moral = models.FileField(
        upload_to='organizations/%Y/%m/school_year_%Y/certificates/',
        verbose_name="Good Moral Certificate",
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx'])]
    )

    # Organization Approval Information
    organization_approved_by = models.ForeignKey(
        'CustomUser',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='approved_organizations'
    )
    organization_approved_at = models.DateTimeField(null=True, blank=True)
    organization_rejection_reason = models.TextField(blank=True, null=True)

    # Organization Members (as JSON field)
    organization_members = models.JSONField(
        default=list,
        blank=True,
        null=True,
        help_text="Store organization members as JSON"
    )

    renew_count = models.IntegerField(default=0, help_text="Number of times the organization has renewed")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    archived_by = models.ForeignKey(
        'CustomUser',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='archived_organizations'
    )
    archive_reason = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.organization_name} ({self.organization_acronym})"

    @property
    def organization_status(self):
        today = timezone.now().date()

        # If we don't have valid dates, return the stored status
        if not self.organization_valid_from or not self.organization_valid_until:
            return self._organization_status

        # If organization is rejected, keep it as rejected (manual override)
        if self._organization_status == 'rejected':
            return 'rejected'

        # If organization is inactive, keep it as inactive (manual override)
        if self._organization_status == 'inactive':
            return 'inactive'

        # Check if organization has EXPIRED
        if self.organization_valid_until < today:
            return 'expired'

        # Check if organization is currently within valid period
        if self.organization_valid_from <= today <= self.organization_valid_until:
            # Only become active if it was manually approved
            if self._organization_status == 'active':
                return 'active'
            # If it's pending and within dates, it stays pending until manual approval
            elif self._organization_status == 'pending':
                return 'pending'
            # If it was expired but dates are now valid, it stays expired until re-approval
            elif self._organization_status == 'expired':
                return 'expired'

        # Check if organization validity is in the FUTURE
        if self.organization_valid_from > today:
            return 'pending'

        # Fallback to stored status
        return self._organization_status

    @organization_status.setter
    def organization_status(self, value):
        self._organization_status = value

    @property
    def organization_is_active(self):
        today = timezone.now().date()
        return (self.organization_status == 'active' and
                self.organization_valid_from and
                self.organization_valid_until and
                self.organization_valid_from <= today <= self.organization_valid_until)

    @property
    def organization_needs_renewal(self):
        today = timezone.now().date()
        return (self.organization_status == 'expired' or
                (self.organization_valid_until and
                 self.organization_valid_until < today))

    @property
    def organization_member_count(self):
        if not self.organization_members:
            return 0
        # Ensure organization_members is a list and count valid members
        if isinstance(self.organization_members, list):
            # Count members that have at least first_name and last_name
            valid_members = [
                member for member in self.organization_members
                if member and isinstance(member, dict) and
                member.get('first_name') and member.get('last_name')
            ]
            return len(valid_members)
        return 0

    @property
    def organization_has_minimum_members(self):
        return self.organization_member_count >= 3

    @property
    def current_school_year(self):
        if self.organization_valid_from:
            return f"{self.organization_valid_from.year}-{self.organization_valid_from.year + 1}"
        return None

    @property
    def all_requirements_submitted(self):
        required_docs = [
            'organization_calendar_activities',
            'organization_logo',
            'organization_adviser_cv',
            'organization_cog',
            'organization_group_picture',
            'organization_cbl',
            'organization_list_members',
            'organization_acceptance_letter',
            'organization_ar',
            'organization_previous_calendar',
            'organization_good_moral',
            'organization_member_biodata',
        ]

        # Add student-specific requirements
        if self.organization_type == 'student':
            required_docs.extend([
                'organization_financial_report',
                'organization_coa'
            ])

        # Check if all required documents are uploaded
        for doc_field in required_docs:
            if not getattr(self, doc_field):
                return False

        # Check if minimum members requirement is met
        if not self.organization_has_minimum_members:
            return False

        return True

    @property
    def can_be_approved(self):
        return (self._organization_status == 'pending' and
                self.all_requirements_submitted and
                self.organization_valid_from and
                self.organization_valid_until and
                self.organization_valid_until > timezone.now().date())

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)

    def get_organization_position_display(self):
        return dict(self.ORGANIZATION_POSITION_CHOICES).get(self.organization_position, 'Organization Member')

    def add_organization_member(self, member_data):
        if not self.organization_members:
            self.organization_members = []

        # Validate member data
        required_fields = ['first_name', 'last_name', 'position']
        for field in required_fields:
            if field not in member_data:
                raise ValidationError(f"Member data must contain {field}")

        # Add unique ID for the member
        member_data['id'] = len(self.organization_members) + 1
        member_data['added_at'] = timezone.now().isoformat()

        self.organization_members.append(member_data)
        self.save()

    def remove_organization_member(self, member_id):
        if not self.organization_members:
            raise ValidationError("No members to remove")

        self.organization_members = [m for m in self.organization_members if m.get('id') != member_id]
        self.save()

    def update_organization_member(self, member_id, member_data):
        if not self.organization_members:
            raise ValidationError("No members to update")

        for i, member in enumerate(self.organization_members):
            if member.get('id') == member_id:
                self.organization_members[i].update(member_data)
                self.organization_members[i]['updated_at'] = timezone.now().isoformat()
                self.save()
                return

        raise ValidationError("Member not found")

    def organization_approve_registration(self, approved_by):
        if not self.can_be_approved:
            raise ValidationError(
                "Organization cannot be approved. Please ensure all requirements are submitted and dates are valid.")

        # Check minimum members before approval
        if not self.organization_has_minimum_members:
            raise ValidationError("Organization must have at least 3 members before approval")

        # Check if all required documents are submitted
        if not self.all_requirements_submitted:
            raise ValidationError("All required documents must be submitted before approval")

        # MANUALLY set status to active - only happens when approve button is clicked
        self._organization_status = 'active'
        self.organization_approved_by = approved_by
        self.organization_approved_at = timezone.now()
        self.save()

    def organization_reject_registration(self, reason):
        self._organization_status = 'rejected'
        self.organization_rejection_reason = reason
        self.save()

    def organization_renew_registration(self, new_valid_from, new_valid_until):
        if not self.organization_needs_renewal:
            raise ValidationError("Organization does not need renewal yet.")

        self.organization_valid_from = new_valid_from
        self.organization_valid_until = new_valid_until
        # Set to pending for re-approval
        self._organization_status = 'pending'
        self.save()

    def clean(self):
        required_fields = [
            'organization_name', 'organization_acronym', 'organization_description',
            'organization_mission', 'organization_vision', 'organization_type',
            'organization_email', 'organization_adviser_name', 'organization_adviser_department',
            'organization_valid_from', 'organization_valid_until'
        ]

        for field in required_fields:
            if not getattr(self, field):
                raise ValidationError(
                    f"{field.replace('organization_', '').replace('_', ' ').title()} is required for organizations.")

        # Validate registration period
        if self.organization_valid_until <= self.organization_valid_from:
            raise ValidationError("Valid until date must be after valid from date.")

        # Validate registration period is exactly 1 year
        if (self.organization_valid_until - self.organization_valid_from).days != 365:
            raise ValidationError("Organization registration must be exactly 1 year.")

        # Only validate minimum members for existing organizations that are active or pending approval
        if self.pk and self._organization_status in ['active', 'pending']:
            if not self.organization_has_minimum_members:
                raise ValidationError("Organization must have at least 3 members.")

        # Validate required documents for ALL organizations
        required_docs_all = [
            'organization_calendar_activities',
            'organization_logo',
            'organization_adviser_cv',
            'organization_cog',
            'organization_group_picture',
            'organization_cbl',
            'organization_list_members',
            'organization_acceptance_letter',
            'organization_ar',
            'organization_previous_calendar',
            'organization_good_moral',
            'organization_member_biodata',
        ]

        # Validate required documents for Student Organizations (additional)
        if self.organization_type == 'student':
            required_docs_student = [
                'organization_financial_report',
                'organization_coa'
            ]
            required_docs_all.extend(required_docs_student)

        # Check if documents are provided
        missing_docs = []
        for doc_field in required_docs_all:
            if not getattr(self, doc_field):
                field_name = doc_field.replace('organization_', '').replace('_', ' ').title()
                missing_docs.append(field_name)

        if missing_docs:
            raise ValidationError(
                f"The following documents are required: {', '.join(missing_docs)}"
            )

    class Meta:
        verbose_name = "Organization"
        verbose_name_plural = "Organizations"


class Certificate(models.Model):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='certificates'
    )

    # Certificate file
    certificate_file = models.FileField(
        upload_to='certificates/%Y/%m/',
        blank=True,
        null=True
    )

    # Certificate details
    issue_date = models.DateField()
    venue = models.CharField(max_length=255)

    # Status and tracking
    is_active = models.BooleanField(default=True)
    generated_by = models.ForeignKey(
        'CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='generated_certificates'
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Certificate for {self.organization.organization_name} - {self.issue_date}"

    @property
    def organization_name(self):
        return self.organization.organization_name

    @property
    def organization_acronym(self):
        return self.organization.organization_acronym

    @property
    def organization_type(self):
        return self.organization.organization_type

    @property
    def valid_from(self):
        return self.organization.organization_valid_from

    @property
    def valid_until(self):
        return self.organization.organization_valid_until

    class Meta:
        verbose_name = "Certificate"
        verbose_name_plural = "Certificates"
        ordering = ['-issue_date']


class AccomplishmentRecord(models.Model):
    RECORD_TYPE_CHOICES = (
        ('event', 'Event/Activity'),
        ('meeting', 'Meeting'),
        ('training', 'Training/Workshop'),
        ('community', 'Community Service'),
        ('achievement', 'Achievement/Award'),
        ('other', 'Other'),
    )

    SEMESTER_CHOICES = (
        ('1st', '1st Semester'),
        ('2nd', '2nd Semester'),
        ('summer', 'Summer'),
    )

    submitted_by = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='submitted_accomplishments'
    )

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='accomplishment_records',
        null=True,
        blank=True,
        help_text="Automatically set for organization users"
    )

    # Record basic information
    title = models.CharField(max_length=255)
    record_type = models.CharField(max_length=20, choices=RECORD_TYPE_CHOICES)
    date_conducted = models.DateField()
    venue = models.CharField(max_length=255, blank=True, null=True)

    # Semester information
    semester = models.CharField(max_length=10, choices=SEMESTER_CHOICES)
    school_year = models.CharField(max_length=9, help_text="Format: 2024-2025")

    # Objectives and outcomes
    objectives = models.TextField(
        blank=True,
        null=True,
        help_text="Objectives of the activity"
    )

    outcomes = models.TextField(
        blank=True,
        null=True,
        help_text="Outcomes and results achieved"
    )

    # Quantitative data
    number_of_participants = models.PositiveIntegerField(default=0)
    duration_hours = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        help_text="Duration in hours"
    )

    # Budget information (optional)
    budget_utilized = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        blank=True,
        null=True,
        help_text="Budget utilized for this activity"
    )

    # Main report file (required)
    main_report = models.FileField(
        upload_to='accomplishment_records/%Y/%m/main_reports/',
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx'])],
        help_text="Main accomplishment report document"
    )

    # Archive fields
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    archived_by = models.ForeignKey(
        CustomUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='archived_accomplishments'
    )
    archive_reason = models.TextField(blank=True, null=True, help_text="Reason for archiving this report")

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Accomplishment Record"
        verbose_name_plural = "Accomplishment Records"
        ordering = ['-date_conducted', '-created_at']
        indexes = [
            models.Index(fields=['submitted_by', 'semester', 'school_year']),
            models.Index(fields=['date_conducted']),
            models.Index(fields=['record_type']),
            models.Index(fields=['is_archived']),
        ]

    def __str__(self):
        if self.organization:
            return f"{self.organization.organization_acronym} - {self.title} ({self.semester} {self.school_year})"
        else:
            return f"{self.submitted_by.get_full_name()} - {self.title} ({self.semester} {self.school_year})"

    def clean(self):
        """Validate the model data"""
        if self.date_conducted > timezone.now().date():
            raise ValidationError("Date conducted cannot be in the future.")

        # Validate school year format (e.g., 2024-2025)
        if self.school_year and not self._validate_school_year_format():
            raise ValidationError("School year must be in format: YYYY-YYYY (e.g., 2024-2025)")

    def _validate_school_year_format(self):
        """Validate school year format"""
        import re
        pattern = r'^\d{4}-\d{4}$'
        if not re.match(pattern, self.school_year):
            return False

        years = self.school_year.split('-')
        if int(years[1]) - int(years[0]) != 1:
            return False

        return True

    @property
    def organization_name(self):
        """Get organization name if available"""
        if self.organization:
            return self.organization.organization_name
        return "N/A"

    @property
    def organization_acronym(self):
        """Get organization acronym if available"""
        if self.organization:
            return self.organization.organization_acronym
        return "N/A"

    @property
    def has_supporting_files(self):
        """Check if record has supporting files"""
        return self.supporting_files.exists()

    @property
    def display_period(self):
        """Display semester and school year"""
        return f"{self.semester} Semester, {self.school_year}"

    @property
    def submitted_by_name(self):
        """Get submitter's name"""
        return self.submitted_by.get_full_name()

    @property
    def archived_by_name(self):
        """Get archiver's name"""
        return self.archived_by.get_full_name() if self.archived_by else "System"

    def archive(self, user, reason=""):
        """Archive the accomplishment record"""
        self.is_archived = True
        self.archived_at = timezone.now()
        self.archived_by = user
        self.archive_reason = reason
        self.save()

    def unarchive(self):
        """Unarchive the accomplishment record"""
        self.is_archived = False
        self.archived_at = None
        self.archived_by = None
        self.archive_reason = None
        self.save()

    def save(self, *args, **kwargs):
        # Auto-set organization for organization users
        if not self.organization and self.submitted_by.user_type == 15:
            if hasattr(self.submitted_by, 'organization_account'):
                self.organization = self.submitted_by.organization_account
        super().save(*args, **kwargs)


class SupportingFile(models.Model):
    accomplishment_record = models.ForeignKey(
        AccomplishmentRecord,
        on_delete=models.CASCADE,
        related_name='supporting_files'
    )

    file = models.FileField(
        upload_to='accomplishment_records/%Y/%m/supporting_files/',
        validators=[FileExtensionValidator(
            allowed_extensions=[
                'pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png',
                'xls', 'xlsx', 'mp4', 'avi', 'mov', 'zip'
            ]
        )]
    )

    description = models.CharField(max_length=255, blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Supporting File"
        verbose_name_plural = "Supporting Files"
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.filename} - {self.description or 'No description'}"

    @property
    def filename(self):
        """Get the filename without path"""
        return self.file.name.split('/')[-1] if self.file.name else ""


# ------------------------------------------------ User Activity Section -----------------------------------------------
class UserActivityLog(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    activity = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.activity}"


# ---------------------------------------------- Downloadbles/Template Section -----------------------------------------
class Downloadable(models.Model):
    CATEGORY_CHOICES = (
        ('osas_forms', 'OSAS Forms'),
        ('society_forms', 'Society Forms'),
        ('scholarship_forms', 'Scholarship Forms'),
        ('ojt_forms', 'OJT Forms'),
        ('guidelines', 'Guidelines'),
        ('manuals', 'Manuals'),
        ('others', 'Others'),
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to='downloadables/')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='created_downloadables')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    archived_by = models.ForeignKey(CustomUser,null=True, blank=True, on_delete=models.SET_NULL,
                                    related_name='archived_downloadables')

    def __str__(self):
        return self.title

    def get_file_name(self):
        return self.file.name.split('/')[-1]

    def get_file_size(self):
        try:
            size = self.file.size
            if size < 1024:
                return f"{size} bytes"
            elif size < 1024 * 1024:
                return f"{round(size / 1024, 1)} KB"
            else:
                return f"{round(size / (1024 * 1024), 1)} MB"
        except:
            return "N/A"


# ------------------------------------------------ Announcement Section ------------------------------------------------
class AnnouncementImage(models.Model):
    announcement = models.ForeignKey('Announcement', on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='announcements/images/%Y/%m/%d/')
    caption = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image {self.order} for {self.announcement.title}"


class Announcement(models.Model):
    CATEGORY_CHOICES = [
        ('BASIC', 'Basic Announcements'),
        ('ENROLLMENT', 'Enrollment Announcements'),
        ('EVENT', 'Event Announcements'),
        ('SUSPENSION', 'Class Suspension Announcements'),
        ('EMERGENCY', 'Emergency Announcements'),
        ('SCHOLARSHIP', 'Scholarship Announcements'),
    ]

    COURSE_CHOICES = [
        ('BSIT', 'BS in Information Technology'),
        ('BSCS', 'BS in Computer Science'),
        ('BSHM', 'BS in Hospitality Management'),
        ('BSBM', 'BS in Business Management'),
        ('BSE', 'BS in Secondary Education'),
        ('BSCrim', 'BS in Criminology'),
        ('BSPsy', 'BS in Psychology'),
    ]

    # Core fields for all announcements
    title = models.CharField(max_length=200, validators=[MinLengthValidator(5)])
    content = models.TextField(validators=[MinLengthValidator(10)])
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    publish_date = models.DateTimeField(auto_now_add=True)
    is_published = models.BooleanField(default=True)
    author = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    link = models.URLField(max_length=500, blank=True, null=True)
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    archived_by = models.ForeignKey(CustomUser, null=True, blank=True, on_delete=models.SET_NULL,
                                    related_name='archived_announcements')

    # Enrollment-specific fields
    courses = models.JSONField(default=list, blank=True, null=True)
    enrollment_start = models.DateTimeField(null=True, blank=True)
    enrollment_end = models.DateTimeField(null=True, blank=True)

    # Event-specific fields
    event_date = models.DateTimeField(null=True, blank=True)
    location = models.CharField(max_length=200, null=True, blank=True)

    # Class Suspension-specific fields
    suspension_date = models.DateField(null=True, blank=True)
    until_suspension_date = models.DateField(null=True, blank=True)

    # Emergency-specific fields
    contact_info = models.TextField(null=True, blank=True)

    # Scholarship-specific fields
    scholarship = models.ForeignKey(
        'Scholarship',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='announcements'
    )
    application_start = models.DateTimeField(null=True, blank=True)
    application_end = models.DateTimeField(null=True, blank=True)
    requirements = models.TextField(null=True, blank=True)
    benefits = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.title} ({self.get_category_display()})"

    def get_first_image(self):
        return self.images.first()

    def clean(self):
        """Validate category-specific requirements"""
        from django.core.exceptions import ValidationError

        # Enrollment Announcements validation
        if self.category == 'ENROLLMENT':
            if not all([self.enrollment_start, self.enrollment_end]):
                raise ValidationError("Enrollment announcements require both start and end dates.")
            if self.enrollment_start >= self.enrollment_end:
                raise ValidationError("Enrollment end date must be after start date.")
            if not self.courses:
                raise ValidationError("Enrollment announcements require at least one course.")

        # Event Announcements validation
        if self.category == 'EVENT':
            if not self.event_date:
                raise ValidationError("Event announcements require an event date.")
            if not self.location:
                raise ValidationError("Event announcements require a location.")

        # Class Suspension Announcements validation
        if self.category == 'SUSPENSION':
            if not self.suspension_date:
                raise ValidationError("Class suspension announcements require a suspension date.")
            if self.until_suspension_date and self.suspension_date > self.until_suspension_date:
                raise ValidationError("Until suspension date must be after or equal to suspension date.")

        # Emergency Announcements validation
        if self.category == 'EMERGENCY':
            if not self.contact_info:
                raise ValidationError("Emergency announcements require contact information.")

        # Scholarship Announcements validation
        if self.category == 'SCHOLARSHIP':
            if self.application_start and self.application_end and self.application_start >= self.application_end:
                raise ValidationError("Scholarship application end date must be after start date.")
            if self.application_start and self.application_start < timezone.now():
                raise ValidationError("Application period cannot start in the past.")
            if not self.scholarship and not (self.requirements and self.benefits):
                raise ValidationError(
                    "Scholarship announcements require either a linked scholarship or manual entry of requirements and benefits.")

    class Meta:
        ordering = ['-publish_date']
        verbose_name_plural = "Announcements"

    def get_unique_courses_display(self):
        if not self.courses:
            return []
        choice_dict = dict(self.COURSE_CHOICES)
        unique_courses = []
        seen = set()
        for code in self.courses:
            if code not in seen:
                seen.add(code)
                unique_courses.append(choice_dict.get(code, code))
        return unique_courses


# ---------------------------------------------- Editable Pages Section ------------------------------------------------
class HomePageContent(models.Model):
    logo = models.ImageField(upload_to='home/', null=True, blank=True, default='images/cvsu-logo.png')
    title = models.CharField(max_length=200, default="Cavite State University - Bacoor City Campus")
    tagline = models.CharField(max_length=200, default="Office of Student Affairs and Services")

    # Office Hours
    weekdays_hours = models.CharField(max_length=100, default="0:00 AM - 0:00 PM")
    saturday_hours = models.CharField(max_length=100, default="0:00 AM - 00:00 PM")
    sunday_hours = models.CharField(max_length=100, default="Closed")

    last_updated = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return "Home Page Content"

    class Meta:
        verbose_name_plural = "Home Page Content"


class AboutPageContent(models.Model):
    title = models.CharField(max_length=200, default="OSAS Bacoor Campus")
    tagline = models.CharField(max_length=200, default="Shaping Future Leaders with Character and Excellence")
    about_text = models.TextField(
        default="The Office of Student Affairs and Services (OSAS) at Cavite State University supports students' "
                "personal and academic growth...")
    mission = models.TextField(
        default="Cavite State University shall provide excellent, equitable and relevant educational opportunities...")
    vision = models.TextField(
        default="The premier university in historic Cavite recognized for excellence in character development...")
    goals = models.TextField(
        default="To look after the educational, vocational, and personal development needs of students...")
    objectives = models.JSONField(default=list)
    courses = models.ManyToManyField(Course, blank=True)
    last_updated = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return "About Page Content"

    class Meta:
        verbose_name_plural = "About Page Content"


class StudentDisciplineContent(models.Model):
    title = models.CharField(max_length=200, default="Title")
    tagline = models.CharField(max_length=200, default="Tagline")
    about_text = models.TextField(
        default="Brief description about the Student Discipline Unit..."
    )

    # Principles section
    principles_title = models.CharField(max_length=200, default="Our Principles")
    principles_items = models.JSONField(default=list)

    # Approach section
    approach_title = models.CharField(max_length=200, default="Our Approach")
    approach_text = models.TextField(default="We follow a <strong>restorative justice</strong> model that focuses on:")
    approach_items = models.JSONField(default=list)

    # Filing a complaint section
    filing_title = models.CharField(max_length=200, default="Filing a Complaint")
    filing_text = models.TextField(
        default="Our unit handles various types of complaints to ensure a safe and respectful campus environment:"
    )

    # Complaint types
    complaint_types = models.JSONField(default=list)

    # How to file section
    how_to_file_title = models.CharField(max_length=200, default="How to File a Complaint")
    how_to_file_steps = models.JSONField(default=list)

    # Process notes
    process_notes = models.JSONField(default=list)

    last_updated = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return "Student Discipline Unit Content"

    class Meta:
        verbose_name_plural = "Student Discipline Unit Content"


class FooterContent(models.Model):
    logo = models.ImageField(upload_to='footer/', null=True, blank=True)
    campus_name = models.CharField(max_length=200, default="Cavite State University - Bacoor City Campus")
    description = models.TextField(
        default="Brief Description Here..."
    )

    # Social Media Links
    facebook_url = models.URLField(blank=True)
    twitter_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    youtube_url = models.URLField(blank=True)

    # Contact Information
    address = models.TextField(default="Soldiers Hills IV, Molino VI, Bacoor City, Cavite")
    phone = models.CharField(max_length=50, default="(000) 000-0000")
    email = models.EmailField(default="cvsubacoorosas@gmail.com")
    working_hours = models.CharField(max_length=100, default="Monday-Friday: 0:00 AM - 0:00 PM")

    # Emergency Contacts
    campus_security = models.CharField(max_length=50, default="(000) 000-0000")
    university_clinic = models.CharField(max_length=50, default="(000) 000-0000")
    local_police = models.CharField(max_length=50, default="911")

    # Copyright
    copyright_text = models.CharField(max_length=200,
                                      default="CvSU Office of the Student Affairs and Services - Bacoor City Campus. All Rights Reserved.")

    last_updated = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return "Footer Content"

    class Meta:
        verbose_name_plural = "Footer Content"


class ScholarshipPageContent(models.Model):
    hero_title = models.CharField(max_length=200, default="Scholarship Opportunities")
    hero_subtitle = models.TextField(
        default="Unlock your academic potential with our curated selection of scholarship programs. "
                "Find the perfect financial support for your educational journey."
    )
    hero_image = models.ImageField(
        upload_to='scholarship/images/',
        null=True,
        blank=True,
        default='scholarship/images/default.jpg'
    )
    faq_content = models.JSONField(default=list)
    last_updated = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return "Scholarship Page Content"

    def save(self, *args, **kwargs):
        # Ensure faq_content is always a list
        if isinstance(self.faq_content, str):
            try:
                self.faq_content = json.loads(self.faq_content)
            except json.JSONDecodeError:
                self.faq_content = []
        super().save(*args, **kwargs)

    class Meta:
        verbose_name_plural = "Scholarship Page Content"


class AdmissionPageContent(models.Model):
    hero_title = models.CharField(max_length=200, default="ADMISSION S.Y. 2025-2026")
    hero_tagline = models.CharField(max_length=200,
                                    default="Shape your future with Cavite State University - Bacoor City Campus")
    cta_text = models.CharField(max_length=200, default="READY TO BEGIN YOUR JOURNEY?")
    cta_description = models.TextField(
        default="Take the first step towards your future at Cavite State University - Bacoor City Campus. Our admissions team is ready to assist you."
    )

    # Requirements will be stored as JSON
    requirements = models.JSONField(default=dict)

    last_updated = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return "Admission Page Content"

    class Meta:
        verbose_name_plural = "Admission Page Content"


class NSTPPageContent(models.Model):
    hero_title = models.CharField(max_length=200, default="National Service Training Program")
    hero_subtitle = models.CharField(
        max_length=300,
        default="Empowering students to contribute to national development through civic consciousness and defense preparedness"
    )
    about_title = models.CharField(max_length=200, default="NSTP Program Overview")
    about_text = models.TextField(
        default="The National Service Training Program (NSTP) is a program aimed at enhancing civic consciousness and defense preparedness in the youth..."
    )
    about_image = models.ImageField(upload_to='nstp/', default='nstp/default-about.jpg', help_text="Recommended size: 800x600px")

    # Programs
    programs = models.JSONField(default=list)

    # FAQs
    faqs = models.JSONField(default=list)

    last_updated = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return "NSTP Page Content"

    class Meta:
        verbose_name_plural = "NSTP Page Content"


class ClinicPageContent(models.Model):
    hero_title = models.CharField(max_length=200, default="Comprehensive Healthcare Services")
    hero_description = models.TextField(default="Providing quality medical care with compassion and expertise. Our clinic offers a range of services to meet your healthcare needs in a comfortable and welcoming environment.")
    services = models.JSONField(default=list)
    gallery_images = models.JSONField(default=list)
    faqs = models.JSONField(default=list)
    phone = models.CharField(max_length=20, default="(123) 456-7890")
    email = models.EmailField(default="info@clinic.example.com")
    address = models.TextField(default="123 Health Street, Medical City")
    last_updated = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return "Clinic Page Content"

    class Meta:
        verbose_name_plural = "Clinic Page Content"

    def save(self, *args, **kwargs):
        # Set default content if empty
        if not self.services:
            self.services = [
                {
                    "icon": "images/clinic/icons/sample.png",
                    "title": "First Aid Treatment",
                    "description": "Immediate care for minor injuries and emergencies with trained medical staff ready to assist when you need it most."
                },
                {
                    "icon": "images/clinic/icons/sample.png",
                    "title": "Free Over the Counter Medicine",
                    "description": "Access to common medications at no cost, subject to availability and medical assessment."
                },
                {
                    "icon": "images/clinic/icons/sample.png",
                    "title": "Medical Assessment & Physical Examination",
                    "description": "Comprehensive health evaluations to assess your condition and provide appropriate care recommendations."
                },
                {
                    "icon": "images/clinic/icons/sample.png",
                    "title": "Health Promotion & Teaching",
                    "description": "Educational resources and guidance to help you maintain and improve your overall health and wellbeing."
                },
                {
                    "icon": "images/clinic/icons/sample.png",
                    "title": "Medical Referral",
                    "description": "Connections to specialized healthcare providers when your condition requires additional expertise."
                },
                {
                    "icon": "images/clinic/icons/sample.png",
                    "title": "Student Medic Training",
                    "description": "Educational programs for aspiring healthcare professionals to develop essential medical skills."
                }
            ]

        if not self.faqs:
            self.faqs = [
                {
                    "question": "What are your operating hours?",
                    "answer": "Our clinic is open Monday to Friday from 8:00 AM to 6:00 PM, and Saturdays from 9:00 AM to 2:00 PM. We are closed on Sundays and public holidays."
                },
                {
                    "question": "Do I need an appointment?",
                    "answer": "While appointments are recommended to minimize waiting time, we welcome walk-in patients for urgent care needs. Appointments can be scheduled by phone or in person."
                },
                {
                    "question": "What payment methods do you accept?",
                    "answer": "We accept cash, credit cards, and most major insurance plans. Some services like basic first aid and health education are offered free of charge."
                },
                {
                    "question": "How can I access the free over-the-counter medicines?",
                    "answer": "Free over-the-counter medicines are available after a medical assessment. Availability varies based on our current stock, and they are provided at the discretion of our healthcare providers."
                },
                {
                    "question": "What is the Student Medic Training program?",
                    "answer": "Our Student Medic Training program provides hands-on experience for students pursuing healthcare careers. The program includes basic medical procedures, patient care techniques, and emergency response training."
                }
            ]

        if not self.gallery_images:
            self.gallery_images = [
                {
                    "image": "images/clinic/gallery-1.jpg",
                    "alt": "Clinic reception area"
                },
                {
                    "image": "images/clinic/gallery-2.jpg",
                    "alt": "Medical equipment"
                },
                {
                    "image": "images/clinic/gallery-3.jpg",
                    "alt": "Consultation room"
                },
                {
                    "image": "images/clinic/gallery-4.jpg",
                    "alt": "Medical staff"
                }
            ]

        super().save(*args, **kwargs)


class OJTPageContent(models.Model):
    # Hero Section
    hero_title = models.CharField(max_length=255, default="On-the-Job Training Program")
    hero_subtitle = models.TextField(
        default="Gain real-world experience and develop professional skills through our comprehensive internship program designed for future leaders."
    )

    # Overview Section
    overview_title = models.CharField(max_length=255, default="Program Overview")
    overview_subtitle = models.TextField(
        default="Our OJT program bridges the gap between academic learning and professional practice"
    )

    # Overview Cards
    overview_cards = models.JSONField(default=list, blank=True)

    # Services Section
    services_title = models.CharField(max_length=255, default="Our Services")
    services_subtitle = models.TextField(
        default="Comprehensive support throughout your internship journey"
    )

    # Services Cards
    services_cards = models.JSONField(default=list, blank=True)

    # Partners Section
    partners_title = models.CharField(max_length=255, default="Our Partner Companies")
    partners_subtitle = models.TextField(
        default="Collaborating with industry leaders to provide exceptional opportunities"
    )

    # Process Section
    process_title = models.CharField(max_length=255, default="Application Process")
    process_subtitle = models.TextField(
        default="Simple and straightforward steps to start your OJT journey"
    )

    # Process Steps
    process_steps = models.JSONField(default=list, blank=True)

    # FAQ Section
    faq_title = models.CharField(max_length=255, default="Frequently Asked Questions")
    faq_subtitle = models.TextField(
        default="Find answers to common questions about our OJT program"
    )

    # FAQ Content
    faq_content = models.JSONField(default=list, blank=True)

    # CTA Section
    cta_title = models.CharField(max_length=255, default="Ready to Start Your Professional Journey?")
    cta_subtitle = models.TextField(
        default="Join hundreds of students who have transformed their careers through our OJT program"
    )
    cta_button_text = models.CharField(max_length=100, default="Apply for OJT")

    # Meta fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        'CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='updated_ojt_pages'
    )

    def __str__(self):
        return "OJT Page Content"

    def save(self, *args, **kwargs):
        # Set default values for JSON fields if empty
        if not self.overview_cards:
            self.overview_cards = [
                {
                    "icon": "fas fa-graduation-cap",
                    "title": "Academic Integration",
                    "description": "Seamlessly integrate classroom knowledge with real-world applications in your field of study."
                },
                {
                    "icon": "fas fa-users",
                    "title": "Professional Mentorship",
                    "description": "Receive guidance from experienced professionals who are committed to your growth and success."
                },
                {
                    "icon": "fas fa-network-wired",
                    "title": "Industry Networking",
                    "description": "Build valuable connections with industry leaders and potential future employers."
                },
                {
                    "icon": "fas fa-rocket",
                    "title": "Career Launchpad",
                    "description": "Transform your internship experience into a stepping stone for your professional career."
                }
            ]

        if not self.services_cards:
            self.services_cards = [
                {
                    "icon": "fas fa-file-contract",
                    "title": "Documentation",
                    "description": "Complete assistance with all required paperwork and compliance documentation.",
                    "items": ["MOA preparation", "Requirements checklist", "Compliance monitoring"]
                },
                {
                    "icon": "fas fa-user-tie",
                    "title": "Professional Development",
                    "description": "Workshops and training sessions to enhance your professional skills.",
                    "items": ["Resume building", "Interview preparation", "Workplace etiquette"]
                },
                {
                    "icon": "fas fa-chalkboard-teacher",
                    "title": "Academic Supervision",
                    "description": "Dedicated coordinators to ensure your OJT meets academic requirements.",
                    "items": ["Progress monitoring", "Academic credit coordination", "Performance evaluation"]
                }
            ]

        if not self.process_steps:
            self.process_steps = [
                {
                    "number": "1",
                    "title": "Application",
                    "description": "Submit your application form and required documents through our online portal."
                },
                {
                    "number": "2",
                    "title": "Screening",
                    "description": "Our team reviews your application and matches you with suitable companies."
                },
                {
                    "number": "3",
                    "title": "Interview",
                    "description": "Participate in interviews with potential host companies."
                },
                {
                    "number": "4",
                    "title": "Placement",
                    "description": "Finalize your OJT placement and complete necessary documentation."
                },
                {
                    "number": "5",
                    "title": "Orientation",
                    "description": "Attend pre-internship orientation and begin your OJT journey."
                }
            ]

        if not self.faq_content:
            self.faq_content = [
                {
                    "question": "Who is eligible for the OJT program?",
                    "answer": "Currently enrolled students who have completed at least two years of their degree program are eligible. Specific requirements may vary by academic department."
                },
                {
                    "question": "How long does the OJT program last?",
                    "answer": "The standard OJT period is 3-6 months, depending on your academic requirements and the host company's needs. Some specialized programs may have different durations."
                },
                {
                    "question": "Are OJT positions paid?",
                    "answer": "Many of our partner companies offer stipends or allowances. Compensation varies by company and role. We encourage students to discuss this during the interview process."
                },
                {
                    "question": "Can I choose my preferred company?",
                    "answer": "Yes, we consider student preferences when matching with companies. However, final placement depends on company requirements and availability of positions."
                },
                {
                    "question": "What support is provided during OJT?",
                    "answer": "We provide continuous support through assigned coordinators, regular check-ins, and access to resources. Both academic and workplace mentors are available throughout your internship."
                }
            ]

        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "OJT Page Content"
        verbose_name_plural = "OJT Page Content"


class SDSPageContent(models.Model):
    hero_title = models.CharField(max_length=200, default="Student Development Services")
    hero_subtitle = models.TextField(
        default="Empowering students through comprehensive development programs and support services")
    hero_badge_text = models.CharField(max_length=100, default="CvSU Bacoor Campus")
    section_subtitle = models.CharField(
        max_length=200,
        default="Discover how we support student growth and development"
    )

    # Overview Section
    mission_title = models.CharField(max_length=200, default="Our Mission")
    mission_content = models.TextField(
        default="The Student Development Services (SDS) is dedicated to supporting the holistic development of students through various programs, activities, and services. We aim to foster leadership skills, personal growth, and academic excellence.")

    what_we_do_title = models.CharField(max_length=200, default="What We Do")
    what_we_do_content = models.TextField(
        default="Our office coordinates with various student organizations to provide opportunities for engagement, skill development, and community building. We serve as the bridge between academic learning and real-world application.")

    # Features List (stored as JSON)
    features = models.JSONField(default=list, blank=True)

    # FAQs (stored as JSON)
    faqs = models.JSONField(default=list, blank=True)

    # CTA Section
    cta_title = models.CharField(max_length=200, default="Ready to Get Involved?")
    cta_content = models.TextField(
        default="Join one of our student organizations and start your journey of growth and development today.")

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        'CustomUser',
        null=True,
        blank=True,
        on_delete=models.SET_NULL
    )

    def __str__(self):
        return "SDS Page Content"

    class Meta:
        verbose_name = "SDS Page Content"
        verbose_name_plural = "SDS Page Content"

    def save(self, *args, **kwargs):
        # Set default features if empty
        if not self.features:
            self.features = [
                {"text": "Leadership Training Programs"},
                {"text": "Student Organization Support"},
                {"text": "Campus Events Coordination"},
                {"text": "Student Welfare Services"}
            ]

        # Set default FAQs if empty
        if not self.faqs:
            self.faqs = [
                {
                    "question": "How can I join a student organization?",
                    "subtitle": "Learn about the membership process and requirements",
                    "answer": "You can join a student organization by attending their orientation events, signing up during recruitment drives, or contacting the organization directly through their social media pages or email. Most organizations welcome new members at the beginning of each semester.",
                    "tips": [
                        "Attend the Organization Fair at the start of each semester",
                        "Follow organizations on social media for updates",
                        "Contact the organization's president or advisor"
                    ],
                    "benefits": []
                },
                {
                    "question": "What are the benefits of joining a student organization?",
                    "subtitle": "Discover how organizations can enhance your college experience",
                    "answer": "Joining a student organization helps you develop leadership skills, build networks, gain practical experience, enhance your resume, and make new friends with similar interests. It also provides opportunities for personal growth and community engagement.",
                    "tips": [],
                    "benefits": [
                        {"icon": "fas fa-brain", "text": "Skill Development"},
                        {"icon": "fas fa-network-wired", "text": "Networking"},
                        {"icon": "fas fa-handshake", "text": "Leadership"},
                        {"icon": "fas fa-users", "text": "Community"}
                    ]
                }
            ]
        super().save(*args, **kwargs)


# ---------------------------------------------- Misdeamenor | Complaint Section ---------------------------------------
class Complaint(models.Model):
    STATUS_CHOICES = (
        ('under_review', 'Under Review'),
        ('resolved', 'Resolved'),
        ('canceled', 'Canceled'),
    )

    RESPONDENT_TYPE_CHOICES = (
        ('student', 'Student'),
        ('faculty_staff', 'Faculty/Staff'),
    )

    # Complainant Information
    complainant_first_name = models.CharField(max_length=100)
    complainant_last_name = models.CharField(max_length=100)
    complainant_email = models.EmailField()
    complainant_phone = models.CharField(max_length=20)
    complainant_address = models.TextField()
    complainant_instructor_name = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="If you're a student, please specify your instructor (if applicable)"
    )

    # Respondent/Subject Information
    respondent_type = models.CharField(
        max_length=20,
        choices=RESPONDENT_TYPE_CHOICES,
        help_text="Is the respondent a student or faculty/staff?"
    )
    respondent_first_name = models.CharField(max_length=100)
    respondent_last_name = models.CharField(max_length=100)

    # Fields for Student respondents
    respondent_course = models.ForeignKey(
        Course,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        help_text="Required if respondent is a student"
    )
    respondent_year = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Required if respondent is a student (e.g., 1st Year, 2nd Year)"
    )
    respondent_section = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Required if respondent is a student"
    )

    # Fields for Faculty/Staff respondents
    respondent_department = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Required if respondent is faculty/staff"
    )

    # Complaint Details
    title = models.CharField(max_length=200)
    statement = models.TextField()
    incident_date = models.DateField()
    incident_time = models.TimeField(blank=True, null=True)
    incident_location = models.CharField(max_length=255)
    witnesses = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='under_review')
    notes = models.TextField(blank=True, null=True)

    # Meta Information
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_archived = models.BooleanField(default=False)
    archived_by = models.ForeignKey(
        CustomUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='archived_complaints'
    )
    archived_at = models.DateTimeField(blank=True, null=True)

    # Reference number field
    reference_number = models.CharField(
        max_length=15,
        unique=True,
        editable=False,
        blank=True,
        null=True,
        help_text="Unique reference number for the complaint"
    )
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='complaints_created')
    def generate_reference_number(self):
        """ Reference Number format: ABC-123456-X"""
        while True:
            # 3 random uppercase letters
            letters = ''.join([random.choice(string.ascii_uppercase) for _ in range(3)])
            # 6 random digits
            numbers = ''.join([random.choice(string.digits) for _ in range(6)])
            # 1 random checksum letter
            checksum = random.choice(string.ascii_uppercase)

            ref_num = f"{letters}-{numbers}-{checksum}"

            if not Complaint.objects.filter(reference_number=ref_num).exists():
                return ref_num

    def save(self, *args, **kwargs):
        if not self.reference_number:
            self.reference_number = self.generate_reference_number()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Complaint #{self.reference_number or self.id}: {self.title}"

    def clean(self):
        from django.core.exceptions import ValidationError

        if self.respondent_type == 'student':
            if not all([self.respondent_course, self.respondent_year, self.respondent_section]):
                raise ValidationError(
                    "For student respondents, course, year, and section are required."
                )
        elif self.respondent_type == 'faculty_staff':
            if not self.respondent_department:
                raise ValidationError(
                    "For faculty/staff respondents, department is required."
                )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Complaint'
        verbose_name_plural = 'Complaints'


class ComplaintDocument(models.Model):
    complaint = models.ForeignKey(Complaint, related_name='documents', on_delete=models.CASCADE)
    file = models.FileField(
        upload_to='complaints/documents/%Y/%m/%d/',
        validators=[
            FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif'])
        ]
    )
    description = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Document for Complaint #{self.complaint.id}"


class ComplaintImage(models.Model):
    complaint = models.ForeignKey(Complaint, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='complaints/images/%Y/%m/%d/')
    caption = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for Complaint #{self.complaint.id}"


# ------------------------------------------------- Scholarship Models -------------------------------------------------
class Scholarship(models.Model):
    TYPE_CHOICES = (
        ('public', 'Public Scholarship'),
        ('private', 'Private Scholarship'),
    )

    name = models.CharField(max_length=200)
    description = models.TextField()
    scholarship_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    benefits = models.TextField(help_text="Describe what the scholarship provides")
    requirements = models.TextField(help_text="List of requirements for applicants")
    slots_available = models.PositiveIntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True)
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    archived_by = models.ForeignKey(
        CustomUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='archived_scholarship'
    )
    application_form = models.ForeignKey(
        'Downloadable',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='scholarship_forms'
    )

    def __str__(self):
        return self.name


class ScholarshipApplication(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='scholarship_applications')
    scholarship = models.ForeignKey(Scholarship, on_delete=models.CASCADE)
    application_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    status_update_date = models.DateTimeField(null=True, blank=True)
    status_updated_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='updated_applications'
    )
    notes = models.TextField(blank=True)

    # Documents - using FileField since you might want to keep submitted documents separate from templates
    application_form = models.FileField(upload_to='scholarships/applications/forms/')
    cog = models.FileField(upload_to='scholarships/applications/cog/', verbose_name="Certificate of Grades")
    cor = models.FileField(upload_to='scholarships/applications/cor/', verbose_name="Certificate of Registration")
    id_photo = models.FileField(upload_to='scholarships/applications/ids/')
    other_documents = models.FileField(upload_to='scholarships/applications/others/', null=True, blank=True)

    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    archived_by = models.ForeignKey(
        CustomUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='archived_applicants'
    )

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.scholarship.name}"

    class Meta:
        unique_together = ('student', 'scholarship')


# ---------------------------------------------------- Admission Models ------------------------------------------------
class StudentAdmission(models.Model):
    STUDENT_TYPE_CHOICES = [
        ('current_grade12', 'Current Grade 12 Student'),
        ('shs_graduate', 'SHS Graduate'),
        ('transferee', 'Transferee'),
    ]

    CURRICULUM_CHOICES = [
        ('new', 'New Curriculum (2019 up)'),
        ('old', 'Old Curriculum (2018 below)'),
    ]

    SEMESTER_STATUS_CHOICES = [
        ('not_finished', 'Not Finished'),
        ('finished', 'Finished'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('incomplete', 'Incomplete Requirements'),
        ('complete', 'Complete Requirements'),
        ('done', 'Done Exam'),
    ]

    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='admissions',
        null=True,
        blank=True
    )
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)

    # Common fields for all student types
    student_type = models.CharField(max_length=20, choices=STUDENT_TYPE_CHOICES)
    date = models.DateField(auto_now_add=True)
    control_no = models.CharField(max_length=20, unique=True)
    course = models.ForeignKey(
        Course,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Desired Course"
    )
    admission_portal_registration = models.BooleanField(
        default=False,
        verbose_name="Accomplished Admission Portal Registration"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Fields specific to Current Grade 12 and SHS Graduate
    strand = models.CharField(max_length=100, blank=True, null=True)

    # Fields specific to Current Grade 12
    grade11_report_card = models.FileField(
        upload_to='admission_docs/grade11/',
        blank=True,
        null=True,
        verbose_name="Grade 11 Report Card"
    )
    certificate_of_enrollment = models.FileField(
        upload_to='admission_docs/enrollment/',
        blank=True,
        null=True,
        verbose_name="Certificate of Enrollment"
    )

    # Fields specific to SHS Graduate
    grade12_report_card = models.FileField(
        upload_to='admission_docs/grade12/',
        blank=True,
        null=True,
        verbose_name="Grade 12 Report Card"
    )
    form137 = models.FileField(
        upload_to='admission_docs/form137/',
        blank=True,
        null=True,
        verbose_name="Form 137"
    )

    # Fields specific to Transferee
    curriculum_type = models.CharField(
        max_length=10,
        choices=CURRICULUM_CHOICES,
        blank=True,
        null=True,
        verbose_name="When did you start college? (Curriculum Type)"
    )
    first_year_first_semester = models.CharField(
        max_length=20,
        choices=SEMESTER_STATUS_CHOICES,
        blank=True,
        null=True,
        verbose_name="1st Year - 1st Semester"
    )
    first_year_second_semester = models.CharField(
        max_length=20,
        choices=SEMESTER_STATUS_CHOICES,
        blank=True,
        null=True,
        verbose_name="1st Year - 2nd Semester"
    )
    second_year_first_semester = models.CharField(
        max_length=20,
        choices=SEMESTER_STATUS_CHOICES,
        blank=True,
        null=True,
        verbose_name="2nd Year - 1st Semester"
    )
    other_semester_info = models.TextField(
        blank=True,
        null=True,
        verbose_name="Others"
    )
    transcript_of_grades = models.FileField(
        upload_to='admission_docs/transcripts/',
        blank=True,
        null=True,
        verbose_name="Transcript of Grades or Certificate of Grades"
    )
    good_moral_certificate = models.FileField(
        upload_to='admission_docs/good_moral/',
        blank=True,
        null=True,
        verbose_name="Certificate of Good Moral Character"
    )
    honorable_dismissal = models.FileField(
        upload_to='admission_docs/dismissal/',
        blank=True,
        null=True,
        verbose_name="Honorable Dismissal"
    )
    nbi_police_clearance = models.FileField(
        upload_to='admission_docs/clearance/',
        blank=True,
        null=True,
        verbose_name="NBI or Police Clearance"
    )
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    archived_by = models.ForeignKey(
        CustomUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='archived_admission'
    )

    def __str__(self):
        return f"{self.control_no} - {self.get_student_type_display()}"

    def update_status(self):
        """Update the status based on submitted requirements"""
        missing_requirements = []

        # Check common requirement for all student types
        if not self.admission_portal_registration:
            missing_requirements.append("Admission Portal Registration not completed")

        # Check type-specific requirements
        if self.student_type == 'current_grade12':
            if not self.grade11_report_card:
                missing_requirements.append("Grade 11 Report Card")
            if not self.certificate_of_enrollment:
                missing_requirements.append("Certificate of Enrollment")

        elif self.student_type == 'shs_graduate':
            if not self.grade12_report_card:
                missing_requirements.append("Grade 12 Report Card")
            if not self.form137:
                missing_requirements.append("Form 137")

        elif self.student_type == 'transferee':
            if not self.curriculum_type:
                missing_requirements.append("Curriculum Type not specified")
            if not self.transcript_of_grades:
                missing_requirements.append("Transcript of Grades")
            if not self.good_moral_certificate:
                missing_requirements.append("Certificate of Good Moral Character")
            if not self.honorable_dismissal:
                missing_requirements.append("Honorable Dismissal")
            if not self.nbi_police_clearance:
                missing_requirements.append("NBI or Police Clearance")

        # Clear previous remarks before setting new ones
        self.remarks = ""

        # Update status and remarks based on missing requirements
        if missing_requirements:
            self.status = 'incomplete'
            if len(missing_requirements) == 1 and "Admission Portal Registration" in missing_requirements[0]:
                self.remarks = missing_requirements[0]
            else:
                self.remarks = "To Follow Requirements:\n" + "\n".join(missing_requirements)
        else:
            self.status = 'complete'
            self.remarks = "All requirements submitted"

        self.save()

    def get_required_fields(self):
        """Return a list of required fields based on student type"""
        if self.student_type == 'current_grade12':
            return [
                'admission_portal_registration',
                'grade11_report_card',
                'certificate_of_enrollment'
            ]
        elif self.student_type == 'shs_graduate':
            return [
                'admission_portal_registration',
                'grade12_report_card',
                'form137'
            ]
        elif self.student_type == 'transferee':
            return [
                'admission_portal_registration',
                'transcript_of_grades',
                'good_moral_certificate',
                'honorable_dismissal',
                'nbi_police_clearance',
                'curriculum_type'
            ]
        return []

    class Meta:
        verbose_name = "Student Admission"
        verbose_name_plural = "Student Admissions"
        ordering = ['-created_at']


# ----------------------------------------------------- NSTP Models ----------------------------------------------------
class NSTPStudentInfo(models.Model):
    APPROVAL_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    SEMESTER_CHOICES = (
        ('1st Sem', 'First Semester'),
        ('2nd Sem', 'Second Semester'),
    )

    user = models.ForeignKey(
        'CustomUser',
        on_delete=models.CASCADE,
        related_name='nstp_enrollments',
        limit_choices_to={'user_type': 14}  # Only for students
    )

    student_number = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Student Number',
        validators=[RegexValidator(
            r'^[\d-]+$',
            'Only numbers and hyphens are allowed'
        )]
    )
    last_name = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Last Name'
    )
    first_name = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='First Name'
    )
    middle_name = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Middle Name'
    )
    program = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Program/Course'
    )
    gender = models.CharField(
        max_length=1,
        choices=CustomUser.GENDER_CHOICES,
        blank=True,
        verbose_name='Gender'
    )
    birth_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='Birth Date'
    )
    contact_number = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Contact Number'
    )
    email_address = models.EmailField(
        blank=True,
        verbose_name='Email Address'
    )

    # Address fields (can be auto-filled from CustomUser.address)
    street_or_barangay = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='Street/Barangay'
    )
    municipality_or_city = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Municipality/City'
    )
    province = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Province'
    )

    approval_status = models.CharField(
        max_length=10,
        choices=APPROVAL_CHOICES,
        default='pending',
        verbose_name='Approval Status'
    )

    semester = models.CharField(
        max_length=10,
        choices=SEMESTER_CHOICES,
        verbose_name='Semester'
    )
    academic_year = models.CharField(
        max_length=9,
        validators=[
            RegexValidator(
                regex=r'^\d{4}-\d{4}$',
                message='Academic year must be in the format YYYY-YYYY (e.g., 2024-2025)'
            )
        ],
        verbose_name='Academic Year'
    )

    remarks = models.TextField(
        blank=True,
        null=True,
        verbose_name='Admin Remarks'
    )

    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    archived_by = models.ForeignKey(
        CustomUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='archived_enlistment'
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'NSTP Student Information'
        verbose_name_plural = 'NSTP Student Information'
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'semester', 'academic_year'],
                name='unique_enrollment_per_semester'
            )
        ]

    def __str__(self):
        return f"{self.last_name}, {self.first_name} - {self.student_number}"

    def clean(self):
        # Validate academic year format (e.g., 2024-2025)
        if self.academic_year:
            try:
                start, end = map(int, self.academic_year.split('-'))
                if end != start + 1:
                    raise ValidationError({
                        'academic_year': _(
                            'The second year should be exactly one year after the first year (e.g., 2024-2025)')
                    })
            except (ValueError, AttributeError):
                pass  # Regex validator will catch this

    def save(self, *args, **kwargs):
        # Auto-fill fields from CustomUser if available
        if self.user:
            if not self.student_number and self.user.student_number:
                self.student_number = self.user.student_number
            if not self.last_name and self.user.last_name:
                self.last_name = self.user.last_name
            if not self.first_name and self.user.first_name:
                self.first_name = self.user.first_name
            if not self.middle_name and hasattr(self.user, 'middle_name'):
                self.middle_name = self.user.middle_name
            if not self.program and self.user.course:
                self.program = self.user.course
            if not self.gender and self.user.gender:
                self.gender = self.user.gender
            if not self.birth_date and self.user.birth_date:
                self.birth_date = self.user.birth_date
            if not self.contact_number and self.user.phone_number:
                self.contact_number = self.user.phone_number
            if not self.email_address and self.user.email:
                self.email_address = self.user.email

            # Parse address if available
            if self.user.address and not any([
                self.street_or_barangay,
                self.municipality_or_city,
                self.province
            ]):
                self._parse_address(self.user.address)

        super().save(*args, **kwargs)

    def _parse_address(self, address):
        parts = address.split(',')
        if len(parts) >= 1:
            self.street_or_barangay = parts[0].strip()
        if len(parts) >= 2:
            self.municipality_or_city = parts[1].strip()
        if len(parts) >= 3:
            self.province = parts[2].strip()


class NSTPFile(models.Model):
    CATEGORY_CHOICES = (
        ('accomplishment_reports', 'Accomplishment Reports'),
        ('communication_letters', 'Communication Letters'),
        ('financial_plan', 'Financial Plan'),
        ('letters', 'Letters'),
        ('moa', 'MOA'),
        ('nstp_files', 'NSTP Files'),
        ('recommendation', 'Recommendation'),
        ('schedule', 'Schedule'),
    )

    SEMESTER_CHOICES = (
        ('1st_semester', '1st Semester'),
        ('2nd_semester', '2nd Semester'),
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to='nstp_files/')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    semester = models.CharField(max_length=20, choices=SEMESTER_CHOICES)
    school_year = models.CharField(
        max_length=9,
        help_text='Format: YYYY-YYYY (e.g., 2020-2021)'
    )
    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='created_nstp_files')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    archived_by = models.ForeignKey(
        CustomUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='archived_nstp_files'
    )

    def __str__(self):
        return self.title

    def get_file_name(self):
        return self.file.name.split('/')[-1]

    def get_file_size(self):
        try:
            size = self.file.size
            if size < 1024:
                return f"{size} bytes"
            elif size < 1024 * 1024:
                return f"{round(size / 1024, 1)} KB"
            else:
                return f"{round(size / (1024 * 1024), 1)} MB"
        except:
            return "N/A"

    class Meta:
        verbose_name = 'NSTP File'
        verbose_name_plural = 'NSTP Files'


# ----------------------------------------------------- OJT Models -----------------------------------------------------
class OJTCompany(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField()
    contact_number = models.CharField(max_length=20)
    available_slots = models.PositiveIntegerField(default=5, help_text="Number of available OJT slots")

    # Company details
    description = models.TextField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    email = models.EmailField(blank=True, null=True)

    # Archive fields
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    archived_by = models.ForeignKey(
        'CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='archived_ojt_companies'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    @property
    def filled_slots(self):
        """Calculate number of filled slots (ONLY approved students in OJT)"""
        return self.ojt_applications.filter(
            is_archived=False,
            status='approved'
        ).count()

    @property
    def remaining_slots(self):
        """Calculate remaining available slots"""
        return max(0, self.available_slots - self.filled_slots)

    def can_accept_more_students(self):
        """Check if company can accept more students"""
        return self.remaining_slots > 0 and not self.is_archived

    @property
    def is_full(self):
        """Check if company slots are full"""
        return self.remaining_slots <= 0

    @property
    def utilization_rate(self):
        """Calculate slot utilization percentage"""
        if self.available_slots == 0:
            return 0
        return (self.filled_slots / self.available_slots) * 100

    @property
    def status(self):
        """Get company status based on slot availability"""
        if self.is_archived:
            return "Archived"
        elif self.remaining_slots == 0:
            return "Full"
        elif self.remaining_slots <= 2:
            return "Limited"
        else:
            return "Available"

    def get_pending_applications_count(self):
        """Get count of pending applications (for information only)"""
        return self.ojt_applications.filter(
            is_archived=False,
            status__in=['submitted', 'under_review']
        ).count()

    @classmethod
    def get_available_companies(cls):
        """Get companies that are available for applications"""
        return cls.objects.filter(
            is_archived=False
        ).annotate(
            filled_slots_count=Count(
                'ojt_applications',
                filter=Q(ojt_applications__status='approved', ojt_applications__is_archived=False)
            )
        ).filter(
            available_slots__gt=F('filled_slots_count')
        ).order_by('name')

    class Meta:
        verbose_name_plural = "OJT Companies"
        ordering = ['name']


class OJTApplication(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]

    student = models.ForeignKey(
        'CustomUser',
        on_delete=models.CASCADE,
        limit_choices_to={'user_type': 14},
        related_name='ojt_applications'
    )

    # OJT Company
    company = models.ForeignKey(
        OJTCompany,
        on_delete=models.CASCADE,
        related_name='ojt_applications'
    )

    # Proposed OJT period
    proposed_start_date = models.DateField()
    proposed_end_date = models.DateField()
    proposed_hours = models.PositiveIntegerField(
        default=240,
        help_text="Total required OJT hours"
    )

    # Application status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    previous_status = models.CharField(max_length=20, choices=STATUS_CHOICES, blank=True, null=True)
    application_date = models.DateTimeField(auto_now_add=True)

    # Application details
    cover_letter = models.TextField(
        blank=True,
        help_text="Why you want to do OJT at this company"
    )
    skills = models.TextField(
        blank=True,
        help_text="Relevant skills and qualifications"
    )

    # Approval information
    approved_by = models.ForeignKey(
        'CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_ojt_applications'
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    # Review information
    reviewed_by = models.ForeignKey(
        'CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_ojt_applications'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True, null=True)

    rejection_reason = models.TextField(blank=True, null=True)

    # Archive fields
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    archived_by = models.ForeignKey(
        'CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='archived_ojt_applications'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.company.name}"

    def save(self, *args, **kwargs):
        if self.is_archived and self.status != 'cancelled':
            self.previous_status = self.status
            self.status = 'cancelled'

        # Handle retrieval logic
        if not self.is_archived and hasattr(self, '_retrieving') and self._retrieving:
            # Check if company is full when retrieving
            if self.company and self.company.is_full:
                self.status = 'draft'
            elif self.previous_status:
                self.status = self.previous_status
                self.previous_status = None

            # Clear archive fields
            self.archived_at = None
            self.archived_by = None
            self._retrieving = False

        super().save(*args, **kwargs)

    @property
    def student_name(self):
        """Get student's full name"""
        return self.student.get_full_name()

    @property
    def student_course(self):
        """Get student's course"""
        return self.student.course.name if self.student.course else "Not specified"

    @property
    def student_section(self):
        """Get student's section"""
        return self.student.section

    @property
    def student_year_level(self):
        """Get student's year level"""
        return self.student.year_level

    @property
    def requirements_submitted(self):
        """Get count of submitted requirements"""
        return self.requirements.filter(is_submitted=True).count()

    @property
    def total_requirements(self):
        """Get total required requirements"""
        return self.requirements.count()

    @property
    def requirements_complete(self):
        """Check if all requirements are submitted"""
        return self.requirements_submitted == self.total_requirements

    def approve_application(self, approved_by):
        """Approve the OJT application"""
        if self.status not in ['submitted', 'under_review']:
            raise ValidationError("Only submitted applications can be approved.")

        if not self.company.can_accept_more_students():
            raise ValidationError("Company has no available slots.")

        # Check if this application is already approved to avoid double-counting
        if self.status == 'approved':
            raise ValidationError("This application is already approved.")

        self.status = 'approved'
        self.approved_by = approved_by
        self.approved_at = timezone.now()
        self.save()

    def reject_application(self, reason, reviewed_by=None):
        """Reject the OJT application"""
        if self.status not in ['submitted', 'under_review']:
            raise ValidationError("Only submitted applications can be rejected.")

        self.status = 'rejected'
        self.rejection_reason = reason
        if reviewed_by:
            self.reviewed_by = reviewed_by
            self.reviewed_at = timezone.now()
        self.save()

    def cancel_application(self):
        """Cancel the application"""
        if self.status in ['approved']:
            raise ValidationError("Cannot cancel an approved application.")

        self.status = 'cancelled'
        self.save()

    @property
    def duration_days(self):
        """Calculate proposed OJT duration in days"""
        if self.proposed_start_date and self.proposed_end_date:
            return (self.proposed_end_date - self.proposed_start_date).days
        return 0

    def clean(self):
        """Validate the OJT application"""
        super().clean()

        if self.proposed_start_date and self.proposed_end_date:
            if self.proposed_end_date <= self.proposed_start_date:
                raise ValidationError("End date must be after start date.")

            # Check if OJT duration is reasonable
            duration = (self.proposed_end_date - self.proposed_start_date).days
            if duration < 30:
                raise ValidationError("OJT duration should be at least 1 month.")
            if duration > 365:
                raise ValidationError("OJT duration cannot exceed 1 year.")

        if self.proposed_hours and self.proposed_hours < 240:
            raise ValidationError("OJT hours must be at least 240 hours.")

        # Check if company can accept more students (only for new applications)
        if not self.pk and self.company and not self.company.can_accept_more_students():
            raise ValidationError("This company has no available slots for OJT.")

    class Meta:
        ordering = ['-application_date']
        unique_together = ['student', 'company']
        verbose_name = "OJT Application"
        verbose_name_plural = "OJT Applications"


class OJTRequirement(models.Model):
    REQUIREMENT_TYPES = [
        ('resume', 'Resume/CV'),
        ('application_form', 'Application Form'),
        ('parent_consent', 'Parent Consent Form'),
        ('medical_certificate', 'Medical Certificate'),
        ('barangay_clearance', 'Barangay Clearance'),
        ('police_clearance', 'Police Clearance'),
        ('nbi_clearance', 'NBI Clearance'),
        ('photo_2x2', '2x2 Photo'),
        ('registration_form', 'Registration Form'),
        ('endorsement_letter', 'Endorsement Letter'),
        ('waiver', 'Waiver Form'),
        ('academic_records', 'Academic Records'),
        ('other', 'Other Document'),
    ]

    application = models.ForeignKey(
        OJTApplication,
        on_delete=models.CASCADE,
        related_name='requirements'
    )

    requirement_type = models.CharField(max_length=50, choices=REQUIREMENT_TYPES)
    file = models.FileField(
        upload_to='ojt_requirements/%Y/%m/%d/',
        validators=[
            FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'])
        ]
    )

    # Submission info
    is_submitted = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(null=True, blank=True)

    # Verification info
    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(
        'CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_requirements'
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    verification_notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_requirement_type_display()} - {self.application.student.get_full_name()}"

    def save(self, *args, **kwargs):
        # Auto-set submitted_at when file is uploaded
        if self.file and not self.submitted_at:
            self.is_submitted = True
            self.submitted_at = timezone.now()

        super().save(*args, **kwargs)

    def verify(self, verified_by, notes=""):
        """Verify this requirement"""
        self.is_verified = True
        self.verified_by = verified_by
        self.verified_at = timezone.now()
        self.verification_notes = notes
        self.save()

    def unverify(self):
        """Unverify this requirement"""
        self.is_verified = False
        self.verified_by = None
        self.verified_at = None
        self.verification_notes = ""
        self.save()

    @property
    def file_name(self):
        """Get the file name"""
        return self.file.name.split('/')[-1]

    @property
    def status(self):
        """Get requirement status"""
        if self.is_verified:
            return "Verified"
        elif self.is_submitted:
            return "Submitted"
        else:
            return "Pending"

    class Meta:
        verbose_name = "OJT Requirement"
        verbose_name_plural = "OJT Requirements"
        unique_together = ['application', 'requirement_type']


class OJTReport(models.Model):
    REPORT_TYPES = [
        ('weekly', 'Weekly Report'),
        ('monthly', 'Monthly Report'),
        ('final', 'Final Report'),
        ('incident', 'Incident Report'),
        ('complaint', 'Complaint Report'),
    ]

    REPORT_STATUS = [
        ('submitted', 'Submitted'),
        ('reviewed', 'Reviewed'),
    ]

    # Basic report info
    title = models.CharField(max_length=255, help_text="Brief title of the report")
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES)

    # Related OJT application
    application = models.ForeignKey(
        OJTApplication,
        on_delete=models.CASCADE,
        related_name='reports'
    )

    # Report dates
    report_date = models.DateField(default=timezone.now)
    period_start = models.DateField(help_text="Start date of reporting period", blank=True, null=True)
    period_end = models.DateField(help_text="End date of reporting period", blank=True, null=True)

    # Simple content fields
    description = models.TextField(help_text="Report content - activities, incidents, or accomplishments")
    issues_challenges = models.TextField(blank=True, null=True, help_text="Any issues or challenges faced")

    # Simple status
    status = models.CharField(max_length=20, choices=REPORT_STATUS, default='submitted')

    # Submitted by (automatically set)
    submitted_by = models.ForeignKey(
        'CustomUser',
        on_delete=models.CASCADE,
        related_name='submitted_ojt_reports'
    )
    submitted_at = models.DateTimeField(auto_now_add=True)

    # Simple review info
    reviewed_by = models.ForeignKey(
        'CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_ojt_reports'
    )
    reviewed_at = models.DateTimeField(blank=True, null=True)
    feedback = models.TextField(blank=True, null=True, help_text="Feedback from reviewer")

    # Archive fields
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(blank=True, null=True)
    archived_by = models.ForeignKey(
        'CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='archived_ojt_reports'
    )

    def __str__(self):
        return f"{self.title} - {self.application.student.get_full_name()}"

    def save(self, *args, **kwargs):
        # Auto-set reviewed_at when status changes to reviewed
        if self.status == 'reviewed' and not self.reviewed_at:
            self.reviewed_at = timezone.now()
        super().save(*args, **kwargs)

    @property
    def student_name(self):
        """Get student's full name"""
        return self.application.student.get_full_name()

    @property
    def company_name(self):
        """Get company name"""
        return self.application.company.name

    @property
    def is_complaint_report(self):
        """Check if this is a complaint/incident report"""
        return self.report_type in ['complaint', 'incident']

    @property
    def has_attachments(self):
        """Check if report has any attachments"""
        return self.attachments.exists()

    @property
    def attachments_count(self):
        """Get number of attachments"""
        return self.attachments.count()

    def mark_as_reviewed(self, reviewed_by, feedback=""):
        """Mark report as reviewed"""
        self.status = 'reviewed'
        self.reviewed_by = reviewed_by
        self.reviewed_at = timezone.now()
        self.feedback = feedback
        self.save()

    def archive(self, archived_by):
        """Archive the report"""
        self.is_archived = True
        self.archived_at = timezone.now()
        self.archived_by = archived_by
        self.save()

    def unarchive(self):
        """Unarchive the report"""
        self.is_archived = False
        self.archived_at = None
        self.archived_by = None
        self.save()

    def clean(self):
        """Simple validation"""
        super().clean()

        if self.period_start and self.period_end:
            if self.period_end <= self.period_start:
                raise ValidationError("Period end date must be after start date.")

    class Meta:
        ordering = ['-report_date', '-submitted_at']
        verbose_name = "OJT Report"
        verbose_name_plural = "OJT Reports"


class OJTReportAttachment(models.Model):
    report = models.ForeignKey(
        OJTReport,
        on_delete=models.CASCADE,
        related_name='attachments'
    )
    file = models.FileField(
        upload_to='ojt_reports/attachments/%Y/%m/%d/',
        validators=[
            FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'])
        ]
    )
    file_name = models.CharField(max_length=255, blank=True)
    file_size = models.PositiveIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Auto-populate file_name and file_size if not set
        if self.file and not self.file_name:
            self.file_name = self.file.name.split('/')[-1]  # Get filename only
        if self.file and not self.file_size:
            self.file_size = self.file.size
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.file_name} - {self.report.title}"

    @property
    def file_type(self):
        """Get file type for icon display"""
        ext = self.file_name.split('.')[-1].lower() if '.' in self.file_name else ''
        if ext in ['pdf']:
            return 'pdf'
        elif ext in ['doc', 'docx']:
            return 'word'
        elif ext in ['jpg', 'jpeg', 'png']:
            return 'image'
        else:
            return 'file'

    @property
    def file_type_icon(self):
        """Get icon class based on file type"""
        file_type = self.file_type
        if file_type == 'pdf':
            return 'bx-file-pdf'
        elif file_type == 'word':
            return 'bx-file-doc'
        elif file_type == 'image':
            return 'bx-image'
        else:
            return 'bx-file'

    class Meta:
        verbose_name = "OJT Report Attachment"
        verbose_name_plural = "OJT Report Attachments"
        ordering = ['-uploaded_at']

