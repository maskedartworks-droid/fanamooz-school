
const SUPABASE_URL = "https://whjeurwstvryrrpgwigz.supabase.co";
const SUPABASE_KEY = "sb_publishable_TqfUbviGYULqP3pdl1ug2Q_NXruETS0";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// ==================================================
// ابزار
// ==================================================

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, function (m) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m];
  });
}


// ==================================================
// اخبار
// ==================================================

async function getNews() {
  const { data, error } = await supabaseClient
    .from("news")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error("خطا در دریافت اخبار:", error);
    return [];
  }

  return data || [];
}


async function renderNews(id, limit) {
  const el = document.getElementById(id);

  if (!el) return;

  let news = await getNews();

  if (limit) {
    news = news.slice(0, limit);
  }

  el.innerHTML = news.map(function (x) {
    return `
      <article class="news">
        <div class="date">${esc(x.date)}</div>
        <h3>${esc(x.title)}</h3>
        <p>${esc(x.body)}</p>
      </article>
    `;
  }).join("");
}


async function renderAdmin() {
  const el = document.getElementById("adminNews");

  if (!el) return;

  const news = await getNews();

  el.innerHTML = news.map(function (x) {
    return `
      <div class="admin-item">
        <b>${esc(x.title)}</b>
        <p>${esc(x.body)}</p>
        <button type="button" onclick="delNews('${x.id}')">
          حذف
        </button>
      </div>
    `;
  }).join("");
}


async function delNews(id) {
  if (!confirm("این خبر حذف شود؟")) {
    return;
  }

  const { error } = await supabaseClient
    .from("news")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("خطا در حذف خبر:", error);
    alert("حذف خبر انجام نشد.");
    return;
  }

  await renderAdmin();
  await renderNews("newsList", 3);
  await renderNews("allNews");

  alert("خبر حذف شد.");
}


// ==================================================
// اطلاعات سایت
// ==================================================

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
  const text = document.querySelector(".about > div:first-child p");
  const address = document.querySelector(".card p");
  const phone = document.querySelector(".card p[dir='ltr']");

  if (title) {
    title.textContent = data.main_title || "";
  }

  if (text) {
    text.textContent = data.main_text || "";
  }

  if (address) {
    address.textContent = data.address || "";
  }

  if (phone) {
    phone.textContent = data.phone || "";
  }

  document.querySelectorAll("footer p").forEach(function (p, i) {
    if (i === 0) {
      p.textContent = data.address || "";
    }

    if (i === 1) {
      p.textContent = data.phone || "";
    }
  });
}


async function saveSite() {
  const mainTitle =
    document.getElementById("mainTitle")?.value.trim() || "";

  const mainText =
    document.getElementById("mainText")?.value.trim() || "";

  const address =
    document.getElementById("address")?.value.trim() || "";

  const phone =
    document.getElementById("phone")?.value.trim() || "";

  const { data: existing, error: readError } =
    await supabaseClient
      .from("site_content")
      .select("id")
      .limit(1)
      .maybeSingle();

  if (readError) {
    console.error(readError);
    alert("دریافت اطلاعات سایت انجام نشد.");
    return;
  }

  let result;

  if (existing?.id) {
    result = await supabaseClient
      .from("site_content")
      .update({
        main_title: mainTitle,
        main_text: mainText,
        address: address,
        phone: phone
      })
      .eq("id", existing.id);
  } else {
    result = await supabaseClient
      .from("site_content")
      .insert({
        main_title: mainTitle,
        main_text: mainText,
        address: address,
        phone: phone
      });
  }

  if (result.error) {
    console.error(result.error);
    alert("ذخیره اطلاعات سایت انجام نشد.");
    return;
  }

  await loadSiteContent();

  alert("اطلاعات سایت ذخیره شد.");
}


// ==================================================
// ورود مدیر
// ==================================================

async function login() {
  const email =
    document.getElementById("email")?.value.trim() || "";

  const password =
    document.getElementById("pass")?.value || "";

  const err =
    document.getElementById("err");

  if (!email || !password) {
    if (err) {
      err.textContent = "ایمیل و رمز عبور را وارد کنید.";
    }

    return;
  }

  const { error } =
    await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

  if (error) {
    console.error("خطای ورود:", error);

    if (err) {
      err.textContent = "ایمیل یا رمز عبور اشتباه است.";
    }

    return;
  }

  sessionStorage.setItem("fan_admin", "1");

  await showDash();
}


