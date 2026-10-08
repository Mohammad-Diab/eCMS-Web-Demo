# eCMS Web Demo

Front-end demo of **eCMS**, an Arabic (RTL) clinic management system I built in
2019–2020 for an eye clinic client, as part of a small team (the backend was a
separate WCF service). This version runs entirely in the browser on **fictional mock
data**: no server, no real patients, and the clinic's name and branding are replaced
with a neutral "eCMS Clinic".

**Live demo:** https://mohammad-diab.github.io/eCMS-Web-Demo/ (press «دخول» on the login page)

## What you can try

- **Patients list** (`index.htm`): paging, search, add, edit, delete, attachments
  with typed properties, register a visit.
- **Waiting room**: today's queue; send a patient to the doctor, edit or cancel a visit.
- **Doctor room**: the current patient, visit notes (complaint, visual acuity, eye
  pressure, diagnosis, treatment, medication), the eye exam report
  (auto-refractor / keratometer values, manual entry), past visits and paper file,
  return to the waiting room or end the visit.
- **Canceled visits** by doctor and date range.

## How it works

The pages are the original front end. `assets/js/demo-backend.js` answers the calls
that used to go to the WCF API, and `assets/js/demo-data.js` generates 30 fictional
patients, their visits and exam values with dates relative to today, so the waiting
room is always "today". Changes are kept in `sessionStorage` for the open tab; a new
tab starts fresh.

## Run locally

Any static file server works, for example:

```
python -m http.server 8000
```

then open http://localhost:8000/.

## Credits

| Library | Version | Licence |
|---|---|---|
| jQuery | 3.4.1 | MIT |
| Bootstrap (RTL build) + Popper.js | 4.2.1 | MIT |
| jsGrid | 1.5.3 | MIT |
| Moment.js | 2.24.0 | MIT |
| Tempus Dominus (Bootstrap 4) | 5.0.0 | MIT |
| Font Awesome Free | 5.11.2 | Icons CC BY 4.0, fonts SIL OFL 1.1, code MIT |
| Tajawal font | – | SIL OFL 1.1 |

## License

Apache License 2.0, see [LICENSE](LICENSE). Third-party libraries keep their own
licences.

## Author

Mohammad Diab
