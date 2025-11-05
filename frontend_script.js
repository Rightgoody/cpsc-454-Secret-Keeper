// === CONFIGURATION ===
const REGION = "us-west-2";
const USER_POOL_ID = "<COGNITO_USER_POOL_ID>";
const CLIENT_ID = "<COGNITO_CLIENT_ID>";
const API_URL = "<API_GATEWAY_URL>"; // e.g. https://xxxx.execute-api.us-west-2.amazonaws.com/prod/secret

// === BASIC COGNITO AUTH (signup/login) ===
async function cognitoLogin(email, password) {
  const endpoint = `https://cognito-idp.${REGION}.amazonaws.com/`;
  const headers = { "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
                    "Content-Type": "application/x-amz-json-1.1" };
  const data = {
    AuthParameters: { USERNAME: email, PASSWORD: password },
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: CLIENT_ID
  };
  const res = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(data) });
  const json = await res.json();
  if (json.AuthenticationResult)
    return json.AuthenticationResult.IdToken;
  throw new Error(json.message || "Login failed");
}

let idToken = null;
document.getElementById("login-btn").onclick = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    idToken = await cognitoLogin(email, password);
    document.getElementById("auth-section").classList.add("hidden");
    document.getElementById("app-section").classList.remove("hidden");
    listSecrets();
  } catch (e) { alert(e.message); }
};

document.getElementById("logout-btn").onclick = () => location.reload();

// === SECRET CRUD ===
async function createSecret() {
  const secret = document.getElementById("secret-text").value;
  const ttl = parseInt(document.getElementById("ttl").value) || 3600;
  const res = await axios.post(`${API_URL}/create`, { secret, ttl }, {
    headers: { Authorization: idToken }
  });
  alert("Secret stored! ID: " + res.data.secret_id);
  listSecrets();
}

async function listSecrets() {
  const listDiv = document.getElementById("secrets-list");
  listDiv.innerHTML = "";
  const res = await axios.post(`${API_URL}/list`, {}, { headers: { Authorization: idToken } });
  res.data.forEach(item => {
    const card = document.createElement("div");
    card.className = "p-3 bg-gray-700 rounded-xl flex justify-between items-center hover:bg-gray-600 transition";
    card.innerHTML = `
      <div><b>ID:</b> ${item.secret_id}<br><small>TTL: ${item.ttl}</small></div>
      <div class="space-x-2">
        <button class="bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded" onclick="getSecret('${item.secret_id}')">View</button>
        <button class="bg-red-500 hover:bg-red-600 px-2 py-1 rounded" onclick="deleteSecret('${item.secret_id}')">Delete</button>
      </div>`;
    listDiv.appendChild(card);
  });
}

async function getSecret(secret_id) {
  const res = await axios.post(`${API_URL}/get`, { secret_id }, { headers: { Authorization: idToken } });
  alert("Decrypted Secret:\n\n" + res.data.secret);
}

async function deleteSecret(secret_id) {
  await axios.post(`${API_URL}/delete`, { secret_id }, { headers: { Authorization: idToken } });
  alert("Secret deleted");
  listSecrets();
}

document.getElementById("create-btn").onclick = createSecret;
