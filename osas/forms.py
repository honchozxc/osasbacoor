import json
from datetime import timezone, date, datetime

from django.contrib.auth.hashers import make_password
from django.utils import timezone
from django import forms
from django.utils.translation import gettext_lazy as _
import re
from django.contrib.auth import authenticate
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm, PasswordChangeForm
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator, FileExtensionValidator
from django.contrib.auth.forms import UserChangeForm
from django.forms import inlineformset_factory
from .models import CustomUser, Downloadable, Announcement, AnnouncementImage, AboutPageContent, \
    ComplaintImage, ComplaintDocument, Complaint, FooterContent, \
    StudentDisciplineContent, Scholarship, ScholarshipApplication, ScholarshipPageContent, HomePageContent, \
    StudentAdmission, AdmissionPageContent, NSTPStudentInfo, NSTPFile, NSTPPageContent, \
    Course, ClinicPageContent, OJTCompany, OJTApplication, OJTRequirement, OJTReport, OJTReportAttachment, \
    OJTPageContent, Organization, SDSPageContent, AccomplishmentRecord


# --------------------------------------------- Custom User & Login Form -----------------------------------------------
class CustomUserCreationForm(UserCreationForm):
    first_name = forms.CharField(
        validators=[RegexValidator(
            regex='^[a-zA-Z ]+$',
            message='First name must not contain any numbers',
            code='invalid_first_name'
        )],
        widget=forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Enter first name'})
    )
    last_name = forms.CharField(
        validators=[RegexValidator(
            regex='^[a-zA-Z ]+$',
            message='Last name must not contain any numbers',
            code='invalid_last_name'
        )],
        widget=forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Enter last name'})
    )
    profile_picture = forms.ImageField(
        required=False,
        widget=forms.FileInput(attrs={
            'accept': 'image/*',
            'class': 'profile-picture-input'
        })
    )
    user_type = forms.ChoiceField(
        choices=[('', 'Select User Type')] + [choice for choice in CustomUser.USER_TYPE_CHOICES if choice[0] != 15],
        # Hide Organization (15)
        required=True,
        widget=forms.Select(attrs={'class': 'form-input'}),
        error_messages={
            'required': 'Please select a user type'
        }
    )
    gender = forms.ChoiceField(
        choices=CustomUser.GENDER_CHOICES,
        required=False,
        widget=forms.Select(attrs={'class': 'form-input'})
    )
    birth_date = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={'type': 'date', 'class': 'form-input'})
    )
    phone_number = forms.CharField(
        required=False,
        max_length=20,
        validators=[RegexValidator(
            regex='^[0-9+()-]+$',
            message='Phone number can only contain numbers, +, (), and hyphens'
        )],
        widget=forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Enter phone number'})
    )
    address = forms.CharField(
        required=False,
        max_length=255,
        widget=forms.Textarea(attrs={'class': 'form-input', 'rows': 3, 'placeholder': 'Enter address'})
    )
    student_number = forms.CharField(
        required=False,
        max_length=20,
        validators=[RegexValidator(
            regex='^[0-9-]+$',
            message='Student number can only contain numbers and hyphens'
        )],
        widget=forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Enter student number'})
    )
    course = forms.ModelChoiceField(
        queryset=Course.objects.all(),
        required=False,
        widget=forms.Select(attrs={'class': 'form-input'})
    )
    year_level = forms.CharField(
        required=False,
        max_length=10,
        widget=forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Enter year level'})
    )
    section = forms.CharField(
        required=False,
        max_length=10,
        widget=forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Enter section'})
    )
    department = forms.CharField(
        required=False,
        max_length=100,
        widget=forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Enter department'})
    )
    osas_position = forms.ChoiceField(
        choices=CustomUser.OSAS_POSITION_CHOICES,
        required=False,
        widget=forms.Select(attrs={'class': 'form-input'})
    )
    id_photo = forms.ImageField(
        required=False,
        widget=forms.FileInput(attrs={'accept': 'image/*', 'class': 'form-input'})
    )
    cor_photo = forms.ImageField(
        required=False,
        widget=forms.FileInput(attrs={'accept': 'image/*', 'class': 'form-input'}),
        label="Certificate of Registration (COR)"
    )

    class Meta:
        model = CustomUser
        fields = (
            'first_name', 'last_name', 'username', 'email', 'user_type', 'profile_picture',
            'password1', 'password2', 'gender', 'birth_date', 'phone_number', 'address',
            'student_number', 'course', 'year_level', 'section', 'department',
            'osas_position', 'id_photo', 'cor_photo'
        )

    def __init__(self, *args, **kwargs):
        self.request = kwargs.pop('request', None)
        super().__init__(*args, **kwargs)

        # Remove user_type field if user is not superuser
        if self.request and not self.request.user.is_superuser:
            self.fields.pop('user_type')

        # Make course field optional initially
        self.fields['course'].required = False
        self.fields['course'].queryset = Course.objects.all().order_by('name')

    def clean_user_type(self):
        user_type = self.cleaned_data.get('user_type')
        if not user_type:
            raise forms.ValidationError("Please select a user type.")

        # Convert to integer for validation
        try:
            user_type_int = int(user_type)
        except (ValueError, TypeError):
            raise forms.ValidationError("Invalid user type selected.")

        # Validate that organization (15) is not selected
        if user_type_int == 15:
            raise forms.ValidationError("Organization registration is not available through this form.")

        return user_type_int

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if email and CustomUser.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError("This email is already in use. Please use a different email address.")
        return email

    def clean_phone_number(self):
        phone_number = self.cleaned_data.get('phone_number')
        if phone_number and not re.match(r'^[0-9+()-]+$', phone_number):
            raise forms.ValidationError("Phone number can only contain numbers, +, (), and hyphens.")
        return phone_number

    def clean_student_number(self):
        student_number = self.cleaned_data.get('student_number')
        user_type = self.cleaned_data.get('user_type')

        # Skip validation if not a student
        if user_type != 14:
            return student_number

        # Student-specific validation
        if not student_number:
            raise forms.ValidationError("Student number is required for students.")

        if not re.match(r'^[0-9-]+$', student_number):
            raise forms.ValidationError("Student number can only contain numbers and hyphens.")

        # Check uniqueness only for students
        if CustomUser.objects.filter(student_number__iexact=student_number).exists():
            raise forms.ValidationError("This student number is already in use.")

        return student_number

    def clean_birth_date(self):
        birth_date = self.cleaned_data.get('birth_date')
        if birth_date:
            today = date.today()
            age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
            if age < 18:
                raise forms.ValidationError("You must be at least 18 years old to register.")
        return birth_date

    def clean(self):
        cleaned_data = super().clean()
        password1 = cleaned_data.get("password1")
        password2 = cleaned_data.get("password2")
        user_type = cleaned_data.get("user_type")

        # Password validation
        if password1 and password2 and password1 != password2:
            self.add_error('password2', "Passwords don't match")

        # User type validation
        if not user_type:
            self.add_error('user_type', "Please select a user type.")

        # Conditional field validation based on user type
        if user_type == 14:  # Student
            student_required = ['student_number', 'course', 'year_level', 'section']
            for field in student_required:
                if not cleaned_data.get(field):
                    self.add_error(field, f'This field is required for students')

            # COR is required for students
            if not cleaned_data.get('cor_photo'):
                self.add_error('cor_photo', 'Certificate of Registration (COR) is required for students')

        elif user_type and user_type in range(1, 14):  # OSAS staff (1-13)
            staff_required = ['department']
            for field in staff_required:
                if not cleaned_data.get(field):
                    self.add_error(field, f'This field is required for OSAS staff')

            # ID Photo is required for OSAS staff
            if not cleaned_data.get('id_photo'):
                self.add_error('id_photo', 'ID Photo is required for OSAS staff')

        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        user_type = self.cleaned_data['user_type']

        # Handle profile picture - check both cleaned_data and files
        profile_picture = self.cleaned_data.get('profile_picture')
        if not profile_picture and 'profile_picture' in self.files:
            profile_picture = self.files['profile_picture']

        if profile_picture:
            user.profile_picture = profile_picture

        if user_type == 14:  # Student
            user.student_number = self.cleaned_data['student_number']
            user.course = self.cleaned_data['course']
            user.year_level = self.cleaned_data['year_level']
            user.section = self.cleaned_data['section']

            # Handle COR photo
            cor_photo = self.cleaned_data.get('cor_photo')
            if not cor_photo and 'cor_photo' in self.files:
                cor_photo = self.files['cor_photo']
            if cor_photo:
                user.cor_photo = cor_photo

        elif user_type in range(1, 14):  # OSAS staff
            user.department = self.cleaned_data['department']
            user.osas_position = self.cleaned_data.get('osas_position')

            # Handle ID photo
            id_photo = self.cleaned_data.get('id_photo')
            if not id_photo and 'id_photo' in self.files:
                id_photo = self.files['id_photo']
            if id_photo:
                user.id_photo = id_photo

        if commit:
            user.save()

        return user


class CustomUserUpdateForm(UserChangeForm):
    first_name = forms.CharField(
        validators=[RegexValidator(
            regex='^[a-zA-Z ]+$',
            message='First name must not contain any numbers',
            code='invalid_first_name'
        )]
    )
    last_name = forms.CharField(
        validators=[RegexValidator(
            regex='^[a-zA-Z ]+$',
            message='Last name must not contain any numbers',
            code='invalid_last_name'
        )]
    )
    profile_picture = forms.ImageField(required=False, widget=forms.FileInput(attrs={
        'accept': 'image/*',
        'class': 'profile-picture-input'
    }))
    user_type = forms.ChoiceField(
        choices=CustomUser.USER_TYPE_CHOICES,
        widget=forms.RadioSelect,
        required=False
    )
    osas_position = forms.ChoiceField(
        choices=CustomUser.OSAS_POSITION_CHOICES,
        required=False,
        widget=forms.Select(attrs={'class': 'form-input'})
    )
    course = forms.ModelChoiceField(
        queryset=Course.objects.all(),
        required=False,
        widget=forms.Select(attrs={'class': 'form-input'})
    )
    password1 = forms.CharField(
        label="New Password",
        widget=forms.PasswordInput,
        required=False,
        help_text="Leave blank to keep the same password."
    )
    password2 = forms.CharField(
        label="Confirm New Password",
        widget=forms.PasswordInput,
        required=False,
        help_text="Enter the same password as above, for verification."
    )

    class Meta:
        model = CustomUser
        fields = (
            'first_name', 'last_name', 'username', 'email', 'is_active',
            'user_type', 'profile_picture', 'gender', 'birth_date',
            'phone_number', 'address', 'student_number', 'course',
            'year_level', 'section', 'department', 'osas_position',
            'id_photo', 'cor_photo'
        )

    def __init__(self, *args, **kwargs):
        self.request = kwargs.pop('request', None)
        super().__init__(*args, **kwargs)
        self.fields.pop('password')

        # Remove user_type field if user is not superuser
        if self.request and not self.request.user.is_superuser:
            self.fields.pop('user_type')

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if email and CustomUser.objects.filter(email__iexact=email).exclude(id=self.instance.id).exists():
            raise forms.ValidationError("This email is already in use. Please use a different email address.")
        return email

    def clean(self):
        cleaned_data = super().clean()
        password1 = cleaned_data.get("password1")
        password2 = cleaned_data.get("password2")
        user_type = cleaned_data.get("user_type")

        # Password validation
        if password1 and password2 and password1 != password2:
            self.add_error('password2', "Passwords don't match")

        # Conditional field validation based on user type
        if str(user_type) == '14':  # Student
            student_required = ['student_number', 'course', 'year_level']
            for field in student_required:
                if not cleaned_data.get(field):
                    self.add_error(field, f'This field is required for students')

        elif user_type and str(user_type) in [str(x) for x in range(1, 14)]:  # OSAS staff
            staff_required = ['department']
            for field in staff_required:
                if not cleaned_data.get(field):
                    self.add_error(field, f'This field is required for OSAS staff')


        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)

        # Handle password change
        password = self.cleaned_data.get('password1')
        if password:
            user.set_password(password)

        user_type = self.cleaned_data.get('user_type')

        # Handle user type specific fields
        if str(user_type) == '14':  # Student
            user.student_number = self.cleaned_data.get('student_number')
            user.course = self.cleaned_data.get('course')
            user.year_level = self.cleaned_data.get('year_level')
            user.section = self.cleaned_data.get('section')

        elif str(user_type) in [str(x) for x in range(1, 14)]:  # OSAS staff
            user.department = self.cleaned_data.get('department')
            user.osas_position = self.cleaned_data.get('osas_position')

        if commit:
            user.save()

        return user


