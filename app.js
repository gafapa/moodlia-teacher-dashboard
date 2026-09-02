const STORAGE_KEY = "moodle-control-settings";
const SESSION_TOKEN_KEY = "moodle-control-session-token";
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

const icons = {
  book: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/></svg>',
  clock: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  alert: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  check: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="m20 6-11 11-5-5"/></svg>',
  refresh: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/></svg>',
  external: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
  calendar: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/></svg>',
};

const demoCourses = [
  {
    id: 101,
    fullname: "Analisis de datos educativos",
    shortname: "ADE",
    progress: 72,
    viewurl: "https://moodle.example.test/course/view.php?id=101",
    summary: "Modelos de evaluacion, visualizacion y seguimiento del aprendizaje.",
  },
  {
    id: 102,
    fullname: "Programacion web avanzada",
    shortname: "PWA",
    progress: 48,
    viewurl: "https://moodle.example.test/course/view.php?id=102",
    summary: "Arquitectura frontend, APIs REST y despliegue de interfaces.",
  },
  {
    id: 103,
    fullname: "Didactica y evaluacion continua",
    shortname: "DEC",
    progress: 86,
    viewurl: "https://moodle.example.test/course/view.php?id=103",
    summary: "Rubricas, retroalimentacion y secuencias de aprendizaje.",
  },
];

const demoTasks = [
  {
    id: "demo-1",
    title: "Entregar practica de visualizacion",
    courseId: 101,
    courseName: "Analisis de datos educativos",
    dueAt: offsetDate(-1),
    type: "assign",
    url: "https://moodle.example.test/mod/assign/view.php?id=401",
  },
  {
    id: "demo-2",
    title: "Cuestionario sobre APIs REST",
    courseId: 102,
    courseName: "Programacion web avanzada",
    dueAt: offsetDate(1),
    type: "quiz",
    url: "https://moodle.example.test/mod/quiz/view.php?id=502",
  },
  {
    id: "demo-3",
    title: "Revisar foro de retroalimentacion",
    courseId: 103,
    courseName: "Didactica y evaluacion continua",
    dueAt: offsetDate(3),
    type: "forum",
    url: "https://moodle.example.test/mod/forum/view.php?id=603",
  },
  {
    id: "demo-4",
    title: "Subir memoria final del sprint",
    courseId: 102,
    courseName: "Programacion web avanzada",
    dueAt: offsetDate(6),
    type: "assign",
    url: "https://moodle.example.test/mod/assign/view.php?id=511",
  },
];

const demoModules = {
  101: [
    { name: "Guia de la practica final", url: "https://moodle.example.test/mod/resource/view.php?id=710" },
    { name: "Entrega de visualizacion", url: "https://moodle.example.test/mod/assign/view.php?id=401" },
    { name: "Foro de dudas", url: "https://moodle.example.test/mod/forum/view.php?id=712" },
  ],
  102: [
    { name: "API REST de Moodle", url: "https://moodle.example.test/mod/page/view.php?id=810" },
    { name: "Cuestionario de APIs", url: "https://moodle.example.test/mod/quiz/view.php?id=502" },
    { name: "Repositorio del proyecto", url: "https://moodle.example.test/mod/url/view.php?id=812" },
  ],
  103: [
    { name: "Rubrica de evaluacion", url: "https://moodle.example.test/mod/resource/view.php?id=910" },
    { name: "Foro de retroalimentacion", url: "https://moodle.example.test/mod/forum/view.php?id=603" },
  ],
};

let state = {
  settings: readSettings(),
  courses: demoCourses,
  tasks: demoTasks,
  modulesByCourse: demoModules,
  selectedCourseId: demoCourses[0].id,
  filter: "all",
  isLoading: false,
  statusText: "Modo demo",
  error: "",
};

function offsetDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(days < 0 ? 10 : 23, 59, 0, 0);
  return date.toISOString();
}

function readSettings() {
  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    stored = {};
  }
  if (stored.token) {
    try {
      sessionStorage.setItem(SESSION_TOKEN_KEY, stored.token);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ baseUrl: stored.baseUrl || "" }));
    } catch {
      // Continue with in-memory settings when browser storage is unavailable.
    }
  }
  let token = "";
  try {
    token = sessionStorage.getItem(SESSION_TOKEN_KEY) || "";
  } catch {
    token = "";
  }
  return { baseUrl: stored.baseUrl || "", token };
}

