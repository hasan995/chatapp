const socket = io("ws://localhost:3000");

const activity = document.querySelector(".activity");
const msgInput = document.querySelector("#message");
const nameInput = document.querySelector("#name");

function sendMessage(e) {
  e.preventDefault();
  if (msgInput.value) {
    socket.emit("message", { message: msgInput.value });
    msgInput.value = "";
  }
  msgInput.focus();
}

function joinRoom(e) {
  e.preventDefault();
  if (nameInput.value) {
    socket.emit("joinRoom", nameInput.value);
    nameInput.value = "";
  }
}

document.querySelector(".form-msg").addEventListener("submit", sendMessage);
document.querySelector(".form-join").addEventListener("submit", joinRoom);

// Listen for messages
socket.on("message", (data) => {
  const li = document.createElement("li");
  li.textContent = data.message;
  document.querySelector(".chat-display").appendChild(li);
  if (data.isAdmin) {
    li.classList.add("admin");
  }
  if (data.socketid === socket.id) {
    li.classList.add("user");
  }
});

msgInput.addEventListener("keypress", () => {
  socket.emit("activity", socket.id);
});

let activityTimer;
socket.on("activity", (name) => {
  activity.textContent = `${name} is typing...`;

  // Clear after 3 seconds
  clearTimeout(activityTimer);
  activityTimer = setTimeout(() => {
    activity.textContent = "";
  }, 3000);
});