class CustomAuthenticationForm(AuthenticationForm):
    class Meta:
        model = CustomUser
        fields = ('username', 'password')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.error_messages.update({
            'inactive': "Your account is inactive. Please contact support.",
            'archived': "Your account is archived and cannot be accessed. Please contact support.",
            'unverified': "Your account is pending verification. You'll receive an email when your account is approved.",
        })

    def clean(self):
        username = self.cleaned_data.get('username')
        password = self.cleaned_data.get('password')

        if username and password:
            self.user_cache = authenticate(
                self.request,
                username=username,
                password=password
            )

            if self.user_cache is None:
                raise self.get_invalid_login_error()

            self.confirm_login_allowed(self.user_cache)

        return self.cleaned_data

    def confirm_login_allowed(self, user):
        if getattr(user, 'is_archived', False):
            raise forms.ValidationError(
                self.error_messages['archived'],
                code='archived',
            )

        if not user.is_active:
            raise forms.ValidationError(
                self.error_messages['inactive'],
                code='inactive',
            )

        # Add this check for unverified users
        if not getattr(user, 'is_verified', True):
            raise forms.ValidationError(
                self.error_messages['unverified'],
                code='unverified',
            )

        super().confirm_login_allowed(user)


class RegistrationForm(UserCreationForm):
    PASSWORD_MIN_LENGTH = 8
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    MAX_DOC_SIZE = 10 * 1024 * 1024  # 10MB

    password1 = forms.CharField(
        label=_("Password"),
        widget=forms.PasswordInput(attrs={'class': 'form-control'}),
        help_text=_(
            f"Your password must contain at least {PASSWORD_MIN_LENGTH} characters, "
            "including at least one letter and one number."
        ),
    )
    password2 = forms.CharField(
        label=_("Confirm Password"),
        widget=forms.PasswordInput(attrs={'class': 'form-control'}),
    )

    user_type = forms.ChoiceField(
        choices=CustomUser.USER_TYPE_CHOICES,
        widget=forms.RadioSelect,
        initial='14',  # Default to student
        error_messages={
            'required': _('Please select your user type'),
        }
    )

    first_name = forms.CharField(
        label=_("First Name"),
        max_length=30,
        widget=forms.TextInput(attrs={'class': 'form-control'}),
        error_messages={
            'required': _('First name is required'),
            'max_length': _('First name cannot exceed 30 characters'),
        }
    )

    last_name = forms.CharField(
        label=_("Last Name"),
        max_length=30,
        widget=forms.TextInput(attrs={'class': 'form-control'}),
        error_messages={
            'required': _('Last name is required'),
            'max_length': _('Last name cannot exceed 30 characters'),
        }
    )

    email = forms.EmailField(
        label=_("Email"),
        widget=forms.EmailInput(attrs={'class': 'form-control'}),
        error_messages={
            'required': _('Email is required'),
            'invalid': _('Please enter a valid email address'),
        }
    )

    gender = forms.ChoiceField(
        label=_("Gender"),
        choices=CustomUser.GENDER_CHOICES,
        widget=forms.Select(attrs={'class': 'form-control'}),
        error_messages={
            'required': _('Please select your gender'),
        }
    )

    birth_date = forms.DateField(
        label=_("Birth Date"),
        widget=forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
        error_messages={
            'required': _('Birth date is required'),
        }
    )

    phone_number = forms.CharField(
        label=_("Phone Number"),
        max_length=20,
        widget=forms.TextInput(attrs={'class': 'form-control'}),
        error_messages={
            'required': _('Phone number is required'),
            'max_length': _('Phone number cannot exceed 20 characters'),
        }
    )

    id_photo = forms.ImageField(
        label=_("ID Photo"),
        required=True,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png'])],
        widget=forms.FileInput(attrs={'class': 'form-control-file'}),
        help_text=_("Upload a clear photo of your valid ID (max 5MB)."),
        error_messages={
            'required': _('ID photo is required'),
            'invalid_extension': _('Only JPG, JPEG, and PNG files are allowed'),
        }
    )

    verification_document = forms.FileField(
        label=_("Verification Document"),
        required=False,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'jpeg', 'png'])],
        widget=forms.FileInput(attrs={'class': 'form-control-file'}),
        help_text=_("Upload supporting document for verification (max 10MB)."),
        error_messages={
            'required': _('Verification document is required'),
            'invalid_extension': _('Only PDF, JPG, JPEG, and PNG files are allowed'),
        }
    )

    address = forms.CharField(
        label=_("Address"),
        max_length=255,
        widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        error_messages={
            'required': _('Address is required'),
            'max_length': _('Address cannot exceed 255 characters'),
        }
    )

    class Meta:
        model = CustomUser
        fields = ['username', 'user_type', 'first_name', 'last_name', 'email',
                  'gender', 'birth_date', 'phone_number', 'address']
        widgets = {
            'username': forms.TextInput(attrs={'class': 'form-control'}),
        }
        error_messages = {
            'username': {
                'required': _('Username is required'),
                'unique': _('This username is already taken'),
            },
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Calculate max date (today - 18 years)
        today = date.today()
        max_birth_date = today.replace(year=today.year - 18)
        self.fields['birth_date'].widget.attrs['max'] = max_birth_date.strftime('%Y-%m-%d')

        # Set up conditional fields for different user types
        self._setup_student_fields()
        self._setup_osas_fields()

    def _setup_student_fields(self):
        """Setup student-specific fields"""
        student_fields = {
            'student_number': {
                'label': _("Student Number"),
                'required': False,
                'widget': forms.TextInput(attrs={'class': 'form-control'}),
                'error_messages': {'required': _('Student number is required for students')}
            },
            'course': {
                'label': _("Course"),
                'required': False,
                'widget': forms.TextInput(attrs={'class': 'form-control'}),
                'error_messages': {'required': _('Course is required for students')}
            },
            'year_level': {
                'label': _("Year Level"),
                'required': False,
                'widget': forms.TextInput(attrs={'class': 'form-control'}),
                'error_messages': {'required': _('Year level is required for students')}
            },
            'section': {
                'label': _("Section"),
                'required': False,
                'widget': forms.TextInput(attrs={'class': 'form-control'}),
                'error_messages': {'required': _('Section is required for students')}
            }
        }

        for field_name, config in student_fields.items():
            self.fields[field_name] = forms.CharField(**config)

    def _setup_osas_fields(self):
        """Setup OSAS staff-specific fields"""
        osas_fields = {
            'department': {
                'label': _("Department/Unit"),
                'required': False,
                'widget': forms.TextInput(attrs={'class': 'form-control'}),
                'error_messages': {'required': _('Department/Unit is required for OSAS staff')}
            },
            'osas_position': {
                'label': _("Position"),
                'required': False,
                'widget': forms.Select(attrs={'class': 'form-control'}),
                'choices': CustomUser.OSAS_POSITION_CHOICES,
                'error_messages': {'required': _('Position is required for OSAS staff')}
            }
        }

        for field_name, config in osas_fields.items():
            if field_name == 'osas_position':
                self.fields[field_name] = forms.ChoiceField(**config)
            else:
                self.fields[field_name] = forms.CharField(**config)

    def clean_first_name(self):
        first_name = self.cleaned_data.get('first_name')
        if first_name and not re.match(r'^[a-zA-Z\s\-]+$', first_name):
            raise ValidationError(_("First name can only contain letters, spaces, and hyphens."))
        return first_name

    def clean_last_name(self):
        last_name = self.cleaned_data.get('last_name')
        if last_name and not re.match(r'^[a-zA-Z\s\-]+$', last_name):
            raise ValidationError(_("Last name can only contain letters, spaces, and hyphens."))
        return last_name

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if email and CustomUser.objects.filter(email=email).exists():
            raise ValidationError(_("This email address is already in use."))
        return email

    def clean_phone_number(self):
        phone_number = self.cleaned_data.get('phone_number')
        if phone_number and not re.match(r'^\+?[0-9]{8,15}$', phone_number):
            raise ValidationError(_("Please enter a valid phone number (8-15 digits, may start with +)."))
        return phone_number

    def clean_student_number(self):
        student_number = self.cleaned_data.get('student_number')
        user_type = self.cleaned_data.get('user_type')

        # Only validate if user is student and field is not empty
        if user_type == '14' and student_number:
            if not re.match(r'^[0-9\-]+$', student_number):
                raise ValidationError(_("Student number can only contain numbers and hyphens."))

            if CustomUser.objects.filter(student_number=student_number).exists():
                raise ValidationError(_("This student number is already registered"))

        # Still require student number for students
        if user_type == '14' and not student_number:
            raise ValidationError(_("Student number is required"))

        return student_number

    def clean_id_photo(self):
        id_photo = self.cleaned_data.get('id_photo')
        if id_photo and id_photo.size > self.MAX_FILE_SIZE:
            raise ValidationError(_("ID photo size cannot exceed 5MB"))
        return id_photo

    def clean_verification_document(self):
        doc = self.cleaned_data.get('verification_document')
        if doc and doc.size > self.MAX_DOC_SIZE:
            raise ValidationError(_("Verification document size cannot exceed 10MB"))
        return doc

    def clean_password1(self):
        password1 = self.cleaned_data.get('password1')
        if password1:
            if len(password1) < self.PASSWORD_MIN_LENGTH:
                raise ValidationError(_(f"Password must be at least {self.PASSWORD_MIN_LENGTH} characters long."))

            # Check for at least one letter and one number
            if not re.search(r'[a-zA-Z]', password1) or not re.search(r'[0-9]', password1):
                raise ValidationError(_("Password must contain at least one letter and one number."))

        return password1

    def clean(self):
        cleaned_data = super().clean()
        user_type = cleaned_data.get('user_type')
        birth_date = cleaned_data.get('birth_date')

        # Age restriction: must be at least 18
        if birth_date:
            today = date.today()
            age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
            if age < 18:
                self.add_error('birth_date', _('You must be at least 18 years old to register.'))

        # Student validation
        if user_type == '14':  # Student
            required_fields = ['student_number', 'course', 'year_level', 'section']
            for field in required_fields:
                if not cleaned_data.get(field):
                    self.add_error(field, _(f"This field is required for student registration."))

        # OSAS unit validation
        elif user_type and user_type in [str(x) for x in range(1, 14)]:
            required_fields = ['department', 'osas_position']
            for field in required_fields:
                if not cleaned_data.get(field):
                    self.add_error(field, _(f"This field is required for OSAS unit registration."))


        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data['password1'])
        user.is_verified = False

        # Handle file uploads
        user.id_photo = self.cleaned_data.get('id_photo')
        user.verification_document = self.cleaned_data.get('verification_document')

        # Set address
        user.address = self.cleaned_data.get('address', '')

        # Set user type specific fields
        user_type = self.cleaned_data['user_type']

        if user_type == '14':  # Student
            user.student_number = self.cleaned_data['student_number']
            user.course = self.cleaned_data['course']
            user.year_level = self.cleaned_data['year_level']
            user.section = self.cleaned_data['section']
        elif user_type in [str(x) for x in range(1, 14)]:  # OSAS staff
            user.department = self.cleaned_data['department']
            user.osas_position = self.cleaned_data['osas_position']

        if commit:
            user.save()
            self.save_m2m()

        return user