function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ baseUrl: settings.baseUrl }));
  } catch {
    // The current connection still works when persistent storage is blocked.
  }
  try {
    if (settings.token) sessionStorage.setItem(SESSION_TOKEN_KEY, settings.token);
    else sessionStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    // The active state retains the token for this page lifecycle.
  }
}

function normalizeServiceBaseUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(String(rawUrl || "").trim());
  } catch {
    throw new Error("La URL de Moodle debe ser una URL absoluta valida.");
  }
  const isLoopback = LOOPBACK_HOSTS.has(parsed.hostname.toLowerCase());
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && isLoopback)) {
    throw new Error("La URL de Moodle debe usar HTTPS. HTTP solo se permite en desarrollo local.");
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error("La URL de Moodle no puede incluir credenciales, parametros ni fragmentos.");
  }
  return `${parsed.origin}${parsed.pathname.replace(/\/+$/, "")}`;
}

class MoodleClient {
  constructor(baseUrl, token) {
    this.baseUrl = normalizeServiceBaseUrl(baseUrl);
    this.token = token.trim();
  }

  async call(functionName, params = {}) {
    const body = new URLSearchParams();
    body.set("wstoken", this.token);
    body.set("wsfunction", functionName);
    body.set("moodlewsrestformat", "json");
    appendParams(body, params);

    const response = await fetch(`${this.baseUrl}/webservice/rest/server.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      redirect: "error",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (payload?.exception || payload?.errorcode) {
      throw new Error(payload.message || payload.errorcode || "Moodle API error");
    }

    return payload;
  }
}

function appendParams(body, params, prefix = "") {
  Object.entries(params).forEach(([key, value]) => {
    const name = prefix ? `${prefix}[${key}]` : key;
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === "object") appendParams(body, item, `${name}[${index}]`);
        else body.set(`${name}[${index}]`, item);
      });
      return;
    }
    if (typeof value === "object") {
      appendParams(body, value, name);
      return;
    }
    body.set(name, value);
  });
}

async function syncMoodle() {
  const baseUrl = document.querySelector("#baseUrl").value.trim();
  const token = document.querySelector("#token").value.trim();
  if (!baseUrl || !token) {
    setState({ error: "Introduce la URL de Moodle y un token de servicio web.", statusText: "Faltan credenciales" });
    return;
  }

  setState({ isLoading: true, error: "", statusText: "Sincronizando..." });

  try {
    const client = new MoodleClient(baseUrl, token);
    const settings = { baseUrl: client.baseUrl, token };
    saveSettings(settings);
    setState({ settings });
    const siteInfo = await client.call("core_webservice_get_site_info");
    const courses = await fetchCourses(client, siteInfo.userid, client.baseUrl);
    const tasks = await fetchTasks(client, courses, client.baseUrl);
    const modulesByCourse = await fetchModules(client, courses.slice(0, 12));
    setState({
      courses,
      tasks,
      modulesByCourse,
      selectedCourseId: courses[0]?.id || null,
      isLoading: false,
      statusText: `Actualizado ${formatTime(new Date())}`,
    });
  } catch (error) {
    setState({
      isLoading: false,
      error: `No se pudo sincronizar Moodle: ${error.message}. Revisa que REST este habilitado, que el token tenga funciones permitidas y que el sitio permita llamadas desde el navegador.`,
      statusText: "Error de conexion",
    });
  }
}

async function fetchCourses(client, userId, baseUrl) {
  const classifications = ["inprogress", "future", "past"];
  const results = await Promise.allSettled(
    classifications.map((classification) =>
      client.call("core_course_get_enrolled_courses_by_timeline_classification", {
        classification,
        limit: 100,
        offset: 0,
        sort: "fullname",
      }),
    ),
  );

  let courses = results
    .flatMap((result) => (result.status === "fulfilled" ? result.value.courses || [] : []))
    .map((course) => normalizeCourse(course, baseUrl));

  if (!courses.length && userId) {
    const fallback = await client.call("core_enrol_get_users_courses", { userid: userId });
    courses = fallback.map((course) => normalizeCourse(course, baseUrl));
  }

  return uniqueBy(courses, "id").sort((a, b) => a.fullname.localeCompare(b.fullname, "es"));
}

async function fetchTasks(client, courses, baseUrl) {
  const courseIds = courses.map((course) => course.id);
  const tasks = [];

  try {
    const calendar = await client.call("core_calendar_get_action_events_by_courses", {
      courseids: courseIds,
      timesortfrom: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 21,
      timesortto: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 90,
    });
    tasks.push(...normalizeCalendarEvents(calendar, courses));
  } catch {
    const [assignments, quizzes] = await Promise.allSettled([
      client.call("mod_assign_get_assignments", { courseids: courseIds }),
      client.call("mod_quiz_get_quizzes_by_courses", { courseids: courseIds }),
    ]);
    if (assignments.status === "fulfilled") {
      tasks.push(...normalizeAssignments(assignments.value, courses, baseUrl));
    }
    if (quizzes.status === "fulfilled") {
      tasks.push(...normalizeQuizzes(quizzes.value, courses, baseUrl));
    }
  }

  return uniqueBy(tasks, "id").sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
}

async function fetchModules(client, courses) {
  const entries = await Promise.allSettled(
    courses.map(async (course) => {
      const sections = await client.call("core_course_get_contents", { courseid: course.id });
      const modules = sections
        .flatMap((section) => section.modules || [])
        .filter((module) => module.visible !== 0 && module.url)
        .slice(0, 6)
        .map((module) => ({ name: module.name, url: module.url, modname: module.modname }));
      return [course.id, modules];
    }),
  );

  return Object.fromEntries(entries.filter((entry) => entry.status === "fulfilled").map((entry) => entry.value));
}

function normalizeCourse(course, baseUrl) {
  return {
    id: Number(course.id),
    fullname: stripHtml(course.fullname || course.displayname || course.shortname || "Curso sin nombre"),
    shortname: stripHtml(course.shortname || ""),
    progress: clamp(Number(course.progress ?? course.completedprogress ?? 0), 0, 100),
    viewurl: course.viewurl || `${baseUrl.replace(/\/+$/, "")}/course/view.php?id=${course.id}`,
    summary: stripHtml(course.summary || course.coursecategory || ""),
  };
}

function normalizeCalendarEvents(calendar, courses) {
  const byCourse = new Map(courses.map((course) => [Number(course.id), course]));
  return Object.values(calendar.groupedbycourse || {})
    .flatMap((group) => group.events || [])
    .concat(calendar.events || [])
    .filter((event) => event.timesort || event.timestart)
    .map((event) => {
      const courseId = Number(event.course?.id || event.courseid);
      const course = byCourse.get(courseId);
      return {
        id: `calendar-${event.id}`,
        title: stripHtml(event.name || event.action?.name || "Actividad pendiente"),
        courseId,
        courseName: stripHtml(event.course?.fullname || course?.fullname || "Curso"),
        dueAt: new Date((event.timesort || event.timestart) * 1000).toISOString(),
        type: event.modulename || event.eventtype || "calendar",
        url: event.action?.url || event.url || course?.viewurl || "#",
      };
    });
}

function normalizeAssignments(payload, courses, baseUrl) {
  const byCourse = new Map(courses.map((course) => [Number(course.id), course]));
  return (payload.courses || []).flatMap((course) =>
    (course.assignments || [])
      .filter((assignment) => assignment.duedate)
      .map((assignment) => ({
        id: `assign-${assignment.id}`,
        title: stripHtml(assignment.name),
        courseId: Number(course.id),
        courseName: stripHtml(course.fullname || byCourse.get(Number(course.id))?.fullname || "Curso"),
        dueAt: new Date(assignment.duedate * 1000).toISOString(),
        type: "assign",
        url: `${baseUrl.replace(/\/+$/, "")}/mod/assign/view.php?id=${assignment.cmid}`,
      })),
  );
}

function normalizeQuizzes(payload, courses, baseUrl) {
  const byCourse = new Map(courses.map((course) => [Number(course.id), course]));
  return (payload.quizzes || [])
    .filter((quiz) => quiz.timeclose)
    .map((quiz) => ({
      id: `quiz-${quiz.id}`,
      title: stripHtml(quiz.name),
      courseId: Number(quiz.course),
      courseName: byCourse.get(Number(quiz.course))?.fullname || "Curso",
      dueAt: new Date(quiz.timeclose * 1000).toISOString(),
      type: "quiz",
      url: `${baseUrl.replace(/\/+$/, "")}/mod/quiz/view.php?id=${quiz.coursemodule}`,
    }));
}

function setState(patch) {
  state = { ...state, ...patch };
  render();
}

function selectCourse(courseId) {
  setState({ selectedCourseId: Number(courseId) });
}

function setFilter(filter) {
  setState({ filter });
}

function useDemoData() {
  setState({
    courses: demoCourses,
    tasks: demoTasks,
    modulesByCourse: demoModules,
    selectedCourseId: demoCourses[0].id,
    filter: "all",
    error: "",
    statusText: "Modo demo",
  });
}

function getFilteredTasks() {
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + 7);

  return state.tasks.filter((task) => {
    const due = new Date(task.dueAt);
    if (state.filter === "today") return due.toDateString() === now.toDateString();
    if (state.filter === "week") return due >= startOfDay(now) && due <= weekEnd;
    if (state.filter === "overdue") return due < now;
    if (state.filter === "course") return task.courseId === state.selectedCourseId;
    return true;
  });
}

function computeMetrics() {
  const now = new Date();
  const inSevenDays = new Date(now);
  inSevenDays.setDate(now.getDate() + 7);
  return {
    activeCourses: state.courses.length,
    pending: state.tasks.length,
    soon: state.tasks.filter((task) => {
      const due = new Date(task.dueAt);
      return due >= now && due <= inSevenDays;
    }).length,
    overdue: state.tasks.filter((task) => new Date(task.dueAt) < now).length,
  };
}

function render() {
  const app = document.querySelector("#app");
  const selectedCourse = state.courses.find((course) => course.id === state.selectedCourseId) || state.courses[0];
  const metrics = computeMetrics();
  const tasks = getFilteredTasks();

  app.innerHTML = `
    <main class="dashboard">
      ${renderTopbar()}
      ${state.error ? `<div class="error-box">${escapeHtml(state.error)}</div>` : ""}
      ${renderConnectionPanel()}
      ${renderMetrics(metrics)}
      ${renderCourseRail(selectedCourse)}
      ${renderMainPanel(tasks)}
      ${renderDetailPanel(selectedCourse)}
    </main>
  `;

  bindEvents();
}

function renderTopbar() {
  return `
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">${icons.book}</div>
        <div>
          <h1 class="brand-title">MoodlIA Teacher Dashboard</h1>
          <p class="brand-subtitle">Cursos, entregas y enlaces accionables en una sola pantalla.</p>
        </div>
      </div>
      <div class="top-actions">
        <span class="sync-state">${escapeHtml(state.statusText)}</span>
        <button class="secondary-button" data-action="demo">${icons.check}Demo</button>
        <button class="primary-button" data-action="sync" ${state.isLoading ? "disabled" : ""}>${icons.refresh}Actualizar</button>
      </div>
    </header>
  `;
}

function renderConnectionPanel() {
  return `
    <section class="connection-panel" aria-label="Conectar Moodle">
      <div class="field">
        <label for="baseUrl">URL de Moodle</label>
        <input id="baseUrl" autocomplete="url" placeholder="https://moodle.tu-centro.edu" value="${escapeHtml(state.settings.baseUrl || "")}" />
      </div>
      <div class="field">
        <label for="token">Token web service</label>
        <div class="input-row">
          <input id="token" type="password" autocomplete="off" placeholder="Token REST" value="${escapeHtml(state.settings.token || "")}" />
          <button class="ghost-button" data-action="toggle-token" type="button">Ver</button>
        </div>
        <small>El token solo se conserva durante esta sesion del navegador.</small>
      </div>
      <button class="primary-button" data-action="sync" ${state.isLoading ? "disabled" : ""}>Conectar Moodle</button>
    </section>
  `;
}

function renderMetrics(metrics) {
  const items = [
    { label: "Cursos activos", value: metrics.activeCourses, note: "en seguimiento", icon: icons.book },
    { label: "Pendiente", value: metrics.pending, note: "acciones abiertas", icon: icons.check },
    { label: "Vence pronto", value: metrics.soon, note: "proximos 7 dias", icon: icons.clock, tone: "warning" },
    { label: "Atrasado", value: metrics.overdue, note: "requiere atencion", icon: icons.alert, tone: "danger" },
  ];

  return `
    <section class="metrics" aria-label="Resumen">
      ${items
        .map(
          (item) => `
        <article class="metric ${item.tone || ""}">
          <div>
            <p class="metric-label">${item.label}</p>
            <p class="metric-value">${item.value}</p>
            <p class="metric-note">${item.note}</p>
          </div>
          <div class="metric-icon">${item.icon}</div>
        </article>
      `,
        )
        .join("")}
    </section>
  `;
}

function renderCourseRail(selectedCourse) {
  return `
    <aside class="course-rail">
      <div class="panel-header">
        <h2 class="panel-title">Cursos</h2>
        <span class="panel-meta">${state.courses.length}</span>
      </div>
      <div class="course-list">
        ${state.courses
          .map(
            (course) => `
          <button class="course-item ${selectedCourse?.id === course.id ? "active" : ""}" data-course-id="${course.id}">
            <div>
              <p class="course-name">${escapeHtml(course.fullname)}</p>
              <p class="course-meta">${escapeHtml(course.shortname || "Curso Moodle")}</p>
            </div>
            <span class="progress-ring" style="--progress: ${course.progress || 0}">${Math.round(course.progress || 0)}%</span>
          </button>
        `,
          )
          .join("")}
      </div>
    </aside>
  `;
}

function renderMainPanel(tasks) {
  const loadingRows = Array.from({ length: 4 })
    .map(() => `<div class="timeline-row loading-row"><span class="urgency-bar"></span><div></div></div>`)
    .join("");

  return `
    <section class="main-panel">
      <div class="toolbar">
        <div>
          <h2 class="panel-title">Cosas que hacer</h2>
          <span class="panel-meta">Ordenado por fecha limite</span>
        </div>
        <div class="filters">
          ${renderFilter("all", "Todo")}
          ${renderFilter("today", "Hoy")}
          ${renderFilter("week", "Esta semana")}
          ${renderFilter("overdue", "Atrasado")}
          ${renderFilter("course", "Curso")}
        </div>
      </div>
      <div class="timeline">
        ${
          state.isLoading
            ? loadingRows
            : tasks.length
              ? tasks.map(renderTask).join("")
              : `<div class="empty-state"><div><strong>Sin acciones pendientes</strong><span>No hay tareas para el filtro seleccionado.</span></div></div>`
        }
      </div>
    </section>
  `;
}

function renderFilter(filter, label) {
  return `<button class="filter-button ${state.filter === filter ? "active" : ""}" data-filter="${filter}">${label}</button>`;
}

function renderTask(task) {
  const due = new Date(task.dueAt);
  const urgency = getUrgency(due);
  return `
    <article class="timeline-row ${urgency}">
      <span class="urgency-bar"></span>
      <div>
        <h3 class="task-title">${escapeHtml(task.title)}</h3>
        <div class="task-meta">
          <span class="tag">${icons.book}${escapeHtml(task.courseName)}</span>
          <span class="tag">${icons.calendar}<span class="deadline ${urgency}">${formatDueDate(due)}</span></span>
          <span class="tag">${escapeHtml(task.type || "actividad")}</span>
        </div>
      </div>
      <a class="link-button" href="${escapeAttribute(safeMoodleUrl(task.url))}" target="_blank" rel="noreferrer">Abrir en Moodle ${icons.external}</a>
    </article>
  `;
}

function renderDetailPanel(course) {
  if (!course) {
    return `<aside class="detail-panel"><div class="empty-state"><div><strong>Sin curso seleccionado</strong></div></div></aside>`;
  }

  const modules = state.modulesByCourse[course.id] || [];
  const courseTasks = state.tasks.filter((task) => task.courseId === course.id).slice(0, 4);

  return `
    <aside class="detail-panel">
      <div class="panel-header">
        <h2 class="panel-title">Detalle</h2>
        <span class="panel-meta">${Math.round(course.progress || 0)}%</span>
      </div>
      <div class="detail-body">
        <section class="selected-course">
          <h2>${escapeHtml(course.fullname)}</h2>
          <p>${escapeHtml(course.summary || "Curso Moodle sincronizado con enlaces directos y actividades recientes.")}</p>
          <div class="progress-block">
            <div class="progress-track"><div class="progress-fill" style="width: ${course.progress || 0}%"></div></div>
            <span class="panel-meta">Progreso del curso</span>
          </div>
          <div class="quick-links">
            <a class="quick-link" href="${escapeAttribute(safeMoodleUrl(course.viewurl))}" target="_blank" rel="noreferrer">Abrir curso ${icons.external}</a>
            ${courseTasks
              .map(
                (task) => `<a class="quick-link" href="${escapeAttribute(safeMoodleUrl(task.url))}" target="_blank" rel="noreferrer">${escapeHtml(task.title)} ${icons.external}</a>`,
              )
              .join("")}
          </div>
        </section>
        <section>
          <p class="section-label">Recursos recientes</p>
          <div class="module-list">
            ${
              modules.length
                ? modules
                    .map(
                      (module) => `<a class="module-link" href="${escapeAttribute(safeMoodleUrl(module.url))}" target="_blank" rel="noreferrer"><span>${escapeHtml(module.name)}</span>${icons.external}</a>`,
                    )
                    .join("")
                : `<div class="empty-state"><div><strong>Sin recursos cargados</strong><span>Actualiza Moodle para ver enlaces del curso.</span></div></div>`
            }
          </div>
        </section>
      </div>
    </aside>
  `;
}

function bindEvents() {
  document.querySelectorAll("[data-action='sync']").forEach((button) => button.addEventListener("click", syncMoodle));
  document.querySelector("[data-action='demo']")?.addEventListener("click", useDemoData);
  document.querySelector("[data-action='toggle-token']")?.addEventListener("click", () => {
    const input = document.querySelector("#token");
    input.type = input.type === "password" ? "text" : "password";
  });
  document.querySelectorAll("[data-course-id]").forEach((button) =>
    button.addEventListener("click", () => selectCourse(button.dataset.courseId)),
  );
  document.querySelectorAll("[data-filter]").forEach((button) =>
    button.addEventListener("click", () => setFilter(button.dataset.filter)),
  );
}

function getUrgency(due) {
  const now = new Date();
  const soon = new Date(now);
  soon.setDate(now.getDate() + 3);
  if (due < now) return "overdue";
  if (due <= soon) return "soon";
  return "normal";
}

function formatDueDate(date) {
  const formatter = new Intl.DateTimeFormat("es", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  return formatter.format(date);
}

function formatTime(date) {
  return new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function uniqueBy(items, key) {
  const seen = new Set();
  return items.filter((item) => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function stripHtml(value) {
  if (typeof document === "undefined") {
    return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
  const element = document.createElement("div");
  element.innerHTML = String(value || "");
  return element.textContent || element.innerText || "";
}

function clamp(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value || "#");
}

function safeMoodleUrl(value) {
  try {
    const candidate = new URL(String(value || ""));
    if (candidate.username || candidate.password) return "#";
    const candidateBase = normalizeServiceBaseUrl(candidate.origin);
    if (state.settings.baseUrl) {
      const configured = new URL(normalizeServiceBaseUrl(state.settings.baseUrl));
      if (candidate.origin !== configured.origin) return "#";
    }
    return candidateBase ? candidate.href : "#";
  } catch {
    return "#";
  }
}

if (typeof document !== "undefined") {
  render();
}

export {
  MoodleClient,
  appendParams,
  clamp,
  escapeHtml,
  fetchCourses,
  fetchModules,
  fetchTasks,
  getUrgency,
  normalizeAssignments,
  normalizeCalendarEvents,
  normalizeCourse,
  normalizeQuizzes,
  normalizeServiceBaseUrl,
  readSettings,
  safeMoodleUrl,
  saveSettings,
  stripHtml,
  uniqueBy
};
