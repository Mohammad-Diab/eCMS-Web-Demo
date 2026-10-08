// eCMS demo: generates the fictional clinic data used by demo-backend.js.
// Every name, phone number and address here is made up. Dates are computed
// from "now", so the waiting room and the doctor room always show today.
var DemoData = (function () {
    'use strict';

    function rng(seed) { // mulberry32: same data on every load, only the dates move
        return function () {
            seed |= 0; seed = seed + 0x6D2B79F5 | 0;
            var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    var doctors = [
        { Id: 1, FullName: 'د. سامر النجار' },
        { Id: 2, FullName: 'د. ريم الخطيب' }
    ];

    var visitKinds = [
        { Id: 1, DescriptionAr: 'مراجعة' },
        { Id: 2, DescriptionAr: 'زيارة جديدة' },
        { Id: 3, DescriptionAr: 'فحص نظر' },
        { Id: 4, DescriptionAr: 'متابعة بعد عملية' }
    ];

    var noteTypes = [
        { Id: 1, DescriptionAr: 'الشكوى الرئيسية', Description: 'Chief complaint' },
        { Id: 2, DescriptionAr: 'حدة البصر', Description: 'Visual acuity' },
        { Id: 3, DescriptionAr: 'ضغط العين', Description: 'Intraocular pressure' },
        { Id: 4, DescriptionAr: 'التشخيص', Description: 'Diagnosis' },
        { Id: 5, DescriptionAr: 'الخطة العلاجية', Description: 'Treatment plan' },
        { Id: 6, DescriptionAr: 'الدواء الموصوف', Description: 'Prescribed medication' }
    ];

    var attachmentCategories = [
        { Id: 1, DescriptionAr: 'وصفة طبية' },
        { Id: 2, DescriptionAr: 'صورة قاع العين' },
        { Id: 3, DescriptionAr: 'تقرير مخبري' },
        { Id: 4, DescriptionAr: 'إضبارة ورقية' }
    ];

    // property ids match PropertiesName in script.js; BasicTypeId 1 = date, 2 = text
    var attachmentProperties = [
        { Id: 0, DescriptionAr: 'تاريخ آخر زيارة', BasicTypeId: 1 },
        { Id: 1, DescriptionAr: 'اسم المريض', BasicTypeId: 2 },
        { Id: 2, DescriptionAr: 'الدواء الموصوف', BasicTypeId: 2 }
    ];

    // first name, last name, gender (1 male, 2 female), age, job, note
    var people = [
        ['أحمد', 'الحلبي', 1, 58, 'مهندس مدني', 'مريض سكري منذ عشر سنوات'],
        ['سارة', 'الأحمد', 2, 27, 'مصممة', ''],
        ['خالد', 'العلي', 1, 66, 'متقاعد', 'عملية ساد سابقة في العين اليسرى'],
        ['ليلى', 'الشامي', 2, 34, 'معلمة', 'حساسية من البنسلين'],
        ['يوسف', 'النوري', 1, 9, 'طالب', 'يحضر مع والدته'],
        ['هدى', 'الحسن', 2, 72, 'ربة منزل', 'ارتفاع ضغط الدم'],
        ['عمر', 'الصالح', 1, 41, 'محاسب', ''],
        ['رنا', 'المصري', 2, 23, 'طالبة جامعية', 'تستخدم عدسات لاصقة'],
        ['سامي', 'القاسم', 1, 50, 'سائق', 'مريض سكري'],
        ['مريم', 'البيطار', 2, 15, 'طالبة', ''],
        ['مازن', 'الحداد', 1, 63, 'نجار', ''],
        ['نور', 'العمر', 2, 31, 'صيدلانية', ''],
        ['فادي', 'الزين', 1, 38, 'مبرمج', 'يعمل ساعات طويلة على الحاسوب'],
        ['دانة', 'السيد', 2, 7, 'طالبة', 'تحضر مع والدها'],
        ['باسل', 'الرفاعي', 1, 45, 'محامٍ', ''],
        ['لمى', 'الجابي', 2, 56, 'موظفة', 'قصور غدة درقية'],
        ['طارق', 'الطويل', 1, 81, 'متقاعد', 'يستخدم عصا للمشي'],
        ['سلمى', 'الحمصي', 2, 29, 'ممرضة', ''],
        ['وليد', 'الكردي', 1, 52, 'تاجر', 'ارتفاع ضغط العين في العائلة'],
        ['هبة', 'الموصلي', 2, 44, 'خياطة', ''],
        ['حسام', 'الدباغ', 1, 19, 'طالب جامعي', ''],
        ['جود', 'العطار', 2, 12, 'طالبة', 'تلبس نظارة منذ عمر 6 سنوات'],
        ['نزار', 'السقا', 1, 69, 'مهندس متقاعد', 'مريض سكري وضغط'],
        ['ميساء', 'الخياط', 2, 61, 'ربة منزل', ''],
        ['رامي', 'الحكيم', 1, 33, 'طبيب أسنان', ''],
        ['رهف', 'اليوسف', 2, 25, 'مهندسة معمارية', ''],
        ['كريم', 'الشهابي', 1, 47, 'موظف بنك', ''],
        ['غادة', 'العبدالله', 2, 39, 'محامية', 'صداع متكرر'],
        ['زياد', 'الفارس', 1, 74, 'متقاعد', 'عملية ساد في العين اليمنى'],
        ['تالا', 'المحمد', 2, 5, 'طفلة', 'أول فحص نظر']
    ];

    var addresses = ['حي الياسمين، شارع 4', 'حي الزيتون، بناء 12', 'المدينة الجديدة، جادة 3', 'شارع الجامعة، بناء 21',
        'حي الربيع، شارع الورد', 'ضاحية النور، بناء 8', 'حي البساتين، شارع 9', 'شارع النخيل، بناء 5',
        'حي السلام، جادة 7', 'حي الأمل، شارع 15'];

    // clinical pictures used for past visits: complaint, diagnosis, plan, medication
    var cases = {
        myopia: ['ضعف في الرؤية البعيدة وصداع عند القراءة', 'قصر نظر (Myopia) في العينين', 'نظارة طبية جديدة ومراجعة بعد سنة', 'دموع اصطناعية 3 مرات يومياً عند الحاجة'],
        allergy: ['حكة واحمرار ودموع في العينين', 'التهاب ملتحمة تحسسي', 'تجنب فرك العينين وكمادات باردة', 'قطرة أولوباتادين مرتين يومياً لمدة أسبوعين'],
        dryEye: ['جفاف وحرقة في العينين مع العمل على الحاسوب', 'جفاف العين', 'قاعدة 20-20-20 وتقليل وقت الشاشات', 'دموع اصطناعية 4 مرات يومياً'],
        cataract: ['تشوش تدريجي في الرؤية وتوهج حول الأضواء', 'ساد (كاتاراكت) أولي في العين اليمنى', 'متابعة كل 6 أشهر وتقييم الحاجة للجراحة', 'لا يوجد'],
        glaucoma: ['مراجعة دورية لضغط العين', 'ارتفاع ضغط العين (Ocular hypertension)', 'قياس الضغط كل 3 أشهر وفحص الساحة البصرية', 'قطرة لاتانوبروست مساءً في العينين'],
        diabetic: ['فحص دوري لمريض سكري', 'اعتلال شبكية سكري غير تكاثري خفيف', 'ضبط السكر ومراجعة بعد 6 أشهر مع تصوير قاع العين', 'لا يوجد'],
        postOp: ['متابعة بعد عملية ساد', 'حالة جيدة بعد زرع عدسة داخل العين', 'الاستمرار على القطرات وتجنب الماء أسبوعاً', 'قطرة مضاد حيوي وكورتيزون 4 مرات يومياً'],
        child: ['ضعف نظر لاحظه الأهل عند مشاهدة التلفاز', 'مد نظر مع كسل في العين اليسرى', 'نظارة وتغطية العين السليمة ساعتين يومياً', 'لا يوجد'],
        presbyopia: ['صعوبة في القراءة عن قرب', 'طول نظر شيخوخي (Presbyopia)', 'نظارة قراءة +2.00', 'لا يوجد']
    };

    var waitingNotes = ['موعد مسبق', 'أول زيارة', 'يحتاج قطرة توسيع قبل الفحص', '', 'حضر مع مرافق', '', 'طلب الدخول بسرعة لظرف عمل', ''];
    var cancelReasons = ['اعتذر المريض بسبب السفر', 'تأخر المريض عن موعده', 'الطبيب لديه عملية طارئة', 'تم تأجيل الموعد للأسبوع القادم', 'المريض شعر بتحسن ولم يعد بحاجة للزيارة'];

    function pick(r, list) { return list[Math.floor(r() * list.length)]; }
    function q(x, step) { return Math.round(x / step) * step; }
    function signed(x) { return (x > 0 ? '+' : '') + x.toFixed(2); }

    function caseFor(r, p) {
        var age = p[3], note = p[5];
        if (age < 14) return 'child';
        if (note.indexOf('سكري') > -1) return 'diabetic';
        if (note.indexOf('ساد') > -1) return 'postOp';
        if (note.indexOf('ضغط العين') > -1) return 'glaucoma';
        if (note.indexOf('حاسوب') > -1) return 'dryEye';
        if (age >= 65) return pick(r, ['cataract', 'glaucoma', 'presbyopia']);
        if (age >= 42) return pick(r, ['presbyopia', 'glaucoma', 'dryEye']);
        return pick(r, ['myopia', 'myopia', 'allergy', 'dryEye']);
    }

    // auto-refractor / keratometer (KR-8800) output for one eye, as the doctor room expects it
    function eyeTest(r, kind, eye) {
        var sph = kind === 'child' ? q(1.5 + r() * 2.5, 0.25) :
            kind === 'presbyopia' ? q(0.5 + r() * 1.5, 0.25) :
            kind === 'myopia' ? -q(0.75 + r() * 5, 0.25) : q(-1.5 + r() * 2.25, 0.25);
        var cyl = -q(0.25 + r() * 1.5, 0.25);
        var axis = Math.round(r() * 180);
        var d1 = q(41.5 + r() * 3.5, 0.25);
        var d2 = q(d1 + Math.abs(cyl) * (0.6 + r() * 0.6), 0.25);
        var a1 = Math.round(r() * 180), a2 = (a1 + 90) % 180;
        var mm1 = 337.5 / d1, mm2 = 337.5 / d2;
        return {
            EYE: eye, SPH: signed(sph), CYL: cyl.toFixed(2), AXIS: String(axis),
            MM1: mm1.toFixed(2), D1: d1.toFixed(2), A1: String(a1),
            MM2: mm2.toFixed(2), D2: d2.toFixed(2), A2: String(a2),
            MM_AV: ((mm1 + mm2) / 2).toFixed(2), D_CYL: (d1 - d2).toFixed(2), A_CYL: String(Math.min(a1, a2)),
            Note: '', FileName: ''
        };
    }

    function acuity(r, kind) {
        var good = ['6/6', '6/6', '6/7.5', '6/9'], fair = ['6/9', '6/12', '6/18', '6/24'];
        var list = (kind === 'cataract' || kind === 'child' || kind === 'myopia') ? fair : good;
        return 'العين اليمنى ' + pick(r, list) + '، العين اليسرى ' + pick(r, list) + ' (بعد التصحيح 6/6)';
    }

    function pressure(r, kind) {
        var base = kind === 'glaucoma' ? 23 : 13;
        var right = base + Math.round(r() * 5), left = base + Math.round(r() * 5);
        return 'العين اليمنى ' + right + ' ملم زئبق، العين اليسرى ' + left + ' ملم زئبق';
    }

    function generate(now) {
        var r = rng(20191103);
        now = moment(now);
        var today = now.clone().startOf('day');
        var db = {
            generatedOn: today.format('YYYY-MM-DD'),
            doctors: doctors, visitKinds: visitKinds, noteTypes: noteTypes.slice(),
            attachmentCategories: attachmentCategories, attachmentProperties: attachmentProperties,
            patients: [], visits: [], notes: [], eyeTests: [], attachments: [],
            seq: { patient: 0, visit: 0, note: 0, eyeTest: 0, attachment: 0, noteType: 100 }
        };

        function addNotes(visitId, kind, full) {
            var c = cases[kind];
            var values = [c[0], acuity(r, kind), pressure(r, kind), c[1], c[2], c[3]];
            var count = full ? 6 : 3;
            for (var i = 0; i < count; i++) {
                db.notes.push({ Id: ++db.seq.note, VisitId: visitId, VisitNoteTypeId: i + 1, Note: values[i] });
            }
        }

        function addEyeTests(visitId, kind, seqCount) {
            for (var s = 1; s <= seqCount; s++) {
                ['R', 'L'].forEach(function (eye) {
                    var t = eyeTest(r, kind, eye);
                    t.Id = ++db.seq.eyeTest; t.VisitId = visitId; t.Seq = s;
                    db.eyeTests.push(t);
                });
            }
        }

        function visit(p, at, status, doctorId, kindId, extra) {
            var v = {
                Id: ++db.seq.visit, PatientId: p.Id, DoctorId: doctorId, VisitKindId: kindId,
                ArrivalTime: at.format('YYYY-MM-DD HH:mm'), EnterTime: '', EndTime: '',
                StatusId: status, CancelingReason: '', Note: ''
            };
            for (var k in extra) { v[k] = extra[k]; }
            db.visits.push(v);
            return v;
        }

        people.forEach(function (p, i) {
            var birth = today.clone().subtract(p[3], 'years').subtract(Math.floor(r() * 360), 'days');
            var hasPaperFile = i % 4 === 0;
            var patient = {
                Id: ++db.seq.patient,
                Number: hasPaperFile ? 1200 + Math.floor(r() * 8600) : 20001 + i,
                FirstName: p[0], LastName: p[1], GenderId: p[2],
                BirthDate: birth.format('YYYY-MM-DD'),
                Phone: '011-000-' + (2001 + i), Mobile: '0900-000-' + (101 + i),
                Address: pick(r, addresses), Job: p[4], Note: p[5], IsDeleted: false
            };
            db.patients.push(patient);
            var kind = caseFor(r, p);
            patient.kind = kind;

            // past visits, oldest first
            var pastCount = 1 + Math.floor(r() * 4);
            var daysAgo = 30 + Math.floor(r() * 650);
            for (var k = 0; k < pastCount; k++) {
                var at = today.clone().subtract(daysAgo, 'days').hour(9 + Math.floor(r() * 8)).minute(Math.floor(r() * 12) * 5);
                var canceled = r() < 0.15;
                var v = visit(patient, at, canceled ? 3 : 4, 1 + Math.floor(r() * 2), k === 0 ? 2 : (kind === 'postOp' ? 4 : pick(r, [1, 1, 3])), {});
                if (canceled) {
                    v.CancelingReason = pick(r, cancelReasons);
                } else {
                    var enter = at.clone().add(10 + Math.floor(r() * 50), 'minutes');
                    v.EnterTime = enter.format('YYYY-MM-DD HH:mm');
                    v.EndTime = enter.clone().add(10 + Math.floor(r() * 20), 'minutes').format('YYYY-MM-DD HH:mm');
                    addNotes(v.Id, kind, true);
                    addEyeTests(v.Id, kind, 1 + Math.floor(r() * 2));
                }
                daysAgo = Math.max(1, Math.floor(daysAgo * (0.3 + r() * 0.5)));
            }

            // attachments
            var lastVisit = db.visits.filter(function (x) { return x.PatientId === patient.Id && x.StatusId === 4; }).pop();
            var lastDate = lastVisit ? lastVisit.ArrivalTime.substr(0, 10) : today.format('YYYY-MM-DD');
            function attach(categoryId, name, file, props) {
                db.attachments.push({ Id: ++db.seq.attachment, PatientId: patient.Id, CategoryId: categoryId, FileName: name, File: file, Properties: props || [] });
            }
            if (hasPaperFile) {
                attach(4, 'إضبارة ورقية - صفحة 1', 'assets/data/attachments/paper-file.svg', [{ PropertyId: 0, PropertyValue: today.clone().subtract(4 + i, 'years').format('YYYY-MM-DD') }]);
                attach(4, 'إضبارة ورقية - صفحة 2', 'assets/data/attachments/paper-file-2.svg', []);
            }
            if (i % 3 === 0 || kind === 'allergy' || kind === 'glaucoma') {
                attach(1, 'وصفة طبية', 'assets/data/attachments/prescription.svg', [
                    { PropertyId: 0, PropertyValue: lastDate },
                    { PropertyId: 2, PropertyValue: cases[kind][3] }]);
            }
            if (kind === 'diabetic' || kind === 'cataract' || kind === 'glaucoma') {
                attach(2, 'صورة قاع العين - اليمنى', 'assets/data/attachments/fundus-right.svg', [{ PropertyId: 0, PropertyValue: lastDate }]);
                attach(2, 'صورة قاع العين - اليسرى', 'assets/data/attachments/fundus-left.svg', [{ PropertyId: 0, PropertyValue: lastDate }]);
            }
            if (kind === 'diabetic') {
                attach(3, 'تحليل السكر التراكمي', 'assets/data/attachments/lab-report.svg', [{ PropertyId: 0, PropertyValue: lastDate }]);
            }
        });

        // today: completed, canceled, in the doctor room and waiting
        var order = [2, 6, 12, 0, 18, 9, 25, 4, 15, 22, 28, 7, 19];
        var minutesAgo = [215, 190, 160, 70, 64, 52, 41, 33, 26, 18, 11, 140, 95];
        order.forEach(function (pi, n) {
            var p = db.patients[pi];
            var at = now.clone().subtract(minutesAgo[n], 'minutes');
            var doctorId = n % 3 === 1 ? 2 : 1;
            var kindId = p.kind === 'postOp' ? 4 : (n % 4 === 0 ? 2 : pick(r, [1, 3]));
            if (n < 3) { // finished earlier today
                var v = visit(p, at, 4, doctorId, kindId, {
                    EnterTime: at.clone().add(20, 'minutes').format('YYYY-MM-DD HH:mm'),
                    EndTime: at.clone().add(35, 'minutes').format('YYYY-MM-DD HH:mm')
                });
                addNotes(v.Id, p.kind, true);
                addEyeTests(v.Id, p.kind, 1);
            } else if (n === 3) { // with doctor 1 now
                var cur = visit(p, at, 2, 1, 1, { EnterTime: now.clone().subtract(12, 'minutes').format('YYYY-MM-DD HH:mm'), Note: 'مراجعة لقياس السكر والشبكية' });
                addNotes(cur.Id, p.kind, false);
                addEyeTests(cur.Id, p.kind, 1);
            } else if (n >= 11) { // canceled today
                visit(p, at, 3, doctorId, kindId, { CancelingReason: pick(r, cancelReasons) });
            } else { // waiting room
                visit(p, at, 1, doctorId, kindId, { Note: waitingNotes[n % waitingNotes.length] });
            }
        });
        db.patients.forEach(function (p) { delete p.kind; });
        return db;
    }

    return { generate: generate };
})();