# -------------------------------------------------- User Profile Form -------------------------------------------------
class UserProfileForm(forms.ModelForm):
    profile_picture = forms.ImageField(required=False, widget=forms.FileInput(attrs={
        'accept': 'image/*',
        'class': 'hidden',
        'id': 'id_profile_picture'
    }))
    birth_date = forms.DateField(
        widget=forms.DateInput(attrs={'type': 'date'}),
        required=False
    )
    bio = forms.CharField(
        widget=forms.Textarea(attrs={'rows': 4}),
        required=False
    )

    # Only keep OSAS position field
    osas_position = forms.ChoiceField(
        choices=CustomUser.OSAS_POSITION_CHOICES,
        required=False,
        widget=forms.Select(attrs={'class': 'zen-form-input'})
    )

    class Meta:
        model = CustomUser
        fields = ('first_name', 'last_name', 'gender', 'birth_date', 'address', 'phone_number',
                  'osas_position', 'bio', 'profile_picture')
        widgets = {
            'gender': forms.Select(attrs={'class': 'zen-form-input'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Remove the old 'position' field if it exists in the form
        if 'position' in self.fields:
            del self.fields['position']

        for field in self.fields.values():
            field.widget.attrs['class'] = 'zen-form-input'

        # Set initial values for position field based on user type
        if self.instance:
            if self.instance.is_osas_unit:
                # For OSAS staff, show OSAS position
                if self.instance.osas_position:
                    self.fields['osas_position'].initial = self.instance.osas_position
            else:
                # For students and others, hide OSAS position field
                self.fields['osas_position'].widget = forms.HiddenInput()

    def clean_phone_number(self):
        phone_number = self.cleaned_data.get('phone_number')
        if phone_number and not phone_number.isdigit():
            raise ValidationError('Phone number should contain only digits')
        return phone_number

    def save(self, commit=True):
        user = super().save(commit=False)

        # Save OSAS position only for OSAS staff
        if user.is_osas_unit:
            user.osas_position = self.cleaned_data.get('osas_position')

        if commit:
            user.save()
        return user


class AccountInfoForm(forms.ModelForm):
    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'user_type', 'is_active']
        widgets = {
            'user_type': forms.Select(attrs={'class': 'zen-form-input'}),
            'is_active': forms.CheckboxInput(attrs={'class': 'hidden'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs['class'] = 'zen-form-input'

        if not self.instance.is_superuser:
            self.fields.pop('user_type')
            self.fields.pop('is_active')

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if CustomUser.objects.filter(email=email).exclude(pk=self.instance.pk).exists():
            raise ValidationError('This email is already registered')
        return email

    def clean_username(self):
        username = self.cleaned_data.get('username')
        if CustomUser.objects.filter(username=username).exclude(pk=self.instance.pk).exists():
            raise ValidationError('This username is already taken')
        return username


class CustomPasswordChangeForm(PasswordChangeForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs['class'] = 'zen-form-input'


# -------------------------------------------------- Downloadable Form -------------------------------------------------
class DownloadableForm(forms.ModelForm):
    class Meta:
        model = Downloadable
        fields = ['title', 'description', 'file', 'category', 'is_active']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3}),
        }

    def clean_file(self):
        file = self.cleaned_data.get('file')
        if file:
            max_size = 10 * 1024 * 1024
            if file.size > max_size:
                raise forms.ValidationError("File size must be less than 10MB.")

            valid_extensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip']
            if not any(file.name.lower().endswith(ext) for ext in valid_extensions):
                raise forms.ValidationError("Unsupported file type. Please upload a document or archive file.")

        return file


# -------------------------------------------------- Announcement Form -------------------------------------------------
class AnnouncementForm(forms.ModelForm):
    courses = forms.MultipleChoiceField(
        choices=Announcement.COURSE_CHOICES,
        required=False,
        widget=forms.CheckboxSelectMultiple
    )

    application_start = forms.DateTimeField(
        required=False,
        widget=forms.DateTimeInput(attrs={'type': 'datetime-local'})
    )
    application_end = forms.DateTimeField(
        required=False,
        widget=forms.DateTimeInput(attrs={'type': 'datetime-local'})
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.courses:
            # Initialize courses field with instance data
            self.initial['courses'] = self.instance.courses

    def clean_courses(self):
        courses = self.cleaned_data.get('courses', [])
        if isinstance(courses, str):
            return [courses]
        return list(courses)

    def clean(self):
        cleaned_data = super().clean()
        category = cleaned_data.get('category')
        errors = {}

        # Enrollment validation
        if category == 'ENROLLMENT':
            enrollment_start = cleaned_data.get('enrollment_start')
            enrollment_end = cleaned_data.get('enrollment_end')
            courses = cleaned_data.get('courses', [])

            if not courses:
                errors['courses'] = "Please select at least one course."
            elif 'ALL' in courses and len(courses) > 1:
                errors['courses'] = "You cannot select 'All Courses' with other courses."

            if not enrollment_start:
                errors['enrollment_start'] = "Enrollment start date is required."
            if not enrollment_end:
                errors['enrollment_end'] = "Enrollment end date is required."
            if enrollment_start and enrollment_end and enrollment_start >= enrollment_end:
                errors['enrollment_start'] = "Enrollment end date must be after start date."
                errors['enrollment_end'] = "Enrollment end date must be after start date."

        # Scholarship validation
        elif category == 'SCHOLARSHIP':
            app_start = cleaned_data.get('application_start')
            app_end = cleaned_data.get('application_end')
            scholarship = cleaned_data.get('scholarship')
            requirements = cleaned_data.get('requirements')
            benefits = cleaned_data.get('benefits')

            if app_start and app_end:
                if app_start >= app_end:
                    errors['application_start'] = "Application end date must be after start date."
                    errors['application_end'] = "Application end date must be after start date."
                if app_start < timezone.now():
                    errors['application_start'] = "Application period cannot start in the past."

            if not scholarship and not requirements:
                errors['requirements'] = "Requirements are required when no scholarship is selected."
            if not scholarship and not benefits:
                errors['benefits'] = "Benefits are required when no scholarship is selected."

        # Event validation
        elif category == 'EVENT':
            event_date = cleaned_data.get('event_date')
            location = cleaned_data.get('location')

            if not event_date:
                errors['event_date'] = "Event date is required."
            elif event_date < timezone.now():
                errors['event_date'] = "Event date cannot be in the past."
            if not location:
                errors['location'] = "Location is required."

        # Suspension validation
        elif category == 'SUSPENSION':
            suspension_date = cleaned_data.get('suspension_date')
            until_date = cleaned_data.get('until_suspension_date')

            if not suspension_date:
                errors['suspension_date'] = "Suspension date is required."
            if until_date and suspension_date and suspension_date > until_date:
                errors['until_suspension_date'] = "Until date must be after suspension date."

        # Emergency validation
        elif category == 'EMERGENCY':
            if not cleaned_data.get('contact_info'):
                errors['contact_info'] = "Contact information is required."

        if errors:
            raise ValidationError(errors)

        return cleaned_data

    class Meta:
        model = Announcement
        fields = [
            'title', 'content', 'category', 'is_published', 'link',
            'courses', 'enrollment_start', 'enrollment_end',
            'event_date', 'location',
            'suspension_date', 'until_suspension_date',
            'contact_info',
            'scholarship', 'application_start', 'application_end',
            'requirements', 'benefits'
        ]
        widgets = {
            'enrollment_start': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'enrollment_end': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'event_date': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'suspension_date': forms.DateInput(attrs={'type': 'date'}),
            'until_suspension_date': forms.DateInput(attrs={'type': 'date'}),
            'content': forms.Textarea(attrs={'rows': 5}),
            'application_start': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'application_end': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'requirements': forms.Textarea(attrs={'rows': 3}),
            'benefits': forms.Textarea(attrs={'rows': 3}),
        }

    def setup_category_fields(self):
        # All category-specific fields should be hidden by default
        category_fields = [
            # Enrollment fields
            'courses', 'enrollment_start', 'enrollment_end',
            # Event fields
            'event_date', 'location',
            # Suspension fields
            'suspension_date', 'until_suspension_date',
            # Emergency fields
            'contact_info'
            # Scholarship fields
            'scholarship', 'application_start', 'application_end', 'requirements', 'benefits'
        ]

        for field in category_fields:
            self.fields[field].widget = forms.HiddenInput()
            self.fields[field].required = False

    def show_category_fields(self, category):
        self.setup_category_fields()

        if category == 'BASIC':
            pass
        elif category == 'ENROLLMENT':
            for field in ['courses', 'enrollment_start', 'enrollment_end']:
                self.fields[field].widget = self.Meta.widgets.get(field, forms.TextInput())
                self.fields[field].required = True
        elif category == 'EVENT':
            for field in ['event_date', 'location']:
                self.fields[field].widget = self.Meta.widgets.get(field, forms.TextInput())
                self.fields[field].required = True
        elif category == 'SUSPENSION':
            for field in ['suspension_date', 'until_suspension_date']:
                self.fields[field].widget = self.Meta.widgets.get(field, forms.TextInput())
                self.fields[field].required = True
        elif category == 'EMERGENCY':
            self.fields['contact_info'].widget = forms.Textarea(attrs={'rows': 3})
            self.fields['contact_info'].required = True
        elif category == 'SCHOLARSHIP':
            # Scholarship field is optional
            self.fields['scholarship'].widget = self.Meta.widgets.get('scholarship', forms.TextInput())
            self.fields['scholarship'].required = False

            # Application dates are optional but will validate if provided
            self.fields['application_start'].widget = self.Meta.widgets.get('application_start', forms.TextInput())
            self.fields['application_start'].required = False
            self.fields['application_end'].widget = self.Meta.widgets.get('application_end', forms.TextInput())
            self.fields['application_end'].required = False

            if not self.data.get('scholarship'):
                self.fields['requirements'].widget = forms.Textarea(attrs={'rows': 3})
                self.fields['benefits'].widget = forms.Textarea(attrs={'rows': 3})
                self.fields['requirements'].required = True
                self.fields['benefits'].required = True


AnnouncementImageFormSet = inlineformset_factory(
    Announcement,
    AnnouncementImage,
    fields=('image', 'caption'),
    extra=5,
    max_num=30,
    can_delete=True,
    widgets={
        'caption': forms.TextInput(attrs={'placeholder': 'Optional caption'}),
    }
)


# -------------------------------------------------- Editable Page Form ------------------------------------------------
class HomePageForm(forms.ModelForm):
    class Meta:
        model = HomePageContent
        fields = ['logo', 'title', 'tagline', 'weekdays_hours', 'saturday_hours', 'sunday_hours']
        widgets = {
            'logo': forms.ClearableFileInput(attrs={'accept': 'image/*'}),
            'title': forms.TextInput(attrs={'class': 'form-control'}),
            'tagline': forms.TextInput(attrs={'class': 'form-control'}),
            'weekdays_hours': forms.TextInput(attrs={'class': 'form-control'}),
            'saturday_hours': forms.TextInput(attrs={'class': 'form-control'}),
            'sunday_hours': forms.TextInput(attrs={'class': 'form-control'}),
        }


class CourseForm(forms.ModelForm):
    class Meta:
        model = Course
        fields = ['name', 'subtext', 'logo']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control'}),
            'subtext': forms.TextInput(attrs={'class': 'form-control'}),
            'logo': forms.FileInput(attrs={'class': 'custom-file-input'}),
        }


class AboutPageForm(forms.ModelForm):
    class Meta:
        model = AboutPageContent
        fields = ['title', 'tagline', 'about_text', 'mission', 'vision', 'goals', 'objectives']
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control'}),
            'tagline': forms.TextInput(attrs={'class': 'form-control'}),
            'about_text': forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
            'mission': forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
            'vision': forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
            'goals': forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
            'objectives': forms.HiddenInput(),
        }


class StudentDisciplineForm(forms.ModelForm):
    class Meta:
        model = StudentDisciplineContent
        fields = '__all__'
        widgets = {
            'about_text': forms.Textarea(attrs={'rows': 4}),
            'approach_text': forms.Textarea(attrs={'rows': 3}),
            'filing_text': forms.Textarea(attrs={'rows': 3}),
            'principles_items': forms.HiddenInput(),
            'approach_items': forms.HiddenInput(),
            'complaint_types': forms.HiddenInput(),
            'how_to_file_steps': forms.HiddenInput(),
            'process_notes': forms.HiddenInput(),
        }


class FooterContentForm(forms.ModelForm):
    class Meta:
        model = FooterContent
        fields = '__all__'
        widgets = {
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'address': forms.Textarea(attrs={'class': 'form-control', 'rows': 2}),
            'copyright_text': forms.TextInput(attrs={'class': 'form-control'}),
        }


class ScholarshipPageForm(forms.ModelForm):
    faq_content = forms.CharField(widget=forms.HiddenInput(), required=False)

    class Meta:
        model = ScholarshipPageContent
        fields = ['hero_title', 'hero_subtitle', 'hero_image', 'faq_content']
        widgets = {
            'hero_title': forms.TextInput(attrs={'class': 'form-control'}),
            'hero_subtitle': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }


class AdmissionPageForm(forms.ModelForm):
    class Meta:
        model = AdmissionPageContent
        fields = '__all__'
        widgets = {
            'requirements': forms.HiddenInput(),
        }


class NSTPPageForm(forms.ModelForm):
    class Meta:
        model = NSTPPageContent
        fields = '__all__'
        widgets = {
            'about_text': forms.Textarea(attrs={'rows': 5}),
            'hero_subtitle': forms.Textarea(attrs={'rows': 3}),
        }
        help_texts = {
            'about_image': 'Upload an image for the about section (recommended size: 800x600px)',
        }


class ClinicPageForm(forms.ModelForm):
    class Meta:
        model = ClinicPageContent
        fields = ['hero_title', 'hero_description', 'phone', 'email', 'address']
        widgets = {
            'hero_title': forms.TextInput(attrs={'class': 'form-control'}),
            'hero_description': forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
            'phone': forms.TextInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
            'address': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }


class OJTPageForm(forms.ModelForm):
    class Meta:
        model = OJTPageContent
        fields = [
            'hero_title', 'hero_subtitle',
            'overview_title', 'overview_subtitle',
            'services_title', 'services_subtitle',
            'partners_title', 'partners_subtitle',
            'process_title', 'process_subtitle',
            'faq_title', 'faq_subtitle',
            'cta_title', 'cta_subtitle', 'cta_button_text',
            'overview_cards', 'services_cards', 'process_steps', 'faq_content'
        ]
        widgets = {
            'hero_title': forms.TextInput(attrs={'class': 'form-control'}),
            'hero_subtitle': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'overview_title': forms.TextInput(attrs={'class': 'form-control'}),
            'overview_subtitle': forms.Textarea(attrs={'class': 'form-control', 'rows': 2}),
            'services_title': forms.TextInput(attrs={'class': 'form-control'}),
            'services_subtitle': forms.Textarea(attrs={'class': 'form-control', 'rows': 2}),
            'partners_title': forms.TextInput(attrs={'class': 'form-control'}),
            'partners_subtitle': forms.Textarea(attrs={'class': 'form-control', 'rows': 2}),
            'process_title': forms.TextInput(attrs={'class': 'form-control'}),
            'process_subtitle': forms.Textarea(attrs={'class': 'form-control', 'rows': 2}),
            'faq_title': forms.TextInput(attrs={'class': 'form-control'}),
            'faq_subtitle': forms.Textarea(attrs={'class': 'form-control', 'rows': 2}),
            'cta_title': forms.TextInput(attrs={'class': 'form-control'}),
            'cta_subtitle': forms.Textarea(attrs={'class': 'form-control', 'rows': 2}),
            'cta_button_text': forms.TextInput(attrs={'class': 'form-control'}),
            'overview_cards': forms.HiddenInput(),
            'services_cards': forms.HiddenInput(),
            'process_steps': forms.HiddenInput(),
            'faq_content': forms.HiddenInput(),
        }


# -------------------------------------------------- Complaint Form ----------------------------------------------------
class ComplaintForm(forms.ModelForm):
    class Meta:
        model = Complaint
        fields = [
            # Complainant Information
            'complainant_first_name', 'complainant_last_name', 'complainant_email',
            'complainant_phone', 'complainant_address', 'complainant_instructor_name',

            # Respondent Information
            'respondent_type', 'respondent_first_name', 'respondent_last_name',
            'respondent_course', 'respondent_year', 'respondent_section',
            'respondent_department',

            # Complaint Details
            'title', 'statement', 'incident_date', 'incident_time',
            'incident_location', 'witnesses', 'notes'
        ]
        widgets = {
            'incident_date': forms.DateInput(attrs={'type': 'date'}),
            'incident_time': forms.TimeInput(attrs={'type': 'time'}),
            'statement': forms.Textarea(attrs={'rows': 4}),
            'witnesses': forms.Textarea(attrs={'rows': 2}),
            'notes': forms.Textarea(attrs={'rows': 2}),
            'complainant_address': forms.Textarea(attrs={'rows': 3}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields:
            if field in self.errors:
                self.fields[field].widget.attrs.update({
                    'class': 'is-invalid'
                })

    def clean_complainant_first_name(self):
        first_name = self.cleaned_data.get('complainant_first_name', '').strip()
        if not first_name:
            raise ValidationError("First name is required.")

        if not all(char.isalpha() or char.isspace() for char in first_name):
            raise ValidationError("First name should contain only letters and spaces.")

        if not any(char.isalpha() for char in first_name):
            raise ValidationError("First name must contain letters.")

        return first_name

    def clean_complainant_last_name(self):
        last_name = self.cleaned_data.get('complainant_last_name', '').strip()
        if not last_name:
            raise ValidationError("Last name is required.")

        if not all(char.isalpha() or char.isspace() for char in last_name):
            raise ValidationError("Last name should contain only letters and spaces.")

        if not any(char.isalpha() for char in last_name):
            raise ValidationError("Last name must contain letters.")

        return last_name

    def clean_complainant_email(self):
        email = self.cleaned_data.get('complainant_email')
        if email and '@' not in email:
            raise ValidationError("Please enter a valid email address.")
        return email

    def clean_complainant_phone(self):
        phone = self.cleaned_data.get('complainant_phone')
        if phone and not phone.isdigit():
            raise ValidationError("Phone number should contain only numbers.")
        return phone

    def clean_incident_date(self):
        incident_date = self.cleaned_data.get('incident_date')
        if incident_date:
            today = date.today()
            if incident_date > today:
                raise ValidationError("Incident date cannot be in the future.")
        return incident_date

    def clean(self):
        cleaned_data = super().clean()
        respondent_type = cleaned_data.get('respondent_type')

        if respondent_type == 'student':
            if not all([
                cleaned_data.get('respondent_course'),
                cleaned_data.get('respondent_year'),
                cleaned_data.get('respondent_section')
            ]):
                raise ValidationError("For student respondents, course, year, and section are required.")

        elif respondent_type == 'faculty_staff':
            if not cleaned_data.get('respondent_department'):
                raise ValidationError("For faculty/staff respondents, department is required.")

        return cleaned_data


class ComplaintDocumentForm(forms.ModelForm):
    class Meta:
        model = ComplaintDocument
        fields = ['file', 'description']
        widgets = {
            'description': forms.TextInput(attrs={'placeholder': 'Document description'}),
        }


class ComplaintImageForm(forms.ModelForm):
    class Meta:
        model = ComplaintImage
        fields = ['image', 'caption']
        widgets = {
            'caption': forms.TextInput(attrs={'placeholder': 'Image caption'}),
        }


# ------------------------------------------------- Scholarship Section ------------------------------------------------
class ScholarshipForm(forms.ModelForm):
    class Meta:
        model = Scholarship
        fields = [
            'name', 'scholarship_type', 'description', 'benefits',
            'requirements', 'slots_available', 'is_active'
        ]
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3}),
            'benefits': forms.Textarea(attrs={'rows': 3}),
            'requirements': forms.Textarea(attrs={'rows': 3}),
        }


# ----------------------------------------- Scholarship Application Section --------------------------------------------
class ScholarshipApplicationForm(forms.ModelForm):
    class Meta:
        model = ScholarshipApplication
        fields = ['scholarship', 'application_form', 'cog', 'cor', 'id_photo', 'other_documents']
        widgets = {
            'scholarship': forms.Select(attrs={'class': 'form-control'}),
        }

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        self.fields['scholarship'].queryset = Scholarship.objects.filter(is_active=True)

        # Make all file fields required except other_documents
        for field in ['application_form', 'cog', 'cor', 'id_photo']:
            self.fields[field].required = True


class ScholarshipApplicationEditForm(forms.ModelForm):
    class Meta:
        model = ScholarshipApplication
        fields = ['scholarship', 'status', 'notes',
                  'application_form', 'cog', 'cor', 'id_photo', 'other_documents',
                  'status_updated_by', 'status_update_date']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['scholarship'].queryset = Scholarship.objects.filter(is_active=True)
        self.fields['status_update_date'].required = False
        self.fields['status_updated_by'].required = False

        # Make document fields not required since they might not change
        for field in ['application_form', 'cog', 'cor', 'id_photo', 'other_documents']:
            self.fields[field].required = False

    def save(self, commit=True):
        instance = super().save(commit=False)

        # Only update status fields if status changed
        if 'status' in self.changed_data:
            instance.status_update_date = timezone.now()

        if commit:
            instance.save()
            self.save_m2m()

        return instance


class SDSPageForm(forms.ModelForm):
    class Meta:
        model = SDSPageContent
        fields = [
            'hero_title', 'hero_subtitle',
            'hero_badge_text', 'section_subtitle',
            'mission_title', 'mission_content',
            'what_we_do_title', 'what_we_do_content',
            'cta_title', 'cta_content'
        ]
        widgets = {
            'hero_title': forms.TextInput(attrs={'class': 'form-control'}),
            'hero_subtitle': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'hero_badge_text': forms.TextInput(attrs={'class': 'form-control'}),
            'section_subtitle': forms.TextInput(attrs={'class': 'form-control'}),
            'mission_title': forms.TextInput(attrs={'class': 'form-control'}),
            'mission_content': forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
            'what_we_do_title': forms.TextInput(attrs={'class': 'form-control'}),
            'what_we_do_content': forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
            'cta_title': forms.TextInput(attrs={'class': 'form-control'}),
            'cta_content': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }


# ----------------------------------------------------- Admission Section ----------------------------------------------
class StudentAdmissionForm(forms.ModelForm):
    first_name = forms.CharField(
        max_length=100,
        required=True,
        widget=forms.TextInput(attrs={'class': 'form-control'})
    )
    last_name = forms.CharField(
        max_length=100,
        required=True,
        widget=forms.TextInput(attrs={'class': 'form-control'})
    )
    course = forms.ModelChoiceField(
        queryset=Course.objects.all(),
        required=True,
        widget=forms.Select(attrs={'class': 'form-control'}),
        empty_label="Select a course"
    )

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)  # Get user from kwargs if it exists
        super().__init__(*args, **kwargs)

        # Initialize first_name and last_name with user data if available
        if user:
            self.fields['first_name'].initial = user.first_name
            self.fields['last_name'].initial = user.last_name

        # Make all file fields not required
        file_fields = [
            'grade11_report_card', 'certificate_of_enrollment',
            'grade12_report_card', 'form137',
            'transcript_of_grades', 'good_moral_certificate',
            'honorable_dismissal', 'nbi_police_clearance'
        ]
        for field_name in file_fields:
            self.fields[field_name].required = False

        # Show fields based on student type if it's set
        if 'student_type' in self.data:
            self.show_fields_based_on_type(self.data['student_type'])
        elif self.instance and self.instance.pk:
            self.show_fields_based_on_type(self.instance.student_type)

    def show_fields_based_on_type(self, student_type):
        # Reset all fields to visible first (except the always visible ones)
        for field_name in self.fields:
            if field_name not in ['student_type', 'control_no', 'course']:
                self.fields[field_name].widget = self.get_widget_for_field(field_name)
                self.fields[field_name].required = False

        # Common fields for all types
        common_fields = ['admission_portal_registration']

        if student_type == 'current_grade12':
            required_fields = common_fields + ['strand']
            optional_fields = ['grade11_report_card', 'certificate_of_enrollment']
        elif student_type == 'shs_graduate':
            required_fields = common_fields + ['strand']
            optional_fields = ['grade12_report_card', 'form137']
        elif student_type == 'transferee':
            required_fields = common_fields + ['curriculum_type']
            optional_fields = [
                'first_year_first_semester',
                'first_year_second_semester',
                'second_year_first_semester',
                'other_semester_info',
                'transcript_of_grades',
                'good_moral_certificate',
                'honorable_dismissal',
                'nbi_police_clearance'
            ]
        else:
            required_fields = common_fields
            optional_fields = []

        # Make required fields required
        for field_name in required_fields:
            self.fields[field_name].required = True

        # Ensure optional fields are visible but not required
        for field_name in optional_fields:
            self.fields[field_name].widget = self.get_widget_for_field(field_name)
            self.fields[field_name].required = False

    def get_widget_for_field(self, field_name):
        if field_name in [
            'grade11_report_card', 'certificate_of_enrollment',
            'grade12_report_card', 'form137',
            'transcript_of_grades', 'good_moral_certificate',
            'honorable_dismissal', 'nbi_police_clearance'
        ]:
            return forms.FileInput(attrs={
                'accept': '.pdf,.jpg,.jpeg,.png',
                'class': 'form-control-file'
            })
        elif field_name in ['admission_portal_registration']:
            return forms.CheckboxInput(attrs={'class': 'form-check-input'})
        elif field_name in ['first_year_first_semester', 'first_year_second_semester',
                          'second_year_first_semester', 'curriculum_type']:
            return forms.Select(attrs={'class': 'form-control'})
        elif field_name == 'other_semester_info':
            return forms.Textarea(attrs={'class': 'form-control', 'rows': 3})
        else:
            return forms.TextInput(attrs={'class': 'form-control'})

    def clean(self):
        cleaned_data = super().clean()
        student_type = cleaned_data.get('student_type')

        # Validate admission portal registration
        if not cleaned_data.get('admission_portal_registration'):
            self.add_error('admission_portal_registration',
                         "You must complete the admission portal registration")

        # Only validate curriculum type for transferees
        if student_type == 'transferee' and not cleaned_data.get('curriculum_type'):
            self.add_error('curriculum_type',
                         "Please indicate when you started college (curriculum type)")

        return cleaned_data

    def validate_file_extension(self, field_name):
        file = self.cleaned_data.get(field_name)
        if file:
            valid_extensions = ['pdf', 'jpg', 'jpeg', 'png']
            ext = file.name.split('.')[-1].lower()
            if ext not in valid_extensions:
                raise ValidationError(f"Unsupported file extension. Only {', '.join(valid_extensions)} are allowed.")
        return file

    class Meta:
        model = StudentAdmission
        fields = '__all__'
        widgets = {
            'student_type': forms.Select(attrs={
                'class': 'form-control',
                'onchange': 'this.form.submit()'
            }),
            'control_no': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Enter your control number'
            }),
            'first_name': forms.TextInput(attrs={'class': 'form-control'}),
            'last_name': forms.TextInput(attrs={'class': 'form-control'}),
            'strand': forms.Select(attrs={'class': 'form-control'}),
            'curriculum_type': forms.Select(attrs={'class': 'form-control'}),
            'first_year_first_semester': forms.Select(attrs={'class': 'form-control'}),
            'first_year_second_semester': forms.Select(attrs={'class': 'form-control'}),
            'second_year_first_semester': forms.Select(attrs={'class': 'form-control'}),
            'other_semester_info': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 2,
                'placeholder': 'Enter other semester information if applicable'
            }),
            'remarks': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Enter any remarks'
            }),
        }


