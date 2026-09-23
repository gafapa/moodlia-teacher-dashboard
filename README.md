# MoodlIA Teacher Dashboard

A backend-free Moodle dashboard for teachers that runs entirely in the browser. It connects to Moodle's REST web service API with a user-provided token and consolidates courses, deadlines, course resources, and direct Moodle links into one screen. The Moodle URL persists locally; the token remains in session storage and is removed when the browser session ends.

## Run locally

Open `index.html` directly, or serve the folder with any static server:

```bash
python -m http.server 4173
```

Then visit `http://localhost:4173`.

## Moodle requirements

The Moodle site must have web services enabled, REST protocol enabled, and a token for a service that permits these functions:

- `core_webservice_get_site_info`
- `core_course_get_enrolled_courses_by_timeline_classification`
- `core_enrol_get_users_courses`
- `core_calendar_get_action_events_by_courses`
- `core_course_get_contents`
- Optional fallbacks: `mod_assign_get_assignments`, `mod_quiz_get_quizzes_by_courses`

Some Moodle installations block browser-origin requests through CORS. This app intentionally has no backend, so that policy must be allowed by the Moodle site for live synchronization to work.

Remote Moodle URLs must use HTTPS. Plain HTTP is accepted only for loopback development addresses, and authenticated requests reject redirects.

## Quality Checks

```bash
npm run check
```

The tests cover REST request encoding, Moodle errors, nested parameters, course and calendar normalization, deduplication, bounds, and output escaping.

## License

Copyright (C) 2026 Pablo Gallego.

This project is free software released under the GNU General Public License version 3 or later. See `LICENSE`.
