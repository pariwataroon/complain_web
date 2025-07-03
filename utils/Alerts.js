import Swal from "sweetalert2";

// เพิ่ม z-index สูงสุดให้กับ SweetAlert2 container ทุกตัว
const HIGH_Z_INDEX_CLASS = "swal-high-zindex";

// ฟังก์ชัน inject CSS เฉพาะ client (ป้องกัน SSR error)
function ensureSwalZIndexStyle() {
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    if (!document.getElementById("swal-high-zindex-style")) {
      const style = document.createElement("style");
      style.id = "swal-high-zindex-style";
      style.innerHTML = `
        .swal-high-zindex,
        .swal2-container.swal-high-zindex,
        .swal2-container {
          z-index: 2500 !important;
        }
      `;
      document.head.appendChild(style);
    }
    if (!document.getElementById("swal-custom-style")) {
      const style = document.createElement("style");
      style.id = "swal-custom-style";
      style.innerHTML = `
        .swal2-actions .custom-confirm-button,
        .swal2-actions .custom-cancel-button {
          padding: 4px 16px !important;
          border-radius: 12px !important;
          font-size: 18px !important;
          border-width: 2px !important;
          border-style: solid !important;
        }

        .swal2-actions .custom-confirm-button {
          margin-left: 12px;
          background-color: #D52C27 !important;
          border-color: #D52C27 !important;
          color: white !important;
        }
        .swal2-actions .custom-cancel-button {
          margin-right: 12px;
          background-color: #FBEAE9 !important;
          border-color: #DF615D !important;
          color: #DF615D !important;
        }
        .swal2-actions .custom-confirm-button:hover {
          filter: brightness(0.85);
        }
        .swal2-actions .custom-cancel-button:hover {
          filter: brightness(0.9);
        }
      `;
      document.head.appendChild(style);
    }
  }
}

export const showAlert = (
  type = "info",
  title = "แจ้งเตือน",
  text = "",
  isHtml = false
) => {
  ensureSwalZIndexStyle();
  return Swal.fire({
    icon: type,
    title,
    ...(isHtml ? { html: text } : { text }),
    confirmButtonColor: "#3085d6",
    confirmButtonText: "ตกลง",
    customClass: {
      container: HIGH_Z_INDEX_CLASS,
    },
  });
};

export const showConfirm = (
  title = "คุณแน่ใจหรือไม่?",
  content = "",
  confirmText = "ใช่",
  cancelText = "ยกเลิก",
  width = undefined
) => {
  ensureSwalZIndexStyle();
  const isHtml = /<\/?[a-z][\s\S]*>/i.test(content);

  const options = {
    icon: "question",
    title,
    ...(isHtml ? { html: content } : { text: content }),
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    customClass: {
      container: HIGH_Z_INDEX_CLASS,
    },
  };

  if (width) {
    options.width = width;
  }

  return Swal.fire(options).then((result) => result.isConfirmed);
};

export const showConfirm2 = (
  title = "คุณแน่ใจหรือไม่?",
  content = "",
  confirmText = "ใช่",
  cancelText = "ยกเลิก",
  width = undefined
) => {
  ensureSwalZIndexStyle();
  const isHtml = /<\/?[a-z][\s\S]*>/i.test(content);

  const buttonStyle = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 24px;
    font-size: 18px;
    gap: 8px;
    background-color: transparent;
  `;

  const options = {
    title,
    ...(isHtml ? { html: content } : { text: content }),
    showCancelButton: true,
    confirmButtonColor: "#D52C27",
    cancelButtonColor: "#FBEAE9",
    confirmButtonText: `
      <div style="${buttonStyle} border-color: #D52C27; color: white;">
        <span>${confirmText}</span>
        <img src="/icons/Tick.png" style="vertical-align: middle;" />
      </div>
    `,
    cancelButtonText: `
      <div style="${buttonStyle} border-color: #DF615D; color: #DF615D;">
        <img src="/icons/Cross.png" style="vertical-align: middle;" />
        <span>${cancelText}</span>
      </div>
    `,
    reverseButtons: true,
    customClass: {
      confirmButton: "custom-confirm-button",
      cancelButton: "custom-cancel-button",
      container: HIGH_Z_INDEX_CLASS,
    },
  };

  if (width) {
    options.width = width;
  }

  return Swal.fire(options).then((result) => result.isConfirmed);
};

export const showLoading = (title = "กำลังโหลด...") => {
  ensureSwalZIndexStyle();
  Swal.fire({
    title,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
    customClass: {
      container: HIGH_Z_INDEX_CLASS,
    },
  });
};

export const closeAlert = () => {
  Swal.close();
};

export const alertSuccess = (title, text, isHtml = false) => {
  ensureSwalZIndexStyle();
  return Swal.fire({
    icon: "success",
    title,
    ...(isHtml ? { html: text } : { text }),
    confirmButtonColor: "#3085d6",
    confirmButtonText: "ตกลง",
    allowOutsideClick: true,
    allowEscapeKey: true,
    customClass: {
      container: HIGH_Z_INDEX_CLASS,
    },
  });
};

export const alertError = (title, text, isHtml = false) =>
  showAlert("error", title, text, isHtml);
export const alertWarning = (title, text, isHtml = false) =>
  showAlert("warning", title, text, isHtml);
export const alertInfo = (title, text, isHtml = false) =>
  showAlert("info", title, text, isHtml);
export const alertQuestion = (title, text, isHtml = false) =>
  showAlert("question", title, text, isHtml);