class StudentAdmissionStatusUpdateForm(forms.ModelForm):
    class Meta:
        model = StudentAdmission
        fields = ['status', 'remarks']
        widgets = {
            'status': forms.Select(attrs={
                'class': 'form-control',
                'onchange': 'this.form.submit()'
            }),
            'remarks': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Enter status update remarks'
            }),
        }


# ----------------------------------------------------- NSTP Section ---------------------------------------------------
class NSTPStudentInfoForm(forms.ModelForm):
    # Custom field validators
    alphanumeric_validator = RegexValidator(
        r'^[a-zA-Z\sñÑ.-]*$',
        'Only letters, spaces, dots, and hyphens are allowed'
    )
    student_number_validator = RegexValidator(
        r'^\d+(-\d+)*$',
        'Only numbers and dashes are allowed in student number'
    )
    address_component_validator = RegexValidator(
        r'^[a-zA-Z0-9\sñÑ.,/#-]*$',
        'Only alphanumeric characters and .,/#- are allowed'
    )
    phone_validator = RegexValidator(
        r'^\+?\d{9,15}$',
        'Enter a valid phone number (9-15 digits, + optional)'
    )
    year_validator = RegexValidator(
        r'^\d{4}-\d{4}$',
        'Academic year must be in YYYY-YYYY format'
    )

    # Field definitions with custom validation
    student_number = forms.CharField(
        validators=[student_number_validator],
        widget=forms.TextInput(attrs={
            'pattern': r'[\d-]+',
            'title': 'Numbers and dashes only'
        })
    )
    last_name = forms.CharField(
        validators=[alphanumeric_validator],
        widget=forms.TextInput(attrs={
            'pattern': '[a-zA-ZñÑ\\s.-]+',
            'title': 'Letters, spaces, dots, and hyphens only'
        })
    )
    first_name = forms.CharField(
        validators=[alphanumeric_validator],
        widget=forms.TextInput(attrs={
            'pattern': '[a-zA-ZñÑ\\s.-]+',
            'title': 'Letters, spaces, dots, and hyphens only'
        })
    )
    middle_name = forms.CharField(
        required=False,
        validators=[alphanumeric_validator],
        widget=forms.TextInput(attrs={
            'pattern': '[a-zA-ZñÑ\\s.-]*',
            'title': 'Letters, spaces, dots, and hyphens only'
        })
    )
    program = forms.CharField(
        validators=[RegexValidator(
            r'^[a-zA-Z\sñÑ.,()/-]*$',
            'Only letters, spaces, and .,()/- are allowed'
        )]
    )
    street_or_barangay = forms.CharField(
        validators=[address_component_validator],
        widget=forms.TextInput(attrs={
            'pattern': '[a-zA-Z0-9ñÑ\\s.,/#-]+',
            'title': 'Alphanumeric with spaces and .,/#- only'
        })
    )
    municipality_or_city = forms.CharField(
        validators=[address_component_validator],
        widget=forms.TextInput(attrs={
            'pattern': '[a-zA-Z0-9ñÑ\\s.,/#-]+',
            'title': 'Alphanumeric with spaces and .,/#- only'
        })
    )
    province = forms.CharField(
        validators=[address_component_validator],
        widget=forms.TextInput(attrs={
            'pattern': '[a-zA-Z0-9ñÑ\\s.,/#-]+',
            'title': 'Alphanumeric with spaces and .,/#- only'
        })
    )
    contact_number = forms.CharField(
        validators=[phone_validator],
        widget=forms.TextInput(attrs={
            'pattern': r'\+?\d{9,15}',
            'title': '9-15 digits with optional +'
        })
    )
    academic_year = forms.CharField(
        validators=[year_validator],
        widget=forms.TextInput(attrs={
            'pattern': r'\d{4}-\d{4}',
            'title': 'Format: YYYY-YYYY'
        })
    )
    birth_date = forms.DateField(
        widget=forms.DateInput(attrs={'type': 'date'}),
        help_text="Format: YYYY-MM-DD"
    )

    class Meta:
        model = NSTPStudentInfo
        fields = '__all__'
        exclude = ['user', 'approval_status']

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)

        if self.user and self.user.is_student:
            # Pre-fill user data but keep editable
            self.fields['student_number'].initial = self.user.student_number
            self.fields['last_name'].initial = self.user.last_name
            self.fields['first_name'].initial = self.user.first_name
            if hasattr(self.user, 'middle_name'):
                self.fields['middle_name'].initial = self.user.middle_name
            self.fields['program'].initial = self.user.course
            self.fields['gender'].initial = self.user.gender
            self.fields['birth_date'].initial = self.user.birth_date
            self.fields['contact_number'].initial = self.user.phone_number
            self.fields['email_address'].initial = self.user.email

    def clean_student_number(self):
        data = self.cleaned_data['student_number']
        # Additional validation if needed
        if len(data.replace('-', '')) < 5:
            raise ValidationError("Student number too short")

        # If user is logged in and has a student number, ensure it matches
        if self.user and hasattr(self.user, 'student_number') and self.user.student_number:
            if data != self.user.student_number:
                raise ValidationError("Student number must match your registered student number")

        return data

    def clean_academic_year(self):
        data = self.cleaned_data['academic_year']
        try:
            start, end = map(int, data.split('-'))
            if start >= end:
                raise ValidationError("Start year must be before end year")
            if end != start + 1:
                raise ValidationError("Academic year should cover exactly one year (e.g., 2024-2025)")
        except ValueError:
            raise ValidationError("Invalid academic year format")
        return data

    def clean(self):
        cleaned_data = super().clean()

        # Ensure either email or phone is provided
        if not cleaned_data.get('email_address') and not cleaned_data.get('contact_number'):
            raise ValidationError("Either email or contact number must be provided")

        # Check for existing application for this semester and academic year
        if self.user and 'semester' in cleaned_data and 'academic_year' in cleaned_data:
            existing_application = NSTPStudentInfo.objects.filter(
                user=self.user,
                semester=cleaned_data['semester'],
                academic_year=cleaned_data['academic_year']
            ).exclude(pk=self.instance.pk if self.instance else None).exists()

            if existing_application:
                raise ValidationError(
                    "You already have an application for this semester and academic year."
                )

        return cleaned_data


