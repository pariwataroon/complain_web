import Navbar from "@services/navbar/navbar";
import Footer from "@services/footer/footer";
import Homepage1 from "@services/homepage1/homepage1";
import Homepage2 from "@services/homepage2/homepage2";
import Homepage3 from "@services/homepage3/homepage3";
import Homepage4 from "@services/homepage4/homepage4";
import Homepage5 from "@services/homepage5/homepage5";
import Homepage6 from "@services/homepage6/homepage6";
// นำเข้า Chat component
import Chat from "@services/chat/chat";

export default function HomePage() {
  return (
    <div style={{ position: "relative" }}>
      {/* Navbar overlay */}
      <div
        style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}
      >
        <Navbar menuType="alt" />
      </div>

      {/* หน้าเนื้อหาต่างๆ เรียงต่อกัน */}
      <Homepage1 />
      <Homepage2 />
      <Homepage3 />
      <Homepage4 />
      <Homepage5 />
      <Homepage6 />

      {/* เรียกใช้ Chat component */}
      <Chat />

      <Footer />
    </div>
  );
}
