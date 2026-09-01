javascript
const SUPABASE_URL =
  "https://whjeurwstvryrrpgwigz.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_TqfUbviGYULqP3pdl1ug2Q_NXruETS0";

const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// ==================================================
// ابزار
// ==================================================

function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    function (m) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[m];
    }
  );
}


// ==================================================
// اخبار
// ==================================================

async function getNews() {

  const { data, error } =
    await supabaseClient
      .from("news")
      .select("*")
      .order("id", {
        ascending: false
      });

  if (error) {

    console.error(
      "خطا در دریافت اخبار:",
      error
    );

    return [];
  }

  return data || [];
}


async function renderNews(id, limit) {

  const el =
    document.getElementById(id);

  if (!el) return;

  let news =
    await getNews();

  if (limit) {
    news = news.slice(0, limit);
  }

  el.innerHTML =
    news.map(function (x) {

      return `
        <article class="news">

          <div class="date">
            ${esc(x.date)}
          </div>

          <h3>
            ${esc(x.title)}
          </h3>

          <p>
            ${esc(x.body)}
          </p>

        </article>
      `;

    }).join("");
}


// ==================================================
// مدیریت اخبار
// ==================================================

async function renderAdmin() {

  const el =
    document.getElementById(
      "adminNews"
    );

  if (!el) return;

  const news =
    await getNews();

  el.innerHTML =
    news.map(function (x) {

      return `
        <div class="admin-item">

          <b>
            ${esc(x.title)}
          </b>

          <p>
            ${esc(x.body)}
          </p>

          <button
            type="button"
            onclick="delNews('${x.id}')"
          >
            حذف
          </button>

        </div>
      `;

    }).join("");
}


async function delNews(id) {

  if (
    !confirm(
      "این خبر حذف شود؟"
    )
  ) {
    return;
  }

  const { error } =
    await supabaseClient
      .from("news")
      .delete()
      .eq("id", id);

  if (error) {

    console.error(
      "خطا در حذف خبر:",
      error
    );

    alert(
      "حذف خبر انجام نشد."
    );

    return;
  }

  await renderAdmin();

  await renderNews(
    "newsList",
    3
  );

  await renderNews(
    "allNews"
  );

  alert(
    "خبر حذف شد."
  );
}


// ==================================================
// اطلاعات سایت
// ==================================================

async function loadSiteContent() {

  const { data, error } =
    await supabaseClient
      .from("site_content")
      .select("*")
      .limit(1)
      .maybeSingle();

  if (error) {

    console.error(
      "خطا در دریافت اطلاعات سایت:",
      error
    );

    return;
  }

  if (!data) return;


  const title =
    document.querySelector(
      ".about h2"
    );

  const text =
    document.querySelector(
      ".about > div:first-child p"
    );

  const address =
    document.querySelector(
      ".card p"
    );

  const phone =
    document.querySelector(
      ".card p[dir='ltr']"
    );


  if (title) {
    title.textContent =
      data.main_title || "";
  }

  if (text) {
    text.textContent =
      data.main_text || "";
  }

  if (address) {
    address.textContent =
      data.address || "";
  }

  if (phone) {
    phone.textContent =
      data.phone || "";
  }


  document
    .querySelectorAll(
      "footer p"
    )
    .forEach(function (p, i) {

      if (i === 0) {
        p.textContent =
          data.address || "";
      }

      if (i === 1) {
        p.textContent =
          data.phone || "";
      }

    });
}


// ==================================================
// ذخیره اطلاعات سایت
// ==================================================

async function saveSite() {

  const mainTitle =
    document
      .getElementById("mainTitle")
      ?.value
      .trim() || "";

  const mainText =
    document
      .getElementById("mainText")
      ?.value
      .trim() || "";

  const address =
    document
      .getElementById("address")
      ?.value
      .trim() || "";

  const phone =
    document
      .getElementById("phone")
      ?.value
      .trim() || "";


  const { data: existing, error: readError } =
    await supabaseClient
      .from("site_content")
      .select("id")
      .limit(1)
      .maybeSingle();


  if (readError) {

    console.error(
      readError
    );

    alert(
      "دریافت اطلاعات سایت انجام نشد."
    );

    return;
  }


  let result;


  if (existing?.id) {

    result =
      await supabaseClient
        .from("site_content")
        .update({
          main_title: mainTitle,
          main_text: mainText,
          address: address,
          phone: phone
        })
        .eq(
          "id",
          existing.id
        );

  } else {

    result =
      await supabaseClient
        .from("site_content")
        .insert({
          main_title: mainTitle,
          main_text: mainText,
          address: address,
          phone: phone
        });

  }


  if (result.error) {

    console.error(
      result.error
    );

    alert(
      "ذخیره اطلاعات سایت انجام نشد."
    );

    return;
  }


  await loadSiteContent();

  alert(
    "اطلاعات سایت ذخیره شد."
  );
}


