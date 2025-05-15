import NavbarMain from "@services/navbarMain/navbarMain";
import Footer from "@services/footer/footer";

export default function Forbidden404() {
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}
      >
        <NavbarMain menuType="alt" />
      </div>
      <div style={{ padding: "250px 50px", textAlign: "center" }}>
        <h1>404 - ไม่พบหน้าที่คุณค้นหา</h1>
        <p>
          หน้านี้อาจถูกลบหรือไม่มีอยู่ในระบบ กรุณาตรวจสอบ URL หรือกลับไปหน้าแรก
        </p>
      </div>

      <Footer />
    </div>
  );
}