class NSTPFileForm(forms.ModelForm):
    file = forms.FileField(
        validators=[
            FileExtensionValidator(
                allowed_extensions=['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png']
            )
        ],
        help_text="Allowed formats: PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, JPG/JPEG, PNG (Max size: 10MB)"
    )

    class Meta:
        model = NSTPFile
        fields = [
            'title',
            'description',
            'file',
            'category',
            'semester',
            'school_year',
        ]
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3}),
            'category': forms.Select(attrs={'class': 'form-control'}),
            'semester': forms.Select(attrs={'class': 'form-control'}),
            'school_year': forms.TextInput(attrs={
                'placeholder': 'YYYY-YYYY',
                'pattern': r'\d{4}-\d{4}',
                'title': 'Format: YYYY-YYYY (e.g., 2020-2021)'
            }),
        }
        help_texts = {
            'title': 'Enter a descriptive title for the file (5-255 characters)',
            'description': 'Optional description about the file contents',
            'school_year': 'Format: YYYY-YYYY (e.g., 2020-2021)',
        }

    def clean_title(self):
        title = self.cleaned_data.get('title')
        if len(title) < 5:
            raise ValidationError("Title must be at least 5 characters long")
        return title

    def clean_file(self):
        file = self.cleaned_data.get('file')
        if file:
            max_size = 10 * 1024 * 1024
            if file.size > max_size:
                raise ValidationError(f"File size must not exceed {max_size / 1024 / 1024}MB")
        return file

    def clean_school_year(self):
        school_year = self.cleaned_data.get('school_year')
        if len(school_year) != 9 or school_year[4] != '-':
            raise ValidationError('School year must be in the format "YYYY-YYYY" (e.g., 2020-2021)')

        try:
            start_year = int(school_year[:4])
            end_year = int(school_year[5:])
        except ValueError:
            raise ValidationError('Both parts of the school year must be numbers')

        if end_year != start_year + 1:
            raise ValidationError('End year must be exactly 1 year after start year (e.g., 2020-2021)')

        current_year = datetime.now().year
        if start_year < 2000 or start_year > current_year + 5:
            raise ValidationError(f'Start year must be between 2000 and {current_year + 5}')

        return school_year


