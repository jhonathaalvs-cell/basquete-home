import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { auth, db } from "./firebase-config.js";

const ADMIN_UID = "Bj9Upk54jMew52iJUWbKFpTF9DU2";
const loading = document.querySelector("#app-loading");
const app = document.querySelector("#admin-app");
const pageTitle = document.querySelector("#page-title");

const entities = {
  players: { collection: "jogadores", title: "Jogadores", fields: [{ key: "nome", label: "Nome", required: true }, { key: "posicao", label: "Posição" }, { key: "numero", label: "Número", type: "number" }, { key: "equipeId", label: "ID da equipe" }, { key: "ativo", label: "Ativo e visível", type: "checkbox", default: true }] },
  teams: { collection: "equipes", title: "Equipes", fields: [{ key: "nome", label: "Nome", required: true }, { key: "cidade", label: "Cidade" }, { key: "conferencia", label: "Conferência" }, { key: "logo", label: "Caminho do logo" }, { key: "descricao", label: "Descrição", type: "textarea" }, { key: "ativo", label: "Ativa e visível", type: "checkbox", default: true }] },
  championships: { collection: "campeonatos", title: "Campeonatos", fields: [{ key: "nome", label: "Nome", required: true }, { key: "temporada", label: "Temporada" }, { key: "status", label: "Status" }, { key: "ativo", label: "Ativo e visível", type: "checkbox", default: true }] },
  games: { collection: "jogos", title: "Jogos", fields: [{ key: "data", label: "Data", type: "date", required: true }, { key: "hora", label: "Horário" }, { key: "rodada", label: "Rodada" }, { key: "mandanteId", label: "ID equipe mandante", required: true }, { key: "visitanteId", label: "ID equipe visitante", required: true }, { key: "mandantePlacar", label: "Placar mandante", type: "number" }, { key: "visitantePlacar", label: "Placar visitante", type: "number" }, { key: "status", label: "Status" }, { key: "local", label: "Local" }] },
  seasons: { collection: "temporadas", title: "Temporadas", fields: [{ key: "nome", label: "Nome", required: true }, { key: "ano", label: "Ano", type: "number" }, { key: "status", label: "Status" }, { key: "ativo", label: "Ativa e visível", type: "checkbox", default: true }] },
  news: { collection: "noticias", title: "Notícias", fields: [{ key: "titulo", label: "Título", required: true }, { key: "categoria", label: "Categoria" }, { key: "data", label: "Data" }, { key: "resumo", label: "Resumo", type: "textarea" }, { key: "conteudo", label: "Conteúdo", type: "textarea" }, { key: "publicado", label: "Publicada", type: "checkbox", default: true }] }
 };
entities.stats = { collection: "estatisticas", title: "Estatisticas", fields: [{ key: "jogadorId", label: "ID do jogador", required: true }, { key: "pontos", label: "Pontos", type: "number" }, { key: "rebotes", label: "Rebotes", type: "number" }, { key: "assistencias", label: "Assistencias", type: "number" }, { key: "jogos", label: "Jogos", type: "number" }] };
entities.teams.fields.splice(2, 0, { key: "sigla", label: "Sigla do time", required: true });
entities.teams.fields.find((field) => field.key === "conferencia").label = "Grupo ou conferência (opcional)";
entities.players.fields.find((field) => field.key === "equipeId").label = "Equipe";

const titles = { dashboard: "Dashboard", ...Object.fromEntries(Object.entries(entities).map(([key, value]) => [key, value.title])), transfers: "Transferências", credits: "Créditos virtuais" };
const $ = (selector, root = document) => root.querySelector(selector);
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const valueOf = (data, key, fallback = "") => data?.[key] ?? fallback;

function authorized(user) { return user?.uid === ADMIN_UID; }
function setStatus(message, kind = "error") { const element = $("#global-status"); if (element) { element.textContent = message; element.className = `form-status ${kind}`; } }
function setText(selector, value) { const element = $(selector); if (element) element.textContent = value; }

const sessionTimeout = window.setTimeout(() => { if (!loading.hidden) { loading.textContent = "Não foi possível verificar a sessão. Atualize a página."; loading.classList.add("error"); } }, 10000);
onAuthStateChanged(auth, async (user) => {
  window.clearTimeout(sessionTimeout);
  if (!authorized(user)) { window.location.replace("./admin-login.html"); return; }
  setText("#user-email", user.email || "Administrador");
  loading.hidden = true; app.hidden = false;
  try { setupEntitySections(); setupNavigation(); await loadDashboard(); }
  catch (error) { console.error("Erro ao carregar o painel:", error); setStatus(`Não foi possível carregar o painel: ${error.message || "erro desconhecido"}`); }
});

async function readCollection(name) { try { return await getDocs(collection(db, name)); } catch (error) { console.warn(`Coleção ${name}:`, error); return null; } }
async function loadDashboard() {
  const [players, teams, championships, transfers] = await Promise.all(["jogadores", "equipes", "campeonatos", "transferencias"].map(readCollection));
  setText("#players-count", players ? players.size : "—"); setText("#teams-count", teams ? teams.size : "—"); setText("#championships-count", championships ? championships.size : "—"); setText("#transfers-count", transfers ? transfers.size : "—");
  for (const [key, config] of Object.entries(entities)) { const snapshot = await readCollection(config.collection); if (snapshot) renderEntity(key, snapshot); }
}

function setupNavigation() {
  document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => {
    const target = button.dataset.section; document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item === button));
    document.querySelectorAll(".admin-section").forEach((section) => { const active = section.id === target; section.hidden = !active; section.classList.toggle("active-section", active); });
    setText("#page-title", titles[target] || target);
  }));
  $("#logout").addEventListener("click", async () => { await signOut(auth); window.location.replace("./admin-login.html"); });
}

