import Swal from 'sweetalert2';

export const showAlert = (type = "info", title = "แจ้งเตือน", text = "") => {
  return Swal.fire({
    icon: type,
    title,
    text,
    confirmButtonColor: '#3085d6',
    confirmButtonText: 'ตกลง',
  });
};

export const showConfirm = (
  title = "คุณแน่ใจหรือไม่?",
  text = "",
  confirmText = "ใช่",
  cancelText = "ยกเลิก"
) => {
  return Swal.fire({
    icon: 'question',
    title,
    text,
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  }).then((result) => result.isConfirmed);
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

export const alertSuccess = (title, text) => showAlert("success", title, text);
export const alertError = (title, text) => showAlert("error", title, text);
export const alertWarning = (title, text) => showAlert("warning", title, text);
export const alertInfo = (title, text) => showAlert("info", title, text);
export const alertQuestion = (title, text) => showAlert("question", title, text);
