// ----------------------------------------------------- Export Function -----------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    const exportBtn = document.getElementById('export-user-btn');
    const exportModal = document.getElementById('exportUserModal');
    const cancelExportBtn = document.getElementById('cancelUserExport');
    const confirmExportBtn = document.getElementById('confirmUserExport');
    const closeBtn = exportModal.querySelector('.export-modal-close');
    const exportForm = document.getElementById('exportUserForm');
    const exportOptions = document.querySelectorAll('input[name="export_option"]');

    const customOptions = document.getElementById('customUserOptions');

    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            exportModal.classList.add('is-active');
            document.body.style.overflow = 'hidden';
        });
    }

    function closeExportModal() {
        exportModal.classList.remove('is-active');
        document.body.style.overflow = 'auto';
    }

    if (closeBtn) closeBtn.addEventListener('click', closeExportModal);
    if (cancelExportBtn) cancelExportBtn.addEventListener('click', closeExportModal);

    window.addEventListener('click', function(event) {
        if (event.target === exportModal) {
            closeExportModal();
        }
    });

    exportOptions.forEach(option => {
        option.addEventListener('change', function() {
            if (this.value === 'custom') {
                customOptions.style.display = 'block';
            } else {
                customOptions.style.display = 'none';
            }
        });
    });

    if (confirmExportBtn) {
        confirmExportBtn.addEventListener('click', function() {
            const selectedOption = document.querySelector('input[name="export_option"]:checked').value;

            if (selectedOption === 'filtered') {
                const searchValue = document.getElementById('user-search').value;
                if (searchValue) {
                    addHiddenInput(exportForm, 'search', searchValue);
                }

                const unitValue = document.getElementById('unit-sort').value;
                if (unitValue) {
                    addHiddenInput(exportForm, 'unit_filter', unitValue);
                }

                const verifiedValue = document.getElementById('verified-sort').value;
                if (verifiedValue) {
                    addHiddenInput(exportForm, 'verified_filter', verifiedValue);
                }

                const statusValue = document.getElementById('status-sort').value;
                if (statusValue) {
                    addHiddenInput(exportForm, 'status_filter', statusValue);
                }
            }

            this.classList.add('btn-loading');
            this.disabled = true;

            setTimeout(() => {
                exportForm.submit();
                closeExportModal();

                this.classList.remove('btn-loading');
                this.disabled = false;
            }, 500);
        });
    }

    function addHiddenInput(form, name, value) {
        const existingInput = form.querySelector(`input[name="${name}"]`);
        if (existingInput) {
            existingInput.remove();
        }

        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
    }
});

// -------------------------------------------- Approved Function ------------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    const approveModal = document.getElementById('approveUserModal');
    let currentUserId = null;
    let currentCsrfToken = null;
    let currentButton = null;

    const documentViewerModal = document.getElementById('documentViewerModal');
    const documentViewerImage = document.getElementById('documentViewerImage');
    const documentViewerTitle = document.getElementById('documentViewerTitle');

    // Handle document preview clicks
    document.addEventListener('click', function(e) {
        const idPhotoPreview = e.target.closest('#idPhotoPreview');
        const corPhotoPreview = e.target.closest('#corPhotoPreview');

        if (idPhotoPreview && idPhotoPreview.querySelector('img')) {
            const imgSrc = idPhotoPreview.querySelector('img').src;
            documentViewerImage.src = imgSrc;
            documentViewerTitle.textContent = 'ID Photo';
            documentViewerModal.classList.add('active');
            e.stopPropagation();
        }

        if (corPhotoPreview && corPhotoPreview.querySelector('img')) {
            const imgSrc = corPhotoPreview.querySelector('img').src;
            documentViewerImage.src = imgSrc;
            documentViewerTitle.textContent = 'Certificate of Registration';
            documentViewerModal.classList.add('active');
            e.stopPropagation();
        }

        if (e.target.closest('.document-viewer-overlay') ||
            e.target.closest('.document-viewer-container .modal-close-btn')) {
            documentViewerModal.classList.remove('active');
            e.stopPropagation();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (documentViewerModal.classList.contains('active')) {
                documentViewerModal.classList.remove('active');
                e.stopPropagation();
            }
        }
    });

    // Handle approve button clicks using event delegation
    document.addEventListener('click', function(e) {
        const approveBtn = e.target.closest('.approve-user');
        if (approveBtn) {
            currentUserId = approveBtn.getAttribute('data-user-id');
            currentCsrfToken = approveBtn.getAttribute('data-csrf');
            currentButton = approveBtn;

            // Get basic info from the row
            const row = approveBtn.closest('tr');
            const firstName = row.cells[1].textContent;
            const lastName = row.cells[2].textContent;
            const username = row.cells[3].textContent;
            const userType = row.cells[4].textContent;
            const isVerified = row.cells[5].querySelector('.status-badge').classList.contains('verified');
            const userId = row.cells[0].textContent;

            // Update modal with basic information
            document.getElementById('approveUserName').textContent = `${firstName} ${lastName}`;
            document.getElementById('approveUserUsername').textContent = username;
            document.getElementById('approveUserUnit').textContent = userType;
            document.getElementById('approveUserId').textContent = userId;

            const statusBadge = document.getElementById('approveUserStatus');
            statusBadge.textContent = isVerified ? 'Verified' : 'Unverified';
            statusBadge.className = isVerified ? 'status-badge verified' : 'status-badge unverified';

            fetch(`/user/${userId}/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': currentCsrfToken
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const user = data.user;

                    // Update ID photo preview
                    const idPhotoPreview = document.getElementById('idPhotoPreview');
                    if (user.id_photo) {
                        idPhotoPreview.innerHTML = `<img src="${user.id_photo}" alt="ID Photo" class="document-image">`;
                    } else {
                        idPhotoPreview.innerHTML = '<p class="no-document">No ID photo uploaded</p>';
                    }

                    // Update COR photo preview
                    const corPhotoPreview = document.getElementById('corPhotoPreview');
                    if (user.cor_photo) {
                        corPhotoPreview.innerHTML = `<img src="${user.cor_photo}" alt="Certificate of Registration" class="document-image">`;
                    } else {
                        corPhotoPreview.innerHTML = '<p class="no-document">No COR uploaded</p>';
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching user details:', error);
                // Fallback in case of error
                document.getElementById('idPhotoPreview').innerHTML = '<p class="no-document">Error loading ID photo</p>';
                document.getElementById('corPhotoPreview').innerHTML = '<p class="no-document">Error loading COR</p>';
            });

            // Show modal
            approveModal.classList.add('active');
        }
    });


    // Confirm approval
    document.getElementById('confirmApprove').addEventListener('click', function() {
        if (currentUserId && currentCsrfToken && currentButton) {
            approveUser(currentUserId, currentCsrfToken, currentButton);
        }
    });

    // Close modal function
    const closeModal = function() {
        const loadingIndicator = approveModal.querySelector('#approveLoading');
        if (loadingIndicator.style.display !== 'block') {
            approveModal.classList.remove('active');
        }
    };

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    approveModal.querySelector('.modal-overlay').addEventListener('click', closeModal);

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && approveModal.classList.contains('active')) {
            closeModal();
        }
    });
});

function approveUser(userId, csrfToken, buttonElement) {
    const approveBtn = document.getElementById('confirmApprove');
    const loadingIndicator = document.getElementById('approveLoading');
    const btnText = approveBtn.querySelector('.btn-text');
    const btnSpinner = approveBtn.querySelector('.loading-spinner-btn');

    approveBtn.disabled = true;
    btnText.textContent = 'Approving...';
    btnSpinner.style.display = 'inline-block';
    loadingIndicator.style.display = 'block';

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.disabled = true;
    });

    fetch(`/users/${userId}/approve/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({})
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || 'Network response was not ok');
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showToast(data.message, 'success');

            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Failed to approve user: ' + error.message, 'error');

        approveBtn.disabled = false;
        btnText.textContent = 'Approve';
        btnSpinner.style.display = 'none';
        loadingIndicator.style.display = 'none';

        document.querySelectorAll('.modal-close-btn').forEach(btn => {
            btn.disabled = false;
        });
    });
}

