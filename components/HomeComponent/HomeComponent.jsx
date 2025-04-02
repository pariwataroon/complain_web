import Navbar from "@services/navbar/navbar";
import Footer from "@services/footer/footer";
import Homepage1 from "@services/homepage1/homepage1";
import Homepage2 from "@services/homepage2/homepage2";
import Homepage3 from "@services/homepage3/homepage3";
import Homepage4 from "@services/homepage4/homepage4";
import Homepage5 from "@services/homepage5/homepage5";
import Homepage6 from "@services/homepage6/homepage6";
import Chat from "@services/chat/chat";

export default function HomeComponent() {
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}
      >
        <Navbar menuType="alt" />
      </div>

      <Homepage1 />
      <div style={{ position: "relative", minHeight: "20vh", width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              color: "#1120A3",
              marginLeft: "20%",
            }}
          >
            HOTLINE
            <span style={{ fontSize: "3rem", marginTop: "10px" }}>1689</span>
          </h1>

          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              color: "#1120A3",
              marginRight: "15%",
            }}
          >
            สำนักตรวจสอบและประเมินผล
            <span style={{ fontSize: "2rem", marginTop: "10px" }}>
              สำนักงานปลัดกระทรวงการคลัง
            </span>
          </h1>
        </div>
      </div>
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
