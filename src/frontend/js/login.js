const API_BASE_URL = "http://127.0.0.1:8000";

const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const submitButton = loginForm.querySelector('button[type="submit"]');

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  submitButton.disabled = true;
  submitButton.textContent = "로그인 중...";

  let message = document.getElementById("login-message");
  if (!message) {
    message = document.createElement("p");
    message.id = "login-message";
    message.setAttribute("role", "alert");
    loginForm.append(message);
  }
  message.textContent = "";

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, roll: "students" }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.detail || "아이디 또는 비밀번호를 확인해 주세요.");
    }

    localStorage.setItem("access_token", data.access_token);
    window.location.href = "../html/index.html";
  } catch (error) {
    message.textContent = error instanceof TypeError
      ? "서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해 주세요."
      : error.message;
    passwordInput.value = "";
    passwordInput.focus();
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "로그인";
  }
});
