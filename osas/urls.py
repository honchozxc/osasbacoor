from django.urls import path
from . import views
from .views import (
    LoginView, LogoutView, DashboardView, UserCreateView,
    UserArchiveView, UserDetailView, UserUpdateView, HomePageView, AboutPageView, DownloadableListView, OJTView,
    DownloadableCreateView, DownloadableUpdateView, DownloadableArchiveView, DownloadableDetailView, UserListView,
    ProfileView, UpdateProfileView, UpdateAccountInfoView, CustomPasswordChangeView, AnnouncementListView,
    AnnouncementCreateView, AnnouncementDetailView, AnnouncementArchiveView, AnnouncementUpdateView,
    download_downloadable, ArchivedItemDetailView, RetrieveArchivedItemView, HomeAnnouncementDetailView,
    AllAnnouncementView, TemplatePageView, AboutPageEditView, ComplaintCreateView, download_complaint_pdf,
    ComplaintDetailView, ComplaintEditView, ArchiveComplaintView, FooterView,
    FooterEditView, StudentDisciplinePageView, StudentDisciplineEditView, RegistrationView, clear_registration_session,
    ApproveUserView, ScholarshipCreateView, ScholarshipDetailView, ScholarshipUpdateView, ScholarshipArchiveView,
    ScholarshipApplicationView, ScholarshipApplicationStatusView, ScholarshipApplicationUpdateView,
    ScholarshipApplicationArchiveView, ScholarshipPageEditView, ScholarshipPageView, ScholarshipApplicationApproveView,
    HomePageEditView, StudentAdmissionCreateView, StudentAdmissionSummaryView,
    AdmissionDetailView, StudentAdmissionArchiveView, AdmissionUpdateView, AdmissionApproveView, AdmissionLandingView,
    AdmissionPageEditView, NSTPStudentInfoCreateView, NSTPDetailSuccessView, NSTPStudentDetailView,
    NSTPStudentUpdateView, NSTPEnlistmentArchiveView, NSTPApproveView, NSTPExportTemplateView, NSTPFileCreateView,
    NSTPFileDetailView, NSTPFileUpdateView, NSTPFileArchiveView, NSTPLandingView, NSTPPageEditView, ClinicView,
    CompanyCreateView, OJTCompanyDetailView, OJTCompanyUpdateView, OJTCompanyArchiveView, OJTCompanyExportView,
    OJTPageEditView, OrganizationReactivateView, AccomplishmentCreateView, AccomplishmentRecordDetailView,
    AccomplishmentRecordUpdateView, SupportingFileDeleteView, OSASOrganizationChartView,
)