# ----------------------------------------------- OJT Forms Section ----------------------------------------------------
class OJTCompanyForm(forms.ModelForm):
    class Meta:
        model = OJTCompany
        fields = ['name', 'address', 'contact_number', 'available_slots', 'description', 'website', 'email']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'Enter company name'
            }),
            'address': forms.Textarea(attrs={
                'class': 'form-input',
                'placeholder': 'Enter company address',
                'rows': 4
            }),
            'contact_number': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'Enter contact number (numbers and hyphens only)'
            }),
            'available_slots': forms.NumberInput(attrs={
                'class': 'form-input',
                'placeholder': 'Available slots',
                'min': 1
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-input',
                'placeholder': 'Enter company description',
                'rows': 4
            }),
            'website': forms.URLInput(attrs={
                'class': 'form-input',
                'placeholder': 'https://example.com'
            }),
            'email': forms.EmailInput(attrs={
                'class': 'form-input',
                'placeholder': 'company@example.com'
            }),
        }

    def clean_contact_number(self):
        contact_number = self.cleaned_data.get('contact_number')
        if contact_number:
            # Remove any spaces first
            contact_number = contact_number.replace(' ', '')

            if not re.match(r'^[\d-]+$', contact_number):
                raise forms.ValidationError('Contact number can only contain numbers and hyphens.')

            if contact_number.startswith('-') or contact_number.endswith('-'):
                raise forms.ValidationError('Contact number cannot start or end with a hyphen.')

            if '--' in contact_number:
                raise forms.ValidationError('Contact number cannot have consecutive hyphens.')

        return contact_number


class OJTApplicationForm(forms.ModelForm):
    company = forms.ModelChoiceField(
        queryset=OJTCompany.objects.none(),  # Will be set in __init__
        empty_label="Select a company...",
        widget=forms.Select(attrs={'class': 'form-control'})
    )

    # Date fields with date picker
    proposed_start_date = forms.DateField(
        widget=forms.DateInput(attrs={
            'type': 'date',
            'class': 'form-control',
            'min': timezone.now().date().isoformat()
        })
    )
    proposed_end_date = forms.DateField(
        widget=forms.DateInput(attrs={
            'type': 'date',
            'class': 'form-control',
            'min': (timezone.now() + timezone.timedelta(days=30)).date().isoformat()
        })
    )

    # Text areas with better styling
    cover_letter = forms.CharField(
        widget=forms.Textarea(attrs={
            'class': 'form-control',
            'rows': 4,
            'placeholder': 'Explain why you want to do OJT at this company...'
        }),
        required=False
    )

    skills = forms.CharField(
        widget=forms.Textarea(attrs={
            'class': 'form-control',
            'rows': 3,
            'placeholder': 'List your relevant skills and qualifications...'
        }),
        required=False
    )

    class Meta:
        model = OJTApplication
        fields = [
            'company',
            'proposed_start_date',
            'proposed_end_date',
            'proposed_hours',
            'cover_letter',
            'skills'
        ]
        widgets = {
            'proposed_hours': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': '240',
                'max': '1000',
                'value': '240'
            }),
        }

    def __init__(self, *args, **kwargs):
        self.student = kwargs.pop('student', None)
        super().__init__(*args, **kwargs)

        # Filter companies to only show available companies
        if self.student:
            # Get companies that are not archived and have available slots
            available_companies = OJTCompany.get_available_companies()

            # Exclude companies where student already has an application
            available_companies = available_companies.exclude(
                ojt_applications__student=self.student,
                ojt_applications__is_archived=False
            )

            self.fields['company'].queryset = available_companies

    def clean(self):
        cleaned_data = super().clean()
        start_date = cleaned_data.get('proposed_start_date')
        end_date = cleaned_data.get('proposed_end_date')
        company = cleaned_data.get('company')
        proposed_hours = cleaned_data.get('proposed_hours')

        # Validate date range
        if start_date and end_date:
            if end_date <= start_date:
                raise ValidationError("End date must be after start date.")

            # Check if dates are in the future
            today = timezone.now().date()
            if start_date <= today:
                raise ValidationError("Start date must be in the future.")

            # Validate duration
            duration = (end_date - start_date).days
            if duration < 30:
                raise ValidationError("OJT duration should be at least 1 month (30 days).")
            if duration > 365:
                raise ValidationError("OJT duration cannot exceed 1 year.")

        # Validate hours
        if proposed_hours and proposed_hours < 240:
            raise ValidationError("OJT hours must be at least 240 hours.")
        if proposed_hours and proposed_hours > 1000:
            raise ValidationError("OJT hours cannot exceed 1000 hours.")

        # Check if student already has an application with this company
        if self.student and company:
            existing_application = OJTApplication.objects.filter(
                student=self.student,
                company=company,
                is_archived=False
            ).exclude(pk=self.instance.pk if self.instance else None)

            if existing_application.exists():
                raise ValidationError(f"You already have an OJT application with {company.name}.")

        # Check if company has available slots
        if company and not company.can_accept_more_students():
            raise ValidationError(f"{company.name} currently has no available OJT slots.")

        return cleaned_data

    def save(self, commit=True):
        instance = super().save(commit=False)
        if self.student:
            instance.student = self.student
        if commit:
            instance.save()
        return instance


class OJTRequirementForm(forms.ModelForm):
    requirement_type = forms.ChoiceField(
        choices=OJTRequirement.REQUIREMENT_TYPES,
        widget=forms.Select(attrs={'class': 'form-control requirement-type'})
    )

    file = forms.FileField(
        widget=forms.FileInput(attrs={
            'class': 'file-input',
            'accept': '.pdf,.doc,.docx,.jpg,.jpeg,.png'
        })
    )

    class Meta:
        model = OJTRequirement
        fields = ['requirement_type', 'file']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make fields required for new forms
        if not self.instance.pk:
            self.fields['requirement_type'].required = True
            self.fields['file'].required = True

    def clean(self):
        cleaned_data = super().clean()
        requirement_type = cleaned_data.get('requirement_type')
        file = cleaned_data.get('file')

        # Both fields are required for new requirements
        if not self.instance.pk:
            if requirement_type and not file:
                raise ValidationError("File is required for this requirement.")
            if file and not requirement_type:
                raise ValidationError("Requirement type is required.")

        return cleaned_data

    def clean_file(self):
        file = self.cleaned_data.get('file')
        if file:
            # Validate file size (5MB limit)
            max_size = 5 * 1024 * 1024  # 5MB
            if file.size > max_size:
                raise ValidationError("File size must be less than 5MB.")

            # Validate file type
            allowed_types = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'image/jpeg',
                'image/jpg',
                'image/png'
            ]
            if file.content_type not in allowed_types:
                raise ValidationError(
                    "File type not supported. Please upload PDF, DOC, DOCX, JPG, or PNG files."
                )

        return file


