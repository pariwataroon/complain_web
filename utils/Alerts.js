import Swal from 'sweetalert2';

export const showAlert = (type = "info", title = "แจ้งเตือน", text = "", isHtml = false) => {
  return Swal.fire({
    icon: type,
    title,
    ...(isHtml ? { html: text } : { text }),
    confirmButtonColor: "#3085d6",
    confirmButtonText: "ตกลง",
  });
};


export const showConfirm = (
  title = "คุณแน่ใจหรือไม่?",
  content = "",
  confirmText = "ใช่",
  cancelText = "ยกเลิก",
  width = undefined
) => {
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
  };

  if (width) {
    options.width = width;
  }

  return Swal.fire(options).then((result) => result.isConfirmed);
};

export const showConfirm2 = (
  title = "คุณแน่ใจหรือไม่?",
  content = "",
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  width = "400px"
) => {
  const isHtml = /<\/?[a-z][\s\S]*>/i.test(content);

  const options = {
    title: `<div style="font-size: 16px; font-weight: bold; color: #dc2626;">${title}</div>`,
    showCancelButton: true,
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#dc2626",
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    width,
    
    buttonsStyling: false
  };

  if (isHtml) {
    options.html = `<div style="font-size: 11px; font-weight: bold; color: #dc2626;">${content}</div>`;
  } else {
    options.text = content;
  }

  return Swal.fire(options).then((result) => result.isConfirmed);
};


export const showLoading = (title = "กำลังโหลด...") => {
  Swal.fire({
    title,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};


export const closeAlert = () => {
  Swal.close();
};

export const alertSuccess = (title, text, isHtml = false) => {
  return Swal.fire({
    icon: "success",
    title,
    ...(isHtml ? { html: text } : { text }),
    confirmButtonColor: "#3085d6",
    confirmButtonText: "ตกลง",
    allowOutsideClick: true,
    allowEscapeKey: true,
    customClass: {
      container: "swal-high-zindex",
    },
  });
};

export const alertError = (title, text, isHtml = false) => showAlert("error", title, text, isHtml);
export const alertWarning = (title, text, isHtml = false) => showAlert("warning", title, text, isHtml);
export const alertInfo = (title, text, isHtml = false) => showAlert("info", title, text, isHtml);
export const alertQuestion = (title, text, isHtml = false) => showAlert("question", title, text, isHtml);
