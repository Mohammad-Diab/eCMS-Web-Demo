var queryService = 'EcmsQueryService.svc/JSON/';

var $ = jQuery.noConflict();

var userName = $('#username').val();
var password = $('#password').val();

function loginPrepare(e) {
    if (!e || e.keyCode == 13) {
        if (!$('#username').val()) {
            $('#username').focus();
            return;
        }
        if (!$('#password').val()) {
            $('#password').focus();
            return;
        }
        login();
    }
}

function login() {
    userName = $('#username').val();
    password = $('#password').val();

    var url = serverUrl + queryService + 'LoginUser';

    var postData = {
        'query': {
            'UserName': userName,
            'Password': password
        }
    };

    var xhr = $.ajax({
        url: url,
        method: 'POST',
        contentType: 'application/json;charset=utf-8',
        accept: 'application/json',
        data: JSON.stringify(postData),
        crossDomain: true,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        processData: false,
    });

    xhr.done(function (data, status, xhr) {
        debugger;
        var token = xhr.getResponseHeader('Token');
        sessionStorage.setItem('UserToken',
            JSON.stringify(token)
        );

        if (data && data.Result) {
            sessionStorage.setItem('UserId', data.Result.UserId);
            sessionStorage.setItem('DoctorId', data.Result.DoctorId);
            sessionStorage.setItem('Username', data.Result.UserName);
            sessionStorage.setItem('UserFullName', data.Result.FullName);
            sessionStorage.setItem('UserRole', data.Result.RoleId);
        }

        window.location.href = "patientsList.htm";
    });
}