function setupEntitySections() {
  for (const [key, config] of Object.entries(entities)) {
    let section = $(`#${key}`);
    if (!section) { section = document.createElement("section"); section.id = key; section.className = "admin-section"; section.hidden = true; $(".admin-main").append(section); const nav = document.createElement("button"); nav.className = "nav-item"; nav.dataset.section = key; nav.textContent = config.title; $(".sidebar nav").append(nav); }
    section.innerHTML = `<div class="section-heading"><div><p class="eyebrow">Cadastro manual</p><h2>${escapeHtml(config.title)}</h2></div><button class="primary-button compact" data-new="${key}" type="button">+ Novo</button></div><div class="content-card" id="${key}-form-card" hidden></div><div class="content-card"><div class="empty-state" id="${key}-state">Nenhum registro cadastrado.</div><div class="table-scroll" id="${key}-table-wrap" hidden><table><thead><tr>${config.fields.slice(0, 4).map((field) => `<th>${escapeHtml(field.label)}</th>`).join("")}<th>Ações</th></tr></thead><tbody id="${key}-table"></tbody></table></div></div>`;
    $(`[data-new="${key}"]`).addEventListener("click", () => openForm(key));
  }
}

function formMarkup(key, item = null) {
  const config = entities[key]; const data = item?.data() || "";
  const controls = config.fields.map((field) => { const value = valueOf(data, field.key, field.default ?? ""); if (field.type === "checkbox") return `<label class="checkbox-label"><input name="${field.key}" type="checkbox" ${value ? "checked" : ""}> ${escapeHtml(field.label)}</label>`; if (field.type === "textarea") return `<label for="${key}-${field.key}">${escapeHtml(field.label)}</label><textarea id="${key}-${field.key}" name="${field.key}" rows="3">${escapeHtml(value)}</textarea>`; return `<label for="${key}-${field.key}">${escapeHtml(field.label)}${field.required ? " *" : ""}</label><input id="${key}-${field.key}" name="${field.key}" type="${field.type || "text"}" value="${escapeHtml(value)}" ${field.required ? "required" : ""}>`; }).join("");
  return `<h2>${item ? "Editar" : "Novo"} ${escapeHtml(config.title.toLowerCase())}</h2><form class="admin-form" data-form="${key}"><input type="hidden" name="_id" value="${escapeHtml(item?.id || "")}">${controls}<div class="form-actions"><button class="secondary-button" type="button" data-cancel="${key}">Cancelar</button><button class="primary-button compact" type="submit">Salvar</button></div></form>`;
}

async function openForm(key, item = null) {
  const card = $(`#${key}-form-card`); card.innerHTML = formMarkup(key, item); card.hidden = false;
  if (key === "players") {
    const teams = await readCollection("equipes"); const input = card.querySelector('[name="equipeId"]');
    if (input && teams) { const current = input.value; const select = document.createElement("select"); select.name = "equipeId"; select.innerHTML = `<option value="">Sem equipe</option>${teams.docs.map((teamDoc) => `<option value="${escapeHtml(teamDoc.id)}">${escapeHtml(valueOf(teamDoc.data(), "nome", teamDoc.id))}</option>`).join("")}`; select.value = current; input.replaceWith(select); }
  }
  card.querySelector("form").addEventListener("submit", (event) => saveEntity(event, key)); card.querySelector(`[data-cancel="${key}"]`).addEventListener("click", () => { card.hidden = true; }); card.querySelector("input:not([type=hidden]), select, textarea")?.focus();
}
async function saveEntity(event, key) { event.preventDefault(); const config = entities[key]; const form = event.currentTarget; const data = {}; config.fields.forEach((field) => { const input = form.elements[field.key]; if (!input) return; data[field.key] = field.type === "checkbox" ? input.checked : field.type === "number" ? (input.value === "" ? null : Number(input.value)) : input.value.trim(); }); const id = form.elements._id.value; try { if (id) await updateDoc(doc(db, config.collection, id), data); else await addDoc(collection(db, config.collection), data); form.closest(".content-card").hidden = true; const snapshot = await readCollection(config.collection); if (snapshot) renderEntity(key, snapshot); setStatus(`${config.title} salvo com sucesso.`, "success"); } catch (error) { console.error(error); setStatus(`Não foi possível salvar em ${config.collection}: ${error.message || "verifique as regras do Firebase"}`); } }
async function removeEntity(key, id) { if (!window.confirm("Excluir este registro? Esta ação não pode ser desfeita.")) return; try { await deleteDoc(doc(db, entities[key].collection, id)); const snapshot = await readCollection(entities[key].collection); if (snapshot) renderEntity(key, snapshot); setStatus("Registro excluído.", "success"); } catch (error) { setStatus(`Não foi possível excluir: ${error.message || "verifique as regras do Firebase"}`); } }
function renderEntity(key, snapshot) { const config = entities[key]; const state = $(`#${key}-state`); const wrap = $(`#${key}-table-wrap`); const table = $(`#${key}-table`); if (!state || !wrap || !table) return; if (!snapshot.size) { state.hidden = false; wrap.hidden = true; return; } state.hidden = true; wrap.hidden = false; table.innerHTML = snapshot.docs.map((item) => `<tr>${config.fields.slice(0, 4).map((field) => `<td>${escapeHtml(valueOf(item.data(), field.key, "—"))}</td>`).join("")}<td class="row-actions"><button class="table-button" data-edit="${item.id}" type="button">Editar</button><button class="table-button danger" data-delete="${item.id}" type="button">Excluir</button></td></tr>`).join(""); table.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", () => openForm(key, snapshot.docs.find((item) => item.id === button.dataset.edit)))); table.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", () => removeEntity(key, button.dataset.delete))); }
