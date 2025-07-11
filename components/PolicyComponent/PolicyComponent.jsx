import NavbarMain from "@services/navbarMain/navbarMain";
import Footer from "@services/footer/footer";

export default function PolicyComponent() {
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}
      >
        <NavbarMain menuType="alt" />
      </div>
      <div style={{ padding: "250px 50px", textAlign: "center" }}>
        <h1>นโยบาย</h1>
      </div>
      <Footer />
    </div>
  );
}