class OJTApplicationStatusForm(forms.ModelForm):
    class Meta:
        model = OJTApplication
        fields = ['status', 'review_notes', 'rejection_reason']
        widgets = {
            'status': forms.Select(attrs={'class': 'form-control'}),
            'review_notes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'rejection_reason': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }


# Formset for multiple requirements
OJTRequirementFormSet = forms.inlineformset_factory(
    OJTApplication,
    OJTRequirement,
    form=OJTRequirementForm,
    extra=1,
    can_delete=True,
    max_num=len(OJTRequirement.REQUIREMENT_TYPES)
)


class OJTReportForm(forms.ModelForm):
    class Meta:
        model = OJTReport
        fields = [
            'title', 'report_type', 'application', 'report_date',
            'period_start', 'period_end', 'description', 'issues_challenges'
        ]
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'Enter report title'
            }),
            'report_type': forms.Select(attrs={
                'class': 'form-input'
            }),
            'application': forms.Select(attrs={
                'class': 'form-input'
            }),
            'report_date': forms.DateInput(attrs={
                'class': 'form-input',
                'type': 'date'
            }),
            'period_start': forms.DateInput(attrs={
                'class': 'form-input',
                'type': 'date'
            }),
            'period_end': forms.DateInput(attrs={
                'class': 'form-input',
                'type': 'date'
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-input',
                'rows': 6,
                'placeholder': 'Describe your activities, accomplishments, and experiences...'
            }),
            'issues_challenges': forms.Textarea(attrs={
                'class': 'form-input',
                'rows': 4,
                'placeholder': 'Describe any issues, challenges, or concerns...'
            }),
        }

    def __init__(self, *args, **kwargs):
        self.request = kwargs.pop('request', None)
        super().__init__(*args, **kwargs)

        # Filter applications based on user type
        if self.request and self.request.user.user_type == 14:  # Student
            self.fields['application'].queryset = OJTApplication.objects.filter(
                student=self.request.user,
                status='approved'
            )
        else:
            self.fields['application'].queryset = OJTApplication.objects.filter(
                status='approved'
            )

    def clean(self):
        cleaned_data = super().clean()
        period_start = cleaned_data.get('period_start')
        period_end = cleaned_data.get('period_end')
        report_type = cleaned_data.get('report_type')

        # Validate period dates for weekly and monthly reports
        if report_type in ['weekly', 'monthly']:
            if not period_start or not period_end:
                raise forms.ValidationError(
                    f"Period start and end dates are required for {report_type} reports."
                )

            if period_end <= period_start:
                raise forms.ValidationError("Period end date must be after start date.")

        return cleaned_data

    def save(self, commit=True):
        instance = super().save(commit=False)
        instance.submitted_by = self.request.user

        if commit:
            instance.save()
        return instance


