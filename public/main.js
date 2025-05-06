const socket = io(window.location.origin);

let db;
const request = indexedDB.open("anonChatDB", 1);
request.onupgradeneeded = function (e) {
  db = e.target.result;
  db.createObjectStore("messages", { keyPath: "id" });
};

request.onsuccess = function (e) {
  db = e.target.result;
  if (window.location.pathname.includes("nasihat")) {
    initChat();
  } else if (window.location.pathname.includes("kayit")) {
    initRegister();
  } else {
    initLogin();
  }
};

// ========== REGISTER PAGE ==========
function initRegister() {
  if (localStorage.getItem("user")) return (location.href = "/nasihat");

  const form = document.getElementById("register-form");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nickname = form.nickname.value.trim();
    const password = form.password.value.trim();

    if (!nickname || !password) return alert("Tüm alanları doldurun.");

    socket.emit("register_request", { nickname, password });

    socket.once("register_response", (res) => {
      if (res.success) {
        localStorage.setItem("user", nickname);
        location.href = "/nasihat";
      } else {
        alert(res.message || "Kayıt başarısız.");
      }
    });
  });
}

// ========== LOGIN PAGE ==========
function initLogin() {
  if (localStorage.getItem("user")) return (location.href = "/nasihat");

  const form = document.getElementById("auth-form");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nickname = form.nickname.value.trim();
    const password = form.password.value.trim();

    if (!nickname || !password) return alert("Bütün alanları doldurun.");

    socket.emit("auth_request", { nickname, password });

    socket.once("auth_response", (res) => {
      if (res.success === true) {
        localStorage.setItem("user", nickname);
        location.href = "/nasihat";
      } else {
        alert(res.message || "Giriş başarısız.");
      }
    });
  });
}

// ========== CHAT PAGE ==========
function initChat() {
  const user = localStorage.getItem("user");
  if (!user) return (location.href = "giris");

  const form = document.getElementById("message-form");
  const input = document.getElementById("message-input");
  const msgList = document.getElementById("chat-messages");
  const userInput = document.getElementById("add-user-input");
  const userList = document.getElementById("user-list");
  const chatTitle = document.getElementById("chat-with");
  const logoutBtn = document.getElementById("logout-button");
  let activeTarget = null;

  socket.emit("join", user);

  socket.on("queued_messages", (messages) => {
    const tx = db.transaction("messages", "readwrite");
    const store = tx.objectStore("messages");
    messages.forEach((msg) => store.put(msg));
    loadUserList();
    if (activeTarget) loadMessagesWith(activeTarget);
  });

  loadUserList();

  function loadUserList() {
    const tx = db.transaction("messages", "readonly");
    const store = tx.objectStore("messages");
    const req = store.getAll();

    req.onsuccess = () => {
      const allMsgs = req.result;
      const users = [
        ...new Set(allMsgs.map((m) => (m.from === user ? m.to : m.from))),
      ];
      userList.innerHTML = "";
      users.forEach((nick) => {
        const li = document.createElement("li");
        li.textContent = nick;
        li.addEventListener("click", () => {
          activeTarget = nick;
          loadMessagesWith(nick);
        });
        userList.appendChild(li);
      });
    };
  }

  function loadMessagesWith(nick) {
    chatTitle.textContent = nick;

    const tx = db.transaction("messages", "readonly");
    const store = tx.objectStore("messages");
    const req = store.getAll();

    req.onsuccess = () => {
      const all = req.result.filter(
        (m) =>
          (m.from === user && m.to === nick) ||
          (m.from === nick && m.to === user)
      );
      msgList.innerHTML = "";
      all.forEach((m) => {
        const div = document.createElement("div");
        div.textContent = `${m.from === user ? "Sen" : m.from}: ${m.text}`;
        msgList.appendChild(div);
      });
      msgList.scrollTop = msgList.scrollHeight;
    };
  }

  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && userInput.value.trim()) {
      activeTarget = userInput.value.trim();
      userInput.value = "";
      loadMessagesWith(activeTarget);
      loadUserList();
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!activeTarget || !input.value.trim()) return;

    const message = {
      id: Date.now(),
      from: user,
      to: activeTarget,
      text: input.value.trim(),
      timestamp: new Date().toISOString(),
    };

    const tx = db.transaction("messages", "readwrite");
    const store = tx.objectStore("messages");
    store.put(message);
    console.log(message);
    socket.emit("private_message", message);
    input.value = "";
    loadMessagesWith(activeTarget);
    loadUserList();
  });

  socket.on("private_message", (msg) => {
    console.log(msg);
    if (msg.to === user) {
      const tx = db.transaction("messages", "readwrite");
      const store = tx.objectStore("messages");
      store.put(msg);

      if (msg.from === activeTarget) {
        loadMessagesWith(activeTarget);
      }

      loadUserList();
    }
  });

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("user");
    location.href = "/giris";
  });
}
