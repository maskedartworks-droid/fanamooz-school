const SUPABASE_URL = "https://whjeurwstvryrrpgwigz.supabase.co";
const SUPABASE_KEY = "sb_publishable_TqfUbviGYULqP3pdl1ug2Q_NXruETS0";
const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
const DEFAULT_NEWS=[
 {title:"آغاز به کار وب‌سایت هنرستان فن آموز",body:"به وب‌سایت رسمی هنرستان فن آموز خوش آمدید. اخبار و اطلاعیه‌های جدید از این بخش منتشر می‌شود.",date:"۱۴۰۵/۰۶/۰۱"},
 {title:"اطلاعیه هنرستان",body:"اطلاعیه‌های مهم آموزشی و برنامه‌های هنرستان در این قسمت قرار می‌گیرد.",date:"۱۴۰۵/۰۶/۰۱"}
];
async function getNews() {
  const { data, error } = await supabaseClient
    .from("news")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
}
async function loadSiteContent() {
  const { data, error } = await supabaseClient
    .from("site_content")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("خطا در دریافت اطلاعات سایت:", error);
    return;
  }

  if (!data) return;

  const title = document.querySelector(".about h2");
  const text = document.querySelector(".about p");
  const address = document.querySelector(".card p");
  const phone = document.querySelector(".card p[dir='ltr']");

  if (title) title.textContent = data.main_title || "";
  if (text) text.textContent = data.main_text || "";
  if (address) address.textContent = data.address || "";
  if (phone) phone.textContent = data.phone || "";

  document.querySelectorAll("footer p").forEach((p, i) => {
    if (i === 0) p.textContent = data.address || "";
    if (i === 1) p.textContent = data.phone || "";
  });
}
async function renderNews(id,limit){
  let el=document.getElementById(id);
  if(!el)return;

  let n = await getNews();
  n = n.slice(0,limit||99);

  el.innerHTML=n.map(x=>`
    <article class="news">
      <div class="date">${x.date||""}</div>
      <h3>${esc(x.title)}</h3>
      <p>${esc(x.body)}</p>
    </article>
  `).join("");
}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function toggleMenu(){document.getElementById("nav")?.classList.toggle("open")}
let si=0;function initSlider(){let s=[...document.querySelectorAll(".slide")],d=document.getElementById("dots");if(!s.length)return;d.innerHTML=s.map((_,i)=>`<span class="dot ${i==0?"on":""}"></span>`).join("");setInterval(()=>move(1),5000)}
function move(x){let s=[...document.querySelectorAll(".slide")];if(!s.length)return;s[si].classList.remove("active");si=(si+x+s.length)%s.length;s[si].classList.add("active");document.querySelectorAll(".dot").forEach((d,i)=>d.classList.toggle("on",i==si))}
async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("pass").value;

  if (!email || !password) {
    document.getElementById("err").textContent =
      "ایمیل و رمز عبور را وارد کنید.";
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    document.getElementById("err").textContent =
      "ایمیل یا رمز عبور اشتباه است.";
    return;
  }

  sessionStorage.fan_admin = "1";
  showDash();
}
function showDash(){if(sessionStorage.fan_admin!=="1")return;document.getElementById("login").classList.add("hidden");document.getElementById("dash").classList.remove("hidden");renderAdmin()}
function logout(){sessionStorage.removeItem("fan_admin");location.reload()}
function renderAdmin(){let e=document.getElementById("adminNews");if(!e)return;e.innerHTML=getNews().map((x,i)=>`<div class="admin-item"><b>${esc(x.title)}</b><p>${esc(x.body)}</p><button onclick="delNews(${i})">حذف</button></div>`).join("")}
function delNews(i){let n=getNews();n.splice(i,1);saveNews(n);renderAdmin()}
function changePass(){let p=document.getElementById("newpass").value;if(p.length<4)return alert("رمز باید حداقل ۴ کاراکتر باشد.");localStorage.setItem("fan_pass",p);alert("رمز ذخیره شد.")}
document.addEventListener("DOMContentLoaded", async () => {
  await renderNews("newsList", 3);
  await loadSiteContent();
  await renderNews("allNews");

  initSlider();

  if (location.pathname.toLowerCase().endsWith("admin.html")) {
    showDash();
  }

  document.getElementById("form")?.addEventListener("submit", async e => {
    e.preventDefault();

    const titleInput = document.getElementById("title");
    const bodyInput = document.getElementById("body");

    const { error } = await supabaseClient
      .from("news")
      .insert({
        title: titleInput.value.trim(),
        body: bodyInput.value.trim(),
        date: new Date().toLocaleDateString("fa-IR")
      });

    if (error) {
      console.error(error);
      alert("ذخیره خبر انجام نشد.");
      return;
    }

    e.target.reset();

    await renderAdmin();
    await renderNews("newsList", 3);
    await renderNews("allNews");

    alert("خبر با موفقیت ذخیره شد.");
  });
});