# ------------------------------------------------ SDS Organizations ---------------------------------------------------
class OrganizationCreateForm(forms.ModelForm):
    # Required fields
    username = forms.CharField(max_length=150, required=True)
    email = forms.EmailField(required=True)
    password = forms.CharField(widget=forms.PasswordInput, required=True)
    confirm_password = forms.CharField(widget=forms.PasswordInput, required=True)

    organization_name = forms.CharField(max_length=255, required=True)
    organization_acronym = forms.CharField(max_length=50, required=True)
    organization_description = forms.CharField(widget=forms.Textarea, required=True)
    organization_mission = forms.CharField(widget=forms.Textarea, required=True)
    organization_vision = forms.CharField(widget=forms.Textarea, required=True)
    organization_type = forms.ChoiceField(choices=Organization.ORGANIZATION_TYPE_CHOICES, required=True)
    organization_email = forms.EmailField(required=True)

    organization_adviser_name = forms.CharField(max_length=255, required=True)
    organization_adviser_department = forms.CharField(max_length=100, required=True)
    organization_adviser_email = forms.EmailField(required=True)
    organization_adviser_phone = forms.CharField(max_length=20, required=True)

    # Co-Adviser Information (Optional)
    organization_coadviser_name = forms.CharField(max_length=255, required=False, widget=forms.TextInput(attrs={'placeholder': 'Enter co-adviser name (optional)'}))
    organization_coadviser_department = forms.CharField(max_length=100, required=False, widget=forms.TextInput(attrs={'placeholder': 'Enter co-adviser department (optional)'}))
    organization_coadviser_email = forms.EmailField(required=False, widget=forms.EmailInput(attrs={'placeholder': 'Enter co-adviser email (optional)'}))
    organization_coadviser_phone = forms.CharField(max_length=20, required=False, widget=forms.TextInput(attrs={'placeholder': 'Enter co-adviser phone (optional)'}))

    organization_valid_from = forms.DateField(required=True)
    organization_valid_until = forms.DateField(required=True)

    # Members JSON field
    organization_members_json = forms.CharField(required=True, widget=forms.HiddenInput)

    class Meta:
        model = Organization
        fields = [
            'username', 'email', 'password', 'organization_name', 'organization_acronym',
            'organization_description', 'organization_mission', 'organization_vision',
            'organization_type', 'organization_email', 'organization_adviser_name',
            'organization_adviser_department', 'organization_adviser_email',
            'organization_coadviser_name', 'organization_coadviser_department',
            'organization_coadviser_email', 'organization_coadviser_phone',
            'organization_adviser_phone', 'organization_valid_from', 'organization_valid_until',
            'organization_logo', 'organization_calendar_activities', 'organization_adviser_cv',
            'organization_cog', 'organization_group_picture', 'organization_cbl',
            'organization_list_members', 'organization_acceptance_letter', 'organization_ar',
            'organization_previous_calendar', 'organization_financial_report', 'organization_coa',
            'organization_member_biodata', 'organization_good_moral',
        ]

    def clean_username(self):
        username = self.cleaned_data.get('username')
        if username:
            # Clean the username
            username = username.strip()

            # Check Organization model
            org_query = Organization.objects.filter(username__iexact=username)
            if self.instance and self.instance.pk:
                org_query = org_query.exclude(pk=self.instance.pk)

            # Check CustomUser model
            user_query = CustomUser.objects.filter(username__iexact=username)

            if org_query.exists() or user_query.exists():
                raise ValidationError("This username is already taken. Please choose a different one.")

            # Additional username validation
            if len(username) < 3:
                raise ValidationError("Username must be at least 3 characters long.")

            if not re.match(r'^[a-zA-Z0-9_\.]+$', username):
                raise ValidationError("Username can only contain letters, numbers, underscores, and periods.")

        return username

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if email:
            # Check ONLY CustomUser model for personal email
            if CustomUser.objects.filter(email=email).exists():
                raise ValidationError("This email is already registered. Please use a different email address.")

        return email

    def clean_organization_email(self):
        organization_email = self.cleaned_data.get('organization_email')
        if organization_email:
            # Check ONLY Organization model for organization email
            org_query = Organization.objects.filter(organization_email=organization_email)
            if self.instance and self.instance.pk:
                org_query = org_query.exclude(pk=self.instance.pk)

            if org_query.exists():
                raise ValidationError(
                    "This organization email is already registered. Please use a different email address.")

        return organization_email

    def clean_organization_name(self):
        organization_name = self.cleaned_data.get('organization_name')
        if organization_name:
            # Check if organization name already exists (case-insensitive)
            if Organization.objects.filter(organization_name__iexact=organization_name).exists():
                raise ValidationError("An organization with this name already exists. Please choose a different name.")

        return organization_name

    def clean_organization_acronym(self):
        organization_acronym = self.cleaned_data.get('organization_acronym')
        if organization_acronym:
            # Check if organization acronym already exists (case-insensitive)
            if Organization.objects.filter(organization_acronym__iexact=organization_acronym).exists():
                raise ValidationError("An organization with this acronym already exists. Please choose a different acronym.")

        return organization_acronym

    def clean_organization_email(self):
        organization_email = self.cleaned_data.get('organization_email')
        if organization_email:
            # Check if organization email already exists
            if Organization.objects.filter(organization_email=organization_email).exists():
                raise ValidationError("This organization email is already registered. Please use a different email address.")

        return organization_email

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if email:
            # Check if email already exists in Organization model
            if Organization.objects.filter(email=email).exists():
                raise ValidationError("This email is already registered. Please use a different email address.")

            # Also check if email exists in CustomUser model
            if CustomUser.objects.filter(email=email).exists():
                raise ValidationError("This email is already registered. Please use a different email address.")

        return email

    def clean_organization_adviser_name(self):
        adviser_name = self.cleaned_data.get('organization_adviser_name')
        if adviser_name:
            # Split into first name and last name
            names = adviser_name.strip().split()
            if len(names) < 2:
                raise ValidationError("Please provide both first name and last name for the adviser.")

            first_name = names[0]
            last_name = ' '.join(names[1:])

            # Validate first name contains only letters and spaces
            if not re.match(r'^[A-Za-z\s]+$', first_name):
                raise ValidationError("First name can only contain letters and spaces.")

            # Validate last name contains only letters and spaces
            if not re.match(r'^[A-Za-z\s]+$', last_name):
                raise ValidationError("Last name can only contain letters and spaces.")

        return adviser_name

    def clean_organization_adviser_phone(self):
        phone = self.cleaned_data.get('organization_adviser_phone')
        if phone:
            # Allow numbers, hyphens, spaces, and parentheses
            if not re.match(r'^[\d\s\-\(\)\+]+$', phone):
                raise ValidationError("Phone number can only contain numbers, hyphens, spaces, and parentheses.")

            # Remove non-digit characters to check minimum length
            digits_only = re.sub(r'\D', '', phone)
            if len(digits_only) < 10:
                raise ValidationError("Please enter a valid phone number with at least 10 digits.")

        return phone

    def clean_organization_coadviser_name(self):
        coadviser_name = self.cleaned_data.get('organization_coadviser_name')
        if coadviser_name:
            # Split into first name and last name
            names = coadviser_name.strip().split()
            if len(names) < 2:
                raise forms.ValidationError("Please provide both first name and last name for the co-adviser.")

            first_name = names[0]
            last_name = ' '.join(names[1:])

            # Validate first name contains only letters and spaces
            if not re.match(r'^[A-Za-z\s]+$', first_name):
                raise forms.ValidationError("Co-adviser first name can only contain letters and spaces.")

            # Validate last name contains only letters and spaces
            if not re.match(r'^[A-Za-z\s]+$', last_name):
                raise forms.ValidationError("Co-adviser last name can only contain letters and spaces.")

        return coadviser_name

    def clean_organization_coadviser_phone(self):
        phone = self.cleaned_data.get('organization_coadviser_phone')
        if phone:
            # Allow numbers, hyphens, spaces, and parentheses
            if not re.match(r'^[\d\s\-\(\)\+]+$', phone):
                raise forms.ValidationError(
                    "Co-adviser phone number can only contain numbers, hyphens, spaces, and parentheses.")

            # Remove non-digit characters to check minimum length
            digits_only = re.sub(r'\D', '', phone)
            if len(digits_only) < 10:
                raise forms.ValidationError("Please enter a valid co-adviser phone number with at least 10 digits.")

        return phone

    def clean_organization_members_json(self):
        members_json = self.cleaned_data.get('organization_members_json')
        if members_json:
            try:
                members = json.loads(members_json)

                # Validate minimum members - ONLY THIS VALIDATION REMAINS
                if len(members) < 3:
                    raise ValidationError("Organization must have at least 3 members.")

                # Validate member names contain only letters and spaces
                for i, member in enumerate(members):
                    first_name = member.get('first_name', '').strip()
                    last_name = member.get('last_name', '').strip()

                    if not first_name or not last_name:
                        raise ValidationError(f"Member {i + 1}: Both first name and last name are required.")

                    if not re.match(r'^[A-Za-z\s]+$', first_name):
                        raise ValidationError(f"Member {i + 1}: First name can only contain letters and spaces.")

                    if not re.match(r'^[A-Za-z\s]+$', last_name):
                        raise ValidationError(f"Member {i + 1}: Last name can only contain letters and spaces.")

            except json.JSONDecodeError:
                raise ValidationError("Invalid members data format.")

        return members_json

    def clean(self):
        cleaned_data = super().clean()

        # Validate co-adviser email if co-adviser name is provided
        coadviser_name = cleaned_data.get('organization_coadviser_name')
        coadviser_email = cleaned_data.get('organization_coadviser_email')

        if coadviser_name and not coadviser_email:
            self.add_error('organization_coadviser_email',
                           'Co-adviser email is required when co-adviser name is provided.')

        if coadviser_email and not coadviser_name:
            self.add_error('organization_coadviser_name',
                           'Co-adviser name is required when co-adviser email is provided.')

        # Password confirmation check
        password = cleaned_data.get('password')
        confirm_password = cleaned_data.get('confirm_password')

        if password and confirm_password and password != confirm_password:
            raise ValidationError("Passwords do not match")

        # Organization type specific validations
        organization_type = cleaned_data.get('organization_type')

        if organization_type == 'student':
            # Student organizations require all documents
            required_docs = [
                'organization_financial_report',
                'organization_coa'
            ]

            for doc_field in required_docs:
                if not cleaned_data.get(doc_field):
                    field_name = doc_field.replace('organization_', '').replace('_', ' ').title()
                    self.add_error(doc_field, f"{field_name} is required for student organizations.")

        elif organization_type == 'sociocultural':
            # Sociocultural organizations don't require financial report and COA
            # Remove any existing errors for these fields
            if 'organization_financial_report' in self.errors:
                del self.errors['organization_financial_report']
            if 'organization_coa' in self.errors:
                del self.errors['organization_coa']

        # Common required documents for all organization types
        common_required_docs = [
            'organization_calendar_activities',
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

        for doc_field in common_required_docs:
            if not cleaned_data.get(doc_field):
                field_name = doc_field.replace('organization_', '').replace('_', ' ').title()
                self.add_error(doc_field, f"{field_name} is required.")

        return cleaned_data

    def save(self, commit=True):
        organization = super().save(commit=False)

        # Hash the password manually
        password = self.cleaned_data['password']
        organization.password = make_password(password)

        # Set organization members from JSON
        members_json = self.cleaned_data.get('organization_members_json')
        if members_json:
            try:
                organization.organization_members = json.loads(members_json)
            except json.JSONDecodeError:
                organization.organization_members = []

        # Set status to pending
        organization.organization_status = 'pending'

        if commit:
            organization.save()

        return organization


class OrganizationEditForm(forms.ModelForm):
    # Make password fields optional for editing
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={'class': 'form-input'}),
        required=False,
        help_text="Leave blank to keep current password"
    )
    confirm_password = forms.CharField(
        widget=forms.PasswordInput(attrs={'class': 'form-input'}),
        required=False,
        help_text="Confirm new password"
    )

    username = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Leave blank to keep current username'}),
        help_text="Leave blank to keep current username"
    )

    email = forms.EmailField(
        required=False,
        widget=forms.EmailInput(attrs={'class': 'form-input', 'placeholder': 'Leave blank to keep current email'}),
        help_text="Leave blank to keep current email address"
    )

    class Meta:
        model = Organization
        fields = [
            'username', 'email',
            'organization_name', 'organization_acronym',
            'organization_description', 'organization_mission', 'organization_vision',
            'organization_type', 'organization_email', 'organization_adviser_name',
            'organization_adviser_department', 'organization_adviser_email',
            'organization_adviser_phone', 'organization_coadviser_name',
            'organization_coadviser_department', 'organization_coadviser_email',
            'organization_coadviser_phone', 'organization_valid_from', 'organization_valid_until',
            'organization_logo', 'organization_calendar_activities', 'organization_adviser_cv',
            'organization_cog', 'organization_group_picture', 'organization_cbl',
            'organization_list_members', 'organization_acceptance_letter', 'organization_ar',
            'organization_previous_calendar', 'organization_financial_report', 'organization_coa',
            'organization_member_biodata', 'organization_good_moral',
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            self.fields['username'].widget.attrs['readonly'] = False
            self.fields['username'].widget.attrs['style'] = ''
            self.fields['email'].required = False

            self.fields['organization_coadviser_name'].required = False
            self.fields['organization_coadviser_department'].required = False
            self.fields['organization_coadviser_email'].required = False
            self.fields['organization_coadviser_phone'].required = False

    def clean_username(self):
        username = self.cleaned_data.get('username')

        if not username:
            if self.instance and self.instance.pk:
                return self.instance.username
            else:
                raise ValidationError("Username is required for new organizations.")

        query = Organization.objects.filter(username=username)
        if self.instance and self.instance.pk:
            query = query.exclude(pk=self.instance.pk)

        if query.exists():
            raise ValidationError("This username is already taken. Please choose a different username.")

        return username

    def clean_email(self):
        email = self.cleaned_data.get('email')

        if not email:
            if self.instance and self.instance.pk:
                return self.instance.email
            else:
                raise ValidationError("Email is required for new organizations.")

        query = Organization.objects.filter(email=email)
        if self.instance and self.instance.pk:
            query = query.exclude(pk=self.instance.pk)

        if query.exists():
            raise ValidationError("This email is already registered. Please use a different email address.")

        if CustomUser.objects.filter(email=email).exists():
            raise ValidationError("This email is already registered. Please use a different email address.")
        return email

    def clean_organization_name(self):
        organization_name = self.cleaned_data.get('organization_name')
        if organization_name:
            query = Organization.objects.filter(organization_name__iexact=organization_name)
            if self.instance and self.instance.pk:
                query = query.exclude(pk=self.instance.pk)

            if query.exists():
                raise ValidationError("An organization with this name already exists.")
        return organization_name

    def clean_organization_acronym(self):
        organization_acronym = self.cleaned_data.get('organization_acronym')
        if organization_acronym:
            query = Organization.objects.filter(organization_acronym__iexact=organization_acronym)
            if self.instance and self.instance.pk:
                query = query.exclude(pk=self.instance.pk)

            if query.exists():
                raise ValidationError("An organization with this acronym already exists.")
        return organization_acronym

    def clean_organization_email(self):
        organization_email = self.cleaned_data.get('organization_email')
        if organization_email:
            query = Organization.objects.filter(organization_email=organization_email)
            if self.instance and self.instance.pk:
                query = query.exclude(pk=self.instance.pk)

            if query.exists():
                raise ValidationError("This organization email is already registered.")
        return organization_email

    def clean(self):
        cleaned_data = super().clean()

        # Password validation (only if provided)
        password = cleaned_data.get('password')
        confirm_password = cleaned_data.get('confirm_password')

        if password:
            if len(password) < 8:
                self.add_error('password', "Password must be at least 8 characters long.")

            if password != confirm_password:
                self.add_error('confirm_password', "Passwords do not match.")
        elif confirm_password:
            # If confirm password is provided but password is empty
            self.add_error('password', "Please enter a new password.")

        # Organization type specific validations (same as create form)
        organization_type = cleaned_data.get('organization_type')

        if organization_type == 'student':
            required_docs = ['organization_financial_report', 'organization_coa']
            for doc_field in required_docs:
                if not cleaned_data.get(doc_field) and not getattr(self.instance, doc_field, None):
                    field_name = doc_field.replace('organization_', '').replace('_', ' ').title()
                    self.add_error(doc_field, f"{field_name} is required for student organizations.")

        # Common required documents validation - make optional for editing
        common_required_docs = [
            'organization_calendar_activities', 'organization_adviser_cv',
            'organization_cog', 'organization_group_picture', 'organization_cbl',
            'organization_list_members', 'organization_acceptance_letter', 'organization_ar',
            'organization_previous_calendar', 'organization_good_moral', 'organization_member_biodata',
        ]

        # Only validate if the field is in the form data (new file uploaded)
        for doc_field in common_required_docs:
            if doc_field in self.files and not self.files[doc_field]:
                field_name = doc_field.replace('organization_', '').replace('_', ' ').title()
                self.add_error(doc_field, f"{field_name} is required when uploading a new file.")

        return cleaned_data

    def save(self, commit=True):
        organization = super().save(commit=False)

        # Only update password if a new one was provided
        password = self.cleaned_data.get('password')
        if password:
            organization.set_password(password)

        if commit:
            organization.save()

        return organization


class AccomplishmentRecordForm(forms.ModelForm):
    # Custom field for multiple supporting files
    supporting_files = forms.FileField(
        required=False,
        widget=forms.ClearableFileInput(attrs={
            'class': 'form-control file-input',
            'accept': '.pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx,.mp4,.avi,.mov,.zip'
        }),
        help_text="Supporting documents, photos, certificates, etc."
    )

    # Organization field (optional for non-organization users)
    organization = forms.ModelChoiceField(
        queryset=Organization.objects.filter(_organization_status='active'),
        required=False,
        widget=forms.Select(attrs={
            'class': 'form-control'
        }),
        help_text="Select organization (optional for OSAS staff)",
        label="Organization"
    )

    class Meta:
        model = AccomplishmentRecord
        fields = [
            'organization',
            'title',
            'record_type',
            'date_conducted',
            'venue',
            'semester',
            'school_year',
            'objectives',
            'outcomes',
            'number_of_participants',
            'duration_hours',
            'budget_utilized',
            'main_report',
        ]
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Enter activity title'
            }),
            'record_type': forms.Select(attrs={
                'class': 'form-control'
            }),
            'date_conducted': forms.DateInput(attrs={
                'type': 'date',
                'class': 'form-control'
            }),
            'venue': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Enter venue/location'
            }),
            'semester': forms.Select(attrs={
                'class': 'form-control'
            }),
            'school_year': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '2024-2025'
            }),
            'objectives': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'List objectives...'
            }),
            'outcomes': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Describe outcomes...'
            }),
            'number_of_participants': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': 0
            }),
            'duration_hours': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': 0,
                'step': 0.5
            }),
            'budget_utilized': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': 0,
                'step': 0.01
            }),
            'main_report': forms.FileInput(attrs={
                'class': 'form-control file-input',
                'accept': '.pdf,.doc,.docx'
            }),
        }

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)

        # Set current school year as default
        if not self.instance.pk and not self.data.get('school_year'):
            current_year = timezone.now().year
            self.initial['school_year'] = f"{current_year}-{current_year + 1}"

        # Hide organization field for organization users (it will be auto-set)
        if self.user and self.user.user_type == 15:
            self.fields['organization'].widget = forms.HiddenInput()
            if hasattr(self.user, 'organization_account'):
                self.initial['organization'] = self.user.organization_account
        # Make organization optional for OSAS Staff
        elif self.user and self.user.user_type == 1:
            self.fields['organization'].required = False
            self.fields['organization'].help_text = "Select organization (optional)"

    def clean(self):
        cleaned_data = super().clean()
        user = getattr(self, 'user', None)

        # For organization users, organization is required and auto-set
        if user and user.user_type == 15:
            if hasattr(user, 'organization_account'):
                cleaned_data['organization'] = user.organization_account
            else:
                raise ValidationError("Organization not found for your account.")

        return cleaned_data
