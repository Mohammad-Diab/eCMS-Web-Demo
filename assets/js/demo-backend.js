// eCMS demo backend: answers the requests of script.js in the browser, so the
// front end runs as a static site. The data comes from demo-data.js and lives in
// sessionStorage: changes stay while the tab is open and reset the next day.
var DemoBackend = (function () {
    'use strict';

    var KEY = 'ecms-demo-db-v1';
    var FILES_KEY = 'ecms-demo-files-v1';
    var db, memoryFiles = {}, pendingUpload = null;

    var statusAr = { 1: 'في غرفة الانتظار', 2: 'في غرفة الطبيب', 3: 'ملغاة', 4: 'مكتملة' };

    function load() {
        var today = moment().format('YYYY-MM-DD');
        try {
            var saved = JSON.parse(sessionStorage.getItem(KEY));
            if (saved && saved.generatedOn === today) { db = saved; return; }
        } catch (e) { }
        db = DemoData.generate(moment());
        save();
    }

    function save() {
        try { sessionStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { }
    }

    function ok(result) { return { Code: 0, Message: 'تمت العملية بنجاح', Result: result }; }
    function fail(code, message) { return { Code: code, Message: message, Result: null }; }
    function notFound() { return fail(8, 'لم يتم العثور على السجل في قاعدة البيانات'); }

    function byId(list, id) {
        id = Number(id);
        for (var i = 0; i < list.length; i++) { if (list[i].Id === id) return list[i]; }
        return null;
    }
    function patients() { return db.patients.filter(function (p) { return !p.IsDeleted; }); }
    function time(dt) { return dt ? dt.substr(11, 5) : ''; }
    function doctorName(id) { var d = byId(db.doctors, id); return d ? d.FullName : ''; }
    function kindName(id) { var k = byId(db.visitKinds, id); return k ? k.DescriptionAr : ''; }
    function isToday(dt) { return dt && dt.substr(0, 10) === moment().format('YYYY-MM-DD'); }

    function lastVisitDate(patientId, beforeVisitId) {
        var done = db.visits.filter(function (v) { return v.PatientId === patientId && v.StatusId === 4 && v.Id !== beforeVisitId; });
        done.sort(function (a, b) { return a.ArrivalTime < b.ArrivalTime ? -1 : 1; });
        return done.length ? done[done.length - 1].ArrivalTime.substr(0, 10) : '';
    }

    function patientRow(p) {
        var row = JSON.parse(JSON.stringify(p));
        row.LastVisitDate = lastVisitDate(p.Id);
        return row;
    }

    function contains(value, part) { return String(value || '').indexOf(String(part).trim()) > -1; }

    function search(d) {
        return patients().filter(function (p) {
            return (!d.filterByNumber || String(p.Number) === String(d.number)) &&
                (!d.filterByFirstName || contains(p.FirstName, d.firstName)) &&
                (!d.filterByLastName || contains(p.LastName, d.lastName)) &&
                (!d.filterByMobile || contains(p.Mobile, d.mobile)) &&
                (!d.filterByPhone || contains(p.Phone, d.phone));
        });
    }

    function page(list, d) {
        list = list.slice().sort(function (a, b) { return b.Id - a.Id; });
        var size = Number(d.recordsCount) || 10, start = (Number(d.pageId) || 0) * size;
        return list.slice(start, start + size).map(patientRow);
    }

    function visitNotes(visitId) {
        return db.notes.filter(function (n) { return n.VisitId === Number(visitId); });
    }

    function attachmentFile(a) {
        if (!a) return '';
        if (a.File.indexOf('upload:') === 0) {
            var f = memoryFiles[a.File] || loadFiles()[a.File];
            return f || 'assets/data/attachments/missing-upload.svg';
        }
        return a.File;
    }

    function loadFiles() {
        try { return JSON.parse(sessionStorage.getItem(FILES_KEY)) || {}; } catch (e) { return {}; }
    }

    function storeFile(key, dataUrl) {
        memoryFiles[key] = dataUrl;
        try {
            var files = loadFiles();
            files[key] = dataUrl;
            sessionStorage.setItem(FILES_KEY, JSON.stringify(files));
        } catch (e) { } // too big for sessionStorage: kept until the page changes
    }

    var routes = {
        // reception (SecretaryService)
        'Patient/Count': function () { return ok(patients().length); },
        'Patient/GetPage': function (d) { return ok(page(patients(), d)); },
        'Patient/Search/Count': function (d) { return ok(search(d).length); },
        'Patient/Search': function (d) { return ok(page(search(d), d)); },
        'Patient/NextNumber': function () {
            return ok(db.patients.reduce(function (m, p) { return Math.max(m, p.Number); }, 20000) + 1);
        },
        'Patient/Add': function (d) {
            var p = d.patient;
            if (db.patients.some(function (x) { return !x.IsDeleted && String(x.Number) === String(p.Number); })) {
                return fail(102, 'رقم المريض مكرر');
            }
            p.Id = ++db.seq.patient; p.Number = Number(p.Number); p.GenderId = Number(p.GenderId); p.IsDeleted = false;
            db.patients.push(p);
            return ok(p);
        },
        'Patient/Get': function (d) { var p = byId(db.patients, d.id); return p ? ok(patientRow(p)) : notFound(); },
        'Patient/Edit': function (d) {
            var p = byId(db.patients, d.p.Id);
            if (!p) return notFound();
            ['FirstName', 'LastName', 'BirthDate', 'Phone', 'Mobile', 'Address', 'Job', 'Note'].forEach(function (k) { p[k] = d.p[k]; });
            p.GenderId = Number(d.p.GenderId);
            return ok(patientRow(p));
        },
        'Patient/Remove': function (d) {
            var p = byId(db.patients, d.id);
            if (!p) return notFound();
            p.IsDeleted = true;
            db.visits.forEach(function (v) { if (v.PatientId === p.Id && v.StatusId < 3) { v.StatusId = 3; v.CancelingReason = 'تم حذف سجل المريض'; } });
            return ok(true);
        },
        'Doctor/GetAll': function () { return ok(db.doctors); },
        'VisitKind/GetAll': function () { return ok(db.visitKinds); },
        'Patient/Visit/Add': function (d) {
            var v = d.v, pid = Number(v.PatientId);
            if (db.visits.some(function (x) { return x.PatientId === pid && x.StatusId < 3; })) {
                return fail(-1, 'المريض موجود في غرفة الانتظار أو عند الطبيب');
            }
            var nv = {
                Id: ++db.seq.visit, PatientId: pid, DoctorId: Number(v.DoctorId), VisitKindId: Number(v.VisitKindId),
                ArrivalTime: moment().format('YYYY-MM-DD') + ' ' + v.ArrivalTime.substr(11, 5),
                EnterTime: '', EndTime: '', StatusId: 1, CancelingReason: '', Note: v.Note || ''
            };
            db.visits.push(nv);
            return ok(nv.Id);
        },
        'Patient/Visit/Edit': function (d) {
            var v = byId(db.visits, d.v.Id);
            if (!v) return notFound();
            v.DoctorId = Number(d.v.DoctorId); v.VisitKindId = Number(d.v.VisitKindId); v.Note = d.v.Note || '';
            v.ArrivalTime = v.ArrivalTime.substr(0, 11) + d.v.ArrivalTime.substr(11, 5);
            return ok(v.Id);
        },
        'WaitingRoom/Get': function () {
            var list = db.visits.filter(function (v) { return v.StatusId === 1; });
            list.sort(function (a, b) { return a.ArrivalTime < b.ArrivalTime ? -1 : 1; });
            return ok(list.map(function (v, i) {
                var p = byId(db.patients, v.PatientId);
                return {
                    Id: v.Id, PatientId: v.PatientId, Seq: i + 1, Number: p.Number, FirstName: p.FirstName, LastName: p.LastName,
                    ArrivalTime: time(v.ArrivalTime), DoctorId: v.DoctorId, DoctorFullName: doctorName(v.DoctorId),
                    VisitKindId: v.VisitKindId, VisitKindDescriptionAr: kindName(v.VisitKindId), Note: v.Note,
                    LastVisitDate: lastVisitDate(v.PatientId)
                };
            }));
        },
        'DoctorRoom/Avaliable': function (d) {
            var busy = db.visits.some(function (v) { return v.StatusId === 2 && v.DoctorId === Number(d.doctorId); });
            return busy ? fail(300, 'غرفة الطبيب غير متاحة الآن: ' + doctorName(d.doctorId) + ' مع مريض آخر') : ok(true);
        },
        'Patient/Visit/StartEncounter': function (d) {
            var v = byId(db.visits, d.visitId);
            if (!v) return notFound();
            v.StatusId = 2; v.EnterTime = moment().format('YYYY-MM-DD HH:mm');
            return ok(true);
        },
        'Patient/Visit/Cancel': function (d) {
            var v = byId(db.visits, d.visitId);
            if (!v) return notFound();
            v.StatusId = 3; v.CancelingReason = d.cancelingReason;
            return ok(true);
        },
        'Visit/Canceled/Get': function (d) {
            var from = d.fromDate || '0000', to = d.toDate || '9999';
            var list = db.visits.filter(function (v) {
                var day = v.ArrivalTime.substr(0, 10);
                return v.StatusId === 3 && day >= from && day <= to && (!d.doctorId || v.DoctorId === Number(d.doctorId));
            });
            list.sort(function (a, b) { return a.ArrivalTime < b.ArrivalTime ? 1 : -1; });
            return ok(list.map(function (v) {
                var p = byId(db.patients, v.PatientId);
                return {
                    Id: v.Id, Number: p.Number, FullName: p.FirstName + ' ' + p.LastName, DoctorFullName: doctorName(v.DoctorId),
                    VisitDate: v.ArrivalTime.substr(0, 10), ArrivalTime: time(v.ArrivalTime),
                    VisitKindDescriptionAr: kindName(v.VisitKindId), CancelingReason: v.CancelingReason
                };
            }));
        },

        // attachments (FileStorageService)
        'Attachments/GetAll': function (d) {
            var list = db.attachments.filter(function (a) { return a.PatientId === Number(d.relatedRecordId); });
            return list.length ? ok(list) : notFound();
        },
        'Attachment/Add': function (d) {
            var a = d.attachment;
            db.attachments.push({
                Id: ++db.seq.attachment, PatientId: Number(a.RelatedRecordId), CategoryId: 0,
                FileName: a.FileName, File: pendingUpload || 'assets/data/attachments/missing-upload.svg', Properties: []
            });
            pendingUpload = null;
            return ok(db.seq.attachment);
        },
        'Attachment/Delete': function (d) {
            db.attachments = db.attachments.filter(function (a) { return a.Id !== Number(d.attachmentId); });
            return ok(true);
        },
        'Attachment/Categories/Get': function () { return ok(db.attachmentCategories); },
        'Attachment/Category/Properties/Get': function () { return ok(db.attachmentProperties); },
        'Attachment/Property/Add': function (d) {
            var a = byId(db.attachments, d.attachmentId);
            if (!a) return notFound();
            a.CategoryId = a.CategoryId || Number(d.CategoryId);
            a.Properties = a.Properties.filter(function (x) { return x.PropertyId !== Number(d.PropertyId); });
            a.Properties.push({ PropertyId: Number(d.PropertyId), PropertyValue: d.PropertyValue });
            return ok(true);
        },
        'Attachment/DeleteProperty': function (d) {
            var a = byId(db.attachments, d.attachmentId);
            if (!a) return notFound();
            a.Properties = a.Properties.filter(function (x) { return x.PropertyId !== Number(d.propertyId); });
            return ok(true);
        },

        // doctor room (DoctorService)
        'DoctorRoom/Current': function (d) {
            var v = db.visits.filter(function (x) { return x.StatusId === 2 && x.DoctorId === Number(d.doctorId); })[0];
            if (!v) return notFound();
            var p = byId(db.patients, v.PatientId);
            return ok({
                Id: v.Id, PatientId: p.Id, FirstName: p.FirstName, LastName: p.LastName, Birthdate: p.BirthDate,
                ArrivalTime: time(v.ArrivalTime), EnterToDoctorRoomTime: time(v.EnterTime),
                VisitDate: lastVisitDate(p.Id, v.Id) || 'أول زيارة', DoctorId: v.DoctorId
            });
        },
        'Doctor/VisitNoteType/GetAll': function () { return ok(db.noteTypes); },
        'Doctor/VisitNoteType/Add': function (d) {
            var t = { Id: ++db.seq.noteType, DescriptionAr: d.visitNoteType.DescriptionAr, Description: d.visitNoteType.Description };
            db.noteTypes.push(t);
            return ok(t);
        },
        'Patient/Visit/TextNote/Get': function (d) {
            var n = visitNotes(d.visitId).filter(function (x) { return x.VisitNoteTypeId === Number(d.noteTypeId); })[0];
            return ok(n ? { Id: n.Id, NoteId: n.Id, VisitNoteTypeId: n.VisitNoteTypeId, Note: n.Note } : { Id: 0, VisitNoteTypeId: Number(d.noteTypeId), Note: '' });
        },
        'Patient/Visit/TextNote/Add': function (d) {
            var n = { Id: ++db.seq.note, VisitId: Number(d.vn.VisitId), VisitNoteTypeId: Number(d.vn.VisitNoteTypeId), Note: d.vn.Note };
            db.notes.push(n);
            return ok(n.Id);
        },
        'Patient/Visit/TextNote/Edit': function (d) {
            var n = byId(db.notes, d.noteId);
            if (!n) return notFound();
            n.Note = d.note;
            return ok(true);
        },
        'Patient/Visit/TextNote/Remove': function (d) {
            db.notes = db.notes.filter(function (n) { return n.Id !== Number(d.noteId); });
            return ok(true);
        },
        'Patient/Visit/ToWaitingRoom': function (d) {
            var v = byId(db.visits, d.visitId);
            if (!v) return notFound();
            v.StatusId = 1; v.EnterTime = '';
            return ok(true);
        },
        'Patient/Visit/Complete': function (d) {
            var v = byId(db.visits, d.visitId);
            if (!v) return notFound();
            v.StatusId = 4; v.EndTime = moment().format('YYYY-MM-DD HH:mm');
            return ok(true);
        },

        // query/command service actions
        'GetPatientPastVisits': function (d) {
            var pid = Number(d.PatientId);
            var list = db.visits.filter(function (v) { return v.PatientId === pid && v.StatusId >= 3 && !isToday(v.ArrivalTime); });
            list.sort(function (a, b) { return a.ArrivalTime < b.ArrivalTime ? 1 : -1; });
            var paper = db.attachments.filter(function (a) { return a.PatientId === pid && a.CategoryId === 4; });
            return ok({
                LastVisitDate: lastVisitDate(pid),
                Visits: !list.length ? null : list.map(function (v) {
                    var diagnosis = visitNotes(v.Id).filter(function (n) { return n.VisitNoteTypeId === 4; })[0];
                    var wait = v.EnterTime ? moment(v.EnterTime).diff(moment(v.ArrivalTime), 'minutes') : 0;
                    return {
                        Id: v.Id, VisitDate: v.ArrivalTime.substr(0, 10), VisitStatusId: v.StatusId, VisitStatusAr: statusAr[v.StatusId],
                        CancelingReason: v.CancelingReason, VisitKindAr: kindName(v.VisitKindId),
                        WaitingPeriod: v.EnterTime ? wait + ' دقيقة' : '-', GeneralNotes: diagnosis ? diagnosis.Note : ''
                    };
                }),
                PaperVisits: !paper.length ? null : paper.map(function (a, i) {
                    return { Seq: i + 1, Id: a.Id, Description: a.FileName, FileName: a.Id, IsThereProperties: a.Properties.length > 0 };
                })
            });
        },
        'GetPatientVisitNotes': function (d) {
            return ok(visitNotes(d.VisitId).map(function (n, i) {
                var t = byId(db.noteTypes, n.VisitNoteTypeId);
                return { Seq: i + 1, VisitNoteTypeAr: t ? t.DescriptionAr : 'ملاحظة', Note: n.Note, FileName: '' };
            }));
        },
        'GetPatientPaperVisitAttachment': function (d) {
            var a = byId(db.attachments, d.FileName);
            return a ? ok(attachmentFile(a)) : notFound();
        },
        'GetPatientPaperVisitAttachmentProperties': function (d) {
            var a = byId(db.attachments, d.AttachmentId);
            if (!a) return notFound();
            return ok(a.Properties.map(function (x) {
                var prop = byId(db.attachmentProperties, x.PropertyId);
                return { DescriptionAr: prop ? prop.DescriptionAr : '', PropValue: x.PropertyValue };
            }));
        },
        'ReadKr8800Output': function (d) {
            return ok(db.eyeTests.filter(function (t) { return t.VisitId === Number(d.VisitId); }));
        },
        'AddEyeTest': function (d) {
            var vid = Number(d.VisitId);
            var same = db.eyeTests.filter(function (t) { return t.VisitId === vid && t.EYE === d.EYE && d.Seq && t.Seq === Number(d.Seq); })[0];
            if (same) { same.Note = d.Note; return ok(true); }
            var seq = db.eyeTests.filter(function (t) { return t.VisitId === vid; }).reduce(function (m, t) { return Math.max(m, t.Seq); }, 0) + 1;
            var t = {};
            for (var k in d) { t[k] = d[k]; }
            t.Id = ++db.seq.eyeTest; t.VisitId = vid; t.Seq = seq;
            db.eyeTests.push(t);
            return ok(true);
        }
    };

    function routeKey(url) {
        var key = url.split('?')[0];
        var i = key.indexOf('.svc/JSON/');
        if (i > -1) key = key.substr(i + 10);
        if (key.indexOf('JSON/') === 0) key = key.substr(5);
        return key;
    }

    function handle(url, data) {
        if (!db) load();
        var route = routes[routeKey(url)];
        if (!route) return fail(-1, 'خطأ غير معروف');
        var result;
        try { result = route(data || {}); } catch (e) { result = fail(-1, 'خطأ غير معروف'); }
        save();
        return JSON.parse(JSON.stringify(result));
    }

    function respond(result, onSuccess, hideFailureMessage, treatNoRecordAsSuccess) {
        showLoadingPanal();
        setTimeout(function () {
            if (result.Code === 0 || (treatNoRecordAsSuccess && result.Code === 8)) {
                if (typeof onSuccess === 'function') onSuccess(result.Code === 0 ? result.Result : undefined);
            } else if (!hideFailureMessage) {
                showMessage(result.Message);
            }
            hideLoadingPanal();
        }, 150);
    }

    function parse(data) {
        if (!data) return {};
        return typeof data === 'string' ? JSON.parse(data) : data;
    }

    function upload(url, formData, onSuccess) {
        var file = formData && formData.get('file');
        if (!file) return;
        var key = 'upload:' + Date.now();
        showLoadingPanal();
        var reader = new FileReader();
        reader.onload = function () {
            storeFile(key, file.type.indexOf('image/') === 0 ? reader.result : 'assets/data/attachments/uploaded-file.svg');
            pendingUpload = key;
            hideLoadingPanal();
            if (typeof onSuccess === 'function') onSuccess(key);
        };
        reader.readAsDataURL(file);
    }

    return { handle: handle, respond: respond, parse: parse, upload: upload };
})();

// The functions script.js calls to reach the server, answered by the demo backend.
function requestToServer(url, type, data, onSuccess, hideFailureMessage, treatNoRecordAsSuccess) {
    DemoBackend.respond(DemoBackend.handle(url, DemoBackend.parse(data)), onSuccess, hideFailureMessage, treatNoRecordAsSuccess);
}

function queryToServer(action, data, onSuccess, treatNoRecordAsSuccess) {
    DemoBackend.respond(DemoBackend.handle(action, DemoBackend.parse(data)), onSuccess, false, treatNoRecordAsSuccess);
}

function commandToServer(action, data, onSuccess) {
    DemoBackend.respond(DemoBackend.handle(action, DemoBackend.parse(data)), onSuccess, false, false);
}

function uploadFileToServer(url, formData, onSuccess) {
    DemoBackend.upload(url, formData, onSuccess);
}
