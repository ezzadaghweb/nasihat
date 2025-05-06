document.addEventListener("DOMContentLoaded", () => {
  const userInput = document.getElementById("add-user-input");
  const messageInput = document.getElementById("message-input");

  // Kullanıcı ekleme inputuna odak efektleri
  userInput.addEventListener("focus", () => {
    userInput.style.borderColor = "#28a745";
    userInput.style.boxShadow = "0 0 5px rgba(40, 167, 69, 0.5)";
  });

  userInput.addEventListener("blur", () => {
    userInput.style.borderColor = "#ccc";
    userInput.style.boxShadow = "none";
  });

  // Mesaj inputuna odak efektleri
  messageInput.addEventListener("focus", () => {
    messageInput.style.borderColor = "#007bff";
    messageInput.style.boxShadow = "0 0 5px rgba(0, 123, 255, 0.5)";
  });

  messageInput.addEventListener("blur", () => {
    messageInput.style.borderColor = "#ccc";
    messageInput.style.boxShadow = "none";
  });
});
