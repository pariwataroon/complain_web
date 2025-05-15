import NavbarMain from "@services/navbarMain/navbarMain";
import Footer from "@services/footer/footer";

export default function Forbidden403() {
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}
      >
        <NavbarMain menuType="alt" />
      </div>
      <div style={{ padding: "250px 50px", textAlign: "center" }}>
        <h1>403 - ไม่สามารถเข้าถึงหน้านี้ได้</h1>
        <p>คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาติดต่อผู้ดูแลระบบ</p>
      </div>

      <Footer />
    </div>
  );
}
