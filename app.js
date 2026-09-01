```javascript
const DEFAULT_NEWS = [
  {
    title: "آغاز به کار وب‌سایت هنرستان فن آموز",
    body: "به وب‌سایت رسمی هنرستان فن آموز خوش آمدید. اخبار و اطلاعیه‌های جدید از این بخش منتشر می‌شود.",
    date: "۱۴۰۵/۰۶/۰۱"
  },
  {
    title: "اطلاعیه هنرستان",
    body: "اطلاعیه‌های مهم آموزشی و برنامه‌های هنرستان در این قسمت قرار می‌گیرد.",
    date: "۱۴۰۵/۰۶/۰۱"
  }
];

const DEFAULT_SITE = {
  mainTitle: "محیطی برای یادگیری و ساختن آینده",
  mainText: "این وب‌سایت برای اطلاع‌رسانی اخبار، رویدادها و برنامه‌های هنرستان فن آموز طراحی شده است.",
  address: "شهر بهارستان - ولیعصر جنوبی - خیابان طوطی - پلاک ۱۳۳",
  phone: "۰۳۱۳۶۸۱۲۱۳۳"
};

function getNews() {
  return JSON.parse(localStorage.getItem("fan_news") || "null") || DEFAULT_NEWS;
}

function saveNews(n) {
  localStorage.setItem("fan_news", JSON.stringify(n));
}

function getSite() {
  return JSON.parse(localStorage.getItem("fan_site") || "null") || DEFAULT_SITE;
}

function saveSiteData(data) {
  localStorage.setItem("fan_site", JSON.stringify(data));
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

function renderNews(id, limit) {
  const el = document.getElementById(id);
  if (!el) return;

  const n = getNews().slice(0, limit || 99);

  el.innerHTML = n.map(x => `
    <article class="news">
      <div class="date">${x.date || ""}</div>
      <h3>${esc(x.title)}</h3>
      <p>${esc(x.body)}</p>
    </article>
  `).join("");
}

function renderSite() {
  const s = getSite();

  const title = document.querySelector(".about h2");
  const text = document.querySelector(".about p");
  const address = document.querySelector(".card p");
  const phone = document.querySelector(".card p[dir='ltr']");

  if (title) title.textContent = s.mainTitle;
  if (text) text.textContent = s.mainText;
  if (address) address.textContent = s.address;
  if (phone) phone.textContent = s.phone;

  document.querySelectorAll("footer p").forEach((p, i) => {
    if (i === 0) p.textContent = s.address;
    if (i === 1) p.textContent = s.phone;
  });
}

function toggleMenu() {
  document.getElementById("nav")?.classList.toggle("open");
}

let si = 0;

function initSlider() {
  const s = [...document.querySelectorAll(".slide")];
  const d = document.getElementById("dots");

  if (!s.length) return;

  if (d) {
    d.innerHTML = s.map((_, i) =>
      `<span class="dot ${i === 0 ? "on" : ""}"></span>`
    ).join("");
  }

  setInterval(() => move(1), 5000);
}

function move(x) {
  const s = [...document.querySelectorAll(".slide")];

  if (!s.length) return;

  s[si].classList.remove("active");
  si = (si + x + s.length) % s.length;
  s[si].classList.add("active");

  document.querySelectorAll(".dot").forEach((d, i) => {
    d.classList.toggle("on", i === si);
  });
}

function login() {
  const p = localStorage.getItem("fan_pass") || "1234";

  if (document.getElementById("pass").value === p) {
    sessionStorage.fan_admin = "1";
    showDash();
  } else {
    document.getElementById("err").textContent = "رمز ورود اشتباه است.";
  }
}

function showDash() {
  if (sessionStorage.fan_admin !== "1") return;

  document.getElementById("login")?.classList.add("hidden");
  document.getElementById("dash")?.classList.remove("hidden");

  const s = getSite();

  const mainTitle = document.getElementById("mainTitle");
  const mainText = document.getElementById("mainText");
  const address = document.getElementById("address");
  const phone = document.getElementById("phone");

  if (mainTitle) mainTitle.value = s.mainTitle;
  if (mainText) mainText.value = s.mainText;
  if (address) address.value = s.address;
  if (phone) phone.value = s.phone;

  renderAdmin();
}

function logout() {
  sessionStorage.removeItem("fan_admin");
  location.reload();
}

function renderAdmin() {
  const e = document.getElementById("adminNews");
  if (!e) return;

  e.innerHTML = getNews().map((x, i) => `
    <div class="admin-item">
      <b>${esc(x.title)}</b>
      <p>${esc(x.body)}</p>
      <button onclick="delNews(${i})">حذف</button>
    </div>
  `).join("");
}

function delNews(i) {
  const n = getNews();
  n.splice(i, 1);
  saveNews(n);
  renderAdmin();
  renderNews("newsList", 3);
  renderNews("allNews");
}

function changePass() {
  const input = document.getElementById("newpass");
  if (!input) return;

  const p = input.value;

  if (p.length < 4) {
    return alert("رمز باید حداقل ۴ کاراکتر باشد.");
  }

  localStorage.setItem("fan_pass", p);
  input.value = "";

  alert("رمز ذخیره شد.");
}

function saveSite() {
  const data = {
    mainTitle: document.getElementById("mainTitle")?.value || DEFAULT_SITE.mainTitle,
    mainText: document.getElementById("mainText")?.value || DEFAULT_SITE.mainText,
    address: document.getElementById("address")?.value || DEFAULT_SITE.address,
    phone: document.getElementById("phone")?.value || DEFAULT_SITE.phone
  };

  saveSiteData(data);

  alert("اطلاعات سایت ذخیره شد.");
}

document.addEventListener("DOMContentLoaded", () => {
  renderNews("newsList", 3);
  renderNews("allNews");
  renderSite();
  initSlider();

  if (location.pathname.toLowerCase().endsWith("admin.html")) {
    showDash();
  }

  document.getElementById("form")?.addEventListener("submit", e => {
    e.preventDefault();

    const titleInput = document.getElementById("title");
    const bodyInput = document.getElementById("body");

    const n = getNews();

    n.unshift({
      title: titleInput.value,
      body: bodyInput.value,
      date: new Date().toLocaleDateString("fa-IR")
    });

    saveNews(n);

    e.target.reset();

    renderAdmin();
    renderNews("newsList", 3);
    renderNews("allNews");
  });
});
```
