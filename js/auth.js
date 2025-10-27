const authSection = document.getElementById("auth-section");
const feedSection = document.getElementById("feed-section");
const navLogout = document.getElementById("navLogout");
const btnLogout = document.getElementById("btnLogout");

const authTitle = document.getElementById("auth-title");
const btnAuthAction = document.getElementById("btnAuthAction");
const toggleAuthMode = document.getElementById("toggleAuthMode");
const authToggleText = document.getElementById("auth-toggle-text");
const authAlert = document.getElementById("auth-alert");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

let isLoginMode = true;


function showAuthAlert(msg, type = "danger") {
  authAlert.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
}

function clearInputsAndAlerts() {
  emailInput.value = "";
  passwordInput.value = "";
  authAlert.innerHTML = "";
}


toggleAuthMode.addEventListener("click", (e) => {
  e.preventDefault();
  isLoginMode = !isLoginMode;

  authTitle.textContent = isLoginMode ? "Iniciar sesión" : "Crear cuenta";
  btnAuthAction.textContent = isLoginMode ? "Iniciar sesión" : "Registrar";
  authToggleText.textContent = isLoginMode ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?";
  toggleAuthMode.textContent = isLoginMode ? "Regístrate" : "Inicia sesión";

  clearInputsAndAlerts();
});

btnAuthAction.addEventListener("click", () => {
  const email = emailInput.value.trim();
  const pass = passwordInput.value.trim();

  if (!email || !pass) return showAuthAlert("Completa todos los campos", "warning");
  if (!/^\S+@\S+\.\S+$/.test(email)) return showAuthAlert("Correo electrónico no válido", "warning");

  btnAuthAction.disabled = true;
  btnAuthAction.textContent = isLoginMode ? "Iniciando..." : "Registrando...";

  setTimeout(() => {
    if (isLoginMode) {
      auth.signInWithEmailAndPassword(email, pass)
        .then((userCredential) => {
          console.log("Inicio de sesión de:", userCredential.user.email);
          showAuthAlert("Inicio de sesión exitoso ✅", "success");
        })
        .catch(() => showAuthAlert("Datos incorrectos. Verifica tu correo o contraseña.", "danger"))
        .finally(() => {
          btnAuthAction.disabled = false;
          btnAuthAction.textContent = "Iniciar sesión";
        });
    } else {
      auth.createUserWithEmailAndPassword(email, pass)
  .then((userCredential) => {
    const user = userCredential.user;
    // Generamos el avatar usando la API
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split("@")[0])}`;
    // Guardamos el usuario en Firestore
    db.collection("users").doc(user.uid).set({
      id: user.uid,
      name: email.split("@")[0],
      email: user.email,
      avatar: avatarUrl,
      bio: "Nuevo usuario"
    });
    showAuthAlert("Cuenta creada correctamente ✅", "success");
  })
    }
  }, 800);
});


btnLogout.addEventListener("click", () => {
  auth.signOut()
    .then(() => clearInputsAndAlerts())
    .catch((err) => console.error("Error al cerrar sesión:", err.message));
});

auth.onAuthStateChanged((user) => {
  if (user) {
    setTimeout(() => {
      authSection.classList.add("d-none");
      feedSection.classList.remove("d-none");
      navLogout.classList.remove("d-none");
      clearInputsAndAlerts();
      console.log("Usuario activo:", user.email);
    }, 800);
  } else {
    authSection.classList.remove("d-none");
    feedSection.classList.add("d-none");
    navLogout.classList.add("d-none");
    clearInputsAndAlerts();
  }
});

