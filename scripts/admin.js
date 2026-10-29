import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { auth, db } from "./firebase-config.js";

const ADMIN_UID = "Bj9Upk54jMew52iJUWbKFpTF9DU2";
const loading = document.querySelector("#app-loading");
const app = document.querySelector("#admin-app");
const pageTitle = document.querySelector("#page-title");
const titles = { dashboard: "Dashboard", players: "Jogadores", teams: "Equipes", championships: "Campeonatos", transfers: "Transferências", credits: "Créditos virtuais" };

function showError(message) { const status = document.querySelector("#global-status"); status.textContent = message; status.className = "form-status error"; }
function authorized(user) { return user?.uid === ADMIN_UID; }

const sessionTimeout = window.setTimeout(() => {
  if (!loading.hidden) {
    loading.textContent = "NÃ£o foi possÃ­vel verificar a sessÃ£o. Atualize a pÃ¡gina e confira se o Firebase estÃ¡ acessÃ­vel.";
    loading.classList.add("error");
  }
}, 10000);

onAuthStateChanged(auth, async (user) => {
  window.clearTimeout(sessionTimeout);
  if (!authorized(user)) { window.location.replace("./admin-login.html"); return; }
  document.querySelector("#user-email").textContent = user.email || "Administrador";
  loading.hidden = true; app.hidden = false;
  try { await loadDashboard(); }
  catch (error) { console.error("Erro ao carregar o painel:", error); showError("A sessÃ£o foi validada, mas nÃ£o foi possÃ­vel carregar os dados do painel."); }
});

async function readCollection(name) {
  try { return await getDocs(collection(db, name)); }
  catch (error) { if (error.code !== "permission-denied") console.warn(`Coleção ${name}:`, error); return null; }
}

async function loadDashboard() {
  ensurePlayerForm();
  const players = await readCollection("jogadores");
  document.querySelector("#players-count").textContent = players ? players.size : "—";
  const optional = await Promise.all(["equipes", "campeonatos", "transferencias"].map(readCollection));
  ["#teams-count", "#championships-count", "#transfers-count"].forEach((selector, index) => { document.querySelector(selector).textContent = optional[index] ? optional[index].size : "—"; });
  if (players && document.querySelector("#players-table")) renderPlayers(players);
}

