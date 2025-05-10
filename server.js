const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const User = require("./models/User");
const Message = require("./models/Message");

const app = express();
const sunucu = http.createServer(app);
const io = new Server(sunucu, {
  cors: { origin: "*" },
});

// Public klasörünü sun
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/db", (req, res) => {
  res.sendFile(path.join(__dirname, "db", "messages.db"));
});

app.get("/giris", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Kayıt sayfası
app.get("/kayit", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

// Sohbet sayfası
app.get("/nasihat", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});

// Giriş sayfası ve tanımlanmayan güzergahlar için yönlendirmeler
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

const onlineKullanicilar = new Map();

io.on("connection", (socket) => {
  console.log("Yeni bağlantı:", socket.id);

  // Giriş işlemi
  socket.on("auth_request", ({ nickname, password }) => {
    User.loginUser(nickname, password).then((user) => {
      if (!user.success) {
        socket.emit("auth_response", {
          success: false,
          message: user.message,
        });
        return;
      }

      socket.nickname = nickname;
      onlineKullanicilar.set(nickname, socket);

      socket.emit("auth_response", { success: true });
    });
  });

  // Kayıt işlemi
  socket.on("register_request", ({ nickname, password }) => {
    User.registerUser(nickname, password).then((user) => {
      if (!user.success) {
        socket.emit("register_response", {
          success: false,
          message: user.message,
        });
        return;
      }
      socket.emit("register_response", { success: true });
    });
  });

  socket.on("join", (nickname) => {
    socket.nickname = nickname;
    onlineKullanicilar.set(nickname, socket);
    // Bekleyen mesajlar
    Message.kullaniciIcinBekleyenMesajlar(nickname).then((mesajlar) => {
      if (mesajlar.length > 0) {
        socket.emit("queued_messages", mesajlar); // hepsini bir kerede gönder
        mesajlar.forEach(async (mesaj) => {
          await Message.mesajIletildiOlarakIsaretle(mesaj._id);
          Message.deleteMessage(mesaj._id);
        });
      }
    });

    // Mesaj gönderme
    socket.on("private_message", ({ id, from, to, text, timestamp }) => {
      const gonderen = socket.nickname;
      if (!gonderen || !to || !text) return;
      const hedefSocket = onlineKullanicilar.get(to);
      if (hedefSocket) {
        hedefSocket.emit("private_message", {
          id,
          from,
          to,
          text,
          timestamp,
        });
      } else {
        Message.yeniMesaj({ id, from, to, text, timestamp });
      }
    });
  });

  socket.on("disconnect", () => {
    if (socket.nickname) {
      onlineKullanicilar.delete(socket.nickname);
    }
  });
});

const port = process.env.PORT || 3000;
sunucu.listen(port, () => {
  console.log("Sunucu 3000 portunda çalışıyor");
});
