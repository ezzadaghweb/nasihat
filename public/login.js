document.addEventListener("DOMContentLoaded", () => {
  const inputs = document.querySelectorAll("#auth-form input");

  inputs.forEach((input) => {
    input.addEventListener("focus", () => {
      input.style.borderColor = "#007bff";
      input.style.boxShadow = "0 0 5px rgba(0, 123, 255, 0.5)";
    });

    input.addEventListener("blur", () => {
      input.style.borderColor = "#ccc";
      input.style.boxShadow = "none";
    });
  });
});
