import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { auth } from "./firebase-config.js";

const ADMIN_UID = "Bj9Upk54jMew52iJUWbKFpTF9DU2";
const form = document.querySelector("#login-form");
const status = document.querySelector("#login-status");
const submit = document.querySelector("#login-submit");
const email = document.querySelector("#email");

function setStatus(message, kind = "error") { status.textContent = message; status.className = `form-status ${kind}`; }
function isAdmin(user) { return user?.uid === ADMIN_UID; }

onAuthStateChanged(auth, (user) => {
  if (user && isAdmin(user)) window.location.replace("./admin.html");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  submit.disabled = true;
  submit.textContent = "Entrando...";
  setStatus("");
  try {
    const result = await signInWithEmailAndPassword(auth, email.value.trim(), document.querySelector("#password").value);
    if (!isAdmin(result.user)) {
      await auth.signOut();
      throw Object.assign(new Error(), { code: "auth/not-authorized" });
    }
    window.location.replace("./admin.html");
  } catch (error) {
    const messages = {
      "auth/invalid-credential": "E-mail ou senha incorretos.",
      "auth/invalid-email": "Informe um e-mail válido.",
      "auth/too-many-requests": "Muitas tentativas. Aguarde e tente novamente.",
      "auth/not-authorized": "Esta conta não tem autorização administrativa.",
      "auth/network-request-failed": "Não foi possível conectar ao Firebase. Verifique sua internet."
    };
    setStatus(messages[error.code] || "Não foi possível entrar. Tente novamente.");
  } finally { submit.disabled = false; submit.textContent = "Entrar"; }
});

document.querySelector("#toggle-password").addEventListener("click", (event) => {
  const field = document.querySelector("#password");
  field.type = field.type === "password" ? "text" : "password";
  event.currentTarget.textContent = field.type === "password" ? "Mostrar" : "Ocultar";
  event.currentTarget.setAttribute("aria-label", `${field.type === "password" ? "Mostrar" : "Ocultar"} senha`);
});

document.querySelector("#forgot-password").addEventListener("click", async () => {
  if (!email.value.trim()) { setStatus("Informe seu e-mail para recuperar a senha."); email.focus(); return; }
  try { await sendPasswordResetEmail(auth, email.value.trim()); setStatus("Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação.", "success"); }
  catch (error) { setStatus(error.code === "auth/invalid-email" ? "Informe um e-mail válido." : "Não foi possível solicitar a recuperação agora."); }
});
