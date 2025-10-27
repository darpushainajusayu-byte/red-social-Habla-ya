let state = {
  users: [],
  posts: [],
};

const form = document.getElementById("postForm");
const textarea = document.getElementById("postText");
const alertbox = document.getElementById("alert-box");

const searchInput = document.getElementById("searchInput");
const userFilter = document.getElementById("userFilter");

// --- Validación en tiempo real del botón "Publicar" ---
const publishBtn = form.querySelector('button[type="submit"]');

// Deshabilita el botón si el campo está vacío
textarea.addEventListener("input", () => {
  const isEmpty = textarea.value.trim() === "";
  publishBtn.disabled = isEmpty;
});

// Desactivar el botón al cargar la página si está vacío
publishBtn.disabled = textarea.value.trim() === "";

// Función global showAlert()
function showAlert(message, type = "info") {
  alertbox.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
    </div>
  `;
  setTimeout(() => alertbox.innerHTML = "", 3000);
}

form.addEventListener("submit", (e) => {
  e.preventDefault(); // Evitar el recargo de la página

  if (!auth.currentUser) {
    showAlert("Debes iniciar sesión para publicar", "warning");
    return;
  }

  const texto = textarea.value.trim();

  if (texto !== "") {
    const userData = state.users.find(u => u.id === auth.currentUser.uid);

    db.collection("posts").add({
      text: texto,
      userId: userData.id,
      userName: userData.name,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      textarea.value = "";
      publishBtn.disabled = true;
      showAlert("Publicación correcta", "success");
    })
    .catch(err => {
      showAlert("Error al publicar", "danger");
    });
  }
});


function renderUsers(lista) {
  const aside = document.querySelector("aside");
  aside.innerHTML = `
    <div class="list-group">
      ${lista.map(u => `
        <div class="list-group-item d-flex align-items-center">
          <img src="${u.avatar}" alt="${u.name}" class="rounded-circle me-2" width="40" height="40">
          <div>
            <strong>${u.name}</strong><br>
            <small class="text-muted">${u.bio}</small>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderPosts(lista){
  const feed = document.getElementById("feed"); 
  feed.innerHTML = "";

  lista.forEach(post => {

  const user = state.users.find(u => u.id == post.userId);
  const createdAtStr = post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleString() : "";
  const editedBadge = post.editedAt ? '<small class="text-muted">(editado)</small>' : "";

  const isAuthor = auth.currentUser && post.userId === auth.currentUser.uid;

  const card = `<div class="card mb-3">
      <div class="card-body d-flex">
        ${user ? `<img src="${user.avatar}" alt="${user.name}" class="rounded-circle me-3" width="50" height="50">` : ""}
        <div>
          <h5 class="card-title">${user ? user.name : post.userName}</h5>
          <h6 class="card-subtitle mb-2 text-muted">${createdAtStr} ${editedBadge}</h6>
          <p class="card-text">${post.text}</p>
          <div class="mt-2">
            ${isAuthor ? `<button class="btn btn-sm btn-secondary btn-edit me-2" data-id="${post.id}">Editar</button>` : ""}
            ${isAuthor ? `<button class="btn btn-sm btn-danger btn-delete" data-id="${post.id}">Eliminar</button>` : ""}
          </div>
        </div>
      </div>
    </div>`;

  feed.innerHTML += card;
});
}

//Actualizar select de usuarios únicos
function updateUserFilterOptions(posts) {
    const users = [...new Set(posts.map( post => `${post.userId}|${post.userName}`))]
    userFilter.innerHTML = `<option value="">Todos los usuarios</option>`;
    users.forEach( u => {
        const [id, name] = u.split("|");
        userFilter.innerHTML += `<option value="${id}">${name}</option>`
    });
}

//Eventos de búsqueda y filtrado
searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim();
    const userId = userFilter.value;
    renderPosts(filterPosts(query, userId));
})

userFilter.addEventListener("change", () => {
    const query = searchInput.value.trim();
    const userId = userFilter.value;
    renderPosts(filterPosts(query, userId));
})

//Filtrar publicaciones
function filterPosts(query, userId) {
    return state.posts.filter( post => {
        const matchesText = post.text.toLowerCase().includes(query.toLowerCase())
        const matchesUser = userId ? post.userId == userId : true;
        return matchesText && matchesUser;
    })
}

db.collection("users").onSnapshot(snapshot => {
  state.users = snapshot.docs.map(doc => doc.data());
  renderUsers(state.users);
  renderPosts(state.posts);
});

db.collection("posts")
  .orderBy("createdAt", "desc")
  .onSnapshot(snapshot => {
    state.posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    renderPosts(state.posts);
    updateUserFilterOptions(state.posts);
  });

document.addEventListener("click",(e)=>{
  const btn = e.target;
  const id = btn.dataset.id;

  if(btn.classList.contains("btn-delete")){
  if(confirm("¿Deseas eliminar esta publicación?")){
    db.collection("posts").doc(id).delete()
      .then(() => showAlert("Publicación eliminada correctamente.", "success"))
      .catch(err => showAlert(`Error al eliminar: ${err.message}`, "danger"));
  }
}

  if (btn.classList.contains("btn-edit")) {
  const cardBody = btn.closest(".card-body");
  const textEl = cardBody.querySelector(".card-text");
  const original = textEl.textContent.trim();

  // Ocultar los botones Editar y Eliminar
  const editBtn = cardBody.querySelector(".btn-edit");
  const deleteBtn = cardBody.querySelector(".btn-delete");
  editBtn.style.display = "none";
  deleteBtn.style.display = "none";

  // Botón Guardar inicia deshabilitado
  textEl.outerHTML = `
    <div class="edit-area">
      <textarea class="form-control mb-2">${original}</textarea>
      <button class="btn btn-success btn-sm btn-save" data-id="${id}" disabled>Guardar</button>
      <button class="btn btn-secondary btn-sm btn-cancel">Cancelar</button>
    </div>
  `;

  // Validación en tiempo real del textarea
  const textarea = cardBody.querySelector("textarea");
  const saveBtn = cardBody.querySelector(".btn-save");

  textarea.addEventListener("input", () => {
    const newText = textarea.value.trim();
    saveBtn.disabled = newText === "" || newText === original;
  });
}



  if (btn.classList.contains("btn-save")) {
  const cardBody = btn.closest(".card-body");
  const newText = cardBody.querySelector("textarea").value.trim();

  db.collection("posts").doc(id).update({
    text: newText,
    editedAt: new Date()
  })
  .then(() => {
    cardBody.querySelector(".edit-area").outerHTML = `
      <p class="card-text">${newText} <small class="text-muted">(editado)</small></p>
    `;
    const editBtn = cardBody.querySelector(".btn-edit");
    const deleteBtn = cardBody.querySelector(".btn-delete");
    editBtn.style.display = "inline-block";
    deleteBtn.style.display = "inline-block";
    showAlert("Publicación actualizada correctamente.", "success");
  })
  .catch((err) => showAlert(`Error al actualizar: ${err.message}`, "danger"));
}

if (btn.classList.contains("btn-cancel")) {
  // Mejora el contenedor y el texto original
  const cardBody = btn.closest(".card-body");
  const editArea = btn.closest(".edit-area");
  const textarea = editArea.querySelector("textarea");
  const originalText = textarea.defaultValue;

  editArea.outerHTML = `<p class="card-text">${originalText}</p>`;

  // Restaurar botones Editar y Eliminar
  const editBtn = cardBody.querySelector(".btn-edit");
  const deleteBtn = cardBody.querySelector(".btn-delete");
  editBtn.style.display = "inline-block";
  deleteBtn.style.display = "inline-block";
}

});


  
  auth.onAuthStateChanged((user) => {
  renderPosts(state.posts);
  updateUserFilterOptions(state.posts);
});
