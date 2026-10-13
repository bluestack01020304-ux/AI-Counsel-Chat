import { createChatController } from "./chat.js";

const form = document.querySelector("#chatForm");
const input = document.querySelector("#userInput");
const chatLog = document.querySelector("#chatLog");
const summaryCard = document.querySelector("#summaryCard");
const statusText = document.querySelector("#statusText");
const resetButton = document.querySelector("[data-reset-chat]");
const presetButtons = document.querySelectorAll("[data-preset]");
const fillDemoButton = document.querySelector("[data-fill-demo]");

const chat = createChatController({
  chatLog,
  form,
  input,
  summaryCard,
  statusText
});

presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.dataset.preset ?? "";
    input.focus();
    statusText.textContent = "예시 고민이 입력되었습니다.";
  });
});

fillDemoButton?.addEventListener("click", () => {
  input.value = "시험이 다가오는데 성적이 떨어질까 봐 너무 불안해요.";
  document.querySelector("#demo")?.scrollIntoView({ behavior: "smooth", block: "start" });
  input.focus();
  statusText.textContent = "대표 예시가 입력되었습니다.";
});

resetButton?.addEventListener("click", () => {
  chat.reset();
});