function field(data, names, fallback = "Não informado") { const name = names.find((key) => data[key] !== undefined && data[key] !== null && data[key] !== ""); return name ? String(data[name]) : fallback; }
function escapeHtml(value) { return String(value).replace(/[&<>\"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char])); }
function ensurePlayerForm() {
  const section = document.querySelector("#players");
  if (!section || !section.querySelector(".section-heading") || !section.querySelector(".content-card")) return;
  if (document.querySelector("#new-player")) return;
  if (!section.querySelector("#players-table thead tr")) {
    section.querySelector(".content-card").innerHTML = '<div id="players-state" class="empty-state">Nenhum jogador cadastrado.</div><div id="players-table-wrap" hidden><div class="table-scroll"><table><thead><tr><th>Nome</th><th>Equipe</th><th>Posicao</th><th>Status</th></tr></thead><tbody id="players-table"></tbody></table></div></div>';
  }
  section.querySelector(".section-heading").insertAdjacentHTML("beforeend", '<button id="new-player" class="primary-button compact" type="button">+ Novo jogador</button>');
  section.querySelector(".content-card").insertAdjacentHTML("beforebegin", '<div id="player-form-card" class="content-card" hidden><h2 id="player-form-title">Novo jogador</h2><form id="player-form" class="admin-form"><input id="player-id" type="hidden"><div class="form-grid"><div><label for="player-name">Nome *</label><input id="player-name" required></div><div><label for="player-position">Posição</label><input id="player-position"></div><div><label for="player-number">Número</label><input id="player-number" type="number" min="0"></div><div><label for="player-team">ID da equipe</label><input id="player-team" placeholder="Ex.: graja-bulls"></div></div><label class="checkbox-label"><input id="player-active" type="checkbox" checked> Jogador ativo e visível no portal</label><div class="form-actions"><button id="cancel-player" class="secondary-button" type="button">Cancelar</button><button id="save-player" class="primary-button compact" type="submit">Salvar jogador</button></div></form></div>');
  section.querySelector("#players-table thead tr").insertAdjacentHTML("beforeend", "<th>Ações</th>");
  document.querySelector("#new-player").addEventListener("click", () => openPlayerForm());
  document.querySelector("#cancel-player").addEventListener("click", closePlayerForm);
  document.querySelector("#player-form").addEventListener("submit", savePlayer);
}
function openPlayerForm(item = null) { const data = item?.data() || {}; document.querySelector("#player-id").value = item?.id || ""; document.querySelector("#player-name").value = field(data, ["nome", "name"], ""); document.querySelector("#player-position").value = field(data, ["posicao", "position"], ""); document.querySelector("#player-number").value = field(data, ["numero", "number"], ""); document.querySelector("#player-team").value = field(data, ["equipeId", "teamId", "equipe", "team", "teamName"], ""); document.querySelector("#player-active").checked = data.ativo ?? data.active ?? true; document.querySelector("#player-form-title").textContent = item ? "Editar jogador" : "Novo jogador"; document.querySelector("#player-form-card").hidden = false; document.querySelector("#player-name").focus(); }
function closePlayerForm() { document.querySelector("#player-form-card").hidden = true; document.querySelector("#player-form").reset(); document.querySelector("#player-active").checked = true; }
async function deletePlayer(id) { if (!window.confirm("Excluir este jogador? Esta ação não pode ser desfeita.")) return; try { await deleteDoc(doc(db, "jogadores", id)); closePlayerForm(); await loadDashboard(); showSuccess("Jogador excluído."); } catch (error) { showError(error.code === "permission-denied" ? "O Firebase recusou a operação. Verifique as regras publicadas." : "Não foi possível excluir o jogador."); } }
function showSuccess(message) { const status = document.querySelector("#global-status"); status.textContent = message; status.className = "form-status success"; }
async function savePlayer(event) { event.preventDefault(); const id = document.querySelector("#player-id").value; const name = document.querySelector("#player-name").value.trim(); if (!name) return; const values = { nome: name, posicao: document.querySelector("#player-position").value.trim(), numero: document.querySelector("#player-number").value ? Number(document.querySelector("#player-number").value) : null, equipeId: document.querySelector("#player-team").value.trim(), ativo: document.querySelector("#player-active").checked }; const saveButton = document.querySelector("#save-player"); saveButton.disabled = true; saveButton.textContent = "Salvando..."; try { if (id) await updateDoc(doc(db, "jogadores", id), values); else await addDoc(collection(db, "jogadores"), values); closePlayerForm(); await loadDashboard(); showSuccess(id ? "Jogador atualizado." : "Jogador cadastrado."); } catch (error) { showError(error.code === "permission-denied" ? "O Firebase recusou a operação. Verifique se as regras foram publicadas para o UID correto." : "Não foi possível salvar o jogador."); } finally { saveButton.disabled = false; saveButton.textContent = "Salvar jogador"; } }

function renderPlayers(snapshot) { const state = document.querySelector("#players-state"); const wrap = document.querySelector("#players-table-wrap"); const table = document.querySelector("#players-table"); if (!snapshot.size) { state.hidden = false; state.textContent = "Nenhum jogador cadastrado."; wrap.hidden = true; return; } state.hidden = true; wrap.hidden = false; table.innerHTML = snapshot.docs.map((item) => { const data = item.data(); const active = data.ativo ?? data.active ?? true; return `<tr><td>${escapeHtml(field(data, ["nome", "name"]))}</td><td>${escapeHtml(field(data, ["equipeId", "teamId", "equipe", "team", "teamName"]))}</td><td>${escapeHtml(field(data, ["posicao", "position"]))}</td><td><span class="status-badge ${active ? "status-active" : "status-inactive"}">${active ? "Ativo" : "Inativo"}</span></td><td class="row-actions"><button class="table-button" data-edit-player="${item.id}" type="button">Editar</button><button class="table-button danger" data-delete-player="${item.id}" type="button">Excluir</button></td></tr>`; }).join(""); table.querySelectorAll("[data-edit-player]").forEach((button) => button.addEventListener("click", () => openPlayerForm(snapshot.docs.find((item) => item.id === button.dataset.editPlayer)))); table.querySelectorAll("[data-delete-player]").forEach((button) => button.addEventListener("click", () => deletePlayer(button.dataset.deletePlayer))); }

document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => {
  const target = button.dataset.section; document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item === button));
  document.querySelectorAll(".admin-section").forEach((section) => { const active = section.id === target; section.hidden = !active; section.classList.toggle("active-section", active); }); pageTitle.textContent = titles[target];
}));
document.querySelector("#logout").addEventListener("click", async () => { await signOut(auth); window.location.replace("./admin-login.html"); });
