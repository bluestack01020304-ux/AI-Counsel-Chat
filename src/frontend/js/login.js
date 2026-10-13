document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  console.log("로그인 시도:", email, password);
});

// 1. 로그인 가능한 계정 목록 (아이디/비밀번호 리스트)
const userList = [
  { email: "kjlim0606@naver.com", password: "1234" },
  { email: "admin@gomgom.ai", password: "admin1234" },
  { email: "test@gomgom.ai",  password: "test1234" }
];

// 2. DOM 요소 가져오기
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

// 3. 폼 제출(로그인 시도) 이벤트 리스너 등록
loginForm.addEventListener("submit", function (e) {
  e.preventDefault(); // 기본 폼 제출 동작 방지

  const inputEmail = emailInput.value.trim();
  const inputPassword = passwordInput.value.trim();

  // 4. 리스트에서 일치하는 계정 찾기
  const matchedUser = userList.find(
    (user) => user.email === inputEmail && user.password === inputPassword
  );

  if (matchedUser) {
    alert(`로그인 성공! 환영합니다, ${matchedUser.email}님!`);
    
    window.location.href = "./index.html";
  } else {
    alert("이메일 또는 비밀번호가 일치하지 않습니다.");

    passwordInput.value = "";
    passwordInput.focus();
  }
});