// ==================================================
// ورود مدیر
// ==================================================

async function login() {

  const email =
    document
      .getElementById("email")
      ?.value
      .trim();

  const password =
    document
      .getElementById("pass")
      ?.value;

  const err =
    document.getElementById(
      "err"
    );


  if (!email || !password) {

    if (err) {
      err.textContent =
        "ایمیل و رمز عبور را وارد کنید.";
    }

    return;
  }


  const { error } =
    await supabaseClient.auth
      .signInWithPassword({
        email: email,
        password: password
      });


  if (error) {

    console.error(
      "خطای ورود:",
      error
    );

    if (err) {
      err.textContent =
        "ایمیل یا رمز عبور اشتباه است.";
    }

    return;
  }


  sessionStorage.setItem(
    "fan_admin",
    "1"
  );


  await showDash();
}


// ==================================================
// پنل مدیریت
// ==================================================

async function showDash() {

  if (
    sessionStorage.getItem(
      "fan_admin"
    ) !== "1"
  ) {
    return;
  }


  document
    .getElementById("login")
    ?.classList
    .add("hidden");


  document
    .getElementById("dash")
    ?.classList
    .remove("hidden");


  const { data, error } =
    await supabaseClient
      .from("site_content")
      .select("*")
      .limit(1)
      .maybeSingle();


  if (!error && data) {

    const mainTitle =
      document.getElementById(
        "mainTitle"
      );

    const mainText =
      document.getElementById(
        "mainText"
      );

    const address =
      document.getElementById(
        "address"
      );

    const phone =
      document.getElementById(
        "phone"
      );


    if (mainTitle) {
      mainTitle.value =
        data.main_title || "";
    }

    if (mainText) {
      mainText.value =
        data.main_text || "";
    }

    if (address) {
      address.value =
        data.address || "";
    }

    if (phone) {
      phone.value =
        data.phone || "";
    }

  }


  await renderAdmin();
}


// ==================================================
// خروج
// ==================================================

async function logout() {

  await supabaseClient.auth.signOut();

  sessionStorage.removeItem(
    "fan_admin"
  );

  location.reload();
}


// ==================================================
// تغییر رمز
// ==================================================

async function changePass() {

  const input =
    document.getElementById(
      "newpass"
    );

  if (!input) return;

  const password =
    input.value;


  if (password.length < 6) {

    alert(
      "رمز باید حداقل ۶ کاراکتر باشد."
    );

    return;
  }


  const { error } =
    await supabaseClient.auth
      .updateUser({
        password: password
      });


  if (error) {

    console.error(
      error
    );

    alert(
      "تغییر رمز انجام نشد."
    );

    return;
  }


  input.value = "";

  alert(
    "رمز مدیریت تغییر کرد."
  );
}


// ==================================================
// آپلود اسلایدر
// ==================================================

async function uploadSliderImage(
  file,
  index
) {

  if (!file) {

    alert(
      "ابتدا یک تصویر انتخاب کنید."
    );

    return;
  }


  if (
    ![
      "image/jpeg",
      "image/png",
      "image/webp"
    ].includes(file.type)
  ) {

    alert(
      "فقط JPG، PNG یا WebP مجاز است."
    );

    return;
  }


  /*
   * تصویر را به JPG تبدیل می‌کنیم
   * تا همیشه مسیر ثابت داشته باشیم.
   */

  const image =
    new Image();

  const objectUrl =
    URL.createObjectURL(file);


  image.src =
    objectUrl;


  await new Promise(
    function (resolve, reject) {

      image.onload =
        resolve;

      image.onerror =
        reject;

    }
  );


  const canvas =
    document.createElement(
      "canvas"
    );


  canvas.width =
    image.naturalWidth;

  canvas.height =
    image.naturalHeight;


  const ctx =
    canvas.getContext(
      "2d"
    );


  ctx.drawImage(
    image,
    0,
    0
  );


  const blob =
    await new Promise(
      function (resolve) {

        canvas.toBlob(
          resolve,
          "image/jpeg",
          0.90
        );

      }
    );


  URL.revokeObjectURL(
    objectUrl
  );


  if (!blob) {

    alert(
      "تبدیل تصویر انجام نشد."
    );

    return;
  }


  /*
   * نام ثابت:
   * slider-1.jpg
   * slider-2.jpg
   * slider-3.jpg
   */

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
          contentType:
            "image/jpeg"
        }
      );


  if (error) {

    console.error(
      "خطای آپلود:",
      error
    );

    alert(
      "آپلود تصویر انجام نشد."
    );

    return;
  }


  alert(
    `تصویر اسلاید ${index} با موفقیت آپلود شد.`
  );


  await loadSliderImages();
}


