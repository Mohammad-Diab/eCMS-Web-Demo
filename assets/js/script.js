var secretaryService = 'SecretaryService.svc/JSON/';
var doctorService = 'doctorService.svc/JSON/';
var settingService = 'SettingService.svc/JSON/';
var FileStorageService = 'FileStorageService.svc/JSON/'
var itemInPage = 10;
var maxPatientNumberInPaperArchive = -1;
var maxFileSize = 52428800;

var PropertiesName = ['تاريخ آخر زيارة', 'اسم المريض', 'الدواء الموصوف'];

function requestToServer(url, type, data, onSuccess, hideFailureMessage, treatNoRecordAsSuccess) {
    hideFailureMessage = !!hideFailureMessage;
    treatNoRecordAsSuccess = !!treatNoRecordAsSuccess;
    if (type.toLowerCase() == 'get') {
        data = '';
    } else {
        data = data ? data : '';
    }

    $.ajax({
        url: serverUrl + url,
        method: type,
        contentType: 'application/json;charset=utf-8',
        accept: 'application/json',
        data: data,
        crossDomain: true,
        header: {
            'Content-Type': 'application/json'
        },
        beforeSend: function () {
            showLoadingPanal();
        },
        //contentType: 'application/json',
        error: function (result) {
            hideLoadingPanal();
            //if (!hideFailureMessage) {
            showMessage("خطأ غير معروف");
            //}
        },
        success: function (result) {
            if (result && (result.Code == 0 || (treatNoRecordAsSuccess && result.Code == 8))) {
                if (typeof onSuccess == 'function') {
                    onSuccess(result.Result)
                }
                hideLoadingPanal();
            } else {
                hideLoadingPanal();
                if (!hideFailureMessage) {
                    showMessage(result.Message);
                }
            }
        }
    });
}

function uploadFileToServer(url, formData, onSuccess) {
    if (!formData) {
        return;
    }

    $.ajax({
        url: serverUrl + url,
        method: 'post',
        async: true,
        processData: false,
        contentType: false,
        accept: 'application/json',
        data: formData,
        crossDomain: true,
        mimeType: "multipart/form-data",
        header: {
            contentType: false,
        },
        beforeSend: function () {
            showLoadingPanal();
        },
        error: function (result) {
            hideLoadingPanal();
            showMessage("خطأ غير معروف");
        },
        success: function (result) {
            result = JSON.parse(result);
            if (result && result.Code == 0) {
                if (typeof onSuccess == 'function') {
                    onSuccess(result.Result)
                }
                hideLoadingPanal();
            } else {
                hideLoadingPanal();
                showMessage(result.Message);
            }
        }
    });
}

function showMessage(message) {
    alert(message);
}

Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

Date.prototype.toCustomString = function () {
    var date = new Date(this.valueOf());
    var d = date.getDate();
    var m = date.getMonth() + 1;
    var y = date.getFullYear();
    return '' + y + '-' + (m <= 9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);
}

