(() => {
  const config = window.OUTCAST_CONFIG || {};
  const configured = config.supabaseUrl && config.supabaseAnonKey && !config.supabaseUrl.includes("TU-PROYECTO") && !config.supabaseAnonKey.includes("TU-CLAVE");
  const db = configured && window.supabase ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey) : null;
  const form = document.querySelector("#survey-form");
  const errorBox = document.querySelector("#form-error");
  const success = document.querySelector("#success");
  const adminToggle = document.querySelector("#admin-toggle");
  const loginForm = document.querySelector("#login-form");
  const adminPanel = document.querySelector("#admin-panel");
  const adminError = document.querySelector("#admin-error");
  const progressBar = document.querySelector("#progress-bar");
  const progressText = document.querySelector("#progress-text");
  document.querySelector("#year").textContent = new Date().getFullYear();

  const questions = [...form.querySelectorAll("fieldset[data-required='true']")];
  const answered = (q) => {
    const options = q.querySelector(".options");
    if (options) return !!options.querySelector("input:checked");
    const input = q.querySelector("textarea");
    return !!input?.value.trim();
  };
  const updateProgress = () => {
    const count = questions.filter(answered).length;
    progressText.textContent = `${count} DE 9 OBLIGATORIAS`;
    progressBar.style.width = `${(count / questions.length) * 100}%`;
  };
  form.addEventListener("input", updateProgress);
  form.addEventListener("change", updateProgress);
  updateProgress();

  function getAnswers() {
    const answers = {};
    for (const group of form.querySelectorAll(".options[data-name]")) {
      const selected = [...group.querySelectorAll("input:checked")].map((input) => input.value);
      answers[group.dataset.name] = group.dataset.type === "radio" ? (selected[0] || "") : selected;
    }
    for (const input of form.querySelectorAll("textarea[name]")) answers[input.name] = input.value.trim();
    return answers;
  }
  const generateCode = () => {
    const raw = crypto.randomUUID().replaceAll("-", "").toUpperCase();
    return `OUT-${raw.slice(0, 8)}-${raw.slice(8, 12)}`;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.hidden = true;
    const missing = questions.find((q) => !answered(q));
    if (missing) {
      errorBox.textContent = "Completa todas las preguntas obligatorias antes de enviar.";
      errorBox.hidden = false;
      missing.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!db) {
      errorBox.textContent = "La encuesta aún no está conectada. Configura Supabase siguiendo los pasos del README para empezar a recibir respuestas.";
      errorBox.hidden = false;
      return;
    }
    const button = form.querySelector(".submit-button");
    button.disabled = true;
    button.querySelector("span").textContent = "ENVIANDO…";
    const code = generateCode();
    const { error } = await db.from("survey_responses").insert({ tracking_code: code, answers: getAnswers() });
    button.disabled = false;
    button.querySelector("span").textContent = "ENVIAR MIS RESPUESTAS";
    if (error) {
      errorBox.textContent = "No se pudo guardar tu respuesta. Revisa tu conexión e inténtalo de nuevo.";
      errorBox.hidden = false;
      return;
    }
    document.querySelector("#tracking-code").textContent = code;
    form.hidden = true;
    document.querySelector(".progress-wrap").hidden = true;
    success.hidden = false;
    success.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  document.querySelector("#copy-code").addEventListener("click", async (event) => {
    await navigator.clipboard.writeText(document.querySelector("#tracking-code").textContent);
    event.currentTarget.textContent = "COPIADO ✓";
  });
  document.querySelector("#new-response").addEventListener("click", () => window.location.reload());

  adminToggle.addEventListener("click", () => {
    loginForm.hidden = !loginForm.hidden;
    adminToggle.querySelector("span").textContent = loginForm.hidden ? "＋" : "−";
  });
  const showAdmin = (session) => {
    loginForm.hidden = !!session;
    adminToggle.hidden = !!session;
    adminPanel.hidden = !session;
  };
  if (db) {
    db.auth.getSession().then(({ data }) => showAdmin(data.session));
    db.auth.onAuthStateChange((_event, session) => showAdmin(session));
  }
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    adminError.hidden = true;
    if (!db) {
      adminError.textContent = "Configura Supabase siguiendo los pasos del README.";
      adminError.hidden = false;
      return;
    }
    const data = new FormData(loginForm);
    const { error } = await db.auth.signInWithPassword({ email: data.get("email"), password: data.get("password") });
    if (error) {
      adminError.textContent = "No se pudo iniciar sesión. Verifica tus datos y que tu cuenta tenga acceso de administrador.";
      adminError.hidden = false;
    }
  });
  document.querySelector("#admin-logout").addEventListener("click", async () => {
    if (db) await db.auth.signOut();
    document.querySelector("#lookup-result").replaceChildren();
  });
  document.querySelector("#lookup-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const result = document.querySelector("#lookup-result");
    result.textContent = "Buscando…";
    const code = document.querySelector("#lookup-code").value.trim().toUpperCase();
    const { data, error } = await db.from("survey_responses").select("tracking_code, answers, created_at").eq("tracking_code", code).maybeSingle();
    if (error) {
      result.textContent = "No tienes acceso o no se pudo completar la búsqueda.";
      return;
    }
    if (!data) {
      result.textContent = "No se encontró una respuesta con ese código.";
      return;
    }
    const card = document.createElement("article");
    card.className = "response-card";
    const title = document.createElement("h3");
    title.textContent = `${data.tracking_code} · ${new Date(data.created_at).toLocaleString("es-MX")}`;
    card.append(title);
    const list = document.createElement("dl");
    const labels = { estilos:"Estilos", prendas:"Prendas", marcas:"Marcas", talla_ropa:"Talla de ropa", talla_pantalon:"Talla de pantalón", decision_compra:"Decisión de compra", opinion_precios:"Opinión de precios", rango_precios:"Rango de precios", mejoras:"Mejoras", inconformidad:"Inconformidad", sugerencias:"Sugerencias" };
    for (const [key, value] of Object.entries(data.answers)) {
      const dt = document.createElement("dt"); dt.textContent = labels[key] || key;
      const dd = document.createElement("dd"); dd.textContent = Array.isArray(value) ? (value.join(", ") || "—") : (value || "—");
      list.append(dt, dd);
    }
    card.append(list);
    result.replaceChildren(card);
  });
})();