// ==================================================
// دریافت عکس‌های اسلایدر
// ==================================================

async function loadSliderImages() {

  const slides =
    [
      ...document.querySelectorAll(
        ".slide"
      )
    ];


  if (!slides.length) {
    return;
  }


  slides.forEach(
    function (slide) {

      const index =
        slide.dataset.index;

      const img =
        slide.querySelector(
          ".slider-image"
        );

      const placeholder =
        slide.querySelector(
          ".placeholder"
        );


      if (!img) return;


      const {
        data
      } =
        supabaseClient.storage
          .from("site-images")
          .getPublicUrl(
            `slider-${index}.jpg`
          );


      if (
        data?.publicUrl
      ) {

        img.src =
          data.publicUrl;

        img.onload =
          function () {

            img.style.display =
              "block";

            if (placeholder) {
              placeholder.style.display =
                "none";
            }

          };

        img.onerror =
          function () {

            img.style.display =
              "none";

            if (placeholder) {
              placeholder.style.display =
                "flex";
            }

          };

      }

    }
  );
}


// ==================================================
// اسلایدر
// ==================================================

let si = 0;


function initSlider() {

  const slides =
    [
      ...document.querySelectorAll(
        ".slide"
      )
    ];

  const dots =
    document.getElementById(
      "dots"
    );


  if (!slides.length) {
    return;
  }


  if (dots) {

    dots.innerHTML =
      slides
        .map(
          function (_, i) {

            return `
              <span
                class="dot ${
                  i === 0
                    ? "on"
                    : ""
                }"
              ></span>
            `;

          }
        )
        .join("");

  }


  setInterval(
    function () {
      move(1);
    },
    5000
  );
}


function move(x) {

  const slides =
    [
      ...document.querySelectorAll(
        ".slide"
      )
    ];


  if (!slides.length) {
    return;
  }


  slides[si]
    .classList
    .remove("active");


  si =
    (
      si +
      x +
      slides.length
    ) %
    slides.length;


  slides[si]
    .classList
    .add("active");


  document
    .querySelectorAll(
      ".dot"
    )
    .forEach(
      function (dot, i) {

        dot.classList.toggle(
          "on",
          i === si
        );

      }
    );
}


// ==================================================
// منو
// ==================================================

function toggleMenu() {

  document
    .getElementById("nav")
    ?.classList
    .toggle("open");
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


    /*
     * اگر صفحه admin باشد
     */

    if (
      location.pathname
        .toLowerCase()
        .endsWith(
          "admin.html"
        )
    ) {

      const {
        data
      } =
        await supabaseClient.auth
          .getSession();


      if (
        data?.session
      ) {

        sessionStorage.setItem(
          "fan_admin",
          "1"
        );

        await showDash();

      }

    }


    // ==================================================
    // افزودن خبر
    // ==================================================

    const form =
      document.getElementById(
        "form"
      );


    if (form) {

      form.addEventListener(
        "submit",
        async function (e) {

          e.preventDefault();


          const title =
            document
              .getElementById(
                "title"
              )
              ?.value
              .trim();


          const body =
            document
              .getElementById(
                "body"
              )
              ?.value
              .trim();


          if (!title || !body) {

            alert(
              "عنوان و متن خبر را وارد کنید."
            );

            return;
          }


          const {
            error
          } =
            await supabaseClient
              .from("news")
              .insert({
                title: title,
                body: body,
                date:
                  new Date()
                    .toLocaleDateString(
                      "fa-IR"
                    )
              });


          if (error) {

            console.error(
              "خطای ذخیره خبر:",
              error
            );

            alert(
              "خبر ذخیره نشد."
            );

            return;
          }


          form.reset();


          await renderAdmin();


          await renderNews(
            "newsList",
            3
          );


          await renderNews(
            "allNews"
          );


          alert(
            "خبر با موفقیت ذخیره شد."
          );

        }
      );

    }


    // ==================================================
    // آپلود تصاویر پنل
    // ==================================================

    document
      .querySelectorAll(
        ".slider-upload"
      )
      .forEach(
        function (input) {

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

                console.error(
                  "خطای غیرمنتظره:",
                  error
                );

                alert(
                  "آپلود تصویر انجام نشد."
                );

              }


              input.value = "";

            }
          );

        }
      );

  }
);
```