urlpatterns = [
    # User Authentication
    path('login', LoginView.as_view(), name='login'),
    path('register/', RegistrationView.as_view(), name='register'),
    path('register/clear-session/', clear_registration_session, name='clear_registration_session'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),

    # Core (Landing Page, About Etc.)
    path('', HomePageView.as_view(), name='home'),
    path('edit-home/', HomePageEditView.as_view(), name='home_edit'),
    path('about/', AboutPageView.as_view(), name='about'),
    path('about/edit/', AboutPageEditView.as_view(), name='about_edit'),
    path('all_announcements', AllAnnouncementView.as_view(), name='all_announcements'),
    path('api/announcements/all/', views.all_announcements_api, name='all_announcements_api'),
    path('detail_announcement/<int:pk>/', HomeAnnouncementDetailView.as_view(), name='home_announcement_detail'),
    path('downloadables/', TemplatePageView.as_view(), name='downloadables'),
    path('student-discipline-unit/', StudentDisciplinePageView.as_view(), name='student_discipline_unit'),
    path('student-discipline-unit/edit/', StudentDisciplineEditView.as_view(), name='student_discipline_edit'),
    path('ojt', OJTView.as_view(), name='ojt'),
    path('ojt/edit/', OJTPageEditView.as_view(), name='ojt_edit'),
    path('scholarships/', ScholarshipPageView.as_view(), name='scholarship_info'),
    path('scholarship/edit/', ScholarshipPageEditView.as_view(), name='scholarship_edit'),
    path('admission/', AdmissionLandingView.as_view(), name='admission_landing'),
    path('admission/edit/', AdmissionPageEditView.as_view(), name='admission_edit'),
    path('nstp/', NSTPLandingView.as_view(), name='nstp_landing'),
    path('nstp/edit/', NSTPPageEditView.as_view(), name='nstp_edit'),
    path('clinic/', views.ClinicView.as_view(), name='clinic'),
    path('dashboard/clinic-edit/', views.ClinicPageEditView.as_view(), name='clinic_edit'),
    path('sdsorganization/', views.SDSOrganizationView.as_view(), name='sdsorganization'),
    path('sds-edit/', views.SDSPageEditView.as_view(), name='sds_edit'),
    path('organizations/<int:pk>/', views.CoreOrganizationDetailView.as_view(), name='organization_detail'),
    path('osas-org-chart/', OSASOrganizationChartView.as_view(), name='osas-org-chart/'),
    path('footer/', FooterView.as_view(), name='footer'),
    path('footer/edit/', FooterEditView.as_view(), name='footer_edit'),

    path('get-courses/', views.get_courses, name='get_courses'),

    # Admin Functionalities
    # Profile
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/update/', UpdateProfileView.as_view(), name='update_profile'),
    path('profile/update-account/', UpdateAccountInfoView.as_view(), name='update_account_info'),
    path('password_change/', CustomPasswordChangeView.as_view(), name='password_change'),

    # Users
    path('users/<int:user_id>/approve/', ApproveUserView.as_view(), name='approve_user'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('add-user/', UserCreateView.as_view(), name='add-user'),
    path('user/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('user/<int:pk>/edit/', UserUpdateView.as_view(), name='edit-user'),
    path('archive-user/', UserArchiveView.as_view(), name='archive-user'),
    path('export-users/', views.export_users, name='export_users'),

    # Downloadables/Templates
    path('downloadables/<int:pk>/download/', download_downloadable, name='download_downloadable'),
    path('downloadables/', DownloadableListView.as_view(), name='downloadables'),
    path('downloadables/add/', DownloadableCreateView.as_view(), name='add-downloadable'),
    path('downloadables/<int:pk>/', DownloadableDetailView.as_view(), name='downloadable-detail'),
    path('downloadables/<int:pk>/edit/', DownloadableUpdateView.as_view(), name='edit-downloadable'),
    path('downloadables/<int:pk>/archive/', DownloadableArchiveView.as_view(), name='archive-downloadable'),

    # Announcements
    path('announcements/', AnnouncementListView.as_view(), name='announcements'),
    path('announcements/add/', AnnouncementCreateView.as_view(), name='add-announcement'),
    path('announcements/<int:pk>/', AnnouncementDetailView.as_view(), name='announcement-detail'),
    path('announcements/<int:pk>/edit/', AnnouncementUpdateView.as_view(), name='edit-announcement'),
    path('announcements/<int:pk>/archive/', AnnouncementArchiveView.as_view(), name='announcement_archive'),

    # Complaint
    path('create-complaint/', ComplaintCreateView.as_view(), name='complaint-create'),
    path('complaint/pdf/<str:complaint_id>/', download_complaint_pdf, name='download_complaint_pdf'),
    path('complaints/<int:pk>/update-status/', views.UpdateComplaintStatusView.as_view(), name='update_complaint_status'),
    path('complaints/<int:pk>/view/', ComplaintDetailView.as_view(), name='complaint_detail'),
    path('dashboard/complaints/<int:pk>/edit/', ComplaintEditView.as_view(), name='edit_complaint'),
    path('complaints/<int:pk>/archive/', ArchiveComplaintView.as_view(), name='archive_complaint'),
    path('export-complaints/', views.export_complaints, name='export_complaints'),

    # Scholarship
    path('scholarships/create/', ScholarshipCreateView.as_view(), name='scholarship_create'),
    path('api/scholarships/<int:pk>/', ScholarshipDetailView.as_view(), name='scholarship-detail'),
    path('api/scholarships/<int:pk>/edit/', ScholarshipUpdateView.as_view(), name='scholarship-edit'),
    path('api/scholarships/<int:pk>/archive/', ScholarshipArchiveView.as_view(), name='scholarship-archive'),

    # Scholarship Application
    path('scholarships/applications/<int:pk>/approve/', ScholarshipApplicationApproveView.as_view(),
     name='approve_scholarship_application'),
    path('apply-scholarship/', ScholarshipApplicationView.as_view(), name='scholarship-apply'),
    path('application-status/<int:pk>/', ScholarshipApplicationStatusView.as_view(), name='application-status'),
    path('scholarships/applications/<int:pk>/edit/', ScholarshipApplicationUpdateView.as_view(),
         name='edit_scholarship_application'),
    path('scholarships/applications/<int:pk>/archive/', ScholarshipApplicationArchiveView.as_view(),
         name='archive_application'),
    path('scholarships/applications/export/', views.export_scholarship_applications, name='export_scholarship_applications'),

    # Admission
    path('admissions/<int:pk>/approve/', AdmissionApproveView.as_view(), name='approve_admission'),
    path('admission/create/', StudentAdmissionCreateView.as_view(), name='admission_create'),
    path('admission/summary/<int:pk>/', StudentAdmissionSummaryView.as_view(), name='admission_summary'),
    path('admission/summary/', StudentAdmissionSummaryView.as_view(), name='admission_summary'),
    path('api/admissions/<int:pk>/', AdmissionDetailView.as_view(), name='admission-detail'),
    path('admissions/<int:pk>/edit/', AdmissionUpdateView.as_view(), name='edit_admission'),
    path('admissions/<int:pk>/archive/', StudentAdmissionArchiveView.as_view(), name='archive_admission'),
    path('export-admissions/', views.export_admissions, name='export_admissions'),

    # NSTP
    path('nstp/export-template/', NSTPExportTemplateView.as_view(), name='nstp_export_template'),
    path('nstp/<int:pk>/approve/', NSTPApproveView.as_view(), name='nstp_approve'),
    path('nstp/register/', NSTPStudentInfoCreateView.as_view(), name='nstp_register'),
    path('success/<int:pk>/', NSTPDetailSuccessView.as_view(), name='nstp_success'),
    path('api/nstp/students/<int:pk>/', NSTPStudentDetailView.as_view(), name='nstp-student-detail'),
    path('nstp/students/<int:pk>/edit/', NSTPStudentUpdateView.as_view(), name='edit_nstp_student'),
    path('nstp/enlistments/<int:pk>/archive/', NSTPEnlistmentArchiveView.as_view(), name='nstp_enlistment_archive'),

    # NSTP Files
    path('nstp-files/create/', NSTPFileCreateView.as_view(), name='nstp_file_create'),
    path('nstp-files/<int:pk>/', NSTPFileDetailView.as_view(), name='nstp_file_detail'),
    path('nstp-files/<int:pk>/edit/', NSTPFileUpdateView.as_view(), name='nstp_file_edit'),
    path('nstp/<int:pk>/archive/', NSTPFileArchiveView.as_view(), name='nstp-archive'),

    # OJT Company
    path('companies/add/', CompanyCreateView.as_view(), name='add-company'),
    path('ojt-company/<int:pk>/', OJTCompanyDetailView.as_view(), name='ojt-company-detail'),
    path('ojt-company/<int:pk>/edit/', OJTCompanyUpdateView.as_view(), name='ojt-company-edit'),
    path('ojt-company/<int:pk>/archive/', OJTCompanyArchiveView.as_view(), name='ojt-company-archive'),
    path('export-ojt-companies/', views.OJTCompanyExportView.as_view(), name='export-ojt-companies'),

    # SDS Organization
    path('add-organization/', views.OrganizationCreateView.as_view(), name='add-organization'),
    path('api/check-username/', views.check_username_availability, name='check_username_availability'),
    path('api/check-email/', views.check_email_availability, name='check_email_availability'),
    path('api/check-organization-email/', views.check_organization_email_availability,name='check_organization_email_availability'),
    path('organizations/<int:pk>/view/', views.OrganizationDetailView.as_view(), name='organization-view'),
    path('organizations/<int:pk>/edit/', views.OrganizationEditView.as_view(), name='organization_edit'),
    path('organizations/<int:pk>/archive/', views.OrganizationArchiveView.as_view(), name='organization_archive'),
    path('organizations/<int:pk>/reactivate/', OrganizationReactivateView.as_view(), name='organization_reactivate'),
    path('organizations/<int:organization_id>/approve/', views.approve_organization, name='approve_organization'),
    path('organizations/<int:organization_id>/renew/', views.renew_organization, name='renew_organization'),

    # Organization Certificate
    path('certificates/<int:certificate_id>/details/', views.certificate_details, name='certificate_details'),
    path('certificates/<int:certificate_id>/download/', views.download_certificate, name='download_certificate'),

    # Organization(AR)
    path('add-accomplishment/', AccomplishmentCreateView.as_view(), name='add-accomplishment'),
    path('accomplishment-reports/<int:pk>/view/', AccomplishmentRecordDetailView.as_view(), name='accomplishment_report_view'),
    path('accomplishment-reports/<int:pk>/edit/', AccomplishmentRecordUpdateView.as_view(), name='accomplishment_report_edit'),
    path('accomplishment-reports/supporting-files/<int:pk>/delete/', SupportingFileDeleteView.as_view(), name='supporting_file_delete'),
    path('accomplishment-reports/<int:pk>/archive/', views.AccomplishmentReportArchiveView.as_view(), name='accomplishment_report_archive'),

    # Activity Log
    path('analytics/recent-activities/', views.recent_activities, name='recent_activities'),
    path('analytics/activity-overview/', views.activity_log_overview, name='activity_overview'),
    path('analytics/activity-users/', views.activity_users, name='activity_users'),
    path('analytics/export-activities/', views.export_activities, name='export_activities'),

    # Calendar
    path('api/announcements/', views.AnnouncementCalendarAPI.as_view(), name='announcement_calendar_api'),

    # Archived
    path('api/archived/<str:item_type>/<int:pk>/', ArchivedItemDetailView.as_view(), name='archived_item_detail'),
    path('api/archived/<str:item_type>/<int:pk>/retrieve/', RetrieveArchivedItemView.as_view(),
         name='retrieve_archived_item'),
]