// ==================================================
// پنل مدیریت
// ==================================================

async function showDash() {
  const { data } =
    await supabaseClient.auth.getSession();

  if (!data?.session) {
    sessionStorage.removeItem("fan_admin");
    return;
  }

  const loginPanel =
    document.getElementById("login");

  const dash =
    document.getElementById("dash");

  if (loginPanel) {
    loginPanel.classList.add("hidden");
  }

  if (dash) {
    dash.classList.remove("hidden");
  }

  const { data: siteData, error } =
    await supabaseClient
      .from("site_content")
      .select("*")
      .limit(1)
      .maybeSingle();

  if (!error && siteData) {
    const mainTitle =
      document.getElementById("mainTitle");

    const mainText =
      document.getElementById("mainText");

    const address =
      document.getElementById("address");

    const phone =
      document.getElementById("phone");

    if (mainTitle) {
      mainTitle.value = siteData.main_title || "";
    }

    if (mainText) {
      mainText.value = siteData.main_text || "";
    }

    if (address) {
      address.value = siteData.address || "";
    }

    if (phone) {
      phone.value = siteData.phone || "";
    }
  }

  await renderAdmin();
}


// ==================================================
// خروج
// ==================================================

async function logout() {
  await supabaseClient.auth.signOut();

  sessionStorage.removeItem("fan_admin");

  location.reload();
}


// ==================================================
// تغییر رمز
// ==================================================

async function changePass() {
  const input =
    document.getElementById("newpass");

  if (!input) return;

  const password = input.value;

  if (password.length < 6) {
    alert("رمز باید حداقل ۶ کاراکتر باشد.");
    return;
  }

  const { error } =
    await supabaseClient.auth.updateUser({
      password: password
    });

  if (error) {
    console.error(error);
    alert("تغییر رمز انجام نشد.");
    return;
  }

  input.value = "";

  alert("رمز مدیریت تغییر کرد.");
}


// ==================================================
// آپلود تصویر اسلایدر
// ==================================================