// ----------------------------------------- Create/Add User Function --------------------------------------------------
function toggleUserTypeFields() {
    const studentFields = document.getElementById('studentFields');
    const osasFields = document.getElementById('osasFields');
    const personalInfoSection = document.getElementById('personalInfoSection');
    const personalInfoTitle = document.getElementById('personalInfoTitle');
    const personalInfoDescription = document.getElementById('personalInfoDescription');
    const firstNameLabel = document.getElementById('firstNameLabel');
    const lastNameLabel = document.getElementById('lastNameLabel');
    const userType = document.querySelector('input[name="user_type"]:checked');

    // Hide all role-specific fields first
    studentFields.style.display = 'none';
    osasFields.style.display = 'none';

    // Reset all required fields and labels
    resetAllRequiredFields();

    // Show personal info section for all roles
    personalInfoSection.style.display = 'block';

    if (userType) {
        if (userType.value === '14') { // Student
            studentFields.style.display = 'block';
            setStudentFieldsRequired(true);
            personalInfoTitle.textContent = 'Student Information';
            personalInfoDescription.textContent = 'Personal details of the student';
            firstNameLabel.textContent = 'First Name';
            lastNameLabel.textContent = 'Last Name';

            // Update COR label to show required
            updateLabelRequired('id_cor_photo', true);
            // ID photo is optional for students
            updateLabelRequired('id_id_photo', false);

        }
        else if (['1','2','3','4','5','6','7','8','9','10','11','12','13'].includes(userType.value)) {
            osasFields.style.display = 'block';
            setOsasFieldsRequired(true);
            personalInfoTitle.textContent = 'Staff Information';
            personalInfoDescription.textContent = 'Personal details of the staff member';
            firstNameLabel.textContent = 'First Name';
            lastNameLabel.textContent = 'Last Name';

            // Update ID photo label to show required
            updateLabelRequired('id_id_photo', true);
            // COR is optional for OSAS staff
            updateLabelRequired('id_cor_photo', false);
        }
        else {
            personalInfoTitle.textContent = 'Personal Information';
            personalInfoDescription.textContent = 'Basic personal details';
            firstNameLabel.textContent = 'First Name';
            lastNameLabel.textContent = 'Last Name';

            // Both optional for other roles
            updateLabelRequired('id_id_photo', false);
            updateLabelRequired('id_cor_photo', false);
        }
    }
}

// Helper function to update label required indicator
function updateLabelRequired(fieldId, isRequired) {
    const field = document.getElementById(fieldId);
    if (field) {
        const label = field.closest('.form-group').querySelector('label');
        if (label) {
            // Remove existing required asterisk
            const existingAsterisk = label.querySelector('.required-asterisk');
            if (existingAsterisk) {
                existingAsterisk.remove();
            }

            // Add required asterisk if needed
            if (isRequired) {
                const asterisk = document.createElement('span');
                asterisk.className = 'required-asterisk';
                asterisk.textContent = ' *';
                label.appendChild(asterisk);
            }

            // Update the field requirement
            field.required = isRequired;
        }
    }
}

// Helper functions to set required fields
function resetAllRequiredFields() {
    // Student fields
    document.getElementById('id_student_number').required = false;
    document.getElementById('id_course').required = false;
    document.getElementById('id_year_level').required = false;
    document.getElementById('id_section').required = false;
    document.getElementById('id_cor_photo').required = false;

    // OSAS fields
    document.getElementById('id_department').required = false;
    document.getElementById('id_osas_position').required = false;
    document.getElementById('id_id_photo').required = false;

    // Remove all required asterisks from file upload labels
    const fileLabels = document.querySelectorAll('.form-group label[for="id_id_photo"], .form-group label[for="id_cor_photo"]');
    fileLabels.forEach(label => {
        const asterisk = label.querySelector('.required-asterisk');
        if (asterisk) {
            asterisk.remove();
        }
    });
}

function setStudentFieldsRequired(required) {
    document.getElementById('id_student_number').required = required;
    document.getElementById('id_course').required = required;
    document.getElementById('id_year_level').required = required;
    document.getElementById('id_section').required = required;
    document.getElementById('id_cor_photo').required = required;

    // Update labels to show required indicators
    if (required) {
        updateLabelRequired('id_student_number', true);
        updateLabelRequired('id_course', true);
        updateLabelRequired('id_year_level', true);
        updateLabelRequired('id_cor_photo', true);
    }
}

function setOsasFieldsRequired(required) {
    document.getElementById('id_department').required = required;
    document.getElementById('id_id_photo').required = required;

    // Update labels to show required indicators
    if (required) {
        updateLabelRequired('id_department', true);
        updateLabelRequired('id_id_photo', true);
    }
}

// Initialize the form when modal opens
function openModal() {
    const modal = document.getElementById('userCreateModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Reset and initialize fields
    toggleUserTypeFields();
}

// Add event listeners to all user type radio buttons
document.querySelectorAll('input[name="user_type"]').forEach(radio => {
    radio.addEventListener('change', toggleUserTypeFields);
});

function closeModal() {
  const modal = document.getElementById('userCreateModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';

  document.getElementById('userCreateForm').reset();
  document.getElementById('formResponse').innerHTML = '';

  // Clear all error
  document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
  document.querySelectorAll('.error-message').forEach(el => el.remove());
}

document.getElementById('profilePictureInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  const preview = document.getElementById('profilePicturePreview');
  const placeholder = document.querySelector('.profile-picture-upload .placeholder');
  const removeBtn = document.querySelector('.btn-remove-image');

  if (file) {
    if (!file.type.match('image.*')) {
      showError('Please select a valid image file (JPEG, PNG, etc.)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showError('Image size should be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      preview.src = e.target.result;
      preview.style.display = 'block';
      placeholder.style.display = 'none';
      removeBtn.style.display = 'block';
    }
    reader.readAsDataURL(file);
  }
});

// Update the profile picture change event listener
document.getElementById('profilePictureInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  const preview = document.getElementById('profilePicturePreview');
  const placeholder = document.querySelector('.profile-picture-upload .placeholder');
  const removeBtn = document.querySelector('.btn-remove-image');

  if (file) {
    if (!file.type.match('image.*')) {
      showError('Please select a valid image file (JPEG, PNG, etc.)');
      this.value = ''; // Clear the invalid file
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      showError('Image size should be less than 2MB');
      this.value = ''; // Clear the oversized file
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      preview.src = e.target.result;
      preview.style.display = 'block';
      placeholder.style.display = 'none';
      removeBtn.style.display = 'block';
    }
    reader.readAsDataURL(file);
  }
});

function removeProfilePicture() {
  const input = document.getElementById('profilePictureInput');
  const preview = document.getElementById('profilePicturePreview');
  const placeholder = document.querySelector('.profile-picture-upload .placeholder');
  const removeBtn = document.querySelector('.btn-remove-image');

  // Create a new file input to clear the value
  const newInput = input.cloneNode(true);
  input.parentNode.replaceChild(newInput, input);

  // Re-attach event listener to the new input
  newInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('profilePicturePreview');
    const placeholder = document.querySelector('.profile-picture-upload .placeholder');
    const removeBtn = document.querySelector('.btn-remove-image');

    if (file) {
      if (!file.type.match('image.*')) {
        showError('Please select a valid image file (JPEG, PNG, etc.)');
        this.value = '';
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        showError('Image size should be less than 2MB');
        this.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = function(e) {
        preview.src = e.target.result;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
        removeBtn.style.display = 'block';
      }
      reader.readAsDataURL(file);
    }
  });

  preview.src = '#';
  preview.style.display = 'none';
  placeholder.style.display = 'flex';
  removeBtn.style.display = 'none';
}

function showError(message) {
  const formResponse = document.getElementById('formResponse');
  formResponse.innerHTML = `
    <div class="response-message response-error">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5222d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      ${message}
    </div>
  `;
}

// Update the form submission handler to show detailed errors
document.getElementById('userCreateForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const form = this;
    const submitBtn = form.querySelector('button[type="submit"]');
    const formResponse = document.getElementById('formResponse');

    submitBtn.classList.add('is-loading');
    formResponse.innerHTML = '';

    // Clear previous errors
    document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.error-message').forEach(el => el.remove());

    fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw err; });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Success handling
            showSuccessToast('User created successfully!');
            formResponse.innerHTML = `
                <div class="response-message response-success">
                    User created successfully! This window will close shortly...
                </div>
            `;
            setTimeout(() => {
                closeModal();
                window.location.reload();
            }, 1500);
        } else {
            console.log('Form errors:', data.errors); // Debug log
            showFormErrors(form, data.errors);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        if (error.errors) {
            console.log('Validation errors:', error.errors); // Debug log
            showFormErrors(form, error.errors);
        } else {
            formResponse.innerHTML = `
                <div class="response-message response-error">
                    ${error.message || 'An unexpected error occurred'}
                </div>
            `;
        }
    })
    .finally(() => {
        submitBtn.classList.remove('is-loading');
    });
});