function stringToHtml(value) {
    return value.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

function BirthDateToAge(date) {
    var now = moment();
    var birthdate = moment(date);
    var diffDuration = moment.duration(now.diff(birthdate));
    var y = diffDuration.years();
    var m = diffDuration.months();
    var d = diffDuration.days();
    return '' + (y ? (toFriendlyCount(y, 'سنة واحدة', 'سنتان', 'سنوات', 'سنة') + ((m || d) ? ' و' : '')) : '') +
        (m ? (toFriendlyCount(m, 'شهر واحد', 'شهران', 'أشهر', 'شهر') + (d ? ' و' : '')) : '') +
        (d ? toFriendlyCount(d, 'يوم واحد', 'يومان', 'أيام', 'يوم') : '');
}

//loading panal
var loadingCount = 0;
var currentPage = 1;
var isSearchMode = false;
var searchObject;
var itemsList = [];
var selectedRow,
    selectedItem;
var noteTypes;

var visitKindIds;

function showLoadingPanal() {
    loadingCount++;
    $('#loadingPanal').show();
}

function hideLoadingPanal() {
    loadingCount--;
    if (loadingCount < 1) {
        $('#loadingPanal').hide();
    }
}

function showHamburgerMenu() {
    $('.aside-overlay').show();
    $('#sidebar').css('right', '0');
}

function hideHamburgerMenu() {
    $('#sidebar').css('right', '-320px');
    $('.aside-overlay').hide();
}

$(document).ready(function () {
    $(window).trigger('resize');
});

$(window).on('resize', function (e) {
    if ($(window).width() < 1141) {
        hideHamburgerMenu();
    } else {
        showHamburgerMenu()
    }
});

//patients list
function loadPatientPage(pageNumber, isSearch) {
    setSearchMode(isSearch);
    var countUrl = isSearch ? 'Patient/Search/Count' : 'Patient/Count';
    var pageUrl = isSearch ? 'Patient/Search' : 'Patient/GetPage';
    var data = isSearch ? searchObject : '';
    requestToServer(secretaryService + countUrl, 'POST', JSON.stringify(data), function (result) {
        var pages = Math.ceil(result / itemInPage);
        $('.pb').remove();
        if (pages > 1) {
            var html = '';
            for (var i = 1; i <= pages; i++) {
                html += '<li class="page-item pb' + (pageNumber == (i - 1) ? ' active' : '') + '">';
                html += '<a class="page-link" onclick="loadPatientPage(';
                html += (i - 1) + ', ' + isSearch;
                html += ')">';
                html += i;
                html += '</a></li>\n';
            }
            $('#paggingButtonsPlaceHolder').after(html);
            $('#paginationPanal').show();
        } else {
            $('#paginationPanal').hide();
        }
        $('#firstPage, #previousPage, #nextPage, #lastPage').prop('disabled', false).removeClass('disabled');
        if (pageNumber == 0) {
            $('#firstPage, #previousPage').prop('disabled', true).addClass('disabled');
        }
        if (pageNumber == pages - 1) {
            $('#nextPage, #lastPage').prop('disabled', true).addClass('disabled');
        }

        $('#nextPage a').off('click').on('click', function () {
            loadPatientPage(pageNumber + 1, isSearch);
        });

        $('#lastPage a').off('click').on('click', function () {
            loadPatientPage(pages - 1, isSearch);
        });

        $('#previousPage a').off('click').on('click', function () {
            loadPatientPage(pageNumber - 1, isSearch);
        });

        $('#firstPage a').off('click').on('click', function () {
            loadPatientPage(0, isSearch);
        });

        var data;
        if (isSearch) {
            data = searchObject;
            searchObject["pageId"] = pageNumber;
            searchObject["recordsCount"] = itemInPage;
        } else {
            data = {
                "pageId": pageNumber,
                "recordsCount": itemInPage
            };
        }

        requestToServer(secretaryService + pageUrl, 'POST', JSON.stringify(data), function (result) {
            currentPage = pageNumber;
            if (result.length > 0) {
                for (var i = 0; i < result.length; i++) {
                    result[i].Age = BirthDateToAge(result[i].BirthDate);
                    result[i].FullName = result[i].FirstName + ' ' + result[i].LastName;
                    result[i].Gender = result[i].GenderId == '2' ? 'أنثى' : 'ذكر';
                }
                $("#patients-list").jsGrid("destroy");
                selectedRow = undefined;
                selectedItem = undefined;
                itemsList = result;
                initialGrid('patients-list');
            } else {
                showMessage("لا يوجد نتائج");
            }
        });

    });
}

//add patient
function showPatientHasLogModal() {
    $('#patientHasLog').modal('show');
}

function showAddPatientModal(hasLog) {
    resetAddModalValidations();
    maxPatientNumberInPaperArchive = -1;
    $('#patientHasLog').modal('hide');
    emptyAddModal();
    $('#addPatientModalTitle').text('إضافة سجل مريض');
    $('#addModalSaveBtn').off('click').on('click', addNewPatient);
    if (hasLog) {
        $('#addPatientNumber').prop('disabled', false);
        var data = {
            key: 'MaxPatientNumberInPaperArchive'
        };
        // requestToServer(settingService + 'Setting/Get', 'POST', JSON.stringify(data), function (result) {
        //     if (result && result.Value) {
        maxPatientNumberInPaperArchive = parseInt(10000);
        $('#addPatient').modal('show');
        //     }
        // });
    } else {
        $('#addPatientNumber').prop('disabled', true);
        //$('#addModalAttachmentBtn').hide();
        // requestToServer(secretaryService + 'Patient/NextNumber', 'POST', '', function (result) {
        requestToServer(secretaryService + 'Patient/NextNumber', 'POST', '', function (result) {
            $('#addPatientNumber').val(result);
            $('#addPatient').modal('show');
        });
        // });
    }
}

function addNewPatient() {
    var patientObject = readAddEditModal("patient", true);
    if (patientObject) {
        $('#addPatient').modal('hide');
        requestToServer(secretaryService + 'Patient/Add', 'POST', JSON.stringify(patientObject), function (result) {
            loadPatientPage(currentPage, isSearchMode);
            showMessage('تمت الاضافة بنجاح');
        });
    }
}

//edit patient
function showEditPatientModal() {
    if (!selectedItem) {
        showMessage('الرجاء قم باختيار عنصر لتعديه');
        return;
    }
    var data = {
        "id": selectedItem.Id
    };
    requestToServer(secretaryService + 'Patient/Get', 'POST', JSON.stringify(data), function (result) {
        fillAddModal(result);
        $('#addPatientModalTitle').text('تعديل سجل مريض');
        $('#addModalSaveBtn').off('click').on('click', function () { editAPatient(selectedItem); });
        $('#addPatientNumber').prop('disabled', true);
        $('#addPatient').modal('show');
    });
}

function editAPatient(selectedItem) {
    var patientObject = readAddEditModal("p", false);
    if (patientObject) {
        patientObject.p.Id = selectedItem.Id;
        $('#addPatient').modal('hide');
        requestToServer(secretaryService + 'Patient/Edit', 'POST', JSON.stringify(patientObject), function (result) {
            loadPatientPage(currentPage, isSearchMode);
            showMessage('تمت التعديل بنجاح');
        });
    }
}

//manage attachment
function showManageAttachmentModal() {
    if (!selectedItem) {
        showMessage('الرجاء قم باختيار مريض أولا');
        return;
    }
    loadPatientAttachments();
    $('#attachmentManagment').modal('show');
}

function loadPatientAttachments() {
    var data = {
        "relatedTableId": 1,
        "relatedRecordId": selectedItem.Id
    };
    $('#attachmentsList').empty();
    $('#noAttachmentMessage').remove();
    requestToServer(FileStorageService + 'Attachments/GetAll', 'POST', JSON.stringify(data), function (result) {
        loadAllAttachments(result);
        $('#attachmentManagment').modal('show');
    }, false, true);
}

function loadAllAttachments(attachmentslist) {
    $('#attachmentsList').empty();
    $('#noAttachmentMessage').remove();
    var html = '';
    if (!attachmentslist || attachmentslist.length < 1) {
        html = '<h3 id="noAttachmentMessage" class="text-secondary d-block mx-auto my-3" style="margin: auto;">لا يوجد مرفقات</h3>';
        $('#attachmentsList').before(html);
    } else {
        for (var i = 0; i < attachmentslist.length; ++i) {
            html += createAttachmentItem(attachmentslist[i]);
        }
        $('#attachmentsList').append(html);
    }
}

function createAttachmentItem(item) {
    var result = '';
    result += '<div class="card" style="width: 18rem;">';
    result += '<div class="text-center card-header">';
    result += '<h5 class="card-title">';
    result += stringToHtml(item.FileName);
    result += '</h5>';
    result += '<button class="btn btn-primary ml-2" onclick="viewAttachment(' + item.Id + ')">عرض المرفق</button>';
    result += '<button class="btn btn-danger" onclick="confirmDeleteAttachment(' + item.Id + ')">حذف المرفق</button>';
    result += '</div>';
    if (item.Properties.length > 0) {
        result += '<ul class="card-body list-group list-group-flush p-0">';

        for (var i = 0; i < item.Properties.length; ++i) {
            result += '<li class="list-group-item py-2">';
            result += '<h6>' + PropertiesName[item.Properties[i].PropertyId] + '</h6>';
            result += '<div class="m-0">' + stringToHtml(item.Properties[i].PropertyValue) + '</div>';
            result += '<button class="btn btn-danger" style="position: absolute; top: 15px; left: 15px;" title="حذف خاصية" onclick="confirmDeleteAttachmentProperty(' + item.Id + ', ' + item.Properties[i].PropertyId + ')">';
            result += '<i class="fa fa-trash"></i>';
            result += '</button>';
            result += '</li>';
        }

        result += '</ul>';
    }

    result += '<div class="text-center py-2 card-footer">';
    result += '<button href="#" class="btn btn-primary" onclick="showAddAttachmentPropertyModal(' + item.Id + ')">';
    result += ' <i class="fas fa-plus ml-1"></i>';
    result += ' <span>اضافة خاصية</span>';
    result += '</button>';
    result += '</div>';
    result += '</div>\n';
    return result;
}

function showAddAtachmentModal() {
    $('#attachmentFile').val('').trigger('change');
    $('#attachmentFile').removeClass('is-invalid');
    $('#attachmentFile ~ .invalid-tooltip').hide();
    $('#attachmentAdd').modal('show');
}

function addPatientAttachment() {
    if (!selectedItem) {
        showMessage('الرجاء قم باختيار مريض أولا');
        return;
    }

    var selectedFile = $('#attachmentFile')[0].files[0];
    var validFile = !!selectedFile,
        errorMessage = 'يرجى اختيار ملف';
    if (selectedFile) {
        var fileName = selectedFile.name;
        validFile = selectedFile.size <= maxFileSize;
        errorMessage = 'حجم الملف الأقصي هو 50 ميغابايت';
    }
    if (validFile) {
        $('#attachmentAdd').modal('hide');
        var requestUrl = FileStorageService + 'Attachment/File/Upload';
        requestUrl += '?fileName=' + encodeURI(fileName);
        requestUrl += '&relatedTableId=1';
        requestUrl += '&relatedRecordId=' + selectedItem.Id;
        var formData = new FormData();
        formData.append('file', selectedFile);
        uploadFileToServer(requestUrl, formData, function (result) {
            var data = {
                "attachment": {
                    "FileName": fileName,
                    "RelatedRecordId": selectedItem.Id,
                    "RelatedTableId": 1,
                    "Properties": []
                }
            }
            requestToServer(FileStorageService + 'Attachment/Add', 'POST', JSON.stringify(data), function (result) {
                loadPatientAttachments();
                showMessage('تم رفع المرفق بنجاح');
            });
        });
    } else {
        $('#attachmentFile').addClass('is-invalid');
        $('#attachmentFile ~ .invalid-tooltip').text(errorMessage).show();
    }
}

function fileInputChange() {
    $('#attachmentFileName').text($('#attachmentFile')[0].files[0] ? $('#attachmentFile')[0].files[0].name : 'لم يتم اختيار ملف');
    $('#attachmentFile').removeClass('is-invalid');
    $('#attachmentFile ~ .invalid-tooltip').hide();
}

function viewAttachment(attachmentId, patientId) {
    if (attachmentId) {
        var data = {
            PatientId: patientId ? patientId : (selectedItem ? selectedItem.Id : 0),
            FileName: attachmentId
        };
        queryToServer('GetPatientPaperVisitAttachment', data, function (result) {
            $('#attachmentViewerImage').attr('src', result);
            $('#viewImage').modal('show');
        });
    }
}

function confirmDeleteAttachment(attachmentId) {
    showConfirmDialog('حذف مرفق', 'هل تريد بالتأكيد حذف هذا المرفق؟', false, function () { deleteAttachment(attachmentId); });
}

function deleteAttachment(attachmentId) {
    var data = {
        "attachmentId": attachmentId
    }
    $('#confirmDialog').modal('hide');
    requestToServer(secretaryService + 'Attachment/Delete', 'POST', JSON.stringify(data), function (result) {
        loadPatientAttachments();
        showMessage('تمت العملية بنجاح');
    });
}

function showAddAttachmentPropertyModal(attachmentId) {
    $('#attachmentType, #attachmentProperty').empty();
    $('#attachmentPropertyDiv, #attachmentPropertyValueDiv').hide();
    $('#attachmentAddProperty').modal('show');
    requestToServer(FileStorageService + 'Attachment/Categories/Get', 'POST', '', function (result) {
        var html = '<option value="">اختر نوع المرفق</option>\n';
        for (var i = 0; i < result.length; i++) {
            html += '<option value="' + result[i].Id + '">' + stringToHtml(result[i].DescriptionAr) + '</option>\n';
        }
        $('#attachmentType').append(html).attr('data-attachmentId', attachmentId);
    });
}

function loadAttachmentProperty() {
    var categoryId = $('#attachmentType').val();
    $('#attachmentPropertyValueDiv').hide();
    if (categoryId) {
        $('#attachmentProperty').empty();
        $('#attachmentPropertyDiv').show();
        var data = {
            "categoryId": categoryId
        }
        requestToServer(FileStorageService + 'Attachment/Category/Properties/Get', 'POST', JSON.stringify(data), function (result) {
            var html = '<option value="">اختر الخاصية</option>\n';
            for (var i = 0; i < result.length; i++) {
                html += '<option data-BasicTypeId="' + result[i].BasicTypeId + '" value="' + result[i].Id + '">' + stringToHtml(result[i].DescriptionAr) + '</option>\n';
            }
            $('#attachmentProperty').append(html);
        });
    } else {
        showMessage('الرجاء اختار نوع مرفق أولا.');
    }
}

function createAttachmentPropertyValueInput() {
    var $option = $('#attachmentProperty option:selected');
    var basicTypeId = parseInt($option.attr('data-BasicTypeId'));
    var placeHolder = $option.text();
    $('#attachmentPropertyValueDiv').empty().hide();
    if ($option.val() === undefined || $option.val() === '') {
        return;
    }
    var html = '';
    html += '<label for="attachmentPropertyValue">' + stringToHtml(placeHolder) + '</label>';
    html += '<input id="attachmentPropertyValue" type="text" class="form-control" placeholder="' + stringToHtml(placeHolder) + '" oninput="resetValidationError(\'attachmentPropertyValue\')">';
    html += '<div class="invalid-tooltip">';
    html += 'قيمة غير صالحة';
    html += '</div>';
    $('#attachmentPropertyValueDiv').append(html).show();
    if (basicTypeId == 1) { // date
        $('#attachmentPropertyValue').val(moment().format('YYYY-MM-DD'));
    }
}

function addAttachmentProperty() {
    var attachmentId = $('#attachmentType').attr('data-attachmentId');
    var categoryId = $('#attachmentType').val();
    var propertyId = $('#attachmentProperty').val();
    var propertyValue = $('#attachmentPropertyValue').val();
    var isValidValue = validateItem(propertyValue, 'text', 2, 255, false, true, false, 'attachmentPropertyValue');
    if (!categoryId || !propertyId || !isValidValue) {
        return;
    }
    var data = {
        "attachmentId": attachmentId,
        "CategoryId": categoryId,
        "PropertyId": propertyId,
        "PropertyType": 0,
        "PropertyValue": propertyValue
    };
    $('#attachmentAddProperty').modal('hide');
    requestToServer(FileStorageService + 'JSON/Attachment/Property/Add', 'POST', JSON.stringify(data), function (result) {
        loadPatientAttachments();
        showMessage('تمت العملية بنجاح');
    });
}

function confirmDeleteAttachmentProperty(attachmentId, propertyId) {
    showConfirmDialog('حذف خاصية', 'هل تريد بالتأكيد حذف هذه الخاصية؟', false, function () { deleteAttachmentProperty(attachmentId, propertyId); });
}

function deleteAttachmentProperty(attachmentId, propertyId) {
    var data = {
        "attachmentId": attachmentId,
        "propertyId": propertyId
    }
    $('#confirmDialog').modal('hide');
    requestToServer(secretaryService + 'Attachment/DeleteProperty', 'POST', JSON.stringify(data), function (result) {
        loadPatientAttachments();
        showMessage('تمت العملية بنجاح');
    });
}

//delete patient
function showDeletePatientModal() {
    if (!selectedItem) {
        showMessage('الرجاء قم باختيار عنصر لحذفه');
        return;
    }
    $('#deletePatientHeader').text('هل تريد بالتأكيد حذف سجل المريض ؟');
    $('#deleteModalDeleteBtn').off('click').on('click', function () { deleteAPatient(selectedItem.Id); });
    $('#addPatientNumber').prop('disabled', true);
    $('#deletePatient').modal('show');
}

function deleteAPatient(id) {
    if (id || id === 0) {
        $('#deletePatient').modal('hide');
        var date = {
            "id": id
        };
        requestToServer(secretaryService + 'Patient/Remove', 'POST', JSON.stringify(date), function (result) {
            loadPatientPage(currentPage, isSearchMode);
            showMessage('تمت الحذف بنجاح');
        });
    }
}


function readAddEditModal(objectName, isAdd) {
    resetAddModalValidations();
    var result;

    var number = $('#addPatientNumber').val();
    var firstName = $('#addFirstName').val();
    var lastName = $('#addLastName').val();

    var year = $('#addYear').val();
    var month = $('#addMonth').val();
    var day = $('#addDay').val();

    var gender = $('#addGender').val();

    var work = $('#addWork').val();
    var address = $('#addAddress').val();
    var phone = $('#addPhone').val();
    var mobile = $('#addMobile').val();
    var note = $('#addNote').val();
    var isValidNumber = validateItem(number, 'number', 0, ((isAdd && maxPatientNumberInPaperArchive > -1) ? maxPatientNumberInPaperArchive : 2147483648), false, false, false, 'addPatientNumber');
    var isValidFirstName = validateItem(firstName, 'text', 2, 100, false, true, false, 'addFirstName');
    var isValidLastName = validateItem(lastName, 'text', 2, 100, false, true, false, 'addLastName');
    var isValidYear = validateItem(year, 'number', 0, 100, false, false, false, '');
    var isValidMonth = validateItem(month, 'number', 0, 11, false, false, false, '');
    var isValidDay = validateItem(day, 'number', 0, 30, false, false, false, '');
    var isValidAge = true;
    // to-do check is valid date
    if (!isValidYear || !isValidMonth || !isValidDay || (year + month + day) == 0) {
        $('#addYear, #addMonth, #addDay').addClass('is-invalid');
        $('#addAgemessage').show();
        isValidAge = false;
    }

    if (gender < 1 || gender > 2) {
        $('#addGender + .invalid-tooltip').show();
    }

    var isValidWork = validateItem(work, 'text', 0, 100, true, true, false, 'addWork');
    var isValidAddress = validateItem(address, 'text', 0, 100, true, true, false, 'addAddress');
    var isValidPhone = validateItem(phone, 'text', 0, 100, true, true, true, 'addPhone');
    var isValidMobile = validateItem(mobile, 'text', 0, 100, true, true, true, 'addMobile');
    var isValidNote = validateItem(note, 'text', 0, 100, true, true, false, 'addNote');

    if (isValidNumber && isValidFirstName && isValidLastName && isValidAge && isValidWork && isValidAddress && isValidPhone && isValidMobile && isValidNote) {
        //var BirthDate = '' + year + '-' + (month <= 9 ? '0' + month : month) + '-' + (day <= 9 ? '0' + day : day);
        var birthDate = moment().subtract(year, 'years').subtract(month, 'months').subtract(day, 'days');
        var BirthDate = birthDate.format('YYYY-MM-DD');
        //var BirthDate = new Date();
        //BirthDate.addDays(-(year * 365 + month * 30 + day));
        var patientObject = {
            "Id": 0,
            "Number": number,
            "FirstName": firstName,
            "LastName": lastName,
            "BirthDate": BirthDate,
            "Phone": phone,
            "Mobile": mobile,
            "Address": address,
            "Job": work,
            "Note": note,
            "IsDeleted": true,
            "GenderId": gender
        }

        result = {};
        result[objectName] = patientObject;
    }
    return result;
}

function resetAddModalValidations() {
    $('#addPatientNumber + .invalid-tooltip').hide();
    $('#addFirstName + .invalid-tooltip').hide();
    $('#addLastName + .invalid-tooltip').hide();
    $('#addAgemessage').hide();
    $('#addGender + .invalid-tooltip').hide();
    $('#addWork + .invalid-tooltip').hide();
    $('#addAddress + .invalid-tooltip').hide();
    $('#addPhone + .invalid-tooltip').hide();
    $('#addMobile + .invalid-tooltip').hide();
    $('#addNote + .invalid-tooltip').hide();
    $('#addPatientNumber, #addFirstName, #addLastName, #addAgemessage, #addGender, #addWork, #addPhone, #addMobile, #addNote, #addAddress, #addYear, #addMonth, #addDay').removeClass('is-invalid');
}

function validateItem(value, type, min, max, allowEmpty, allowSpecialChars, isPhoneNumber, itemId) {
    var message = '',
        returnedValue = true;
    switch (type) {
        case 'bool':
            break;
        case 'number':
            var num = parseInt(value);
            if (value === '') {
                message = 'هذا الحقل مطلوب';
                returnedValue = false;
            } else if (isNaN(num)) {
                message = 'رقم غير صالح';
                returnedValue = false;
            } else if (num < min || num > max) {
                message = 'الرجاء ادخال قيمة بين "' + min + '" و "' + max + '"';
                returnedValue = false;
            }
            break;
        case 'text':
            if (typeof value == 'number') {
                value += '';
            }
            if (typeof value != 'string') {
                message = 'قيمة غير صالحة';
                returnedValue = false;
            } else if (!allowEmpty && !value) {
                message = 'هذا الحقل مطلوب';
                returnedValue = false;
            } else if (allowEmpty && !value) {
                returnedValue = true;
            } else if (value.length < min || value.length > max) {
                message = 'عدد المحارف المسوح هو بين "' + min + '" و "' + max + '"';
                returnedValue = false;
            } else if (isPhoneNumber) {
                if (!(allowEmpty && value === '')) {
                    returnedValue = !!value.match(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/);
                }
                if (!returnedValue) {
                    message = 'رقم هاتف غير صالح';
                }
            } else if (!allowSpecialChars) {
                returnedValue = true; // to-do later;
            }
            break;
    }
    if (!returnedValue && itemId) {
        $('#' + itemId).addClass('is-invalid');
        $('#' + itemId + ' + .invalid-tooltip').text(message).show();
    }
    return returnedValue;
}

function resetAddAgeValidationError() {
    $('#addYear, #addMonth, #addDay').removeClass('is-invalid');
    $('#addAgemessage').hide();
}

function resetValidationError(id) {
    $('#' + id).removeClass('is-invalid');
    $('#' + id + ' + .invalid-tooltip').hide();
}


//search section
function searchModalOpen() {
    emptySearchModal();
    $('#searchPatient').modal('show');
}

function emptySearchModal() {
    $('#searchNumber').val('');
    $('#searchFirstName').val('');
    $('#searchLastName').val('');
    $('#searchPhone').val('');
    $('#searchMobile').val('');
}

function searchModalSearch() {
    var number = $('#searchNumber').val();
    number = parseInt(number);
    var firestName = $('#searchFirstName').val();
    var lastName = $('#searchLastName').val();
    var phone = $('#searchPhone').val();
    var mobile = $('#searchMobile').val();
    if (number || firestName || lastName || phone || mobile) {
        var data = {
            "filterByNumber": !!number,
            "number": number ? number : 0,
            "filterByFirstName": !!firestName,
            "firstName": firestName,
            "filterByLastName": !!lastName,
            "lastName": lastName,
            "filterByMobile": !!mobile,
            "mobile": mobile,
            "filterByPhone": !!phone,
            "phone": phone
        }
        searchObject = data;
        loadPatientPage(0, true);
        $('#searchPatient').modal('hide');
    } else {
        showMessage('يرجى تحديد قيمة واحدة على الأقل');
    }
}

function setSearchMode(on) {
    isSearchMode = on;
    if (on) {
        $('#addButton, #searchButton').hide();
        $(' #clearFilterButton').show();
    } else {
        $('#addButton, #searchButton').show();
        $(' #clearFilterButton').hide();
    }
}

// end of search section

//add visit log
function showAddVisitLogModal(isEdit) {
    if (!selectedItem) {
        showMessage(isEdit ? 'الرجاء اختيار مريض لتعديل سجل زيارته' : 'الرجاء قم باختيار مريض لاضافة سجل زيارة له');
        return;
    } else if (false && !isEdit && selectedItem.Id <= 20000) {
        requestToServer(secretaryService + 'Visit/CheckHasAttachment', 'POST', '', function (result) {
            if (result) {
                continueShowAddVisitLogModal(false);
            } else {
                showMessage('لا يملك المريض الحالي اضبارة يرضي اضافتها من المرفقات');
            }
        });
    } else {
        continueShowAddVisitLogModal(isEdit);
    }
}

function continueShowAddVisitLogModal(isEdit) {
    fillDoctorList('logDrName');
    fillVisitKindList(fillVisitKindSelect)
    fillLogPatientModal(selectedItem);
    $('#logPatientModalHeader').text(isEdit ? 'تعديل سجل زيارة' : 'إضافة سجل زيارة مريض');
    if (!isEdit) {
        $('#logNote').val('');
    }
    $('#logPatientSaveBtn').off('click').on('click', function () { addNewVisitLog(selectedItem, isEdit); });
    $('#logPatient').modal('show');
}

function fillVisitKindSelect(result) {
    var html = '';
    for (var i = 0; i < result.length; i++) {
        html += '<option value="' + result[i].Id + '">' + stringToHtml(result[i].DescriptionAr) + '</option>\n';
    }
    $('#logVisitReason').empty().append(html);
    if (selectedItem.VisitKindId) {
        $('#logVisitReason').val(selectedItem.VisitKindId);
        $('#logVisitTime').datetimepicker('date', moment(selectedItem.ArrivalTime, 'HH:mm'));
        $('#logNote').val(selectedItem.Note);
    } else {
        $('#logVisitTime').datetimepicker('date', moment(moment(), 'HH:mm'));
    }
}

function fillDoctorList(id, addEmpty) {
    requestToServer(secretaryService + 'Doctor/GetAll', 'POST', '', function (result) {
        var html = '';
        if (addEmpty) {
            html += '<option value="">الكل</option>\n';
        }
        for (var i = 0; i < result.length; i++) {
            html += '<option value="' + result[i].Id + '">' + stringToHtml(result[i].FullName) + '</option>\n';
        }
        $('#' + id).empty().append(html);
        $('#' + id).trigger('change');
    });
}

function fillVisitKindList(callBack) {
    requestToServer(secretaryService + 'VisitKind/GetAll', 'POST', '', function (result) {
        callBack(result);
    });
}

function fillLogPatientModal(item) {
    $('#logNumber').val(item.Number);
    $('#logName').val(item.FirstName + ' ' + item.LastName);
    $('#logLastVisit').val(item.LastVisitDate ? item.LastVisitDate : 'لا يوجد');
    $('#logVisitTime').datetimepicker('clear');
}

function addNewVisitLog(item, isEdit) {
    var visiObject = readAddVisitModal('v', isEdit ? item.PatientId : item.Id, isEdit ? item.Id : undefined);
    if (visiObject) {
        $('#logPatient').modal('hide');
        var visitUrl = isEdit ? 'Patient/Visit/Edit' : 'Patient/Visit/Add';
        requestToServer(secretaryService + visitUrl, 'POST', JSON.stringify(visiObject), function (result) {
            if (isEdit) {
                loadWaitingRoomPatients()
            } else {
                //loadPatientPage(currentPage, isSearchMode);
            }
            showMessage('تمت العملية بنجاح');
        });
    }
}

function readAddVisitModal(objectName, patientId, visitId) {
    resetAddVisitModalValidations();
    var result;

    var arrivalTime = $('#logVisitTime').datetimepicker('viewDate').format('YYYY-MM-DD HH:mm');
    var visitKindId = $('#logVisitReason').val();
    var note = $('#logNote').val();
    var doctorId = $('#logDrName').val();
    //var createdById =$('#logName').val();
    var isValidNote = validateItem(note, 'text', 0, 100, true, true, false, 'logNote');

    if (arrivalTime && visitKindId && isValidNote && doctorId) {
        var visitObject = {
            "ArrivalTime": arrivalTime,
            "VisitKindId": visitKindId,
            "Note": note,
            "PatientId": patientId,
            "DoctorId": doctorId,
            "CreatedById": 1,
        }
        if (visitId) {
            visitObject['Id'] = visitId;
        }
        result = {};
        result[objectName] = visitObject;
    }
    return result;
}

function resetAddVisitModalValidations() {
    resetValidationError('logNote');
}

function fillAddModal(item) {
    resetAddModalValidations();
    $('#addPatientNumber').val(item.Number);
    $('#addFirstName').val(item.FirstName);
    $('#addLastName').val(item.LastName);

    $('#addGender').val(item.GenderId);
    var age = moment.duration(moment().diff(moment(item.BirthDate, 'YYYY-MM-DD')));

    $('#addYear').val(age.years());
    $('#addMonth').val(age.months());
    $('#addDay').val(age.days());

    $('#addWork').val(item.Job);
    $('#addAddress').val(item.Address);
    $('#addPhone').val(item.Phone);
    $('#addMobile').val(item.Mobile);
    $('#addNote').val(item.Note);
}

function emptyAddModal() {
    $('#addPatientNumber').val('');
    $('#addFirstName').val('');
    $('#addLastName').val('');

    $('#addYear').val('');
    $('#addMonth').val('');
    $('#addDay').val('');

    $('#addWork').val('');
    $('#addAddress').val('');
    $('#addPhone').val('');
    $('#addMobile').val('');
    $('#addNote').val('');
}

function initialGrid(id) {
    $('#' + id).jsGrid({
        width: "100%",
        height: "auto",
        filtering: false,
        inserting: false,
        editing: false,
        sorting: false,
        selecting: true,
        //align: "right",

        paging: false,
        /*pageSize: 2,
        pagerFormat: "{first} {prev} {pages} {next} {last}        {pageIndex} من {pageCount}",
        pagePrevText: "<",
        pageNextText: ">",
        pageFirstText: "<<",
        pageLastText: ">>",
        pageNavigatorNextText: "...",
        pageNavigatorPrevText: "...",*/
        loadIndication: true,
        loadIndicationDelay: 500,
        loadMessage: "يرجى الانتظار...",
        loadShading: true,

        data: itemsList,

        rowClick: function (args) {
            if (selectedRow) {
                selectedRow.children('.jsgrid-cell').css('background-color', '');
                selectedRow.children('.jsgrid-cell').css('color', '');
            }
            selectedItem = args.item;
            var $row = this.rowByItem(args.item);
            $row.children('.jsgrid-cell').css('background-color', '#007bff');
            $row.children('.jsgrid-cell').css('color', 'white');
            selectedRow = $row;
        },

        fields: [
            { name: "Id", title: "المعرف", type: "number", width: 0, visible: false },
            { name: "FirstName", title: "الاسم", type: "text", width: 0, visible: false },
            { name: "LastName", title: "الاسم", type: "text", width: 0, visible: false },
            { name: "Number", title: "الرقم", type: "number", width: 75, validate: "required", headerTemplate: headerTemplate, itemTemplate: itemTemplate },
            { name: "FullName", title: "الاسم", type: "text", width: 150, validate: "required", headerTemplate: headerTemplate, itemTemplate: itemTemplate },
            { name: "Gender", title: "الجنس", type: "text", width: 75, headerTemplate: headerTemplate, itemTemplate: itemTemplate },
            { name: "Age", title: "العمر", type: "text", width: 75, headerTemplate: headerTemplate, itemTemplate: itemTemplate },
            { name: "Phone", title: "الهاتف", type: "text", width: 75, sorting: false, headerTemplate: headerTemplate, itemTemplate: itemTemplate },
            { name: "Mobile", title: "الجوال", type: "text", width: 75, sorting: false, headerTemplate: headerTemplate, itemTemplate: itemTemplate },
            { name: "Address", title: "العنوان", type: "text", width: 150, sorting: false, headerTemplate: headerTemplate, itemTemplate: itemTemplate },
            { name: "Job", title: "العمل", type: "text", width: 100, headerTemplate: headerTemplate, itemTemplate: itemTemplate },
            { name: "Note", title: "ملاحظات", type: "text", width: 200, sorting: false, headerTemplate: headerTemplate, itemTemplate: itemTemplate },
            //{ type: "control" }
        ]
    });
}


//Waiting Room
function initialWaitingRoomGrid(id) {
    $('#' + id).jsGrid({
        width: "100%",
        height: "auto",
        title: true,
        filtering: false,
        inserting: false,
        editing: false,
        sorting: false,
        selecting: true,
        paging: false,
        noDataContent: 'لا يوجد مرضى في غرفة الانتظار',
        data: itemsList,
        rowClick: function (args) {
            if (selectedRow) {
                selectedRow.children('.jsgrid-cell').css('background-color', '');
                selectedRow.children('.jsgrid-cell').css('color', '');
            }
            selectedItem = args.item;
            var $row = this.rowByItem(args.item);
            $row.children('.jsgrid-cell').css('background-color', '#007bff');
            $row.children('.jsgrid-cell').css('color', 'white');
            selectedRow = $row;
        },

        fields: [
            { name: "Id", title: "المعرف", type: "number", width: 0, visible: false },
            { name: "FirstName", title: "الاسم", type: "text", width: 0, visible: false },
            { name: "LastName", title: "الاسم", type: "text", width: 0, visible: false },
            { name: "Seq", title: "#", type: "number", width: 50, headerTemplate: headerTemplate },
            { name: "Number", title: "الرقم", type: "number", width: 75, validate: "required", headerTemplate: headerTemplate, itemTemplate: itemTemplate },
            { name: "FullName", title: "الاسم", type: "text", width: 150, validate: "required", headerTemplate: headerTemplate, itemTemplate: itemTemplate },
            { name: "ArrivalTime", title: "وقت الوصول", type: "text", width: 75, validate: "required", headerTemplate: headerTemplate, itemTemplate: itemTemplate },
            { name: "DoctorFullName", title: "الطبيب", type: "text", width: 75, headerTemplate: headerTemplate, itemTemplate: itemTemplate },
            { name: "VisitKindDescriptionAr", title: "طبيعة الزيارة", type: "text", width: 75, headerTemplate: headerTemplate, itemTemplate: itemTemplate },
            { name: "Note", title: "ملاحظات", type: "text", width: 150, sorting: false, headerTemplate: headerTemplate, itemTemplate: itemTemplate },
            //{ type: "control" }
        ]
    });
}

function headerTemplate() {
    return $("<div>").prop("title", this.title).text(this.title);
}

function itemTemplate(text, item) {
    var displayText = text;

    return $("<div>").prop("title", displayText ? displayText : '(لا يوجد قيمة)').text(displayText ? displayText : '-').css('text-align', displayText ? '' : 'center');
}

//waiting room list
function loadWaitingRoomPage() {
    fillVisitKindList(fillVisitKindIds);
    loadWaitingRoomPatients();
}

function loadWaitingRoomPatients() {
    requestToServer(secretaryService + 'WaitingRoom/Get', 'POST', '', function (result) {
        if (result) {
            for (var i = 0; i < result.length; i++) {
                result[i].FullName = result[i].FirstName + ' ' + result[i].LastName;
            }
            $("#waiting-patients-list").jsGrid("destroy");
            selectedRow = undefined;
            selectedItem = undefined;
            itemsList = result;
            var interval = setInterval(function () {
                if (visitKindIds) {
                    clearInterval(interval);
                    initialWaitingRoomGrid('waiting-patients-list');
                }
            }, 100)

        } else {
            showMessage("لا يوجد نتائج");
        }
    });
}

function fillVisitKindIds(result) {
    visitKindIds = [];
    for (var i = 0; i < result.length; i++) {
        visitKindIds.push({
            id: result[i].Id,
            name: result[i].DescriptionAr
        });
    }
}

function showEnterPatientModal() {
    if (selectedItem) {
        $('#enterName').val(selectedItem.FullName);
        $('#enterPatient').modal('show');
    } else {
        showMessage('الرجاء اختيار مريض لادخاله الى غرفة الطبيب');
    }
}

function enterPatientToDoctor() {
    if (selectedItem) {
        $('#enterPatient').modal('hide');
        var doctorRoom = {
            "doctorId": selectedItem.DoctorId
        }
        requestToServer(secretaryService + 'DoctorRoom/Avaliable', 'POST', JSON.stringify(doctorRoom), function (result) {
            var data = {
                "visitId": selectedItem.Id
            }
            requestToServer(secretaryService + 'Patient/Visit/StartEncounter', 'POST', JSON.stringify(data), function (result) {
                loadWaitingRoomPatients();
                showMessage('تمت الاضافة بنجاح');
            });
        });
    }
}

// cancel visit
function showCancelVisitModal() {
    if (selectedItem) {
        $('#cancelName').val(selectedItem.FullName);
        resetCancelVisitModalValidations();
        $('#cancelVisit').modal('show');
    } else {
        showMessage('الرجاء تحديد زيارة لالغائها');
    }
}

function readCancelVisitModal(visitId) {
    resetAddVisitModalValidations();
    var result;
    var note = $('#cancelReason').val();
    var isValidNote = validateItem(note, 'text', 0, 100, false, true, false, 'cancelReason');

    if (isValidNote) {
        result = {
            "visitId": visitId,
            "cancelingReason": note
        };
    }
    return result;
}

function resetCancelVisitModalValidations() {
    resetValidationError('cancelReason');
}

function PatientCancelVisit() {
    if (selectedItem) {
        var cancelVisitObject = readCancelVisitModal(selectedItem.Id);
        if (cancelVisitObject) {
            $('#cancelVisit').modal('hide');
            requestToServer(secretaryService + 'Patient/Visit/Cancel', 'POST', JSON.stringify(cancelVisitObject), function (result) {
                loadWaitingRoomPatients();
                showMessage('تمت عملية الغاء الزيارة بنجاح');
            });
        }
    }
}

// doctor room

function loadDoctorRoomInfo() {
    var data = {
        'doctorId': 1
    }
    requestToServer(doctorService + 'DoctorRoom/Current', 'POST', JSON.stringify(data), function (result) {
        if (!result) {
            selectedItem = undefined;
            $('#doctor-room, .visit-action').hide();
            $('#noPatientInRoom').show();
            return;
        }
        $('#noPatientInRoom').hide();
        $('#doctor-room, .visit-action').show();
        selectedItem = result;
        gPatientId = result.PatientId;
        $('#drRoomPatientName').text(result.FirstName + ' ' + result.LastName);
        $('#drRoomPatientAge').text(BirthDateToAge(result.Birthdate));
        $('#drRoomArrivedTime').text(result.ArrivalTime);
        $('#drRoomEnterTime').text(result.EnterToDoctorRoomTime);
        $('#drRoomLastVisit').text(result.VisitDate);
        loadAllNotesType(loadAllNotes);
    }, true, true);
}

function loadAllNotesType(callBack) {
    requestToServer(doctorService + 'Doctor/VisitNoteType/GetAll', 'POST', '', function (result) {
        callBack(result);
    });
}

function loadAllNotes(notesType) {
    noteTypes = notesType;
    $('.my-note').remove();
    if (notesType && notesType.length) {
        for (var i = 0; i < notesType.length; i++) {
            var data = {
                "visitId": selectedItem.Id,
                "noteTypeId": notesType[i].Id
            };
            requestToServer(doctorService + 'Patient/Visit/TextNote/Get', 'POST', JSON.stringify(data), function (result) {
                appendNewNote(result);
            }, true, true);
        }
    }
}

function appendNewNote(noteObject) {
    if (!noteObject /*|| !noteObject.Note*/) {
        return;
    }
    var NodeTypeText = '';
    for (var i = 0; i < noteTypes.length; i++) {
        if (noteTypes[i].Id == noteObject.VisitNoteTypeId) {
            NodeTypeText = noteTypes[i].DescriptionAr;
            break;
        }
    }
    var html = '';
    html += '<li class="my-note a' + ((noteObject.VisitNoteTypeId % 8) + 1) + '" data-NodeTypeId="' + noteObject.VisitNoteTypeId + '" data-NodeId="' + noteObject.Id + '">';
    html += '<div class="" onclick="showEditNoteModal(\'' + (noteObject.Id ? noteObject.Id : '') + '\', \'' + noteObject.VisitNoteTypeId + '\')">';
    html += '<h5 class="note-header">';
    html += '<span class="d-inline-block">' + (NodeTypeText ? stringToHtml(NodeTypeText) : 'ملاحظة') + '</span>';
    if (noteObject.Id) {
        html += '<a class="float-left text-danger" href="#" onclick="showDeleteNoteConfirmModal(event, \'' + noteObject.Id + '\')">';
        html += '<i class="fa fa-trash"></i>';
        html += '</a>';
    }
    html += '</h5>';
    html += '<div class="p-2">';
    html += stringToHtml(noteObject.Note);
    html += '</div>';
    html += '</div>';
    html += '</li>';
    if (noteObject.Note) {
        $('#notesList').prepend(html);
    } else {
        $('#noteAddButton').before(html);
    }
}

function showConfirmDialog(header, text, showPatientName, clickEvent) {
    $('#confirmDialogHeader').text(header);
    $('#confirmPatientText').text(text);
    if (showPatientName) {
        $('#confirmPatientName').val(selectedItem.FirstName + ' ' + selectedItem.LastName);
        $('#confirmPatientNameDiv').show();
    } else {
        $('#confirmPatientNameDiv').hide();
    }

    $('#confirmDialogSaveBtn').off('click').on('click', clickEvent);
    $('#confirmDialog').modal('show');
}

function returnToWaitingRoom() {
    showConfirmDialog('اعادة لغرفة الانتظار', 'هل تريد اعادة المريض لغرفة الانتظار؟', true, returnToWaitingRoomAction);
}

function returnToWaitingRoomAction() {
    var data = {
        "visitId": selectedItem.Id
    }
    $('#confirmDialog').modal('hide');
    requestToServer(doctorService + 'Patient/Visit/ToWaitingRoom', 'POST', JSON.stringify(data), function (result) {
        showMessage('تمت العملية بنجاح');
        loadDoctorRoomInfo();
    });
}

function finishVisit() {
    showConfirmDialog('انهاء الزيارة', 'هل تريد انهاء عملية المراجعة؟', true, finishVisitAction);
}

function finishVisitAction() {
    var data = {
        "visitId": selectedItem.Id
    }
    $('#confirmDialog').modal('hide');
    requestToServer(doctorService + 'Patient/Visit/Complete', 'POST', JSON.stringify(data), function (result) {
        showMessage('تمت العملية بنجاح');
        loadDoctorRoomInfo();
    });
}

function showAddNewNoteModal() {
    resetNoteValidationError();
    emptyNoteModal();
    $('#noteModalSaveBtn').off('click').on('click', addNewNote);
    $('#noteModalHeader').text('اضافة ملاحظة للمريض');
    $('#noteArabicName, #noteEnglishName').prop('disabled', false).removeClass('disabled');
    $('#noteModal').modal('show');
}

function resetNoteValidationError() {
    $('#noteArabicName + .invalid-tooltip').hide();
    $('#noteEnglishName + .invalid-tooltip').hide();
    $('#noteNoteText + .invalid-tooltip').hide();
    $('#noteNoteText, #noteEnglishName, #noteArabicName').removeClass('is-invalid');
}

function emptyNoteModal() {
    $('#noteArabicName').val('');
    $('#noteEnglishName').val('');
    $('#noteNoteText').val('');
}

function readAddNewNote(alowEmptyNote) {
    var result;

    var aName = $('#noteArabicName').val();
    var eName = $('#noteEnglishName').val();
    var note = $('#noteNoteText').val();

    var isValidAName = validateItem(aName, 'text', 2, 100, false, true, false, 'noteArabicName');
    var isValidEName = validateItem(eName, 'text', 2, 100, false, true, false, 'noteEnglishName');
    var isValidNote = validateItem(note, 'text', 2, 100, alowEmptyNote, true, false, 'noteNoteText');

    if (isValidAName && isValidEName && isValidNote) {
        if (alowEmptyNote) {
            var noteObject = {
                "Description": eName,
                "DescriptionAr": aName,
            }
            result = {};
            result['visitNoteType'] = noteObject;
        } else {
            return note;
        }
    }
    return result;
}

function addNewNote() {
    var noteTypeObject = readAddNewNote(true);
    if (noteTypeObject) {
        $('#noteModal').modal('hide');
        requestToServer(doctorService + 'Doctor/VisitNoteType/Add', 'POST', JSON.stringify(noteTypeObject), function (result) {
            var note = $('#noteNoteText').val();
            if (note) {
                var noteObject = {
                    "vn": {
                        "Note": note,
                        "VisitId": selectedItem.Id,
                        "VisitNoteTypeId": result.Id
                    }
                }
                requestToServer(doctorService + 'Patient/Visit/TextNote/Add', 'POST', JSON.stringify(noteObject), function (result) {
                    showMessage('تمت العملية بنجاح');
                    loadAllNotesType(loadAllNotes);
                });
            } else {
                showMessage('تمت العملية بنجاح');
                loadAllNotesType(loadAllNotes);
            }
        });
    }
}

function showEditNoteModal(noteId, noteTypeId) {
    resetNoteValidationError();
    fillNoteModal(noteId, noteTypeId);
}

function fillNoteModal(noteId, noteTypeId) {
    if (noteId) {
        var data = {
            "visitId": selectedItem.Id,
            "noteTypeId": noteTypeId
        };
        requestToServer(doctorService + 'Patient/Visit/TextNote/Get', 'POST', JSON.stringify(data), function (result) {
            showEditModal(result)
        });
    } else {
        var noteObject = {
            Id: 0,
            VisitNoteTypeId: noteTypeId,
            Note: ''
        }
        showEditModal(noteObject);
    }
}

function showEditModal(noteObject) {
    var NodeArabicTypeText = '';
    var NodeEnglishTypeText = '';
    for (var i = 0; i < noteTypes.length; i++) {
        if (noteTypes[i].Id == noteObject.VisitNoteTypeId) {
            NodeArabicTypeText = noteTypes[i].DescriptionAr;
            NodeEnglishTypeText = noteTypes[i].Description;
            break;
        }
    }
    $('#noteModalHeader').text('تعديل ملاحظة للمريض');
    $('#noteArabicName').val(NodeArabicTypeText);
    $('#noteEnglishName').val(NodeEnglishTypeText);
    $('#noteNoteText').val(noteObject.Note);
    $('#noteModalSaveBtn').off('click').on('click', function () { editNote(noteObject.NoteId, noteObject.VisitNoteTypeId) });
    $('#noteArabicName, #noteEnglishName').prop('disabled', true).addClass('disabled');
    $('#noteModal').modal('show');
}

function editNote(noteId, noteTypeId) {
    var noteText = readAddNewNote(false);
    if (!noteText) {
        return;
    }
    if (noteText) {
        var noteObject;
        $('#noteModal').modal('hide');
        if (noteId) {
            noteObject = {
                "noteId": noteId,
                "note": noteText,
            }
        } else {
            noteObject = {
                "vn": {
                    "Note": noteText,
                    "VisitId": selectedItem.Id,
                    "VisitNoteTypeId": noteTypeId
                }
            }
        }
    }
    requestToServer(doctorService + 'Patient/Visit/TextNote/' + (noteId ? 'Edit' : 'Add'), 'POST', JSON.stringify(noteObject), function (result) {
        showMessage('تمت العملية بنجاح');
        loadAllNotesType(loadAllNotes);
    });
}

function showDeleteNoteConfirmModal(e, noteId) {
    e.stopPropagation();
    e.preventDefault();
    showConfirmDialog('حذف ملاحظة', 'هل تريد بالتأكيد حذف هذة الملاحظة؟', false, function () { deleteNote(noteId) });
}

function deleteNote(noteId) {
    var data = {
        "noteId": noteId
    }
    $('#confirmDialog').modal('hide');
    requestToServer(doctorService + 'Patient/Visit/TextNote/Remove', 'POST', JSON.stringify(data), function (result) {
        loadAllNotesType(loadAllNotes);
        showMessage('تمت العملية بنجاح');
    });
}

function toFriendlyCount(count, one, tow, multi, many) {
    if (count < 1)
        return '';
    if (count == 1)
        return one;
    if (count == 2)
        return tow;
    if (count < 11)
        return count + ' ' + multi;
    if (count % 100 < 3)
        return count + ' ' + many;
    if (count % 100 < 11)
        return count + ' ' + multi;
    return count + ' ' + many;
}

function loadCanceledVisitPage() {
    fillDoctorList('canceledDrName', true);
}

function startingUp(pageName) {
    let role = sessionStorage.getItem('UserRole');
    if (pageName && pageName.toLowerCase() == 'doctorroom' && role == 1) {
        window.location.href = 'index.htm';
    }
    if (role == 1) {
        $('#doctorRoom').attr('href', '');
        $('#doctorRoom').parents('li').hide();
    }
    let userFullName = sessionStorage.getItem('UserFullName');
    $('#user-full-name-span').text(userFullName ? userFullName : 'د. سامر النجار');
    gDoctorId = sessionStorage.getItem('DoctorId');
    gDoctorId = gDoctorId ? gDoctorId : undefined;
}

function showVisitesLog() {
    // if (!gDoctorId || !gPatientId) {
    //     return;
    // }
    // var data = {
    //     "PatientId": gPatientId,
    //     "DoctorId": gDoctorId
    // }
    queryToServer('GetPatientPastVisits', { PatientId: gPatientId }, function (result) {
        $('#PastVisits').modal('show');
        if (result && (result.LastVisitDate || result.Visits || result.PaperVisits)) {
            //let html = '<div class="row p-2 mx-auto my-4" style="font-size: 20px;">';
            let html = '';
            if (result.LastVisitDate) {
                html += '<h4 class="mt-1 mb-4">';
                html += '<span>الزيارة الأخيرة:</span> ';
                html += '<span class="font-weight-bold">' + result.LastVisitDate + '</span>';
                html += '</h4>';
                html += '<hr/>';
            }

            let visitsHtml = '';
            if (result.Visits) {
                html += '<h3 class="my-1 font-weight-bold">الزيارات السابقة</h3>';
                for (let i = result.Visits.length - 1; i > -1; i--) {
                    const element = result.Visits[i];
                    visitsHtml = generateVisitLogDiv(element, result.Visits.length - i) + visitsHtml;
                }
            }

            html += visitsHtml;

            if (result.PaperVisits) {
                html += '<h3 class="font-weight-bold">السجل الورقي</h3>';
                html += '<table class="table">';
                html += '<thead class="thead-dark">';
                html += '<tr>';
                html += '<th scope="col">#</th>';
                html += '<th scope="col">الوصف</th>';
                html += '<th scope="col"></th>';
                html += '<th scope="col">الخواص</th>';
                html += '</tr>';
                html += '</thead>';
                html += '<tbody>';

                for (let i = 0; i < result.PaperVisits.length; i++) {
                    const element = result.PaperVisits[i];
                    html += '<tr>';
                    html += '<th scope="row">' + element.Seq + '</th>';
                    html += '<td>' + element.Description + '</td>';
                    html += '<td><button style="min-width: 90px;" class="btn btn-success" onclick="viewAttachment(\'' + element.FileName + '\', ' + gPatientId + ')">عرض</button></td>';
                    html += '<td>';
                    if (element.IsThereProperties) {
                        html += '<button style="min-width: 90px;" class="btn btn-primary" onclick="viewAttachmentProperties(' + element.Id + ')">عرض</button>';
                    }
                    html += '</td>';
                    html += '</tr>';
                }
            }
            html += '</tbody>';
            html += '</table>';
            $('#pastVisitBody').empty().append(html);

        } else {
            showMessage(result.Message);
        }
    });
}

function generateVisitLogDiv(visit, id) {
    let result = '';

    result += '<h4 class="text-primary">الزيارة ' + id + '</h4>';

    result += '<div class="row">';
    result += '<div class="col-12 col-lg-6 my-1">';
    result += '<span>تاريخ الزيارة:</span> ';
    result += '<span class="font-weight-bold">' + visit.VisitDate + '</span> ';
    result += '</div>';

    result += '<div class="col-12 col-lg-6 my-1">';
    result += '<span>حالة الزيارة:</span> ';
    result += '<span class="font-weight-bold text-';

    result += (visit.VisitStatusId == visitStatus.Canceled ? 'danger' : 'success');
    result += '">' + visit.VisitStatusAr + '</span> ';
    if (visit.VisitStatusId == visitStatus.Canceled) {
        result += '<span class="font-weight-bold">(' + visit.CancelingReason + ')</span> ';
    }
    result += '</div>';

    result += '</div>';

    result += '<div class="row">';
    result += '<div class="col-12 col-lg-6 my-1">';
    result += '<span>طبيعة الزيارة:</span> ';
    result += '<span class="font-weight-bold">' + visit.VisitKindAr + '</span> ';
    result += '</div>';

    result += '<div class="col-12 col-lg-6 my-1">';
    result += '<span>وقت الانتظار:</span> ';
    result += '<span class="font-weight-bold">' + toFriendlyTime(visit.WaitingPeriod) + '</span> ';
    result += '</div>';
    result += '</div>';

    result += '<div class="row row mt-1 mb-3">';
    result += '<div class="col-12">';
    result += '<span>ملاحظات عامة:</span> ';
    result += '<span class="font-weight-bold">' + (visit.GeneralNotes ? visit.GeneralNotes : '(لا يوجد ملاحظات)') + '</span> ';
    result += '</div>';
    result += '</div>';

    result += '<div class="row my-1">';
    result += '<div class="col-12">';
    result += '<button type="button" class="btn btn-primary" onclick="getVisitNote(this, \'visit' + visit.Id + 'notesDiv\',' + visit.Id + ')">الملاحظات المسجلة</button> ';
    result += '<div id="visit' + visit.Id + 'notesDiv' + '"></div>';
    result += '</div>';
    result += '</div>';
    result += '<hr/>';

    return result;
}

function toFriendlyTime(time) {
    return time;
}

var visitStatus = {
    InWaitingRoom: 1,
    InDoctorRoom: 2,
    Canceled: 3,
    Completed: 4
}

var gDoctorId = 0,
    gPatientId = 0;

function logout() {
    sessionStorage.removeItem('UserToken');
    sessionStorage.removeItem('UserId');
    sessionStorage.removeItem('DoctorId')
    sessionStorage.removeItem('Username');
    sessionStorage.removeItem('UserFullName');
    sessionStorage.removeItem('UserRole');
    window.location.href = 'login.htm';
}

function getVisitNote(sender, divId, visitId) {
    var data = {
        'VisitId': visitId
    }
    queryToServer('GetPatientVisitNotes', data, function(result) {
        if (result) {
            let html = '';
            html += '<h5>الملاحظات المسجلة</h3>';
            html += '<table class="table">';
            html += '<thead class="thead-dark">';
            html += '<tr>';
            html += '<th scope="col">#</th>';
            html += '<th scope="col">نوع الملاحظة</th>';
            html += '<th scope="col">الملاحظة المسجلة</th>';
            html += '<th scope="col">الكتابة بالقلم</th>';
            html += '</tr>';
            html += '</thead>';
            html += '<tbody>';

            for (let i = 0; i < result.length; i++) {
                const element = result[i];
                html += '<tr>';
                html += '<th scope="row">' + element.Seq + '</th>';
                html += '<td>' + element.VisitNoteTypeAr + '</td>';
                html += '<td>' + element.Note + '</td>';
                html += '<td>';
                if (element.FileName) {
                    html += '<button style="min-width: 90px;" class="btn btn-primary" onclick="viewAttachmentProperties(' + element.FileName + ')">عرض</button>';
                }
                html += '</td>';
                html += '</tr>';
            }
            html += '</tbody>';
            html += '</table>';
            $('#' + divId).empty().append(html);
        }
        $(sender).hide();
    });
}

function viewAttachmentProperties(attachmentId) {
    var data = {
        AttachmentId: attachmentId
    };
    $('#attachmentPropertiesList').empty();
    queryToServer('GetPatientPaperVisitAttachmentProperties', data, function(result) {
        $('#attachmentProperties').modal('show');
        let propertiesHtml = '';
        for (let i = 0; i < result.length; ++i) {
            $('#attachmentProperties').modal()
            propertiesHtml += '<li class="list-group-item py-2">';
            propertiesHtml += '<h6>' + result[i].DescriptionAr + '</h6>';
            propertiesHtml += '<div class="m-0">' + stringToHtml(result[i].PropValue) + '</div>';
            propertiesHtml += '</li>';
        }
        $('#attachmentPropertiesList').append(propertiesHtml);
    });
}

var eyeReports = [];

function showEyeReportLog(viewIndex) {
    let data = {
        VisitId: selectedItem.Id
    };
    $('#reportsListDiv, #noReportsInfo, #reportsListDiv').hide();
    $('#reportsList').empty();
    eyeReports = [];
    queryToServer('ReadKr8800Output', data, function(result) {
        $('#eyeReportLog').modal('show');
        if (result && result.length > 1) {
            let html = '';
            for (let i = 0; i < result.length; i++) {
                const element = result[i];
                if (!eyeReports[element.Seq]) {
                    eyeReports[element.Seq] = {};
                    html += '<a class="dropdown-item" onclick="viewReport(' + element.Seq + ')">فحص ' + element.Seq + '</a>';
                }
                eyeReports[element.Seq][element.EYE] = element;
            }
            viewReport(viewIndex);
            $('#reportsList').append(html);
            $('#eyeReportLog .modal-body').scrollTop(0);
            $('#reportsListDiv, #reportsListDiv').show();
        } else {
            $('#noReportsInfo').show();
        }
    });
}

function viewReport(index) {
    if (eyeReports) {
        if (eyeReports && eyeReports[index]) {
            $('#reportBody').show();
            let eye = eyeReports[index].R;
            if (eye) {
                $('#eyeRS').text(eye.SPH);
                $('#eyeRC').text(eye.CYL);
                $('#eyeRA').text(eye.AXIS);
                $('#eyeRMM1').text(eye.MM1);
                $('#eyeRD1').text(eye.D1);
                $('#eyeRA1').text(eye.A1);
                $('#eyeRMM2').text(eye.MM2);
                $('#eyeRD2').text(eye.D2);
                $('#eyeRA2').text(eye.A2);
                $('#eyeRAV').text(eye.MM_AV);
                $('#eyeRCYL1').text(eye.D_CYL);
                $('#eyeRCYL2').text(eye.A_CYL);
                $('#saveEyeReportR-btn').attr('data-eye', 'R').attr('data-index', index).attr('data-fileName', eye.FileName);
                $('#reportBodyTitle').text('فحص #' + eye.Seq);
                $('#eyeReportRightNote').val(eye.Note);
                $('#reportBodyR').show();
            } else {
                $('#reportBodyR').hide();
            }

            eye = eyeReports[index].L;
            if (eye) {
                $('#eyeLS').text(eye.SPH);
                $('#eyeLC').text(eye.CYL);
                $('#eyeLA').text(eye.AXIS);
                $('#eyeLMM1').text(eye.MM1);
                $('#eyeLD1').text(eye.D1);
                $('#eyeLA1').text(eye.A1);
                $('#eyeLMM2').text(eye.MM2);
                $('#eyeLD2').text(eye.D2);
                $('#eyeLA2').text(eye.A2);
                $('#eyeLAV').text(eye.MM_AV);
                $('#eyeLCYL1').text(eye.D_CYL);
                $('#eyeLCYL2').text(eye.A_CYL);
                $('#saveEyeReportL-btn').attr('data-eye', 'L').attr('data-index', index).attr('data-fileName', eye.FileName);
                $('#reportBodyTitle').text('فحص #' + eye.Seq);
                $('#eyeReportLeftNote').val(eye.Note);
                $('#reportBodyL').show();
            } else {
                $('#reportBodyL').hide();
            }

        } else {
            $('#reportBody').hide();
            showMessage('لم يتم العثور على التقرير.');
        }
    } else {
        showEyeReportLog(index);
    }
}

function saveEyeReport(sender, noteId) {
    let fileName = $(sender).attr('data-fileName');
    let eye = $(sender).attr('data-eye');
    let index = $(sender).attr('data-index');
    let note = $('#' + noteId).val();
    if (fileName && eye && index && eyeReports && eyeReports[index] && eyeReports[index][eye]) {
        let data = JSON.parse(JSON.stringify(eyeReports[index][eye]));
        data.Note = note;
        data.VisitId = selectedItem.Id;
        commandToServer('AddEyeTest', data, function (result) {
            eyeReports = undefined;
            showEyeReportLog(index);
            showMessage('تم الحفظ بنجاح');
        });
    } else {
        showMessage('لم يتم العثور على التقرير');
    }
}

function showAddEyeReportLog() {
    $('#eyeReportLogAdd').modal('show');
    $('#addEyeReport input').val('').removeClass('is-invalid');
    $('#eyeReportEye').val('R');
    resetValidationError('addEyeReportNote');
}

function eyeReportOnInput(sender) {
    if (sender) {
        $(sender).val($(sender).val().replace(/[^\d.+-]+/g, ''));
    }
}

function onchangeMM() {
    let val = (Number($('#addEyeRMM1').val()) + Number($('#addEyeRMM2').val())) / 2;
    $('#addEyeRAV').val(val ? val : 0);
}

function onchangeD() {
    let val = Number($('#addEyeRD1').val()) - Number($('#addEyeRD2').val());
    $('#addEyeRCYL1').val(val ? val : 0);
}

function onchangeA() {
    let val = Math.min(Number($('#addEyeRA1').val()), Number($('#addEyeRA2').val()));
    $('#addEyeRCYL2').val(val ? val : 0);
}

function AddNewReport() {
    let notEntered = 0;
    $('#addEyeReport input:not(:disabled)').each(function(index, item) {
        let $item = $(item);
        if (!$item.val()) {
            $item.addClass('is-invalid');
            notEntered++;
        }
    });
    let notes = $('#addEyeReportNote').val();
    let isValidNote = validateItem(notes, 'text', 0, 255, true, true, false, 'addEyeReportNote');
    if (!notEntered && isValidNote) {
        $('#eyeReportLogAdd').modal('hide');
        let data = {
            VisitId: selectedItem.Id,
            EYE: $('#eyeReportEye').val(),
            SPH: $('#addEyeRS').val(),
            CYL: $('#addEyeRC').val(),
            AXIS: $('#addEyeRA').val(),
            MM1: $('#addEyeRMM1').val(),
            MM2: $('#addEyeRMM2').val(),
            MM_AV: $('#addEyeRAV').val(),
            D1: $('#addEyeRD1').val(),
            D2: $('#addEyeRD2').val(),
            D_CYL: $('#addEyeRCYL1').val(),
            A1: $('#addEyeRA1').val(),
            A2: $('#addEyeRA2').val(),
            A_CYL: $('#addEyeRCYL2').val(),
            Note: notes,
            FileName: ''
        }
        commandToServer('AddEyeTest', data, function(result) {
            eyeReports = undefined;
            viewReport(1);
            showMessage('تم الحفظ بنجاح');
        });
    }
}

function viewCanceledVisitList() {
    var fromText = $('#canceled-from-date input').val();
    var toText = $('#canceled-to-date input').val();
    var data = {
        "doctorId": $('#canceledDrName').val(),
        "fromDate": (fromText ? moment(fromText, 'L') : moment().subtract(30, 'days')).format('YYYY-MM-DD'),
        "toDate": (toText ? moment(toText, 'L') : moment()).format('YYYY-MM-DD')
    };
    requestToServer(secretaryService + 'Visit/Canceled/Get', 'POST', JSON.stringify(data), function (result) {
        var html = '<div class="mx-auto my-3 bg-light p-2" style="width: 95%; box-shadow: 0px 5px 8px 2px rgba(0, 0, 0, 0.28);">';
        if (!result || !result.length) {
            html += '<h4 class="text-center text-muted my-4">لا يوجد زيارات ملغاة في هذه الفترة</h4>';
        } else {
            html += '<h5 class="my-2">' + toFriendlyCount(result.length, 'زيارة ملغاة واحدة', 'زيارتان ملغاتان', 'زيارات ملغاة', 'زيارة ملغاة') + '</h5>';
            html += '<div class="table-responsive"><table class="table table-striped mb-0">';
            html += '<thead class="thead-dark"><tr>';
            html += '<th scope="col">#</th><th scope="col">الرقم</th><th scope="col">الاسم</th><th scope="col">الطبيب</th>';
            html += '<th scope="col">تاريخ الزيارة</th><th scope="col">وقت الوصول</th><th scope="col">طبيعة الزيارة</th><th scope="col">سبب الإلغاء</th>';
            html += '</tr></thead><tbody>';
            for (var i = 0; i < result.length; i++) {
                var v = result[i];
                html += '<tr>';
                html += '<th scope="row">' + (i + 1) + '</th>';
                html += '<td>' + v.Number + '</td>';
                html += '<td>' + stringToHtml(v.FullName) + '</td>';
                html += '<td>' + stringToHtml(v.DoctorFullName) + '</td>';
                html += '<td>' + v.VisitDate + '</td>';
                html += '<td>' + v.ArrivalTime + '</td>';
                html += '<td>' + stringToHtml(v.VisitKindDescriptionAr) + '</td>';
                html += '<td>' + stringToHtml(v.CancelingReason) + '</td>';
                html += '</tr>';
            }
            html += '</tbody></table></div>';
        }
        html += '</div>';
        $('#canceled-visit-list').empty().append(html);
    });
}