async function uploadSliderImage(file, index) {
  if (!file) {
    alert("ابتدا یک تصویر انتخاب کنید.");
    return;
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!allowedTypes.includes(file.type)) {
    alert("فقط JPG، PNG یا WebP مجاز است.");
    return;
  }

  try {
    const image = new Image();

    const objectUrl =
      URL.createObjectURL(file);

    image.src = objectUrl;

    await new Promise(function (resolve, reject) {
      image.onload = resolve;
      image.onerror = reject;
    });

    const canvas =
      document.createElement("canvas");

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const ctx =
      canvas.getContext("2d");

    ctx.drawImage(
      image,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const blob =
      await new Promise(function (resolve) {
        canvas.toBlob(
          resolve,
          "image/jpeg",
          0.9
        );
      });

    URL.revokeObjectURL(objectUrl);

    if (!blob) {
      alert("تبدیل تصویر انجام نشد.");
      return;
    }

    const fileName =
      `slider-${index}.jpg`;

    const { error } =
      await supabaseClient.storage
        .from("site-images")
        .upload(
          fileName,
          blob,
          {
            upsert: true,
            contentType: "image/jpeg",
            cacheControl: "3600"
          }
        );

    if (error) {
      console.error("خطای Supabase:", error);
      alert(
        "آپلود انجام نشد: " +
        error.message
      );
      return;
    }

    alert(
      `تصویر اسلاید ${index} با موفقیت آپلود شد.`
    );

    await loadSliderImages();

  } catch (error) {
    console.error("خطای آپلود تصویر:", error);

    alert(
      "آپلود تصویر انجام نشد: " +
      (error.message || error)
    );
  }
}


// ==================================================
// دریافت تصاویر اسلایدر
// ==================================================

function loadSliderImages() {
  const slides =
    [...document.querySelectorAll(".slide")];

  if (!slides.length) {
    return;
  }

  slides.forEach(function (slide) {
    const index =
      slide.dataset.index;

    if (!index) {
      return;
    }

    const img =
      slide.querySelector(".slider-image");

    const placeholder =
      slide.querySelector(".placeholder");

    if (!img) {
      return;
    }

    const result =
      supabaseClient.storage
        .from("site-images")
        .getPublicUrl(
          `slider-${index}.jpg`
        );

    const publicUrl =
      result?.data?.publicUrl;

    if (!publicUrl) {
      return;
    }

    img.onload = function () {
      img.style.display = "block";

      if (placeholder) {
        placeholder.style.display = "none";
      }
    };

    img.onerror = function () {
      img.style.display = "none";

      if (placeholder) {
        placeholder.style.display = "flex";
      }
    };

    img.src =
      publicUrl + "?v=" + Date.now();
  });
}


// ==================================================
// اسلایدر
// ==================================================

let si = 0;

function initSlider() {
  const slides =
    [...document.querySelectorAll(".slide")];

  const dots =
    document.getElementById("dots");

  if (!slides.length) {
    return;
  }

  if (dots) {
    dots.innerHTML =
      slides.map(function (_, i) {
        return `
          <span class="dot ${i === 0 ? "on" : ""}"></span>
        `;
      }).join("");
  }

  setInterval(function () {
    move(1);
  }, 5000);
}


function move(x) {
  const slides =
    [...document.querySelectorAll(".slide")];

  if (!slides.length) {
    return;
  }

  slides[si].classList.remove("active");

  si =
    (si + x + slides.length) %
    slides.length;

  slides[si].classList.add("active");

  document
    .querySelectorAll(".dot")
    .forEach(function (dot, i) {
      dot.classList.toggle(
        "on",
        i === si
      );
    });
}


// ==================================================
// منو
// ==================================================

function toggleMenu() {
  document
    .getElementById("nav")
    ?.classList.toggle("open");
}


// ==================================================
// افزودن خبر
// ==================================================

async function setupNewsForm() {
  const form =
    document.getElementById("form");

  if (!form) {
    return;
  }

  form.addEventListener(
    "submit",
    async function (e) {
      e.preventDefault();

      const title =
        document
          .getElementById("title")
          ?.value
          .trim() || "";

      const body =
        document
          .getElementById("body")
          ?.value
          .trim() || "";

      if (!title || !body) {
        alert("عنوان و متن خبر را وارد کنید.");
        return;
      }

      const { error } =
        await supabaseClient
          .from("news")
          .insert({
            title: title,
            body: body,
            date: new Date().toLocaleDateString("fa-IR")
          });

      if (error) {
        console.error("خطای ذخیره خبر:", error);
        alert("خبر ذخیره نشد: " + error.message);
        return;
      }

      form.reset();

      await renderAdmin();
      await renderNews("newsList", 3);
      await renderNews("allNews");

      alert("خبر با موفقیت ذخیره شد.");
    }
  );
}


// ==================================================
// اتصال آپلودهای پنل
// ==================================================

function setupSliderUploads() {
  document
    .querySelectorAll(".slider-upload")
    .forEach(function (input) {
      input.addEventListener(
        "change",
        async function () {
          const file =
            input.files?.[0];

          const index =
            input.dataset.index;

          try {
            await uploadSliderImage(
              file,
              index
            );
          } catch (error) {
            console.error(error);
            alert(
              "آپلود تصویر انجام نشد."
            );
          }

          input.value = "";
        }
      );
    });
}


// ==================================================
// شروع برنامه
// ==================================================

document.addEventListener(
  "DOMContentLoaded",
  async function () {

    await renderNews(
      "newsList",
      3
    );

    await loadSiteContent();

    await renderNews(
      "allNews"
    );

    await loadSliderImages();

    initSlider();

    await setupNewsForm();

    setupSliderUploads();


    // فقط در admin
    if (
      location.pathname
        .toLowerCase()
        .endsWith("admin.html")
    ) {
      const { data } =
        await supabaseClient.auth.getSession();

      if (data?.session) {
        sessionStorage.setItem(
          "fan_admin",
          "1"
        );

        await showDash();
      }
    }
  }
);