document.getElementById('id_student_number').addEventListener('input', function(e) {
    const value = e.target.value;
    const errorElement = document.querySelector('#id_student_number + .error-message');

    // Only allow numbers and hyphens
    if (!/^[0-9-]*$/.test(value)) {
        if (!errorElement) {
            const errorContainer = document.createElement('div');
            errorContainer.className = 'error-message';
            errorContainer.innerHTML = '<ul><li>Student number can only contain numbers and hyphens</li></ul>';
            e.target.parentNode.insertBefore(errorContainer, e.target.nextSibling);
        }
        e.target.classList.add('error');
    } else {
        if (errorElement) {
            errorElement.remove();
        }
        e.target.classList.remove('error');
    }
});

// Function to handle file upload preview
function setupFileUploadPreview(inputId, previewContainerId) {
  const fileInput = document.getElementById(inputId);
  const previewContainer = document.getElementById(previewContainerId);

  if (fileInput && previewContainer) {
    fileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const previewImage = previewContainer.querySelector('.preview-image');
        const previewFilename = previewContainer.querySelector('.preview-filename');
        const previewFilesize = previewContainer.querySelector('.preview-filesize');

        // Show preview section
        previewContainer.style.display = 'block';

        // Set filename and size
        previewFilename.textContent = file.name;
        previewFilesize.textContent = formatFileSize(file.size);

        // If it's an image, show preview
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = function(e) {
            previewImage.src = e.target.result;
            previewImage.style.display = 'block';
          };
          reader.readAsDataURL(file);
        } else {
          // For non-image files, show a document icon
          previewImage.style.display = 'none';
        }
      }
    });

    // Handle remove button
    const removeBtn = previewContainer.querySelector('.remove-btn');
    if (removeBtn) {
      removeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        fileInput.value = '';
        previewContainer.style.display = 'none';
      });
    }
  }
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Initialize for ID photo and document upload
document.addEventListener('DOMContentLoaded', function() {
  setupFileUploadPreview('id_id_photo', 'id_photo_preview');
  setupFileUploadPreview('id_cor_photo', 'cor_photo_preview');
});

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

