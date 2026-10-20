# MoodlIA Teacher Dashboard

A backend-free Moodle dashboard for teachers that runs entirely in the browser. It connects to Moodle's REST web service API with a user-provided token and consolidates courses, deadlines, course resources, and direct Moodle links into one screen. The Moodle URL persists locally; the token remains in session storage and is removed when the browser session ends.

[Status](#status) · [Getting started](#getting-started) · [Usage](#usage) · [Development](#development) · [Security and privacy](#security-and-privacy) · [Documentation](#documentation) · [License](#license)

## Status

Implemented backend-free dashboard. Live synchronization requires Moodle REST permissions and a site policy that permits the browser requests.

## Getting started

### Run locally

Serve the folder over HTTP with a static server. The application uses JavaScript modules, so opening `index.html` through a `file://` URL is not a supported launch method.

```bash
python -m http.server 4173
```

Then visit `http://localhost:4173`. With Node.js 22 or newer, `npm run dev` starts the bundled static server on the same port. This local server only serves files; Moodle requests still run in the browser.

### Moodle requirements

The Moodle site must have web services enabled, REST protocol enabled, and a token for a service that permits these functions:

- `core_webservice_get_site_info`
- `core_course_get_enrolled_courses_by_timeline_classification`
- `core_enrol_get_users_courses`
- `core_calendar_get_action_events_by_courses`
- `core_course_get_contents`
- Optional fallbacks: `mod_assign_get_assignments`, `mod_quiz_get_quizzes_by_courses`

Some Moodle installations block browser-origin requests through CORS. This app intentionally has no backend, so that policy must be allowed by the Moodle site for live synchronization to work.

Remote Moodle URLs must use HTTPS. Plain HTTP is accepted only for loopback development addresses, and authenticated requests reject redirects.

## Usage

Connect using the Moodle URL and a REST token, then inspect enrolled courses, upcoming deadlines and resource links. The dashboard reads Moodle data; site permissions and available functions determine what can be shown.

## Development

### Quality checks

```bash
npm run check
```

The tests cover REST request encoding, Moodle errors, nested parameters, course and calendar normalization, deduplication, bounds, and output escaping.

## Security and privacy

Moodle requests run directly in the browser. The Moodle URL persists locally; the token stays in session storage. Remote Moodle requires HTTPS, and authenticated requests reject redirects.

## Documentation

- [Project Pages](https://gafapa.github.io/moodlia-teacher-dashboard/)

Build the repository documentation portal with `python tools/build-project-page.py`. Its status comes from this README; purpose and first steps are maintained in `docs/project-page.json`. The `pages.yml` workflow publishes the portal without deploying the application or changing `moodlia.com`.

A compact view of courses, deadlines and resources; [Analyzer Web](https://github.com/gafapa/moodlia-analyzer-web) offers deeper course and student analysis.

- [Source code](https://github.com/gafapa/moodlia-teacher-dashboard)
- [Issue tracker](https://github.com/gafapa/moodlia-teacher-dashboard/issues)
- [MoodlIA website](https://moodlia.com)

## License

Copyright (C) 2026 Pablo Gallego.

This project is free software released under the GNU General Public License version 3 or later. See `LICENSE`.
