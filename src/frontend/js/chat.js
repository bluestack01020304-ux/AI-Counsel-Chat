import { getCounselResponse } from "./api.js";

const copy = {
  user: "\ud559\uc0dd", ai: "AI \uc0c1\ub2f4\uc0ac", greeting: "\uc548\ub155\ud558\uc138\uc694. \uc624\ub298 \uac00\uc7a5 \uc2e0\uacbd \uc4f0\uc774\ub294 \uace0\ubbfc\uc744 \ud3b8\ud558\uac8c \uc801\uc5b4 \uc8fc\uc138\uc694.", suggestion: "\uc81c\uc548", ready: "\ud14c\uc2a4\ud2b8 \ubaa8\ub4dc \uc900\ube44 \uc644\ub8cc", thinking: "AI\uac00 \ub2f5\ubcc0\uc744 \uc815\ub9ac\ud558\uace0 \uc788\uc5b4\uc694...", updated: "\uc0c1\ub2f4 \uc694\uc57d\uc744 \uac31\uc2e0\ud588\uc5b4\uc694.", empty: "\uace0\ubbfc\uc744 \ud55c \ubb38\uc7a5 \uc774\uc0c1 \uc785\ub825\ud574 \uc8fc\uc138\uc694."
};

function createMessage(role, text) {
  const article = document.createElement("article");
  article.className = `message ${role}`;
  const label = document.createElement("span");
  label.className = "message-role";
  label.textContent = role === "user" ? copy.user : copy.ai;
  const body = document.createElement("p");
  body.textContent = text;
  article.append(label, body);
  return article;
}

export function createChatController({ chatLog, form, input, summaryCard, statusText }) {
  function appendMessage(role, text) {
    chatLog.appendChild(createMessage(role, text));
    chatLog.scrollTop = chatLog.scrollHeight;
  }
  function renderSummary(response) {
    summaryCard.innerHTML = "";
    const label = document.createElement("p");
    label.className = "card-label";
    label.textContent = "\uc0c1\ub2f4 \uc694\uc57d";
    const emotion = document.createElement("strong");
    emotion.textContent = response.emotion;
    const action = document.createElement("p");
    action.textContent = response.action;
    summaryCard.append(label, emotion, action);
  }
  function submitMessage(rawText) {
    const text = rawText.trim();
    appendMessage("user", text);
    const response = getCounselResponse(text);
    const reply = `${response.emotion} ${response.reply} ${copy.suggestion}: ${response.action}`;
    window.setTimeout(() => {
      appendMessage("ai", reply);
      renderSummary(response);
      statusText.textContent = copy.updated;
    }, 280);
  }
  function reset() {
    chatLog.innerHTML = "";
    appendMessage("ai", copy.greeting);
    statusText.textContent = copy.ready;
    input.value = "";
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!input.value.trim()) {
      statusText.textContent = copy.empty;
      input.focus();
      return;
    }
    statusText.textContent = copy.thinking;
    submitMessage(input.value);
    input.value = "";
  });
  return { submitMessage, reset };
}