function showFormErrors(form, errors) {
  const formResponse = document.getElementById('formResponse');
  const errorList = document.createElement('ul');
  errorList.style.margin = '0';
  errorList.style.paddingLeft = '0';
  let hasErrors = false;

  for (const [field, fieldErrors] of Object.entries(errors)) {
    const input = form.querySelector(`[name="${field}"]`);
    if (input) {
      input.classList.add('error');
      const errorContainer = document.createElement('div');
      errorContainer.className = 'error-message';

      const errorList = document.createElement('ul');
      const errorArray = Array.isArray(fieldErrors) ? fieldErrors : [fieldErrors];

      errorArray.forEach(errorText => {
        const listItem = document.createElement('li');
        listItem.textContent = errorText;
        errorList.appendChild(listItem);
      });

      errorContainer.appendChild(errorList);
      input.parentNode.insertBefore(errorContainer, input.nextSibling);
      hasErrors = true;
    }

    const errorArray = Array.isArray(fieldErrors) ? fieldErrors : [fieldErrors];
    errorArray.forEach(errorText => {
      const listItem = document.createElement('li');
      listItem.textContent = `${field.replace('_', ' ')}: ${errorText}`;
      errorList.appendChild(listItem);
    });
  }

  if (hasErrors) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'response-message response-error';
    errorContainer.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5222d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>Please correct the following errors:</span>
    `;
    formResponse.appendChild(errorContainer);
  }
}

function showSuccessToast(message) {
  console.log('Success:', message);
}

function showErrorToast(message) {
  console.error('Error:', message);
}

function refreshUserTable() {
  console.log('Refreshing user table...');
}

document.addEventListener('DOMContentLoaded', function() {
  setupFileUploadPreview('id_id_photo', 'id_photo_preview');
  setupFileUploadPreview('id_cor_photo', 'cor_photo_preview');
});

// ------------------------------------------ Role and Permissions Handling --------------------------------------------
function setupRolePermissions() {
  const roleRadios = document.querySelectorAll('input[name="user_type"]');
  const allPermissionCheckboxes = document.querySelectorAll('input[name="permissions"]');
  const permissionsContainer = document.querySelector('.permissions-container');

  function shouldCheckPermission(permName, role) {
    // Super Admin gets all permissions
    if (role === '1') return false;

     // Student Development Services (10) gets all organization permissions
    if (role === '10' && (permName.includes('organization') || permName.includes('Organization'))) {
      return true;
    }

    // Students (#14) get NO announcement permissions at all
    if (role === '14' && (permName.includes('announcement') || permName.includes('Announcement'))) {
      return false;
    }

    // Common permissions for all non-superadmin roles (except students)
    if (role !== '14' && (permName.includes('announcement') || permName.includes('Announcement'))) {
      return true;
    }

    // OJT Permission
    if (permName.includes('OJT') || permName.includes('ojt') ||
        permName.includes('On-the-Job') || permName.includes('on_the_job') ||
        permName.includes('ojtcompany') || permName.includes('ojtapplication') ||
        permName.includes('ojtreport') || permName.includes('ojtrequirement')) {

      if (role === '1' || role === '13') {
        return true;
      }
      else if (role === '14') {
        if (permName.includes('ojtcompany') || permName.includes('OJT company') ||
            permName.includes('OJT Company') || permName.toLowerCase().includes('company')) {
          return permName.toLowerCase().includes('view') && !permName.toLowerCase().includes('add') &&
                 !permName.toLowerCase().includes('change') && !permName.toLowerCase().includes('delete');
        }
        else {
          return true;
        }
      }
      // Other roles - no OJT permissions
      else {
        return false;
      }
    }

    // Organization permissions - for OSAS Staff (1) and Student Development Services (10)
    if (permName.includes('organization') || permName.includes('Organization')) {
      return role === '1' || role === '10';
    }

    // NSTP File permissions - only for OSAS Staff (1) and NSTP (2)
    if (permName.includes('NSTP File') || permName.includes('nstpfile')) {
      return role === '1' || role === '2';
    }

    // Student Admission permissions for OSAS Staff (1), Admission (12), and Students (14)
    if (permName.includes('student admission') || permName.includes('Student Admission')) {
      return role === '1' || role === '12' || role === '14';
    }

    if (permName.includes('Complaint') || permName.includes('complaint')) {
      return true;
    }

    // Role-specific permissions
    switch(role) {
      case '2': // NSTP
        return permName.includes('view downloadable') ||
               permName.includes('add downloadable') ||
               permName.includes('NSTP') ||
               permName.includes('nstp');

      case '3': // Clinic
        return permName.includes('view downloadable') || permName.includes('add downloadable');

      case '4': // Alumni
        return permName.includes('view downloadable') || permName.includes('add downloadable');

      case '5': // Scholarship
        return permName.includes('view downloadable') ||
               permName.includes('add downloadable') ||
               permName.includes('scholarship');

      case '6': // Culture and Arts
        return permName.includes('view downloadable') || permName.includes('add downloadable');

      case '7': // Sports Development
        return permName.includes('view downloadable') || permName.includes('add downloadable');

      case '8': // Guidance Counseling
        return permName.includes('view downloadable') || permName.includes('add downloadable');

      case '9': // Student Welfare Services
        return permName.includes('view downloadable') || permName.includes('add downloadable');

      case '10': // Student Development Services
        return permName.includes('view downloadable') || permName.includes('add downloadable');
               permName.includes('organization') ||
               permName.includes('Organization');

      case '11': // Misdeamenor
        return permName.includes('view downloadable') ||
               permName.includes('add downloadable') ||
               permName.includes('complaint');

      case '12': // Admission
        return permName.includes('view downloadable') ||
               permName.includes('add downloadable') ||
               permName.includes('student admission');

      case '13': // Job Placement
        return permName.includes('view downloadable') || permName.includes('add downloadable');

      case '14': // Student
        return permName.includes('view downloadable') ||
               permName.includes('view scholarship application') ||
               permName.includes('change scholarship application') ||
               permName.includes('delete scholarship application') ||
               permName.includes('student admission') ||
               permName.includes('NSTP Student') ||
               permName.includes('nstpstudentinfo');

      default:
        return permName.includes('view content type');
    }
  }

  // Function to set permissions based on role
  function setRolePermissions(role) {
    // Reset all checkboxes first
    allPermissionCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
    });

    // Set permissions based on role
    if (role === '1') {
      // Super Admin - check all permissions
      allPermissionCheckboxes.forEach(checkbox => {
        checkbox.checked = true;
      });
    } else {
      // For all other roles
      allPermissionCheckboxes.forEach(checkbox => {
        const permName = checkbox.nextElementSibling.textContent.trim();
        if (shouldCheckPermission(permName, role)) {
          checkbox.checked = true;
        }
      });
    }
  }

  // Set up role change handlers
  roleRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.checked) {
        setRolePermissions(this.value);
      }
    });
  });

  // Initialize based on current selection
  const selectedRadio = document.querySelector('input[name="user_type"]:checked');
  if (selectedRadio) {
    setRolePermissions(selectedRadio.value);
  }

  // Allow manual permission changes
  if (permissionsContainer) {
    permissionsContainer.addEventListener('change', function(e) {
      if (e.target && e.target.name === 'permissions') {
        // Custom permission changes allowed
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', function() {
  setupRolePermissions();

  // Click handlers for permission group headers to toggle their sections
  document.querySelectorAll('.permission-group .group-header').forEach(header => {
    header.addEventListener('click', function() {
      this.parentElement.classList.toggle('collapsed');
    });
  });
});

// --------------------------------------------- View User Functions ---------------------------------------------------
function openViewModal(userId) {
    fetch(`/user/${userId}/`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            const user = data.user;
            const modal = document.getElementById('userViewModal');

            // Basic user info
            document.getElementById('viewUserName').textContent = `${user.first_name} ${user.last_name}`;
            document.getElementById('viewUserRole').textContent = user.user_type_display;
            document.getElementById('viewFirstName').textContent = user.first_name || 'N/A';
            document.getElementById('viewLastName').textContent = user.last_name || 'N/A';
            document.getElementById('viewUsername').textContent = user.username || 'N/A';
            document.getElementById('viewEmail').textContent = user.email || 'N/A';
            document.getElementById('viewStatus').textContent = user.is_active ? 'Active' : 'Inactive';
            document.getElementById('viewDateJoined').textContent = formatDateTime(user.date_joined);
            document.getElementById('viewLastLogin').textContent = user.last_login ? formatDateTime(user.last_login) : 'Never logged in';

            // Profile fields
            document.getElementById('viewGender').textContent = user.gender_display || 'N/A';
            document.getElementById('viewBirthDate').textContent = user.birth_date || 'N/A';
            document.getElementById('viewPhoneNumber').textContent = user.phone_number || 'N/A';
            document.getElementById('viewAddress').textContent = user.address || 'N/A';
            document.getElementById('viewPosition').textContent = user.position_display || user.position || 'N/A';
            document.getElementById('viewIsVerified').textContent = user.is_verified ? 'Yes' : 'No';

            // Student-specific fields
            document.getElementById('viewStudentNumber').textContent = user.student_number || 'N/A';
            document.getElementById('viewCourse').textContent = user.course || 'N/A';
            document.getElementById('viewYearLevel').textContent = user.year_level || 'N/A';
            document.getElementById('viewSection').textContent = user.section || 'N/A';

            // OSAS-specific fields
            document.getElementById('viewDepartment').textContent = user.department || 'N/A';

            // Type flags
            document.getElementById('viewIsStudent').textContent = user.is_student ? 'Yes' : 'No';
            document.getElementById('viewIsOsasUnit').textContent = user.is_osas_unit ? 'Yes' : 'No';

            // Profile picture
            const profileImg = document.getElementById('viewProfilePicture');
            if (user.profile_picture) {
                profileImg.src = user.profile_picture;
            } else {
                profileImg.src = "{% static 'images/default-profile.png' %}";
            }

            // Handle permissions display
            const permissionsContainer = document.getElementById('viewPermissions');
            if (permissionsContainer) {
                if (user.permissions && user.permissions.length > 0) {
                    const groupedPermissions = {};

                    user.permissions.forEach(permission => {
                        const parts = permission.split('.');
                        const appLabel = parts[0];
                        const permName = parts[1].replace(/_/g, ' ');

                        if (!groupedPermissions[appLabel]) {
                            groupedPermissions[appLabel] = [];
                        }
                        groupedPermissions[appLabel].push(permName);
                    });

                    // Create HTML for permissions display
                    let permissionsHTML = '';
                    for (const [appLabel, perms] of Object.entries(groupedPermissions)) {
                        permissionsHTML += `
                            <div class="permission-group">
                                <h5 class="group-header">${appLabel}</h5>
                                <div class="permission-items">
                                    ${perms.map(perm => `
                                        <span class="permission-chip">${perm}</span>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    }
                    permissionsContainer.innerHTML = permissionsHTML;
                } else {
                    permissionsContainer.innerHTML = '<p class="text-muted">No special permissions assigned</p>';
                }
            }

            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            showErrorToast('Failed to load user details: ' + (data.error || 'Unknown error'));
            console.error('Failed to fetch user details:', data.error);
        }
    })
    .catch(error => {
        showErrorToast('Failed to load user details. Please try again.');
        console.error('Error fetching user details:', error);
    });
}

function closeViewModal() {
    const modal = document.getElementById('userViewModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Helper function to format date/time
function formatDateTime(isoString) {
    if (!isoString) return 'N/A';

    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showErrorToast(message) {
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Add click handlers to all view buttons
function initializeViewButtons() {
    const viewButtons = document.querySelectorAll('.btn-view');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.closest('tr').querySelector('td:first-child').textContent;
            openViewModal(userId);
        });
    });
}

// Initialize when DOM is loaded also content dynamically loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeViewButtons();

    // Add click handlers for permission group headers to toggle their sections
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('group-header')) {
            e.target.nextElementSibling.classList.toggle('collapsed');
            e.target.parentElement.classList.toggle('collapsed');
        }
    });
});

document.addEventListener('ajaxComplete', initializeViewButtons);

// ----------------------------------------------- Edit User Function --------------------------------------------------
function openEditModal(userId) {
  fetch(`/user/${userId}/edit/`, {
    headers: {
      'X-Requested-With': 'XMLHttpRequest'
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      const user = data.user;
      const modal = document.getElementById('userEditModal');
      const form = document.getElementById('userEditForm');

      // Set form action URL
      form.action = `/user/${userId}/edit/`;

      // Fill basic form fields
      document.getElementById('editUserId').value = userId;
      document.getElementById('edit_first_name').value = user.first_name || '';
      document.getElementById('edit_last_name').value = user.last_name || '';
      document.getElementById('edit_username').value = user.username || '';
      document.getElementById('edit_email').value = user.email || '';

      // Fill new personal information fields
      document.getElementById('edit_gender').value = user.gender || '';
      document.getElementById('edit_birth_date').value = user.birth_date || '';
      document.getElementById('edit_phone_number').value = user.phone_number || '';
      document.getElementById('edit_address').value = user.address || '';

      // Set user type radio button first
      const userTypeRadios = document.querySelectorAll('#userEditModal input[name="user_type"]');
      userTypeRadios.forEach(radio => {
        if (radio.value === user.user_type.toString()) {
          radio.checked = true;
        } else {
          radio.checked = false;
        }
      });

      // Then fill role-specific fields based on current role
      if (user.user_type.toString() === '14') {
        // Student fields
        document.getElementById('edit_student_number').value = user.student_number || '';
        // Initialize course dropdown
        const courseSelect = document.getElementById('edit_course');
        courseSelect.innerHTML = '<option value="">Select Course</option>';

        if (data.courses && data.courses.length > 0) {
          data.courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = course.name;
            if (user.course && course.id === user.course) {
              option.selected = true;
            }
            courseSelect.appendChild(option);
          });
        }

        document.getElementById('edit_year_level').value = user.year_level || '';
        document.getElementById('edit_section').value = user.section || '';
      }
      else if (['1','2','3','4','5','6','7','8','9','10','11','12','13'].includes(user.user_type.toString())) {
        // OSAS fields
        document.getElementById('edit_department').value = user.department || '';
        document.getElementById('edit_osas_position').value = user.osas_position || '';
      }
      else {
        // Clear all role-specific fields
        document.getElementById('edit_student_number').value = '';
        document.getElementById('edit_course').value = '';
        document.getElementById('edit_year_level').value = '';
        document.getElementById('edit_section').value = '';
        document.getElementById('edit_department').value = '';
        document.getElementById('edit_osas_position').value = '';
      }

      // Toggle student/OSAS fields based on user type
      toggleEditUserTypeFields();

      // Set active status toggle
      const activeToggle = document.getElementById('edit_is_active');
      activeToggle.checked = user.is_active;
      activeToggle.nextElementSibling.nextElementSibling.textContent = user.is_active ? 'Active' : 'Inactive';

      // Set profile picture
      const preview = document.getElementById('editProfilePicturePreview');
      const placeholder = document.querySelector('#userEditModal .profile-picture-upload .placeholder');
      const removeBtn = document.querySelector('#userEditModal .btn-remove-image');
      const clearInput = document.getElementById('editProfilePictureClear');

      if (user.profile_picture) {
        preview.src = user.profile_picture;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
        removeBtn.style.display = 'block';
        clearInput.value = 'false';
      } else {
        preview.src = '#';
        preview.style.display = 'none';
        placeholder.style.display = 'flex';
        removeBtn.style.display = 'none';
        clearInput.value = 'false';
      }

      // Set ID Photo preview
      const idPhotoPreview = document.getElementById('edit_id_photo_preview');
      const idPhotoPreviewImg = document.getElementById('edit_id_photo_preview_img');
      const idPhotoFilename = idPhotoPreview.querySelector('.preview-filename');
      const idPhotoFilesize = idPhotoPreview.querySelector('.preview-filesize');
      const idPhotoRemoveBtn = idPhotoPreview.querySelector('.remove-btn');

      if (user.id_photo) {
        idPhotoPreview.style.display = 'block';
        idPhotoFilename.textContent = user.id_photo_name || 'ID Photo';
        idPhotoFilesize.textContent = 'Existing file';

        if (user.id_photo.match(/\.(jpg|jpeg|png|gif)$/i)) {
          idPhotoPreviewImg.src = user.id_photo;
          idPhotoPreviewImg.style.display = 'block';
        } else {
          idPhotoPreviewImg.style.display = 'none';
        }

        // Add click handler to remove button
        idPhotoRemoveBtn.onclick = function() {
          idPhotoPreview.style.display = 'none';
          document.getElementById('edit_id_photo').value = '';
          // Add clear flag for existing file
          const clearInput = document.createElement('input');
          clearInput.type = 'hidden';
          clearInput.name = 'id_photo-clear';
          clearInput.value = 'true';
          form.appendChild(clearInput);
        };
      } else {
        idPhotoPreview.style.display = 'none';
      }

      // Set COR Photo preview
      const corPhotoPreview = document.getElementById('edit_cor_photo_preview');
      const corPhotoPreviewImg = document.getElementById('edit_cor_photo_preview_img');
      const corPhotoFilename = corPhotoPreview.querySelector('.preview-filename');
      const corPhotoFilesize = corPhotoPreview.querySelector('.preview-filesize');
      const corPhotoRemoveBtn = corPhotoPreview.querySelector('.remove-btn');

      if (user.cor_photo) {
        corPhotoPreview.style.display = 'block';
        corPhotoFilename.textContent = user.cor_photo_name || 'COR Photo';
        corPhotoFilesize.textContent = 'Existing file';

        if (user.cor_photo.match(/\.(jpg|jpeg|png|gif)$/i)) {
          corPhotoPreviewImg.src = user.cor_photo;
          corPhotoPreviewImg.style.display = 'block';
        } else {
          corPhotoPreviewImg.style.display = 'none';
        }

        // Add click handler to remove button
        corPhotoRemoveBtn.onclick = function() {
          corPhotoPreview.style.display = 'none';
          document.getElementById('edit_cor_photo').value = '';
          // Add clear flag for existing file
          const clearInput = document.createElement('input');
          clearInput.type = 'hidden';
          clearInput.name = 'cor_photo-clear';
          clearInput.value = 'true';
          form.appendChild(clearInput);
        };
      } else {
        corPhotoPreview.style.display = 'none';
      }

      // Set permissions based on role and user's current permissions
      setupEditRolePermissions(user.user_type.toString(), user.permissions);

      // Clear any previous errors
      document.getElementById('editFormResponse').innerHTML = '';
      document.querySelectorAll('#userEditModal .form-input').forEach(el => el.classList.remove('error'));
      document.querySelectorAll('#userEditModal .error-message').forEach(el => el.remove());

      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    } else {
      showErrorToast('Failed to load user data for editing');
      console.error('Failed to fetch user data:', data.error);
    }
  })
  .catch(error => {
    showErrorToast('Failed to load user data. Please try again.');
    console.error('Error fetching user data:', error);
  });
}

function toggleEditUserTypeFields() {
  const studentFields = document.getElementById('editStudentFields');
  const osasFields = document.getElementById('editOsasFields');
  const personalInfoSection = document.getElementById('editPersonalInfoSection');
  const personalInfoTitle = document.getElementById('editPersonalInfoTitle');
  const personalInfoDescription = document.getElementById('editPersonalInfoDescription');
  const firstNameLabel = document.getElementById('editFirstNameLabel');
  const lastNameLabel = document.getElementById('editLastNameLabel');
  const userType = document.querySelector('#userEditModal input[name="user_type"]:checked');

  // Hide all role-specific fields first
  studentFields.style.display = 'none';
  osasFields.style.display = 'none';

  // Show personal info section for all roles
  personalInfoSection.style.display = 'block';

  if (userType) {
    if (userType.value === '14') { // Student
      studentFields.style.display = 'block';
      personalInfoTitle.textContent = 'Student Information';
      personalInfoDescription.textContent = 'Personal details of the student';
      firstNameLabel.textContent = 'First Name';
      lastNameLabel.textContent = 'Last Name';
    }
    else if (['1','2','3','4','5','6','7','8','9','10','11','12','13'].includes(userType.value)) {
      osasFields.style.display = 'block';
      personalInfoTitle.textContent = 'Staff Information';
      personalInfoDescription.textContent = 'Personal details of the staff member';
      firstNameLabel.textContent = 'First Name';
      lastNameLabel.textContent = 'Last Name';
    }
    else {
      personalInfoTitle.textContent = 'Personal Information';
      personalInfoDescription.textContent = 'Basic personal details';
      firstNameLabel.textContent = 'First Name';
      lastNameLabel.textContent = 'Last Name';
    }
  }
}

function setupEditRolePermissions(role, userPermissions = []) {
  const allPermissionCheckboxes = document.querySelectorAll('#userEditModal input[name="permissions"]');

  function shouldCheckPermission(permName, role) {
    // Super Admin (user type 1) gets ALL permissions
    if (role === '1') return true;

    // Student Development Services (10) gets ALL organization permissions
    if (role === '10' && (permName.includes('organization') || permName.includes('Organization'))) {
      return true;
    }

    // Students (#14) get NO announcement permissions at all
    if (role === '14' && (permName.includes('announcement') || permName.includes('Announcement'))) {
      return false;
    }

    // OJT Permission
    if (permName.includes('OJT') || permName.includes('ojt') ||
        permName.includes('On-the-Job') || permName.includes('on_the_job') ||
        permName.includes('ojtcompany') || permName.includes('ojtapplication') ||
        permName.includes('ojtreport') || permName.includes('ojtrequirement')) {

      if (role === '1' || role === '13') {
        return true;
      }
      else if (role === '14') {
        if (permName.includes('ojtcompany') || permName.includes('OJT company') ||
            permName.includes('OJT Company') || permName.toLowerCase().includes('company')) {
          return permName.toLowerCase().includes('view') && !permName.toLowerCase().includes('add') &&
                 !permName.toLowerCase().includes('change') && !permName.toLowerCase().includes('delete');
        }
        else {
          return true;
        }
      }
      // Other roles - no OJT permissions
      else {
        return false;
      }
    }

    // Organization permissions - for OSAS Staff (1) and Student Development Services (10)
    // This ensures user type 10 gets ALL organization permissions
    if (permName.includes('organization') || permName.includes('Organization')) {
      return role === '1' || role === '10';
    }

    // NSTP File permissions - only for OSAS Staff (1) and NSTP (2)
    if (permName.includes('NSTP File') || permName.includes('nstpfile')) {
      return role === '1' || role === '2';
    }

    // Common permissions for all non-superadmin roles (except students)
    if (role !== '14' && (permName.includes('announcement') || permName.includes('Announcement'))) {
      return true;
    }

    // Student Admission permissions for OSAS Staff (1), Admission (12), and Students (14)
    if (permName.includes('student admission') || permName.includes('Student Admission')) {
      return role === '1' || role === '12' || role === '14';
    }

    if (permName.includes('Complaint') || permName.includes('complaint')) {
      return true;
    }

    // Role-specific permissions
    switch(role) {
      case '2': // NSTP
        return permName.includes('view downloadable') ||
               permName.includes('add downloadable') ||
               permName.includes('NSTP') ||
               permName.includes('nstp');

      case '3': // Clinic
        return permName.includes('view downloadable') || permName.includes('add downloadable');

      case '4': // Alumni
        return permName.includes('view downloadable') || permName.includes('add downloadable');

      case '5': // Scholarship
        return permName.includes('view downloadable') ||
               permName.includes('add downloadable') ||
               permName.includes('scholarship');

      case '6': // Culture and Arts
        return permName.includes('view downloadable') || permName.includes('add downloadable');

      case '7': // Sports Development
        return permName.includes('view downloadable') || permName.includes('add downloadable');

      case '8': // Guidance Counseling
        return permName.includes('view downloadable') || permName.includes('add downloadable');

      case '9': // Student Welfare Services
        return permName.includes('view downloadable') || permName.includes('add downloadable');

      case '10': // Student Development Services
        // User type 10 gets all organization permissions (handled above) plus these:
        return permName.includes('view downloadable') ||
               permName.includes('add downloadable');

      case '11': // Misdeamenor
        return permName.includes('view downloadable') ||
               permName.includes('add downloadable') ||
               permName.includes('complaint');

      case '12': // Admission
        return permName.includes('view downloadable') ||
               permName.includes('add downloadable') ||
               permName.includes('student admission');

      case '13': // Job Placement
        return permName.includes('view downloadable') || permName.includes('add downloadable');

      case '14': // Student
        return permName.includes('view downloadable') ||
               permName.includes('view scholarship application') ||
               permName.includes('change scholarship application') ||
               permName.includes('delete scholarship application') ||
               permName.includes('student admission') ||
               permName.includes('NSTP Student') ||
               permName.includes('nstpstudentinfo');

      default:
        return false;
    }
  }

  // First set permissions based on role
  allPermissionCheckboxes.forEach(checkbox => {
    const permName = checkbox.nextElementSibling.textContent.trim();
    checkbox.checked = shouldCheckPermission(permName, role);
  });

  // Then override with user's current permissions if they exist
  if (userPermissions && userPermissions.length > 0) {
    allPermissionCheckboxes.forEach(checkbox => {
      if (userPermissions.includes(parseInt(checkbox.value))) {
        checkbox.checked = true;
      }
    });
  }

  if (role === '10') {
    allPermissionCheckboxes.forEach(checkbox => {
      const permName = checkbox.nextElementSibling.textContent.trim();
      if (permName.includes('organization') || permName.includes('Organization')) {
        checkbox.checked = true;
      }
    });
  }
}

function setupEditRoleChangeHandlers() {
  const roleRadios = document.querySelectorAll('#userEditModal input[name="user_type"]');
  const permissionsContainer = document.querySelector('#userEditModal .permissions-container');

  roleRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.checked) {
        toggleEditUserTypeFields();
        setupEditRolePermissions(this.value);
      }
    });
  });

  if (permissionsContainer) {
    permissionsContainer.addEventListener('change', function(e) {
      if (e.target && e.target.name === 'permissions') {
        // Allows custom permission sets beyond the defaults
      }
    });
  }
}

function closeEditModal() {
  const modal = document.getElementById('userEditModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';

  document.getElementById('editFormResponse').innerHTML = '';

  // Clear profile picture preview
  const preview = document.getElementById('editProfilePicturePreview');
  const placeholder = document.querySelector('#userEditModal .profile-picture-upload .placeholder');
  const removeBtn = document.querySelector('#userEditModal .btn-remove-image');
  const clearInput = document.getElementById('editProfilePictureClear');

  preview.src = '#';
  preview.style.display = 'none';
  placeholder.style.display = 'flex';
  removeBtn.style.display = 'none';
  clearInput.value = 'false';

  // Clear all error indicators
  document.querySelectorAll('#userEditModal .form-input').forEach(el => el.classList.remove('error'));
  document.querySelectorAll('#userEditModal .error-message').forEach(el => el.remove());
}

// Edit profile picture handling
document.getElementById('editProfilePictureInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  const preview = document.getElementById('editProfilePicturePreview');
  const placeholder = document.querySelector('#userEditModal .profile-picture-upload .placeholder');
  const removeBtn = document.querySelector('#userEditModal .btn-remove-image');
  const clearInput = document.getElementById('editProfilePictureClear');

  if (file) {
    if (!file.type.match('image.*')) {
      showEditError('Please select a valid image file (JPEG, PNG, etc.)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showEditError('Image size should be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      preview.src = e.target.result;
      preview.style.display = 'block';
      placeholder.style.display = 'none';
      removeBtn.style.display = 'block';
      clearInput.value = 'false';
    }
    reader.readAsDataURL(file);
  }
});

function removeEditProfilePicture() {
  const input = document.getElementById('editProfilePictureInput');
  const preview = document.getElementById('editProfilePicturePreview');
  const placeholder = document.querySelector('#userEditModal .profile-picture-upload .placeholder');
  const removeBtn = document.querySelector('#userEditModal .btn-remove-image');
  const clearInput = document.getElementById('editProfilePictureClear');

  input.value = '';
  preview.src = '#';
  preview.style.display = 'none';
  placeholder.style.display = 'flex';
  removeBtn.style.display = 'none';
  clearInput.value = 'true';
}

// Update the form submission handler
document.getElementById('userEditForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const form = this;
    const submitBtn = form.querySelector('button[type="submit"]');
    const formResponse = document.getElementById('editFormResponse');

    submitBtn.classList.add('is-loading');
    formResponse.innerHTML = '';

    // Clear previous errors
    document.querySelectorAll('#userEditModal .form-input').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('#userEditModal .error-message').forEach(el => el.remove());

    // Create FormData from the form
    const formData = new FormData(form);

    fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw err; });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showSuccessToast('User updated successfully!');
            formResponse.innerHTML = `
                <div class="response-message response-success">
                    User updated successfully! This window will close shortly...
                </div>
            `;
            setTimeout(() => {
                closeEditModal();
                window.location.reload();
            }, 1500);
        } else {
            console.log('Form validation errors:', data.errors);
            showFormErrors(form, data.errors, 'editFormResponse');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        if (error.errors) {
            console.log('Validation errors:', error.errors);
            showFormErrors(form, error.errors, 'editFormResponse');
        } else {
            formResponse.innerHTML = `
                <div class="response-message response-error">
                    ${error.message || 'An unexpected error occurred'}
                </div>
            `;
        }
    })
    .finally(() => {
        submitBtn.classList.remove('is-loading');
    });
});

// Initialize edit buttons
function initializeEditButtons() {
  const editButtons = document.querySelectorAll('.btn-edit');
  editButtons.forEach(button => {
    button.addEventListener('click', function() {
      const userId = this.closest('tr').querySelector('td:first-child').textContent;
      openEditModal(userId);
    });
  });
}

// DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
  initializeEditButtons();
  setupEditRoleChangeHandlers();
});

document.addEventListener('ajaxComplete', initializeEditButtons);


// --------------------------------------------- Archive User Functions ------------------------------------------------
function openArchiveModal(userId, username) {
    const modal = document.getElementById('userArchiveModal');
    document.getElementById('archiveUserId').value = userId;

    const description = modal.querySelector('.header-description');
    description.textContent = `Are you sure you want to archive user "${username}"?`;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeArchiveModal() {
    const modal = document.getElementById('userArchiveModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('archiveFormResponse').innerHTML = '';
}

// Handle archive form submission
document.getElementById('userArchiveForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    const userId = document.getElementById('archiveUserId').value;
    const submitBtn = form.querySelector('button[type="submit"]');
    const formResponse = document.getElementById('archiveFormResponse');

    submitBtn.classList.add('is-loading');
    formResponse.innerHTML = '';

    fetch('/archive-user/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: new FormData(form)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw {
                    userFriendly: true,
                    message: err.error || 'Failed to archive user'
                };
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showSuccessToast('User archived successfully!');
            formResponse.innerHTML = `
                <div class="response-message response-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    User archived successfully! This window will close shortly...
                </div>
            `;
            setTimeout(() => {
                closeArchiveModal();
                window.location.reload();
            }, 1500);
        } else {
            showErrorToast(data.error || 'Failed to archive user');
            showArchiveError(data.error || 'Failed to archive user');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        const errorMessage = error.userFriendly ?
            error.message :
            'An unexpected error occurred while processing your request.';
        showErrorToast(errorMessage);
        showArchiveError(errorMessage);
    })
    .finally(() => {
        submitBtn.classList.remove('is-loading');
    });
});

function showArchiveError(message) {
    const formResponse = document.getElementById('archiveFormResponse');
    formResponse.innerHTML = `
        <div class="response-message response-error">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5222d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            ${message}
        </div>
    `;
}

// ------------------------------------------ Search and Sorting Functions ---------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    initUserTable();
});

let fetchAndDisplayUsers;

function initUserTable() {
    const table = document.getElementById('users-table');
    const searchInput = document.getElementById('user-search');
    const unitSortSelect = document.getElementById('unit-sort');
    const verifiedSortSelect = document.getElementById('verified-sort');
    const statusSortSelect = document.getElementById('status-sort');
    const sortableHeaders = table.querySelectorAll('th[data-sort]');
    const tbody = table.querySelector('tbody');
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    // Create a no data row element if it doesn't exist
    let noDataRow = document.getElementById('no-data-row');
    if (!noDataRow) {
        noDataRow = document.createElement('tr');
        noDataRow.id = 'no-data-row';
        const noDataCell = document.createElement('td');
        noDataCell.colSpan = table.querySelectorAll('th').length;
        noDataCell.textContent = 'No users found matching your criteria';
        noDataCell.style.textAlign = 'center';
        noDataCell.style.padding = '20px';
        noDataCell.style.fontStyle = 'italic';
        noDataCell.style.color = '#888';
        noDataRow.appendChild(noDataCell);
        noDataRow.style.display = 'none';
        tbody.appendChild(noDataRow);
    }

    // Set default to show latest users first
    let currentSortColumn = 'date_joined';
    let currentSortDirection = 'desc';

    // Set initial sort indicators
    sortableHeaders.forEach(header => {
        const column = header.getAttribute('data-sort');
        const icon = header.querySelector('i');
        if (column === currentSortColumn) {
            icon.className = currentSortDirection === 'asc' ? 'bx bx-sort-up' : 'bx bx-sort-down';
        } else {
            icon.className = 'bx bx-sort';
        }
    });

    // Initialize sorting for headers
    sortableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.getAttribute('data-sort');

            // If clicking the same column, reverse the direction
            if (currentSortColumn === column) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortColumn = column;
                // Set default direction based on column type
                if (column === 'date_joined' || column === 'id') {
                    currentSortDirection = 'desc';
                } else {
                    currentSortDirection = 'asc';
                }
            }

            // Update sort indicators
            sortableHeaders.forEach(h => {
                const icon = h.querySelector('i');
                if (h === header) {
                    icon.className = currentSortDirection === 'asc' ? 'bx bx-sort-up' : 'bx bx-sort-down';
                } else {
                    icon.className = 'bx bx-sort';
                }
            });

            fetchAndDisplayUsers();
        });
    });

    // Initialize search and filter events
    searchInput.addEventListener('input', debounce(function() {
        fetchAndDisplayUsers();
    }, 300));

    unitSortSelect.addEventListener('change', function() {
        fetchAndDisplayUsers();
    });

    verifiedSortSelect.addEventListener('change', function() {
        fetchAndDisplayUsers();
    });

    statusSortSelect.addEventListener('change', function() {
        fetchAndDisplayUsers();
    });

    // Define the function that will be called
    fetchAndDisplayUsers = function() {
        const searchTerm = searchInput.value;
        const unitFilterValue = unitSortSelect.value;
        const verifiedFilterValue = verifiedSortSelect.value;
        const statusFilterValue = statusSortSelect.value;

        // Get current page from URL or default to 1
        const urlParams = new URLSearchParams(window.location.search);
        const currentPage = urlParams.get('user_page') || 1;

        console.log('Fetching users with params:', {
            search: searchTerm,
            unit: unitFilterValue,
            verified: verifiedFilterValue,
            status: statusFilterValue,
            sort: currentSortColumn,
            direction: currentSortDirection,
            page: currentPage
        });

        // Show loading indicator
        document.getElementById('loading-row').style.display = '';
        document.getElementById('no-data-row').style.display = 'none';
        document.getElementById('error-row').style.display = 'none';

        // Build query parameters - include ALL current URL parameters to maintain state
        const params = new URLSearchParams(window.location.search);
        params.set('get_filtered_users', '1');
        params.set('search', searchTerm);
        params.set('unit', unitFilterValue);
        params.set('verified', verifiedFilterValue);
        params.set('status', statusFilterValue);
        params.set('sort', currentSortColumn);
        params.set('direction', currentSortDirection);
        params.set('user_page', currentPage);

        // Make AJAX request
        fetch(`?${params.toString()}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrfToken
            }
        })
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Received data:', data);
            document.getElementById('loading-row').style.display = 'none';

            if (data.users && data.users.length > 0) {
                updateTableWithData(data.users);
                updatePaginationControls(data);
            } else {
                // Clear existing data rows
                const tbody = document.querySelector('#users-table tbody');
                const existingDataRows = tbody.querySelectorAll('tr[data-user-id]');
                existingDataRows.forEach(row => row.remove());

                // Show no data message
                document.getElementById('no-data-row').style.display = '';

                // Update pagination with empty state
                updatePaginationControls(data);
            }
        })
        .catch(error => {
            console.error('Error fetching user data:', error);
            document.getElementById('loading-row').style.display = 'none';
            document.getElementById('error-row').style.display = '';

            // Clear pagination on error
            const paginationContainer = document.getElementById('user-pagination-container');
            if (paginationContainer) {
                paginationContainer.innerHTML = '';
            }
        });
    }

    function updatePaginationControls(data) {
        const paginationContainer = document.getElementById('user-pagination-container');
        if (!paginationContainer) return;

        // Clear existing content
        paginationContainer.innerHTML = '';

        // Check if we have valid pagination data
        if (!data.pagination) {
            console.log('No pagination data found');
            return;
        }

        const pagination = data.pagination;
        const totalCount = pagination.count || 0;
        const currentPage = pagination.current_page || 1;
        const numPages = pagination.num_pages || 1;
        const hasPrevious = pagination.has_previous || false;
        const hasNext = pagination.has_next || false;
        const startIndex = pagination.start_index || 0;
        const endIndex = pagination.end_index || 0;

        console.log('Pagination data:', {
            totalCount,
            currentPage,
            numPages,
            hasPrevious,
            hasNext,
            startIndex,
            endIndex
        });

        // Create pagination info - ALWAYS show this
        const paginationInfo = document.createElement('div');
        paginationInfo.className = 'pagination-info';

        if (totalCount === 0) {
            paginationInfo.textContent = 'Showing 0 entries';
        } else {
            paginationInfo.textContent = `Showing ${startIndex} to ${endIndex} of ${totalCount} entries`;
        }

        // Create pagination controls container - ALWAYS create this when we have data
        if (totalCount > 0) {
            const paginationControls = document.createElement('div');
            paginationControls.className = 'pagination-controls';

            // Previous button
            if (hasPrevious) {
                const prevBtn = createPaginationButton('prev', currentPage - 1, '<i class="bx bx-chevron-left"></i>', 'Previous Page');
                paginationControls.appendChild(prevBtn);
            } else {
                const prevBtn = createDisabledPaginationButton('prev', '<i class="bx bx-chevron-left"></i>', 'Previous Page');
                paginationControls.appendChild(prevBtn);
            }

            // Page numbers - ALWAYS show when we have data
            const pageNumbers = document.createElement('div');
            pageNumbers.className = 'page-numbers';

            // Show page numbers (limit to 5 pages around current page)
            const startPage = Math.max(1, currentPage - 2);
            const endPage = Math.min(numPages, currentPage + 2);

            for (let i = startPage; i <= endPage; i++) {
                if (i === currentPage) {
                    const currentPageBtn = document.createElement('span');
                    currentPageBtn.className = 'pagination-btn current-page active';
                    currentPageBtn.textContent = i;
                    pageNumbers.appendChild(currentPageBtn);
                } else {
                    const pageBtn = createPaginationButton('page', i, i, `Page ${i}`);
                    pageNumbers.appendChild(pageBtn);
                }
            }

            paginationControls.appendChild(pageNumbers);

            // Next button
            if (hasNext) {
                const nextBtn = createPaginationButton('next', currentPage + 1, '<i class="bx bx-chevron-right"></i>', 'Next Page');
                paginationControls.appendChild(nextBtn);
            } else {
                const nextBtn = createDisabledPaginationButton('next', '<i class="bx bx-chevron-right"></i>', 'Next Page');
                paginationControls.appendChild(nextBtn);
            }

            paginationContainer.appendChild(paginationControls);
        }

        // Always add pagination info
        paginationContainer.appendChild(paginationInfo);
    }

    // Helper functions for creating pagination buttons
    function createPaginationButton(type, page, content, title) {
        const button = document.createElement('a');
        button.href = 'javascript:void(0);';
        button.className = `pagination-btn ${type}-page`;
        button.setAttribute('data-page', page);
        button.title = title;
        button.innerHTML = content;

        button.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            handlePageChange(page);
        });

        return button;
    }

    function createDisabledPaginationButton(type, content, title) {
        const button = document.createElement('span');
        button.className = `pagination-btn ${type}-page disabled`;
        button.title = title;
        button.innerHTML = content;
        return button;
    }

    function handlePageChange(page) {
        console.log('Changing to page:', page);
        // Update URL without reloading
        const url = new URL(window.location);
        url.searchParams.set('user_page', page);
        window.history.pushState({}, '', url);

        // Fetch data for the new page
        if (typeof fetchAndDisplayUsers === 'function') {
            fetchAndDisplayUsers();
        }
    }

    function updateTableWithData(users) {
        const tbody = document.querySelector('#users-table tbody');

        // Remove any existing data rows (keep loading, no-data, and error rows)
        const existingDataRows = tbody.querySelectorAll('tr[data-user-id]');
        existingDataRows.forEach(row => row.remove());

        // If no users, show no data message and hide any other rows
        if (!users || users.length === 0) {
            document.getElementById('no-data-row').style.display = '';
            document.getElementById('loading-row').style.display = 'none';
            document.getElementById('error-row').style.display = 'none';
            return;
        }

        // Hide no data and error rows since we have data
        document.getElementById('no-data-row').style.display = 'none';
        document.getElementById('error-row').style.display = 'none';
        document.getElementById('loading-row').style.display = 'none';

        // Add new rows
        users.forEach(user => {
            const row = document.createElement('tr');
            row.setAttribute('data-user-id', user.id);

            // ID
            const idCell = document.createElement('td');
            idCell.textContent = user.id;
            row.appendChild(idCell);

            // Name (combined first and last name)
            const nameCell = document.createElement('td');
            nameCell.textContent = user.display_name || `${user.first_name} ${user.last_name}`.trim() || user.username;
            row.appendChild(nameCell);

            // Username
            const usernameCell = document.createElement('td');
            usernameCell.textContent = user.username;
            row.appendChild(usernameCell);

            // Unit
            const unitCell = document.createElement('td');
            unitCell.textContent = user.user_type;
            row.appendChild(unitCell);

            // Verified
            const verifiedCell = document.createElement('td');
            const verifiedBadge = document.createElement('span');
            verifiedBadge.className = `status-badge ${user.is_verified ? 'verified' : 'unverified'}`;
            verifiedBadge.textContent = user.is_verified ? 'Verified' : 'Unverified';
            verifiedCell.appendChild(verifiedBadge);
            row.appendChild(verifiedCell);

            // Status
            const statusCell = document.createElement('td');
            const statusBadge = document.createElement('span');
            statusBadge.className = `status-badge ${user.is_active ? 'active' : 'inactive'}`;
            statusBadge.textContent = user.is_active ? 'Active' : 'Inactive';
            statusCell.appendChild(statusBadge);
            row.appendChild(statusCell);

            // Actions
            const actionsCell = document.createElement('td');
            actionsCell.className = 'actions';

            // Approve button
            if (user.can_approve) {
                const approveBtn = document.createElement('button');
                approveBtn.className = 'btn-approve btn-icon approve-user';
                approveBtn.title = 'Approve';
                approveBtn.dataset.userId = user.id;
                approveBtn.dataset.csrf = csrfToken;
                approveBtn.dataset.username = user.username;
                approveBtn.innerHTML = '<i class="bx bx-check"></i>';
                approveBtn.addEventListener('click', function() {
                    const row = this.closest('tr');
                    const name = row.cells[1].textContent;
                    const username = row.cells[2].textContent;
                    const userType = row.cells[3].textContent;
                    const isVerified = row.cells[4].querySelector('.status-badge').classList.contains('verified');
                    const userId = row.cells[0].textContent;

                    // Update modal with basic information
                    document.getElementById('approveUserName').textContent = name;
                    document.getElementById('approveUserUsername').textContent = username;
                    document.getElementById('approveUserUnit').textContent = userType;
                    document.getElementById('approveUserId').textContent = userId;

                    const statusBadge = document.getElementById('approveUserStatus');
                    statusBadge.textContent = isVerified ? 'Verified' : 'Unverified';
                    statusBadge.className = isVerified ? 'status-badge verified' : 'status-badge unverified';

                    // Show modal
                    document.getElementById('approveUserModal').classList.add('active');
                });
                actionsCell.appendChild(approveBtn);
            }

            // View button
            if (user.can_view) {
                const viewBtn = document.createElement('button');
                viewBtn.className = 'btn-view btn-icon view';
                viewBtn.title = 'View';
                viewBtn.dataset.userId = user.id;
                viewBtn.innerHTML = '<i class="ri-eye-fill"></i>';
                viewBtn.addEventListener('click', function() {
                    const userId = this.closest('tr').querySelector('td:first-child').textContent;
                    openViewModal(userId);
                });
                actionsCell.appendChild(viewBtn);
            }

            // Edit button
            if (user.can_edit) {
                const editBtn = document.createElement('button');
                editBtn.className = 'btn-edit btn-icon user-edit';
                editBtn.title = 'Edit';
                editBtn.dataset.userId = user.id;
                editBtn.innerHTML = '<i class="bx bx-edit"></i>';
                editBtn.addEventListener('click', function() {
                    const userId = this.closest('tr').querySelector('td:first-child').textContent;
                    openEditModal(userId);
                });
                actionsCell.appendChild(editBtn);
            }

            // Archive button
            if (user.can_delete) {
                const archiveBtn = document.createElement('button');
                archiveBtn.className = 'btn-icon archive';
                archiveBtn.title = 'Archive';
                archiveBtn.innerHTML = '<i class="bx bxs-archive"></i>';
                archiveBtn.addEventListener('click', function() {
                    const userId = this.closest('tr').querySelector('td:first-child').textContent;
                    const username = this.closest('tr').querySelector('td:nth-child(3)').textContent;
                    openArchiveModal(userId, username);
                });
                actionsCell.appendChild(archiveBtn);
            }

            row.appendChild(actionsCell);
            tbody.appendChild(row);
        });
    }

    // Initial load - FORCE the pagination to load on page refresh
    console.log('Initializing user table...');
    fetchAndDisplayUsers();
}

function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Handle browser back/forward buttons
window.addEventListener('popstate', function() {
    console.log('Popstate event triggered');
    if (typeof fetchAndDisplayUsers === 'function') {
        fetchAndDisplayUsers();
    }
});

// Also trigger on page load to ensure pagination shows
window.addEventListener('load', function() {
    console.log('Page fully loaded');
    // Small delay to ensure everything is initialized
    setTimeout(() => {
        if (typeof fetchAndDisplayUsers === 'function') {
            console.log('Triggering fetchAndDisplayUsers on page load');
            fetchAndDisplayUsers();
        }
    }, 100);
});