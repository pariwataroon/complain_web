import Navbar from "@services/navbar/navbar";
import Footer from "@services/footer/footer";

export default function HomePage() {
  return (
    <div>
      <div
        style={{
          backgroundImage: "url('/images/bg01.png')", // เปลี่ยนชื่อไฟล์ตามที่มีอยู่ใน public
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "70vh",
          width: "100%",
        }}
      >
        <Navbar />
      </div>

      <div>
        <Footer />
      </div>
    </div>
  );
}
